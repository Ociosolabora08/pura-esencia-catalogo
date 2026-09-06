# Arquitectura — Pura Esencia · Catálogo digital

## Visión general

Una sola base de código Next.js 16 (App Router) con dos superficies:

```
                    ┌────────────────────────────────────┐
   Visitante ──────▶│  Catálogo público (RSC + ISR)       │
   WhatsApp ───────▶│  / · /productos/[slug]              │
                    └──────────────┬─────────────────────┘
                                   │ lecturas directas (sin API intermedia)
                    ┌──────────────┴─────────────────────┐
   Admin ──────────▶│  Panel /admin (client)              │
                    │  ↓ fetch JSON + cookie firmada      │
                    │  /api/admin/* (handlers + guard)    │
                    └──────────────┬─────────────────────┘
                                   │ @libsql/client
                    ┌──────────────┴─────────────────────┐
                    │  SQLite local (file:) / Turso       │
                    │  (libsql:) — mismo esquema          │
                    └────────────────────────────────────┘
```

## Decisiones y justificación

| Decisión | Razón |
|---|---|
| **Opción 1: un solo despliegue full-stack** | El panel necesita APIs + cookies + persistencia; `output: static` las rompería. ISR mantiene el público pre-renderizado y barato de servir. |
| **@libsql/client en vez de Prisma** | El mismo código habla con archivo SQLite local y con Turso remoto (libSQL) sin adaptadores ni binarios de engine → viable en serverless gratuito. Esquema pequeño (8 tablas) no justifica un ORM. No fue destructiva: la BD anterior solo tenía datos ficticios y no se borró. |
| **Sesión firmada HMAC-SHA256 (node:crypto)** | El prototipo usaba base64 `admin:{timestamp}` — falsificable por cualquiera. El token ahora es `v1.<exp>.<nonce>.<hmac>`; sin `ADMIN_SESSION_SECRET` no se puede emitir ni validar. Verificación timing-safe. |
| **`requireAdmin()` en cada handler + `src/proxy.ts`** | Defensa en dos capas: el gate de red bloquea temprano; el guard del handler (sesión + origin check) es la fuente de verdad y funciona en cualquier host, con o sin proxy. |
| **Imágenes como BLOB en la BD, servidas por `/api/images/[id]`** | Los hosts gratuitos no tienen disco persistente. Validación: magic bytes + sharp revalida + re-encode WebP (elimina EXIF/payloads) + límites 6 MB entrada / 1600 px. Nombres siempre UUID del servidor. |
| **ISR 5 min + `revalidatePath` on-demand** | El catálogo se sirve estático; cada mutación del panel reconstruye al instante las rutas afectadas (incluida `/productos/[slug]` y el layout para el tema). |
| **Sin framer-motion; animaciones CSS** | Objetivo de peso: la home carga **199 KB** de JS comprimido (< 500 KB). |
| **Placeholders de marca sin foto** | No existen fotografías con permiso de uso. Cada producto usa un visual editorial con el acento de su categoría. Al subir fotos desde el panel, reemplazan el placeholder automáticamente. |

## Modelo de datos (evolución hacia multi-marca)

```text
brands (slug, name, tagline)
 ├── brand_settings (whatsapp_number, plantillas ×3, currency, locale, footer, instagram, logo_image_id)
 ├── brand_theme (9 colores → variables CSS --brand-*)
 ├── admin_account (password_hash bcrypt)          ← hoy: 1 cuenta (MVP)
 ├── categories (slug, name, accent_color, sort_order, image_id)
 └── products (slug, name, description, details, price, currency,
      │        is_pack, is_published, is_available, is_featured,
      │        sort_order, tags JSON, seo_title, seo_description)
      └── product_images (orden, alt) → images (BLOB WebP)
```

Preparado para el futuro sin sobreconstruir: `brand_id` ya existe en categorías/productos/ajustes. Pendiente de crear cuando el negocio lo pida: `ProductVariant`, `Collection`, `Promotion`, `admin_users` (multi-admin), `ProductTag` relacional (hoy JSON). No implementado a propósito: inventario avanzado, facturación, CRM, logística, pagos, cuentas de clientes.

## Flujo comercial (único canal: WhatsApp)

1. Plantillas configurables con marcadores `{producto}`, `{precio}`, `{marca}`.
2. Producto individual → `Hola, me interesa el producto Aurora de Pura Esencia.\nPrecio: $35.000 COP.`
3. Pack (`is_pack`) → `Hola, me interesa el Ritual Completo de Pura Esencia.` (sin precio, estrategia de oferta ancla).
4. Número normalizado (`normalizeWhatsAppNumber`): quita símbolos, `00→` y antepone `57` a móviles colombianos de 10 dígitos.
5. Enlace `wa.me` con `encodeURIComponent`; funciona sin JS, desde enlaces compartidos y en móvil.
6. Sin número configurado, el CTA se oculta en el público y el panel muestra aviso.

## Seguridad (resumen)

- Sesión: cookie `pe_admin` httpOnly + `sameSite=strict` + secure en producción, 24 h.
- Mutaciones: origin check estricto (403 si el Origin no coincide con el Host).
- Login: rate limit 5 intentos / 15 min (en memoria — limitación documentada por instancia en serverless).
- Contraseña: bcrypt cost 12; cambio exige la actual; mínimo 8 con letras y números; sin valores por defecto en el código.
- Validación: Zod en todas las entradas; límites y MIME real en uploads; `nosniff` en imágenes.
- Sin secretos en el cliente ni en Git; `data/` y `.env` gitignored.

## Rendimiento

- Público: RSC + ISR, JS de home **199 KB gz**, imágenes WebP optimizadas con `sizes` explícitos, `priority` solo en la primera imagen visible, lazy en el resto.
- Scrollspy de categorías con IntersectionObserver (no listeners de scroll).
- Carrusel de destacados con scroll-snap nativo (0 JS).
- `prefers-reduced-motion` respetado; zoom del usuario nunca bloqueado.
