# Pura Esencia · Catálogo digital

Catálogo mobile-first para la marca de velas artesanales **Pura Esencia**:
feed visual estilo social, fichas compartibles por producto y cierre de venta
exclusivamente por **WhatsApp**. Panel administrativo protegido para gestionar
productos, fotos, precios, disponibilidad, tema y configuración de WhatsApp.

Colección inicial: **Aurora** · **Equilibrio** · **Nectar** · **Ritual Completo** (pack).

## Inicio rápido

```bash
npm install

# Variables locales (o copia .env.example)
#   DATABASE_URL=file:./data/catalog.db
#   ADMIN_SESSION_SECRET=<openssl rand -base64 32>
export ADMIN_INITIAL_PASSWORD="tu-contraseña-fuerte"   # solo la pide el seed
npm run seed                                           # crea BD + contenido + cuenta admin

npm run dev        # http://localhost:3000
```

- Catálogo: `http://localhost:3000`
- Panel: `http://localhost:3000/admin`

> No hay contraseña por defecto: si el seed se ejecuta sin
> `ADMIN_INITIAL_PASSWORD`, crea el contenido pero deja el login pendiente.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Desarrollo en :3000 |
| `npm run build` / `npm start` | Build y servidor de producción |
| `npm run lint` / `npm run typecheck` | Calidad (deben pasar limpios) |
| `npm run seed` | Inicializa esquema y contenido (`--force` reinicia productos/categorías) |

## Documentación

- [`docs/arquitectura.md`](docs/arquitectura.md) — decisiones técnicas, modelo de datos, seguridad y rendimiento.
- [`docs/despliegue.md`](docs/despliegue.md) — despliegue gratuito (Netlify + Turso), checklist, rollback y mantenimiento.
- [`docs/auditoria-fase-0.md`](docs/auditoria-fase-0.md) — auditoría del prototipo original y riesgos.
- [`AGENTS.md`](AGENTS.md) — reglas para agentes de código.

## Stack

Next.js 16 (App Router, RSC + ISR) · React 19 · TypeScript · Tailwind 4 ·
SQLite/libSQL vía `@libsql/client` · bcryptjs · Zod · sharp · shadcn/ui (subset).

## Estado de las fotografías

Las fotos oficiales de producto **aún no existen**; las fichas muestran
visuales de marca intencionales. Súbelas desde `/admin` (se optimizan a WebP
automáticamente) y reemplazarán el placeholder sin tocar código.

## Despliegue

Guía completa en [`docs/despliegue.md`](docs/despliegue.md) — Netlify (gratis,
uso comercial permitido) + Turso (libSQL remoto gratuito). Configura las
variables `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `ADMIN_SESSION_SECRET` y
`NEXT_PUBLIC_SITE_URL` en el proveedor; nunca en el repositorio.
