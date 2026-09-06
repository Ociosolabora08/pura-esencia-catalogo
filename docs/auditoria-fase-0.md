# Fase 0 — Auditoría y preservación (2026-09-03)

## Qué se revisó

- Archivo origen: `Prototipo mejorado.tar` (27 MB) → extraído a `app/` con su historial Git intacto (10 commits, identidad Git existente).
- Código Next.js: `src/app/`, `src/components/menu/`, `src/components/admin/`, `src/app/api/`, `src/middleware.ts`, `src/lib/`.
- Datos: `prisma/schema.prisma`, `prisma/seed.ts`, `db/custom.db` (SQLite con datos de restaurante ficticios).
- Stack paralelo: `php-catalog/` (PHP 8.3 + MySQL, implementación completa paralela).
- Configuración: `next.config.ts`, `package.json`, `Caddyfile`, `.zscripts/` (plataforma z.ai), `.gitignore`, `.env`.
- Documentación de producto: `download/Plan_Estrategico_Velas_Aromaticas.pdf` (fichas oficiales de producto, precios y paleta) y `download/Estrategia_Catalogo_Digital_Pura_Esencia.pdf` (plataformas de despliegue).
- `worklog.md`: historial de construcción del prototipo.
- `upload/Catalogo1.tar`: otra exportación del mismo proyecto (no contiene fotos de producto).

## Hallazgos verificados

| # | Hallazgo | Evidencia | Severidad |
|---|----------|-----------|-----------|
| 1 | Sesión admin falsificable: token = base64 de `admin:{timestamp}`, sin firma | `src/middleware.ts:40-55`, `src/app/api/admin/login/route.ts:6-9` | Crítica |
| 2 | Contraseña predeterminada `admin123` (hash bcrypt en DB, pero documentada y sembrada) | `prisma/schema.prisma:17`, `prisma/seed.ts:8` | Crítica |
| 3 | Cambio de contraseña sin exigir la actual y mínimo de 4 caracteres | `src/app/api/restaurant/route.ts:43-52` | Alta |
| 4 | Ruta `/api/upload` no existe pero `image-uploader.tsx` la invoca → subida de imágenes rota en runtime | `src/components/admin/image-uploader.tsx:56`; `find src/app/api` | Alta |
| 5 | Página pública 100% client-side (`"use client"` + `fetch` posterior): sin SEO, sin contenido inicial en HTML | `src/app/page.tsx:1` | Alta |
| 6 | Zoom bloqueado (`maximumScale: 1.0, userScalable: false`) | `src/app/layout.tsx:36-42` | Media (accesibilidad) |
| 7 | Listener de scroll sin throttle que consulta `getBoundingClientRect` de todas las categorías en cada evento | `src/app/page.tsx:70-86` | Media |
| 8 | `ignoreBuildErrors: true` en `next.config.ts` | `next.config.ts:6-8` | Alta |
| 9 | Componentes huérfanos: `whatsapp-order-button.tsx` (carrito completo sin usar), `popular-items.tsx`, `theme-picker.tsx`, `lib/menu-data.ts` | `grep` de imports | Media |
| 10 | Selector de idiomas decorativo (6 idiomas, sin i18n) y bookmark sin persistencia; likes falsos en estado local | `sticky-header.tsx:18-39`, `menu-card.tsx:40-47` | Baja |
| 11 | Rate limiting por IP solo con `x-forwarded-for` (spoofable) y en memoria (por instancia) | `src/app/api/admin/login/route.ts:18-36` | Media |
| 12 | `.env`, `db/custom.db` y `upload/Catalogo1.tar` rastreados en Git | `git ls-files` | Media |
| 13 | `.env` con `DATABASE_URL` absoluta de otra máquina (`/home/z/my-project`) | `.env` | Baja |
| 14 | Dos stacks productivos paralelos (Next.js y PHP) | `php-catalog/` completo | Alta (arquitectura) |
| 15 | ~30 dependencias sin uso (dnd-kit, mdxeditor, recharts, next-auth, next-intl, zustand, framer-motion, react-query, etc.) | `package.json` | Baja |
| 16 | Contenido 100% de restaurante genérico (seed con pancakes, croquetas, paella; imágenes Unsplash) | `prisma/seed.ts` | Alta (identidad) |
| 17 | Endpoint `Hello, world!` de leftover en `/api` | `src/app/api/route.ts` | Baja |
| 18 | `output: standalone` + arranque con `bun` (binario ausente en este entorno) | `package.json:scripts` | Baja |
| 19 | Footer "Powered by Mi Menú Digital" enlazando a morcel.ai | `src/app/page.tsx:177-186` | Baja |

