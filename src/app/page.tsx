import Link from "next/link";
import { ArrowDown, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/catalog/site-header";
import { SiteFooter } from "@/components/catalog/site-footer";
import { CategoryNav } from "@/components/catalog/category-nav";
import { FeaturedRail } from "@/components/catalog/featured-rail";
import { ProductCard } from "@/components/catalog/product-card";
import { WhatsAppCta } from "@/components/catalog/whatsapp-cta";
import { getBrand, getCategories, getPublishedProducts } from "@/lib/catalog";
import { buildProductWhatsApp, buildGeneralWhatsApp } from "@/lib/whatsapp";

// ISR: el catálogo se pre-renderiza y se refresca cada 5 minutos
// (o al instante cuando el panel revalida tras publicar cambios).
export const revalidate = 300;

type BrandData = NonNullable<Awaited<ReturnType<typeof getBrand>>>;

export default async function HomePage() {
  let brand: BrandData | null = null;
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let products: Awaited<ReturnType<typeof getPublishedProducts>> = [];
  let dbError = false;
  try {
    [brand, categories, products] = await Promise.all([getBrand(), getCategories(), getPublishedProducts()]);
  } catch {
    dbError = true;
  }

  if (dbError || !brand) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-2xl font-semibold">Pura Esencia</h1>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          El catálogo no está disponible en este momento. Verifica la conexión y
          vuelve a intentarlo en unos minutos.
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex h-10 items-center rounded-full border border-border px-5 text-sm font-medium hover:bg-accent"
        >
          Reintentar
        </Link>
      </main>
    );
  }

  const { settings } = brand;
  const generalWhatsApp = buildGeneralWhatsApp(brand.name, settings);
  const whatsappFor = (product: (typeof products)[number]) =>
    buildProductWhatsApp(brand.name, settings, product)?.link ?? null;

  const featured = products.filter((p) => p.isFeatured || p.isPack);
  const categoriesWithProducts = categories.filter(
    (cat) => products.some((p) => p.categoryId === cat.id),
  );

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader brand={brand} />

      <main className="mx-auto w-full max-w-xl flex-1">
        {/* Hero editorial */}
        <section className="px-4 pb-5 pt-7 text-center">
          <p className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3 w-3 text-accent-foreground/70" aria-hidden />
            {brand.tagline}
          </p>
          <h1 className="font-display mt-4 text-[34px] font-semibold leading-[1.1]">
            Un ritual para
            <br />
            cada momento
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            {settings.description}
          </p>
          {generalWhatsApp && (
            <div className="mt-5 flex justify-center">
              <WhatsAppCta
                href={generalWhatsApp.link}
                label="Escríbenos"
                className="h-11 px-6 text-sm"
              />
            </div>
          )}
        </section>

        <CategoryNav
          categories={categoriesWithProducts.map((cat) => ({
            id: cat.id,
            name: cat.name,
            imageUrl: cat.imageUrl,
            accentColor: cat.accentColor,
          }))}
        />

        <FeaturedRail products={featured} currency={settings.currency} locale={settings.locale} />

        {/* Feed por categorías */}
        {categoriesWithProducts.length === 0 ? (
          <section className="px-4 py-14 text-center">
            <p className="font-display text-lg font-semibold">Pronto encontrarás aquí nuestros rituales</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Estamos preparando el catálogo. Vuelve muy pronto.
            </p>
          </section>
        ) : (
          categoriesWithProducts.map((cat, index) => {
            const catProducts = products.filter((p) => p.categoryId === cat.id);
            return (
              <section
                key={cat.id}
                id={`section-${cat.id}`}
                aria-labelledby={`section-title-${cat.id}`}
                className="scroll-mt-[120px] px-4 py-7"
              >
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <p
                      className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: cat.accentColor || "var(--brand-primary)" }}
                    >
                      {index === 0 ? "Comienza por" : "Continúa con"}
                    </p>
                    <h2 id={`section-title-${cat.id}`} className="font-display text-2xl font-semibold">
                      {cat.name}
                    </h2>
                  </div>
                  <ArrowDown className="mb-1 h-4 w-4 text-muted-foreground/60" aria-hidden />
                </div>
                <div className="flex flex-col gap-6">
                  {catProducts.map((product, i) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      whatsappHref={product.isAvailable ? whatsappFor(product) : null}
                      brandCurrency={settings.currency}
                      brandLocale={settings.locale}
                      priority={index === 0 && i === 0}
                    />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </main>

      <SiteFooter brand={brand} />
    </div>
  );
}
