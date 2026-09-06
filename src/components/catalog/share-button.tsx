"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

/**
 * Compartir con Web Share API y fallback a portapapeles.
 * Feedback honesto: confirma al usuario qué pasó (copiado / no se pudo).
 */
export function ShareButton({
  title,
  text,
  path,
  label = "Compartir",
  variant = "icon",
}: {
  title: string;
  text?: string;
  path: string;
  label?: string;
  variant?: "icon" | "full";
}) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  async function handleShare() {
    setState("idle");
    const url = new URL(path, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return; // El usuario canceló o compartió; nada que confirmar.
      }
      await navigator.clipboard.writeText(url);
      setState("copied");
      setTimeout(() => setState("idle"), 2200);
    } catch {
      // navigator.share lanza AbortError al cancelar; solo es error real el portapapeles.
      if (!navigator.share) {
        setState("error");
        setTimeout(() => setState("idle"), 2200);
      }
    }
  }

  const announcement =
    state === "copied" ? "Enlace copiado al portapapeles" : state === "error" ? "No se pudo copiar el enlace" : "";

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        aria-label={state === "copied" ? "Enlace copiado" : label}
        className={
          variant === "icon"
            ? "inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            : "inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        }
      >
        {state === "copied" ? <Check className="h-4 w-4 text-equilibrio" aria-hidden /> : <Share2 className="h-4 w-4" aria-hidden />}
        {variant === "full" && <span>{state === "copied" ? "¡Copiado!" : label}</span>}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </>
  );
}
