#!/usr/bin/env node
/**
 * Seed idempotente del catálogo Pura Esencia.
 *
 * - Crea el esquema (src/lib/schema.sql).
 * - Crea la marca, ajustes y tema si no existen.
 * - Inserta la colección oficial (Aurora, Equilibrio, Nectar, Ritual Completo)
 *   solo si la base está vacía, o con --force si se pide reiniciar el contenido.
 * - Crea la cuenta admin SOLO con una contraseña suministrada por el operador:
 *   no existe contraseña predeterminada.
 *
 * Uso:
 *   ADMIN_INITIAL_PASSWORD="..." npm run seed
 *   ADMIN_INITIAL_PASSWORD="..." npm run seed -- --force   (reinicia productos/categorías)
 */
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const rawUrl = process.env.DATABASE_URL || "file:./data/catalog.db";
let url = rawUrl;
if (rawUrl.startsWith("file:")) {
  let filePath = rawUrl.slice("file:".length);
  if (!path.isAbsolute(filePath)) filePath = path.join(process.cwd(), filePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  url = `file:${filePath}`;
}
const db = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
const force = process.argv.includes("--force");

function nowIso() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

async function main() {
  const ddl = fs.readFileSync(path.join(process.cwd(), "src", "lib", "schema.sql"), "utf-8");
  await db.executeMultiple(ddl);
  // Migración ligera para bases creadas antes de la columna logo_image_id.
  try {
    await db.execute("ALTER TABLE brand_settings ADD COLUMN logo_image_id TEXT");
  } catch {
    // La columna ya existe.
  }
  console.log("✅ Esquema verificado");

  const existing = await db.execute("SELECT id, slug FROM brands LIMIT 1");
  let brandId;
  if (existing.rows.length > 0) {
    brandId = existing.rows[0].id;
    console.log("ℹ️  Marca existente, se conservan ajustes");
  } else {
    brandId = crypto.randomUUID();
    await db.execute({
      sql: "INSERT INTO brands (id, slug, name, tagline, created_at, updated_at) VALUES (?,?,?,?,?,?)",
      args: [brandId, "pura-esencia", "Pura Esencia", "Un ritual para cada momento del día", nowIso(), nowIso()],
    });
    await db.execute({
      sql: `INSERT INTO brand_settings (brand_id, description) VALUES (?, ?)`,
      args: [
        brandId,
        "Velas artesanales de cera de soja para acompañar los momentos del día. Esencias pensadas para el ritual diario: mañana, tarde y noche.",
      ],
    });
    await db.execute({
      sql: "INSERT INTO brand_theme (brand_id) VALUES (?)",
      args: [brandId],
    });
    console.log("✅ Marca Pura Esencia creada");
  }

  // Colección oficial (contenido del plan estratégico aprobado).
  const categories = [
    { slug: "manana", name: "Mañana", accent: "#D4A843", order: 1 },
    { slug: "tarde", name: "Tarde", accent: "#7A9A6D", order: 2 },
    { slug: "noche", name: "Noche", accent: "#4A5580", order: 3 },
    { slug: "packs", name: "Packs", accent: "#726849", order: 4 },
  ];

  const products = [
    {
      slug: "aurora",
      name: "Aurora",
      category: "manana",
      price: 35000,
      tags: ["Nuevo"],
      featured: false,
      order: 1,
      description:
        "Aurora es la vela que despierta. Con cera de soja y esencias de cítricos, eucalipto y menta, ayuda a crear una sensación de energía limpia que acompaña las primeras horas del día.\n\nRitual sugerido: enciéndela al despertar, durante el primer café o una meditación matinal de gratitud. Cada mañana es una oportunidad de comenzar de nuevo, con intención.",
      details: "Momento: 6:00 – 11:00 AM\nNotas: cítricos, eucalipto y menta\nCera de soja · 180–200 g\nVela artesanal",
    },
    {
      slug: "equilibrio",
      name: "Equilibrio",
      category: "tarde",
      price: 35000,
      tags: [],
      featured: false,
      order: 2,
      description:
        "Equilibrio es la vela que re-centra. Con lavanda, romero y geranio, crea una transición suave entre la energía del día y la calma de la noche: calma sin letargo, enfoque sin tensión.\n\nRitual sugerido: enciéndela a media tarde, en la pausa estratégica antes de la segunda mitad de la jornada. Es el punto fijo que te recuerda que puedes estar en movimiento sin perderte.",
      details: "Momento: 12:00 – 6:00 PM\nNotas: lavanda, romero y geranio\nCera de soja · 180–200 g\nVela artesanal",
    },
    {
      slug: "nectar",
      name: "Nectar",
      category: "noche",
      price: 35000,
      tags: ["Nuevo"],
      featured: false,
      order: 3,
      description:
        "Nectar es la vela que invita al descanso. La vainilla crea un envoltorio cálido y reconfortante, el sándalo aporta profundidad maderera y la manzanilla refuerza una tradición milenaria de serenidad.\n\nRitual sugerido: enciéndela al caer la noche, mientras bajas el ritmo. Es la transición entre el mundo exterior y tu espacio interior, entre la actividad y la quietud.",
      details: "Momento: 7:00 – 11:00 PM\nNotas: vainilla, sándalo y manzanilla\nCera de soja · 180–200 g\nVela artesanal",
    },
    {
      slug: "ritual-completo",
      name: "Ritual Completo",
      category: "packs",
      price: 89000,
      tags: ["Pack", "Más vendido"],
      featured: true,
      order: 0,
      isPack: true,
      description:
        "El Ritual Completo reúne las tres velas del día: Aurora para la mañana, Equilibrio para la tarde y Nectar para la noche. Incluye una tarjeta ritual impresa con las indicaciones de cada momento, para convertir tres velas en un sistema diario de intenciones.\n\nComprando el pack ahorras un 15% frente a las velas individuales, y cada transición del día tiene su aroma.",
      details: "Incluye 3 velas de soja de 180–200 g\nTarjeta ritual impresa\nAhorro del 15% vs. individuales",
    },
  ];

  const productsCount = await db.execute("SELECT COUNT(*) AS n FROM products");
  const hasProducts = Number(productsCount.rows[0].n) > 0;
  if (hasProducts && !force) {
    console.log("ℹ️  Ya existen productos; usa --force para reiniciar el contenido del catálogo");
  } else {
    if (hasProducts && force) {
      await db.execute("DELETE FROM product_images");
      await db.execute("DELETE FROM products");
      await db.execute("DELETE FROM categories");
      console.log("⚠️  Contenido anterior eliminado (--force)");
    }
    const categoryIds = {};
    for (const cat of categories) {
      const id = crypto.randomUUID();
      categoryIds[cat.slug] = id;
      await db.execute({
        sql: "INSERT INTO categories (id, brand_id, slug, name, accent_color, sort_order, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)",
        args: [id, brandId, cat.slug, cat.name, cat.accent, cat.order, nowIso(), nowIso()],
      });
    }
    for (const p of products) {
      await db.execute({
        sql: `INSERT INTO products (id, brand_id, slug, name, description, details, price, currency, category_id,
                is_pack, is_published, is_available, is_featured, sort_order, tags, created_at, updated_at)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: [
          crypto.randomUUID(), brandId, p.slug, p.name, p.description, p.details, p.price, "COP",
          categoryIds[p.category], p.isPack ? 1 : 0, 1, 1, p.featured ? 1 : 0, p.order,
          JSON.stringify(p.tags), nowIso(), nowIso(),
        ],
      });
    }
    console.log(`✅ ${products.length} productos insertados (fotos oficiales pendientes: súbelas desde el panel)`);
  }

  // Cuenta admin: SOLO con contraseña provista por el operador.
  const account = await db.execute("SELECT id FROM admin_account LIMIT 1");
  if (account.rows.length === 0) {
    const password = process.env.ADMIN_INITIAL_PASSWORD;
    if (!password || password.length < 8) {
      console.log("⚠️  Sin cuenta admin. Define ADMIN_INITIAL_PASSWORD (mínimo 8 caracteres) y vuelve a ejecutar el seed.");
      console.log("    Ejemplo: ADMIN_INITIAL_PASSWORD='una-clave-segura-123' npm run seed");
    } else {
      const hash = await bcrypt.hash(password, 12);
      await db.execute({
        sql: "INSERT INTO admin_account (id, brand_id, password_hash, updated_at) VALUES (?,?,?,?)",
        args: [crypto.randomUUID(), brandId, hash, nowIso()],
      });
      console.log("✅ Cuenta de administrador creada con la contraseña suministrada");
    }
  } else {
    console.log("ℹ️  Cuenta admin existente: la contraseña se gestiona desde el panel");
  }

  console.log("🎉 Seed completado");
}

main()
  .catch((err) => {
    console.error("❌ Error en seed:", err.message);
    process.exit(1);
  })
  .finally(() => db.close());
