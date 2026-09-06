import Image from "next/image";
import { MessageCircle, Instagram } from "lucide-react";
import { FlameMark } from "./flame-mark";
import { ShareButton } from "./share-button";
import { buildGeneralWhatsApp } from "@/lib/whatsapp";
import { getBrand, type Brand } from "@/lib/catalog";

/**
 * Encabezado fijo: identidad de marca, WhatsApp general, Instagram y compartir.
 * El logo es una imagen servida por /api/images/... si el admin lo cargó.
 */
type FullBrand = NonNullable<Awaited<ReturnType<typeof getBrand>>>;

export function SiteHeader({ brand }: { brand: FullBrand }) {
  const whatsapp = buildGeneralWhatsApp(brand.name, brand.settings);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-xl items-center justify-between gap-2 px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {brand.logoUrl ? (
            <span className="relative h-9 w-9 overflow-hidden rounded-full">
              <Image src={brand.logoUrl} alt={brand.name} fill sizes="36px" className="object-cover" />
            </span>
          ) : (
            <FlameMark className="h-7 w-7 text-primary" />
          )}
          <div className="min-w-0 leading-tight">
            <p className="font-display truncate text-[15px] font-semibold">{brand.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{brand.tagline}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {brand.settings.instagramUrl && (
            <a
              href={brand.settings.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Instagram className="h-[18px] w-[18px]" aria-hidden />
            </a>
          )}
          {whatsapp && (
            <a
              href={whatsapp.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Escríbenos por WhatsApp"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-wa transition-colors hover:bg-accent"
            >
              <MessageCircle className="h-[18px] w-[18px]" aria-hidden />
            </a>
          )}
          <ShareButton title={brand.name} path="/" label="Compartir catálogo" />
        </div>
      </div>
    </header>
  );
}
