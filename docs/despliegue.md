# Despliegue — Catálogo Pura Esencia (100 % gratuito)

## Objetivo elegido

**Netlify (app) + Turso (base de datos libSQL remota).** Ambos con capa gratuita que
permite uso comercial:

| Pieza | Servicio | Por qué |
|---|---|---|
| App Next.js 16 | [Netlify Free](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/) | Soporta Next.js 16 con el adaptador OpenNext sin configuración, HTTPS + CDN globales, dominio `*.netlify.app` y previews por commit. Su plan gratuito permite uso comercial (a diferencia de Vercel Hobby, que limita a uso no comercial). |
| Base de datos | [Turso Free](https://turso.tech/pricing) | libSQL (compatible SQLite): 100 BD y 5 GB gratis, la misma capa de código que en local (`file:` → `libsql:`). |
| Imágenes | Dentro de la BD (BLOB) | Los hosts serverless no tienen disco persistente; 5 GB de Turso es mucho margen en WebP (~50–150 KB/foto). |

> Verifica siempre las cuotas vigentes en las páginas de precios antes de confiar en ellas.

## Limitaciones conocidas del plan gratuito

- **Netlify**: 100 GB de ancho de banda/mes y 300 h de build/mes (sobra para un catálogo con ISR).
- **Turso free**: 5 GB totales, sin SLA; las filas leídas/mes tienen cuota (el catálogo es pequeño y las páginas están cacheadas).
- El rate limit del login es **en memoria**: en serverless cada instancia cuenta aparte. Contra ataques dirigidos conviene añadir WAF/reglas de la plataforma. El riesgo residual es bajo (no hay usuarios, solo un admin; el token exige el secreto HMAC).
- Las funciones serverless arrancan en frío (~0.5–1 s) la primera vez tras inactividad; las páginas públicas quedan cacheadas en CDN, así que solo lo nota el admin.

## Pasos de despliegue

### 1. Crear la base en Turso

```bash
turso db create pura-esencia
turso db show pura-esencia --url        # → DATABASE_URL (libsql://…)
turso db tokens create pura-esencia     # → DATABASE_AUTH_TOKEN
```

### 2. Inicializar el esquema y el contenido

Desde tu máquina, apuntando a Turso:

```bash
export DATABASE_URL="libsql://pura-esencia-<tu-org>.turso.io"
export DATABASE_AUTH_TOKEN="<token>"
export ADMIN_INITIAL_PASSWORD="una-contraseña-fuerte-única"   # ≥ 8 caracteres
npm run seed
```

El seed crea tablas + marca + colección oficial (Aurora, Equilibrio, Nectar, Ritual Completo)
y la cuenta admin **con la contraseña que tú definas** — no existe contraseña por defecto.
Cámbiala desde el panel (Cuenta) tras el primer ingreso si prefieres.

### 3. Conectar el repositorio a Netlify

1. Sube el repo a GitHub.
2. En Netlify: *Add new site → Import an existing project*.
3. Framework detectado: **Next.js** (usa el adaptador OpenNext automáticamente; `netlify.toml` ya está incluido).
4. Variables de entorno del sitio (Site settings → Environment variables):

| Variable | Valor |
|---|---|
| `DATABASE_URL` | `libsql://pura-esencia-…turso.io` |
| `DATABASE_AUTH_TOKEN` | el token de Turso |
| `ADMIN_SESSION_SECRET` | `openssl rand -base64 32` (¡otro distinto al de local!) |
| `NEXT_PUBLIC_SITE_URL` | `https://<tu-sitio>.netlify.app` (o tu dominio) |

5. Deploy. Netlify genera una **preview** por commit antes de producir.

> Netlify también puede ejecutar el seed en su build si le pasas `ADMIN_INITIAL_PASSWORD`,
> pero lo recomendable es semillar desde tu máquina (el paso 2) y no dejar la contraseña
> inicial en las variables del sitio.

### 4. Verificación post-despliegue (checklist)

- [ ] `/` carga los 4 productos con precios correctos
- [ ] `/productos/aurora` (y las otras 3 fichas) abren con metadata propia (`view-source:` → `og:title`)
- [ ] Botón de WhatsApp abre el chat con el mensaje correcto (configura primero el número real en `/admin` → Marca)
- [ ] `/admin` rechaza la contraseña incorrecta y acepta la tuya
- [ ] Crear/editar/ocultar un producto se refleja en el catálogo al instante
- [ ] Subir una foto de producto se ve en la ficha
- [ ] `/robots.txt` y `/sitemap.xml` responden

### 5. Dominio propio (opcional)

Netlify → Domain management → Add domain. Apunta el DNS según sus instrucciones y
actualiza `NEXT_PUBLIC_SITE_URL`.

## Rollback

- **Por deploy**: Netlify → Deploys → el deploy anterior → *Publish deploy* (instantáneo, sin rebuild).
- **Por commit**: `git revert <hash>` y push.
- **Base de datos**: Turso mantiene copias point-in-time; antes de una operación manual
  delicada: `turso db destroy` NO; usa `turso db create … --from-db` para clonar. Exporta
  antes si dudas: `turso db shell pura-esencia .dump > backup.sql`.

## Mantenimiento

- Dependencias: `npm outdated`; actualiza Next/React con calma y prueba build + checklist.
- Contenido diario: todo desde `/admin` (productos, fotos, disponibilidad, tema, WhatsApp).
- Backup de contenido: `turso db shell <db> .dump > backups/$(date +%F).sql` cada semana.
- Si el tráfico crece: el mismo código sirve en Vercel/Render/Fly (Node) apuntando a Turso.

## Estado de esta fase (honesto)

Los pasos anteriores están preparados y verificados en local (build de producción,
pruebas funcionales y revisión visual completas), pero **no se ha ejecutado un despliegue
real**: requiere cuentas y credenciales de Netlify/Turso del dueño del proyecto, y crearlas
en su nombre no está autorizado. El despliegue es el siguiente paso y la verificación
queda cubierta por el checklist del paso 4.
