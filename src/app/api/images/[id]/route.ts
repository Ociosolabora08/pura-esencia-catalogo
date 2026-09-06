import { NextResponse } from "next/server";
import { getImage } from "@/lib/catalog";

/**
 * Sirve imágenes almacenadas en la base (BLOB WebP) con caché inmutable.
 * El id es un UUID generado por el servidor: no hay rutas de disco ni
 * nombres controlados por el usuario.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Identificador inválido" }, { status: 400 });
  }
  const image = await getImage(id);
  if (!image) {
    return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(image.data), {
    status: 200,
    headers: {
      "Content-Type": image.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(image.data.byteLength),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
