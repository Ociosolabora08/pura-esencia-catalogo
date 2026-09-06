import sharp from "sharp";

/**
 * Procesamiento de imágenes subidas desde el panel.
 * Reglas: se valida el contenido real (magic bytes) antes de decodificar,
 * sharp revalida al decodificar, se re-encodea siempre a WebP (elimina
 * metadatos EXIF y cualquier payload adjunto) y se limitan dimensiones.
 */

export const MAX_UPLOAD_BYTES = 6 * 1024 * 1024; // 6 MB de entrada
export const MAX_OUTPUT_BYTES = 1024 * 1024; // 1 MB tras optimizar
export const MAX_DIMENSION = 1600;
export const MIN_DIMENSION = 200;

const MAGIC_SIGNATURES: Array<{ mime: string; test: (b: Buffer) => boolean }> = [
  { mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: "image/png",
    test: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a,
  },
  {
    mime: "image/webp",
    test: (b) =>
      b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP",
  },
];

export type ProcessResult =
  | { ok: true; data: Buffer; width: number; height: number; originalSize: number; optimizedSize: number }
  | { ok: false; error: string };

export async function processUpload(input: Buffer): Promise<ProcessResult> {
  if (input.byteLength === 0) return { ok: false, error: "El archivo está vacío." };
  if (input.byteLength > MAX_UPLOAD_BYTES) {
    return { ok: false, error: `La imagen supera el máximo de ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.` };
  }

  const header = input.subarray(0, 12);
  if (Buffer.byteLength(header) < 12) {
    return { ok: false, error: "Archivo demasiado pequeño para ser una imagen válida." };
  }
  const matched = MAGIC_SIGNATURES.find((sig) => sig.test(input));
  if (!matched) {
    return { ok: false, error: "Formato no permitido. Usa JPEG, PNG o WebP." };
  }

  let pipeline = sharp(input, { failOn: "error", sequentialRead: true }).rotate();
  let meta;
  try {
    meta = await pipeline.metadata();
  } catch {
    return { ok: false, error: "La imagen no es válida o está corrupta." };
  }

  const srcWidth = meta.width ?? 0;
  const srcHeight = meta.height ?? 0;
  if (!srcWidth || !srcHeight) return { ok: false, error: "No se pudieron leer las dimensiones de la imagen." };
  if (Math.min(srcWidth, srcHeight) < MIN_DIMENSION) {
    return { ok: false, error: `La imagen es demasiado pequeña. Mínimo ${MIN_DIMENSION}px por lado.` };
  }

  const needsResize = srcWidth > MAX_DIMENSION || srcHeight > MAX_DIMENSION;
  if (needsResize) {
    pipeline = pipeline.resize({
      width: Math.min(srcWidth, MAX_DIMENSION),
      height: Math.min(srcHeight, MAX_DIMENSION),
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  let output;
  try {
    output = await pipeline.webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
  } catch {
    return { ok: false, error: "No se pudo procesar la imagen." };
  }

  if (output.data.byteLength > MAX_OUTPUT_BYTES) {
    // Reintenta con menor calidad antes de rechazar.
    try {
      output = await sharp(input, { failOn: "error" })
        .rotate()
        .resize({
          width: Math.min(srcWidth, MAX_DIMENSION),
          height: Math.min(srcHeight, MAX_DIMENSION),
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 62 })
        .toBuffer({ resolveWithObject: true });
    } catch {
      return { ok: false, error: "No se pudo procesar la imagen." };
    }
    if (output.data.byteLength > MAX_OUTPUT_BYTES) {
      return { ok: false, error: "La imagen optimizada sigue siendo demasiado grande. Intenta con una más simple." };
    }
  }

  return {
    ok: true,
    data: output.data,
    width: output.info.width,
    height: output.info.height,
    originalSize: input.byteLength,
    optimizedSize: output.data.byteLength,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
