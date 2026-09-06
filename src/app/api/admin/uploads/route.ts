import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { guardAdmin, jsonError } from "@/lib/api-helpers";
import { processUpload, formatBytes } from "@/lib/images";
import { storeImage } from "@/lib/catalog";

/**
 * Subida de imágenes autenticada y validada:
 * - sesión admin + origin check (guardAdmin)
 * - límite de tamaño y validación de magic bytes + decodificación con sharp
 * - re-encode a WebP (elimina metadatos EXIF y payloads adjuntos)
 * - nombre generado por el servidor (UUID): nunca se usa el nombre del archivo
 * - se almacena como BLOB en la base y se sirve por /api/images/[id]
 */
export async function POST(request: NextRequest) {
  const denied = guardAdmin(request);
  if (denied) return denied;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Petición inválida: se esperaba multipart/form-data.", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return jsonError("Falta el archivo (campo 'file').", 400);
  }
  if (file.size === 0) {
    return jsonError("El archivo está vacío.", 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await processUpload(buffer);
  if (!result.ok) {
    return jsonError(result.error, 400);
  }

  const stored = await storeImage("image/webp", result.width, result.height, result.data);
  revalidatePath("/");

  return NextResponse.json(
    {
      id: stored.id,
      url: `/api/images/${stored.id}`,
      width: stored.width,
      height: stored.height,
      optimization: {
        originalSize: formatBytes(result.originalSize),
        optimizedSize: formatBytes(result.optimizedSize),
        reduction: `${Math.max(0, Math.round((1 - result.optimizedSize / result.originalSize) * 100))}%`,
      },
    },
    { status: 201 },
  );
}