## Información oficial de producto encontrada (fuente: plan estratégico aprobado)

- Productos: **Aurora** (mañana, cítricos/eucalipto/menta), **Equilibrio** (tarde, lavanda/romero/geranio), **Nectar** (noche, vainilla/sándalo/manzanilla), **Ritual Completo** (pack de 3 velas + tarjeta ritual).
- Precios oficiales: **$35.000 COP** vela individual (cera de soja, 180–200 g) · **$89.000 COP** pack (15 % de descuento vs. 3 individuales).
- Paleta oficial: terracota `#726849`, ámbar `#907521`, Aurora `#D4A843`, Equilibrio `#7A9A6D`, Nectar `#4A5580`, crema `#F5F3EF`, carbón `#272623`, gris cálido `#8B8881`.
- Tipografía oficial: Playfair Display (títulos) + Inter (texto).
- **No existen fotografías con permiso de uso** → el catálogo se lanza con visuales de marca generados (gradientes/identidad por producto) y subida de imágenes lista para las fotos oficiales cuando existan.

## Riesgos

- El historial Git contiene `.env`, `db/custom.db` y `upload/Catalogo1.tar` en commits anteriores. No se reescribe historial (operación destructiva que requiere autorización). Ningún secreto real estaba presente (solo una URL de SQLite), así que la exposición es baja.
- `db/custom.db` solo contiene datos de semilla ficticios de restaurante; se conserva el archivo sin borrar y se des-rastrea de Git.

## Decisiones

1. **Stack único: Next.js 16 (App Router) + TypeScript + Tailwind 4.** Se retira `php-catalog/` (regla 3: no mantener dos stacks paralelos). Recuperable desde el historial Git.
2. **Arquitectura: Opción 1 — un solo despliegue full-stack.** Catálogo público pre-renderizado (RSC + ISR + revalidación on-demand desde el panel) y panel admin dinámico con APIs protegidas. Se descarta `output: static` porque rompería las APIs/cookies del panel.
3. **Persistencia: capa de datos propia sobre `@libsql/client`** en lugar de Prisma. Razones: (a) el mismo código habla con archivo SQLite local (`file:`) y con Turso/libSQL remoto en producción (`libsql:`) sin adaptadores ni binarios de engine; (b) despliegue serverless viable en planes gratuitos con uso comercial permitido (Turso free: 100 BD / 5 GB, verificado en turso.tech/pricing); (c) el esquema es pequeño (7 tablas) y no justifica el peso de Prisma. No es migración destructiva: la DB existente solo tiene datos ficticios y no se borra.
4. **Autenticación: token de sesión firmado (HMAC-SHA256) con `node:crypto`**, cookie httpOnly + `sameSite: strict`, verificación timing-safe, y `requireAdmin()` dentro de cada handler (fuente de verdad) + gate en `proxy.ts` (Next 16 reemplaza `middleware.ts`). Rate limiting en memoria documentado como limitación.
5. **Imágenes: subida propia validada** (magic bytes, tamaño, dimensiones, conversión a WebP con sharp, nombres aleatorios) almacenadas como BLOB en la base y servidas por `/api/images/[id]` con caché inmutable — portátil entre hosts gratuitos sin disco persistente.
6. **Likes falsos y selector de idiomas decorativo se retiran** (documentado); "Guardar" se reimplementa como marcador personal honesto (localStorage).
7. **Bundle objetivo < 500 KB JS**: se elimina framer-motion y componentes Radix sin uso; animaciones con CSS.
8. **Proveedores de despliegue** (Fase 5): Netlify (gratis, permite uso comercial, runtime Next.js) + Turso free como BD persistente. Vercel Hobby se descarta como objetivo primario porque sus términos limitan a uso no comercial. Alternativa documentada: Cloudflare (Pages/Workers) con más fricción.

## Plan de trabajo

Fase 1 fundamentos (limpieza, AGENTS.md, capa de datos, seed Pura Esencia, tokens visuales, seguridad) → Fase 2 catálogo público → Fase 3 panel admin → Fase 4 calidad (lint/tsc/build/pruebas) → Fase 5 despliegue y documentación.
