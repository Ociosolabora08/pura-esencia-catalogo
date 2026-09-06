"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // El error real queda en los logs del servidor; al usuario no se le
    // exponen detalles internos.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <div>
        <h1 className="font-display text-2xl font-semibold">Algo salió mal</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          No pudimos cargar esta vista. Puedes reintentarlo; si el problema
          continúa, avísanos por WhatsApp.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
      >
        Reintentar
      </button>
    </main>
  );
}
