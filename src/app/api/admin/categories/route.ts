import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  getCategories,
  getBrand,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
} from "@/lib/catalog";
import { guardAdmin, readJson, jsonError } from "@/lib/api-helpers";
import { categoryInputSchema, zodErrorMessage } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const denied = guardAdmin(request);
  if (denied) return denied;
  return NextResponse.json(await getCategories());
}

export async function POST(request: NextRequest) {
  const denied = guardAdmin(request);
  if (denied) return denied;

  const parsed = categoryInputSchema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return jsonError(zodErrorMessage(parsed.error), 400);

  const brand = await getBrand();
  if (!brand) return jsonError("No hay marca configurada. Ejecuta el seed.", 404);

  if (parsed.data.imageId) {
    const exists = await db.execute("SELECT 1 FROM images WHERE id = ? LIMIT 1", [parsed.data.imageId]);
    if (exists.rows.length === 0) return jsonError("La imagen indicada no existe.", 400);
  }

  const category = await adminCreateCategory(
    brand.id,
    parsed.data.name,
    parsed.data.accentColor,
    parsed.data.sortOrder,
    parsed.data.imageId,
  );
  revalidatePath("/");
  return NextResponse.json(category, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const denied = guardAdmin(request);
  if (denied) return denied;

  const body = await readJson<{ id?: string } & Record<string, unknown>>(request);
  if (!body || typeof body.id !== "string") return jsonError("Falta el id de la categoría.", 400);
  const { id, ...rest } = body;
  const parsed = categoryInputSchema.safeParse(rest);
  if (!parsed.success) return jsonError(zodErrorMessage(parsed.error), 400);

  if (parsed.data.imageId) {
    const exists = await db.execute("SELECT 1 FROM images WHERE id = ? LIMIT 1", [parsed.data.imageId]);
    if (exists.rows.length === 0) return jsonError("La imagen indicada no existe.", 400);
  }

  const updated = await adminUpdateCategory(
    id,
    parsed.data.name,
    parsed.data.accentColor,
    parsed.data.sortOrder,
    parsed.data.imageId,
  );
  if (!updated) return jsonError("Categoría no encontrada.", 404);

  revalidatePath("/");
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const denied = guardAdmin(request);
  if (denied) return denied;

  const id = new URL(request.url).searchParams.get("id");
  if (!id || id.length > 64) return jsonError("Identificador inválido.", 400);

  // Confirmación destructiva vive en el cliente; el servidor no borra productos.
  const deleted = await adminDeleteCategory(id);
  if (!deleted) return jsonError("Categoría no encontrada.", 404);

  revalidatePath("/");
  return NextResponse.json({ success: true });
}
