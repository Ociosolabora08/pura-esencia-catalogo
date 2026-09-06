import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ProductVisual } from "./product-visual";
import { WhatsAppCta } from "./whatsapp-cta";
import { formatPrice } from "@/lib/whatsapp";
import type { Product } from "@/lib/catalog";

/**
 * Tarjeta de producto del feed: visual grande, etiquetas, precio y doble
 * acción — ver detalle (enlace) y pedir por WhatsApp (CTA directo).
 */
export function ProductCard({
  product,
  whatsappHref,
  brandCurrency,
  brandLocale,
  priority = false,
}: {
  product: Product;
  whatsappHref: string | null;
  brandCurrency: string;
  brandLocale: string;
  priority?: boolean;
}) {
  const href = `/productos/${product.slug}`;
  const hasPhotos = product.images.length > 0;

  return (
    <article className="rise-in overflow-hidden rounded-2xl border border-border/60 bg-card card-shadow">
      <div className="relative aspect-square w-full">
        <Link
          href={href}
          aria-label={`Ver detalle de ${product.name}`}
          className="absolute inset-0 z-10"
          tabIndex={-1}
        >
          <span className="sr-only">{product.name}</span>
        </Link>
        {hasPhotos ? (
          <Image
            src={product.images[0].url}
            alt={product.images[0].alt || product.name}
            fill
            sizes="(max-width: 768px) 100vw, 576px"
            priority={priority}
            className="object-cover"
          />
        ) : (
          <ProductVisual name={product.name} accent={product.categoryAccent} />
        )}
        {product.tags.length > 0 && (
          <div className="absolute left-3 top-3 z-20 flex gap-1.5">
            {product.tags.slice(0, 2).map((tag) => (
              <Badge
                key={tag}
                className="border-0 bg-card/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary backdrop-blur-sm"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
        {!product.isAvailable && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/70 backdrop-blur-[2px]">
            <span className="rounded-full bg-foreground/85 px-4 py-1.5 text-sm font-medium text-background">
              Agotado
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {product.categoryName && (
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {product.categoryName}
              </p>
            )}
            <h3 className="font-display truncate text-lg font-semibold">
              <Link href={href} className="hover:text-primary">
                {product.name}
              </Link>
            </h3>
          </div>
          <p className="shrink-0 pt-3 text-base font-semibold tabular-nums">
            {formatPrice(product.price, product.currency || brandCurrency, brandLocale)}
          </p>
        </div>

        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {product.description.split("\n")[0]}
        </p>

        <div className="flex items-center gap-2 pt-1">
          <WhatsAppCta
            href={whatsappHref ?? "#"}
            label={product.isPack ? "Quiero el pack" : "Pedir por WhatsApp"}
            className={whatsappHref ? "flex-1" : "pointer-events-none flex-1 opacity-40"}
          />
          <Link
            href={href}
            className="inline-flex h-10 items-center rounded-full border border-border bg-card px-4 text-sm font-medium transition-colors hover:bg-accent"
          >
            Ver detalle
          </Link>
        </div>
      </div>
    </article>
  );
}
