import { cache } from "react";
import { randomUUID } from "node:crypto";
import { db } from "./db";

/** Tipos del modelo de contenido. */
export interface Brand {
  id: string;
  slug: string;
  name: string;
  tagline: string;
}

export interface BrandSettings {
  description: string;
  whatsappNumber: string;
  whatsappTemplateProduct: string;
  whatsappTemplatePack: string;
  whatsappTemplateGeneral: string;
  currency: string;
  locale: string;
  footerNote: string;
  instagramUrl: string;
  logoImageId: string | null;
}

export interface BrandTheme {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  cardColor: string;
  textColor: string;
  mutedColor: string;
  auroraColor: string;
  equilibrioColor: string;
  nectarColor: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  accentColor: string;
  imageUrl: string | null;
  sortOrder: number;
  productCount: number;
}

export interface ProductImageRef {
  id: string;
  url: string;
  alt: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  details: string;
  price: number;
  currency: string;
  categoryId: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  categoryAccent: string | null;
  isPack: boolean;
  isPublished: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  images: ProductImageRef[];
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

type Row = Record<string, unknown>;

function str(row: Row, key: string): string {
  const v = row[key];
  return typeof v === "string" ? v : v == null ? "" : String(v);
}
function num(row: Row, key: string): number {
  const v = row[key];
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function bool(row: Row, key: string): boolean {
  return num(row, key) === 1;
}
function nullableStr(row: Row, key: string): string | null {
  const v = row[key];
  return v == null || v === "" ? null : String(v);
}

function imageUrl(imageId: string | null): string | null {
  return imageId ? `/api/images/${imageId}` : null;
}

function mapProduct(row: Row, images: ProductImageRef[] = []): Product {
  let tags: string[] = [];
  try {
    const parsed = JSON.parse(str(row, "tags") || "[]");
    if (Array.isArray(parsed)) tags = parsed.filter((t) => typeof t === "string");
  } catch {
    tags = [];
  }
  return {
    id: str(row, "id"),
    slug: str(row, "slug"),
    name: str(row, "name"),
    description: str(row, "description"),
    details: str(row, "details"),
    price: num(row, "price"),
    currency: str(row, "currency") || "COP",
    categoryId: nullableStr(row, "category_id"),
    categorySlug: nullableStr(row, "category_slug"),
    categoryName: nullableStr(row, "category_name"),
    categoryAccent: nullableStr(row, "category_accent"),
    isPack: bool(row, "is_pack"),
    isPublished: bool(row, "is_published"),
    isAvailable: bool(row, "is_available"),
    isFeatured: bool(row, "is_featured"),
    sortOrder: num(row, "sort_order"),
    tags,
    seoTitle: str(row, "seo_title"),
    seoDescription: str(row, "seo_description"),
    images,
    createdAt: str(row, "created_at"),
    updatedAt: str(row, "updated_at"),
  };
}

const PRODUCT_SELECT = `
  SELECT p.*, c.slug AS category_slug, c.name AS category_name, c.accent_color AS category_accent
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
`;

async function loadImagesFor(productIds: string[]): Promise<Map<string, ProductImageRef[]>> {
  const map = new Map<string, ProductImageRef[]>();
  if (productIds.length === 0) return map;
  const placeholders = productIds.map(() => "?").join(",");
  const result = await db.execute({
    sql: `SELECT pi.product_id, pi.image_id, pi.alt
          FROM product_images pi
          WHERE pi.product_id IN (${placeholders})
          ORDER BY pi.sort_order ASC`,
    args: productIds,
  });
  for (const row of result.rows) {
    const pid = str(row, "product_id");
    const list = map.get(pid) ?? [];
    list.push({
      id: str(row, "image_id"),
      url: `/api/images/${str(row, "image_id")}`,
      alt: str(row, "alt"),
    });
    map.set(pid, list);
  }
  return map;
}

/* ------------------------------------------------------------------ */
/* Lectura pública (usada por páginas pre-renderizadas)                */
/* ------------------------------------------------------------------ */

export const getBrand = cache(async (): Promise<(Brand & { logoUrl: string | null; settings: BrandSettings; theme: BrandTheme }) | null> => {
  const brandResult = await db.execute("SELECT * FROM brands LIMIT 1");
  const brandRow = brandResult.rows[0];
  if (!brandRow) return null;
  const [settingsRes, themeRes] = await Promise.all([
    db.execute("SELECT * FROM brand_settings WHERE brand_id = ?", [brandRow.id]),
    db.execute("SELECT * FROM brand_theme WHERE brand_id = ?", [brandRow.id]),
  ]);
  const s = settingsRes.rows[0] ?? {};
  const t = themeRes.rows[0] ?? {};
  return {
    id: str(brandRow, "id"),
    slug: str(brandRow, "slug"),
    name: str(brandRow, "name"),
    tagline: str(brandRow, "tagline"),
    logoUrl: imageUrl(nullableStr(s, "logo_image_id")),
    settings: {
      description: str(s, "description"),
      whatsappNumber: str(s, "whatsapp_number"),
      whatsappTemplateProduct: str(s, "whatsapp_template_product"),
      whatsappTemplatePack: str(s, "whatsapp_template_pack"),
      whatsappTemplateGeneral: str(s, "whatsapp_template_general"),
      currency: str(s, "currency") || "COP",
      locale: str(s, "locale") || "es-CO",
      footerNote: str(s, "footer_note"),
      instagramUrl: str(s, "instagram_url"),
      logoImageId: nullableStr(s, "logo_image_id"),
    },
    theme: {
      primaryColor: str(t, "primary_color") || "#726849",
      accentColor: str(t, "accent_color") || "#907521",
      backgroundColor: str(t, "background_color") || "#F5F3EF",
      cardColor: str(t, "card_color") || "#FFFFFF",
      textColor: str(t, "text_color") || "#272623",
      mutedColor: str(t, "muted_color") || "#8B8881",
      auroraColor: str(t, "aurora_color") || "#D4A843",
      equilibrioColor: str(t, "equilibrio_color") || "#7A9A6D",
      nectarColor: str(t, "nectar_color") || "#4A5580",
    },
  };
});

export const getCategories = cache(async (): Promise<Category[]> => {
  const result = await db.execute(`
    SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_published = 1) AS product_count
    FROM categories c
    ORDER BY c.sort_order ASC
  `);
  return result.rows.map((row) => ({
    id: str(row, "id"),
    slug: str(row, "slug"),
    name: str(row, "name"),
    accentColor: str(row, "accent_color"),
    imageUrl: imageUrl(nullableStr(row, "image_id")),
    sortOrder: num(row, "sort_order"),
    productCount: num(row, "product_count"),
  }));
});

export const getPublishedProducts = cache(async (): Promise<Product[]> => {
  const result = await db.execute(`${PRODUCT_SELECT} WHERE p.is_published = 1 ORDER BY p.sort_order ASC, p.created_at ASC`);
  const products = result.rows.map((row) => mapProduct(row as Row));
  const images = await loadImagesFor(products.map((p) => p.id));
  for (const product of products) product.images = images.get(product.id) ?? [];
  return products;
});

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const result = await db.execute(`${PRODUCT_SELECT} WHERE p.slug = ? AND p.is_published = 1`, [slug]);
  const row = result.rows[0];
  if (!row) return null;
  const product = mapProduct(row as Row);
  const images = await loadImagesFor([product.id]);
  product.images = images.get(product.id) ?? [];
  return product;
});

