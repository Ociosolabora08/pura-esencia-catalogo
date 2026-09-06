import { FlameMark } from "./flame-mark";
import type { Brand } from "@/lib/catalog";

export function SiteFooter({ brand }: { brand: Brand & { settings: { footerNote: string } } }) {
  return (
    <footer className="mt-14 border-t border-border/60 bg-card/50">
      <div className="mx-auto max-w-xl px-4 py-8 text-center">
        <FlameMark className="mx-auto h-6 w-6 text-primary/70" />
        <p className="font-display mt-3 text-sm font-semibold">{brand.name}</p>
        {brand.settings.footerNote && (
          <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
            {brand.settings.footerNote}
          </p>
        )}
        <p className="mt-4 text-[11px] text-muted-foreground/80">
          Hecho a mano · Catálogo digital · Pedidos por WhatsApp
        </p>
      </div>
    </footer>
  );
}
