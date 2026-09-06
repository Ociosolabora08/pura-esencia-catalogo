import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  adminListProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  getBrand,
} from "@/lib/catalog";
import { guardAdmin, readJson, jsonError } from "@/lib/api-helpers";
import { productInputSchema, zodErrorMessage } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const denied = guardAdmin(request);
  if (denied) return denied;
  return NextResponse.json(await adminListProducts());
}

export async function POST(request: NextRequest) {
  const denied = guardAdmin(request);
  if (denied) return denied;

  const parsed = productInputSchema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return jsonError(zodErrorMessage(parsed.error), 400);

  const brand = await getBrand();
  if (!brand) return jsonError("No hay marca configurada. Ejecuta el seed.", 404);

  if (parsed.data.categoryId) {
    const exists = await db.execute("SELECT 1 FROM categories WHERE id = ? LIMIT 1", [parsed.data.categoryId]);
    if (exists.rows.length === 0) return jsonError("La categoría indicada no existe.", 400);
  }

  const product = await adminCreateProduct(brand.id, parsed.data);
  revalidatePath("/");
  revalidatePath(`/productos/${product.slug}`);
  return NextResponse.json(product, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const denied = guardAdmin(request);
  if (denied) return denied;

  const body = await readJson<{ id?: string } & Record<string, unknown>>(request);
  if (!body || typeof body.id !== "string") return jsonError("Falta el id del producto.", 400);
  const { id, ...rest } = body;
  const parsed = productInputSchema.safeParse(rest);
  if (!parsed.success) return jsonError(zodErrorMessage(parsed.error), 400);

  if (parsed.data.categoryId) {
    const exists = await db.execute("SELECT 1 FROM categories WHERE id = ? LIMIT 1", [parsed.data.categoryId]);
    if (exists.rows.length === 0) return jsonError("La categoría indicada no existe.", 400);
  }

  const updated = await adminUpdateProduct(id, parsed.data);
  if (!updated) return jsonError("Producto no encontrado.", 404);

  revalidatePath("/");
  revalidatePath(`/productos/${updated.slug}`);
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const denied = guardAdmin(request);
  if (denied) return denied;

  const id = new URL(request.url).searchParams.get("id");
  if (!id || id.length > 64) return jsonError("Identificador inválido.", 400);

  const deleted = await adminDeleteProduct(id);
  if (!deleted) return jsonError("Producto no encontrado.", 404);

  revalidatePath("/");
  return NextResponse.json({ success: true });
}