/* ------------------------------------------------------------------ */
/* Administración                                                      */
/* ------------------------------------------------------------------ */

export async function adminListProducts(): Promise<Product[]> {
  const result = await db.execute(`${PRODUCT_SELECT} ORDER BY p.sort_order ASC, p.created_at ASC`);
  const products = result.rows.map((row) => mapProduct(row as Row));
  const images = await loadImagesFor(products.map((p) => p.id));
  for (const product of products) product.images = images.get(product.id) ?? [];
  return products;
}

export async function adminGetProduct(id: string): Promise<Product | null> {
  const result = await db.execute(`${PRODUCT_SELECT} WHERE p.id = ?`, [id]);
  const row = result.rows[0];
  if (!row) return null;
  const product = mapProduct(row as Row);
  const images = await loadImagesFor([product.id]);
  product.images = images.get(product.id) ?? [];
  return product;
}

export async function adminGetCategory(id: string): Promise<Category | null> {
  const result = await db.execute("SELECT * FROM categories WHERE id = ?", [id]);
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: str(row, "id"),
    slug: str(row, "slug"),
    name: str(row, "name"),
    accentColor: str(row, "accent_color"),
    imageUrl: imageUrl(nullableStr(row, "image_id")),
    sortOrder: num(row, "sort_order"),
    productCount: 0,
  };
}

