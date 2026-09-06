import Link from "next/link";
import { FlameMark } from "@/components/catalog/flame-mark";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <FlameMark className="h-10 w-10 text-primary/70" />
      <div>
        <h1 className="font-display text-2xl font-semibold">Esta página no existe</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          El producto que buscas puede haber cambiado de nombre o ya no está
          publicado. Vuelve al catálogo para ver la colección completa.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
      >
        Ir al catálogo
      </Link>
    </main>
  );
}
