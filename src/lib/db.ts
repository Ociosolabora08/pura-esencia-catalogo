import { createClient, type Client } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

/**
 * Única fuente de conexión a la base de datos.
 * Local: DATABASE_URL=file:./data/catalog.db (SQLite en disco).
 * Producción: DATABASE_URL=libsql://… (+ DATABASE_AUTH_TOKEN) con Turso/libSQL.
 * La misma capa de código sirve para ambos entornos.
 */

function resolveFileUrl(rawUrl: string): string {
  if (!rawUrl.startsWith("file:")) return rawUrl;
  let filePath = rawUrl.slice("file:".length);
  // Alcance estático bajo ./data para las URLs file: relativas: mantiene el
  // tracing de producción acotado (Turbopack exige subcarpeta literal).
  if (!path.isAbsolute(filePath)) {
    filePath = path.join(process.cwd(), "data", filePath.replace(/^(?:\.\/)?(?:data\/)?/, ""));
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  return `file:${filePath}`;
}

const rawUrl = process.env.DATABASE_URL || "file:./data/catalog.db";

declare global {
  var __puraEsenciaDb: Client | undefined;
}

export const db: Client =
  globalThis.__puraEsenciaDb ??
  createClient({
    url: resolveFileUrl(rawUrl),
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__puraEsenciaDb = db;
}

export async function ensureSchema(): Promise<void> {
  const schemaPath = path.join(process.cwd(), "src", "lib", "schema.sql");
  const ddl = fs.readFileSync(schemaPath, "utf-8");
  await db.executeMultiple(ddl);
}