export function generateSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function slugTaken(table: "products" | "categories", slug: string, excludeId?: string): Promise<boolean> {
  const sql =
    excludeId
      ? `SELECT id FROM ${table} WHERE slug = ? AND id != ? LIMIT 1`
      : `SELECT id FROM ${table} WHERE slug = ? LIMIT 1`;
  const args = excludeId ? [slug, excludeId] : [slug];
  const result = await db.execute({ sql, args });
  return result.rows.length > 0;
}

export async function uniqueSlug(table: "products" | "categories", name: string, excludeId?: string): Promise<string> {
  const base = generateSlug(name) || "producto";
  let candidate = base;
  let i = 2;
  while (await slugTaken(table, candidate, excludeId)) {
    candidate = `${base}-${i}`;
    i += 1;
    if (i > 50) return `${base}-${randomUUID().slice(0, 8)}`;
  }
  return candidate;
}

export interface ProductInput {
  name: string;
  description: string;
  details: string;
  price: number;
  currency: string;
  categoryId: string | null;
  isPack: boolean;
  isPublished: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  imageIds: string[];
}

function nowIso(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

export async function adminCreateProduct(brandId: string, input: ProductInput): Promise<Product> {
  const id = randomUUID();
  const slug = await uniqueSlug("products", input.name);
  await db.execute({
    sql: `INSERT INTO products (id, brand_id, slug, name, description, details, price, currency, category_id,
            is_pack, is_published, is_available, is_featured, sort_order, tags, seo_title, seo_description,
            created_at, updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      id, brandId, slug, input.name, input.description, input.details, input.price, input.currency,
      input.categoryId, input.isPack ? 1 : 0, input.isPublished ? 1 : 0, input.isAvailable ? 1 : 0,
      input.isFeatured ? 1 : 0, input.sortOrder, JSON.stringify(input.tags), input.seoTitle,
      input.seoDescription, nowIso(), nowIso(),
    ],
  });
  await replaceProductImages(id, input.imageIds, input.name);
  const product = await adminGetProduct(id);
  if (!product) throw new Error("No se pudo crear el producto");
  return product;
}

export async function adminUpdateProduct(id: string, input: ProductInput): Promise<Product | null> {
  const existing = await adminGetProduct(id);
  if (!existing) return null;
  // El slug solo se regenera si cambió el nombre; si no, se conserva (URLs estables).
  const slug = input.name !== existing.name ? await uniqueSlug("products", input.name, id) : existing.slug;
  await db.execute({
    sql: `UPDATE products SET name=?, description=?, details=?, price=?, currency=?, category_id=?,
            is_pack=?, is_published=?, is_available=?, is_featured=?, sort_order=?, tags=?,
            seo_title=?, seo_description=?, slug=?, updated_at=? WHERE id=?`,
    args: [
      input.name, input.description, input.details, input.price, input.currency, input.categoryId,
      input.isPack ? 1 : 0, input.isPublished ? 1 : 0, input.isAvailable ? 1 : 0, input.isFeatured ? 1 : 0,
      input.sortOrder, JSON.stringify(input.tags), input.seoTitle, input.seoDescription, slug, nowIso(), id,
    ],
  });
  await replaceProductImages(id, input.imageIds, input.name);
  return adminGetProduct(id);
}

async function replaceProductImages(productId: string, imageIds: string[], productName: string): Promise<void> {
  await db.execute("DELETE FROM product_images WHERE product_id = ?", [productId]);
  let order = 0;
  for (const imageId of imageIds) {
    // Solo referenciar imágenes existentes (evita IDs arbitrarios).
    const found = await db.execute("SELECT id FROM images WHERE id = ? LIMIT 1", [imageId]);
    if (found.rows.length === 0) continue;
    await db.execute({
      sql: "INSERT INTO product_images (id, product_id, image_id, alt, sort_order) VALUES (?,?,?,?,?)",
      args: [randomUUID(), productId, imageId, `${productName} — imagen ${order + 1}`, order],
    });
    order += 1;
  }
}

export async function adminDeleteProduct(id: string): Promise<boolean> {
  const result = await db.execute("DELETE FROM products WHERE id = ?", [id]);
  return result.rowsAffected > 0;
}

export async function adminCreateCategory(brandId: string, name: string, accentColor: string, sortOrder: number, imageId: string | null): Promise<Category> {
  const id = randomUUID();
  const slug = await uniqueSlug("categories", name);
  await db.execute({
    sql: "INSERT INTO categories (id, brand_id, slug, name, accent_color, image_id, sort_order, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
    args: [id, brandId, slug, name, accentColor, imageId, sortOrder, nowIso(), nowIso()],
  });
  return (await adminGetCategory(id))!;
}

export async function adminUpdateCategory(id: string, name: string, accentColor: string, sortOrder: number, imageId: string | null): Promise<Category | null> {
  const existing = await adminGetCategory(id);
  if (!existing) return null;
  const slug = await uniqueSlug("categories", name, id);
  await db.execute({
    sql: "UPDATE categories SET name=?, accent_color=?, image_id=?, sort_order=?, slug=?, updated_at=? WHERE id=?",
    args: [name, accentColor, imageId, sortOrder, slug, nowIso(), id],
  });
  return adminGetCategory(id);
}

export async function adminDeleteCategory(id: string): Promise<boolean> {
  // Los productos quedan con category_id NULL (ON DELETE SET NULL); no se borran.
  const result = await db.execute("DELETE FROM categories WHERE id = ?", [id]);
  return result.rowsAffected > 0;
}

export async function adminUpdateSettings(brandId: string, settings: BrandSettings): Promise<void> {
  await db.execute({
    sql: `UPDATE brand_settings SET description=?, whatsapp_number=?, whatsapp_template_product=?,
            whatsapp_template_pack=?, whatsapp_template_general=?, currency=?, locale=?, footer_note=?,
            instagram_url=?, logo_image_id=?, updated_at=? WHERE brand_id=?`,
    args: [
      settings.description, settings.whatsappNumber, settings.whatsappTemplateProduct,
      settings.whatsappTemplatePack, settings.whatsappTemplateGeneral, settings.currency,
      settings.locale, settings.footerNote, settings.instagramUrl, settings.logoImageId, nowIso(), brandId,
    ],
  });
}

export async function adminUpdateTheme(brandId: string, theme: BrandTheme): Promise<void> {
  await db.execute({
    sql: `UPDATE brand_theme SET primary_color=?, accent_color=?, background_color=?, card_color=?,
            text_color=?, muted_color=?, aurora_color=?, equilibrio_color=?, nectar_color=?, updated_at=?
          WHERE brand_id=?`,
    args: [
      theme.primaryColor, theme.accentColor, theme.backgroundColor, theme.cardColor, theme.textColor,
      theme.mutedColor, theme.auroraColor, theme.equilibrioColor, theme.nectarColor, nowIso(), brandId,
    ],
  });
}

/* ------------------------------------------------------------------ */
/* Imágenes                                                            */
/* ------------------------------------------------------------------ */

export interface StoredImage {
  id: string;
  mime: string;
  width: number;
  height: number;
  size: number;
}

export async function storeImage(mime: string, width: number, height: number, data: Buffer): Promise<StoredImage> {
  const id = randomUUID();
  await db.execute({
    sql: "INSERT INTO images (id, mime, width, height, size, data) VALUES (?,?,?,?,?,?)",
    args: [id, mime, width, height, data.byteLength, data],
  });
  return { id, mime, width, height, size: data.byteLength };
}

export async function getImage(id: string): Promise<{ mime: string; data: Buffer } | null> {
  const result = await db.execute("SELECT mime, data FROM images WHERE id = ? LIMIT 1", [id]);
  const row = result.rows[0];
  if (!row) return null;
  const data = row.data;
  // libSQL entrega el BLOB como Uint8Array o ArrayBuffer según el driver.
  return {
    mime: str(row, "mime"),
    data: Buffer.from(data as unknown as Uint8Array),
  };
}

export async function deleteImage(id: string): Promise<void> {
  await db.execute("DELETE FROM images WHERE id = ?", [id]);
}
