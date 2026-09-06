import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/catalog/site-header";
import { SiteFooter } from "@/components/catalog/site-footer";
import { ProductVisual } from "@/components/catalog/product-visual";
import { ImageCarousel } from "@/components/catalog/image-carousel";
import { WhatsAppCta } from "@/components/catalog/whatsapp-cta";
import { ShareButton } from "@/components/catalog/share-button";
import { BookmarkButton } from "@/components/catalog/bookmark-button";
import { getBrand, getProductBySlug, getPublishedProducts } from "@/lib/catalog";
import { buildProductWhatsApp, formatPrice } from "@/lib/whatsapp";

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const products = await getPublishedProducts();
    return products.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

function absoluteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);
  if (!product) {
    return { title: "Producto no encontrado" };
  }
  const title = product.seoTitle || `${product.name} — Vela artesanal`;
  const description =
    product.seoDescription ||
    product.description.split("\n")[0].slice(0, 158) ||
    `${product.name} de Pura Esencia`;
  const ogImage = product.images[0] ? absoluteUrl(product.images[0].url) : undefined;

  return {
    title,
    description,
    alternates: { canonical: `/productos/${product.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "es_CO",
      url: absoluteUrl(`/productos/${product.slug}`),
      images: ogImage ? [{ url: ogImage, alt: product.images[0].alt || product.name }] : undefined,
    },
    twitter: ogImage ? { card: "summary_large_image", images: [ogImage] } : undefined,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [brand, product] = await Promise.all([
    getBrand().catch(() => null),
    getProductBySlug(slug).catch(() => null),
  ]);
  if (!brand || !product) notFound();

  const { settings } = brand;
  const whatsapp = product.isAvailable ? buildProductWhatsApp(brand.name, settings, product) : null;

  const others = (await getPublishedProducts().catch(() => []))
    .filter((p) => p.id !== product.id && p.isAvailable)
    .slice(0, 3);

  const detailLines = product.details
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description.split("\n")[0],
    brand: { "@type": "Brand", name: brand.name },
    image: product.images[0] ? [absoluteUrl(product.images[0].url)] : undefined,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency,
      availability: product.isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: absoluteUrl(`/productos/${product.slug}`),
    },
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader brand={brand} />

      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-5">
        <nav aria-label="Volver" className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Catálogo
            {product.categoryName && (
              <span className="text-muted-foreground/60">· {product.categoryName}</span>
            )}
          </Link>
        </nav>

        {/* Galería */}
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card card-shadow">
          {product.images.length > 0 ? (
            <ImageCarousel
              images={product.images.map((img) => ({ url: img.url, alt: img.alt || product.name }))}
              priority
              sizes="(max-width: 768px) 100vw, 576px"
            />
          ) : (
            <div className="aspect-square w-full">
              <ProductVisual name={product.name} accent={product.categoryAccent} large />
            </div>
          )}
        </div>

        {/* Título, precio, acciones */}
        <div className="mt-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {product.categoryName && (
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: product.categoryAccent || "var(--brand-primary)" }}>
                {product.categoryName}
              </p>
            )}
            <h1 className="font-display mt-1 text-3xl font-semibold leading-tight">{product.name}</h1>
          </div>
          <div className="flex shrink-0 items-center pt-2">
            <BookmarkButton productId={product.id} name={product.name} />
            <ShareButton
              title={`${product.name} · ${brand.name}`}
              text={product.description.split("\n")[0]}
              path={`/productos/${product.slug}`}
              label="Compartir producto"
            />
          </div>
        </div>

        <p className="mt-2 text-xl font-semibold tabular-nums">
          {formatPrice(product.price, product.currency, settings.locale)}
        </p>

        {product.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {product.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="font-medium">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* CTA comercial */}
        <div className="mt-5">
          {product.isAvailable ? (
            whatsapp ? (
              <WhatsAppCta
                href={whatsapp.link}
                label={product.isPack ? "Quiero el Ritual Completo" : `Pedir ${product.name}`}
                size="lg"
                className="w-full"
              />
            ) : (
              <p className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground">
                Muy pronto activaremos los pedidos directos.
              </p>
            )
          ) : (
            <p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground">
              Este producto está agotado por ahora. Escríbenos para saber cuándo vuelve.
            </p>
          )}
          {whatsapp && (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Se abrirá WhatsApp con tu mensaje listo para enviar.
            </p>
          )}
        </div>

        {/* Descripción */}
        <div className="mt-7 space-y-4">
          {product.description.split("\n\n").map((paragraph, i) => (
            <p key={i} className={`text-[15px] leading-relaxed ${i === 0 ? "text-foreground" : "text-muted-foreground"}`}>
              {paragraph}
            </p>
          ))}
        </div>

        {/* Detalles */}
        {detailLines.length > 0 && (
          <section aria-label="Detalles del producto" className="mt-7 rounded-2xl border border-border/60 bg-card p-5 card-shadow">
            <h2 className="font-display text-base font-semibold">Detalles</h2>
            <ul className="mt-3 space-y-2.5">
              {detailLines.map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-equilibrio" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Otros rituales */}
        {others.length > 0 && (
          <section aria-labelledby="otros-title" className="mt-9">
            <h2 id="otros-title" className="font-display text-lg font-semibold">
              Completa tu ritual
            </h2>
            <ul className="mt-4 space-y-3">
              {others.map((other) => (
                <li key={other.id}>
                  <Link
                    href={`/productos/${other.slug}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3.5 card-shadow transition-colors hover:bg-accent/60"
                  >
                    <span className="min-w-0">
                      <span className="font-display block truncate text-[15px] font-semibold">{other.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {other.description.split("\n")[0].slice(0, 60)}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {formatPrice(other.price, other.currency, settings.locale)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <SiteFooter brand={brand} />
    </div>
  );
}
