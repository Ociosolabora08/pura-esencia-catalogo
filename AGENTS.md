# AGENTS.md — Pura Esencia · Catálogo digital

Instrucciones para agentes de código y personas que trabajen en este repositorio.

## Qué es

Catálogo digital mobile-first de **Pura Esencia**, marca de velas aromáticas artesanales y rituales sensoriales. Es una Single Page Catalog con dos superficies:

1. **Catálogo público** (`/`, `/productos/[slug]`): pre-renderizado con React Server Components + ISR, SEO-friendly, mobile-first. La acción comercial es un enlace profundo a **WhatsApp** — no hay carrito, checkout ni pagos.
2. **Panel administrativo** (`/admin`): dinámico, protegido con sesión firmada, administra productos, categorías, imágenes, tema y configuración de WhatsApp.

**No es un restaurante.** No reintroducir lenguaje de menú/platos/restaurant ni la marca morcel. La referencia de UX es morcel.app, pero la identidad es exclusivamente de Pura Esencia.

## Stack y arquitectura

- **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4**. Un solo despliegue full-stack: público pre-renderizado (ISR) + panel/APIs dinámicos. `output: static` está prohibido (rompe las APIs del panel).
- **Datos**: SQLite vía `@libsql/client` (`src/lib/db.ts` + `src/lib/schema.sql`). Local: `data/catalog.db` (archivo, gitignored). Producción: Turso/libSQL remoto con la misma capa (`DATABASE_URL=libsql://…`). No reintroducir Prisma sin decidirlo explícitamente: se retiró porque sus binarios no son portables a despliegues serverless gratuitos.
- **Seed**: `npm run seed` crea esquema + contenido inicial. **Exige** `ADMIN_INITIAL_PASSWORD` en `.env` o variable de entorno — no existe contraseña predeterminada.
- **Auth**: token firmado HMAC-SHA256 (`src/lib/auth.ts`), cookie `pe_admin` httpOnly + sameSite strict, secreto en `ADMIN_SESSION_SECRET`. Todo handler admin llama `requireAdmin()`; `src/proxy.ts` es defensa adicional. Mutaciones validan Origin y entradas con Zod.
- **Imágenes**: subida a `/api/admin/uploads` (auth + magic bytes + límites + sharp → WebP). Almacenadas como BLOB en la BD, servidas por `/api/images/[id]`. Diseñado así porque los hosts gratuitos no tienen disco persistente.
- **Anims**: CSS (sin framer-motion). Objetivo: JS inicial < 500 KB.

## Reglas del proyecto

1. WhatsApp es el único canal de cierre comercial. Sin pagos, carritos ni cuentas de clientes.
2. Precios y descripciones solo desde fuentes aprobadas (plan estratégico en `download/`). No inventar precios, ingredientes ni claims de salud ("cura", "reduce el estrés" prohibido; el plan aprueba "invita", "ayuda a crear").
3. Nada de contraseñas ni secretos predeterminados; nada de secretos en el cliente o en Git.
4. No ocultar errores de build (`ignoreBuildErrors`, silenciar lint). `npm run lint && npm run typecheck && npm run build` deben pasar limpios.
5. Confirmación del usuario antes de: borrar datos reales, migraciones destructivas, contratar servicios, o cambiar la identidad visual aprobada.
6. Tras mutaciones admin: llamar `revalidatePath` de las rutas públicas afectadas.
7. Estados vacío/carga/error siempre presentes; feedback honesto en el panel (comprobar `response.ok`).

## Comandos

```bash
npm run dev        # desarrollo en :3000
npm run seed       # inicializar/recargar datos (requiere ADMIN_INITIAL_PASSWORD)
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run build      # build de producción
npm start          # servir build (DATABASE_URL apuntando a una BD con seed)
```

## Estructura

```
src/app/            rutas App Router (público + /admin + /api)
src/components/     catalog/ (público), admin/, ui/ (primitivas shadcn mínimas)
src/lib/            db, schema.sql, auth, catalog (queries), whatsapp, validation, images, theme
src/proxy.ts        gate de APIs admin (Next 16 reemplazó middleware.ts)
scripts/seed.mjs    seed idempotente
docs/               auditoría, arquitectura, despliegue
data/               BD local (gitignore)
```

## Variables de entorno (`.env`, no versionado; ver `.env.example`)

- `DATABASE_URL` — `file:./data/catalog.db` local · `libsql://…` en producción.
- `ADMIN_SESSION_SECRET` — ≥ 32 bytes aleatorios (`openssl rand -base64 32`). Obligatorio para login admin.
- `ADMIN_INITIAL_PASSWORD` — solo usado por el seed.
- `NEXT_PUBLIC_SITE_URL` — URL canónica para metadata/sitemap.

## Producto (fuente única de verdad)

Colección inicial: **Aurora** (mañana), **Equilibrio** (tarde), **Nectar** (noche), **Ritual Completo** (pack). Rutas: `/productos/aurora`, `/productos/equilibrio`, `/productos/nectar`, `/productos/ritual-completo`. Precios oficiales: $35.000 COP individual · $89.000 COP pack. Paleta: terracota `#726849`, ámbar `#907521`, Aurora `#D4A843`, Equilibrio `#7A9A6D`, Nectar `#4A5580`, crema `#F5F3EF`. Tipografía: Playfair Display + Inter. Detalles en `docs/arquitectura.md`.
