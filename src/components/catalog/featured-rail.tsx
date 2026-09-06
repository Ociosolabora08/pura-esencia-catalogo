import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ProductVisual } from "./product-visual";
import { formatPrice } from "@/lib/whatsapp";
import type { Product } from "@/lib/catalog";

/**
 * Carrusel de destacados sin JavaScript: scroll horizontal con snap nativo.
 * En móvil se desliza con el dedo; en escritorio con rueda/arrastre.
 */
export function FeaturedRail({
  products,
  currency,
  locale,
}: {
  products: Product[];
  currency: string;
  locale: string;
}) {
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="destacados-title" className="py-4">
      <h2 id="destacados-title" className="font-display px-4 pb-3 text-lg font-semibold">
        Nuestro ritual favorito
      </h2>
      <ul className="hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
        {products.map((product) => (
          <li key={product.id} className="w-40 shrink-0 snap-start">
            <Link
              href={`/productos/${product.slug}`}
              className="group block overflow-hidden rounded-2xl border border-border/60 bg-card card-shadow transition-transform active:scale-[0.98]"
            >
              <span className="relative block aspect-[4/5] w-full overflow-hidden">
                {product.images.length > 0 ? (
                  <Image
                    src={product.images[0].url}
                    alt={product.images[0].alt || product.name}
                    fill
                    sizes="160px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <ProductVisual name={product.name} accent={product.categoryAccent} className="text-base" />
                )}
                {product.tags[0] && (
                  <Badge className="absolute left-2 top-2 border-0 bg-card/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary backdrop-blur-sm">
                    {product.tags[0]}
                  </Badge>
                )}
              </span>
              <span className="block px-3 py-2.5">
                <span className="font-display block truncate text-sm font-semibold group-hover:text-primary">
                  {product.name}
                </span>
                <span className="mt-0.5 block text-xs font-medium tabular-nums text-muted-foreground">
                  {formatPrice(product.price, product.currency || currency, locale)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
