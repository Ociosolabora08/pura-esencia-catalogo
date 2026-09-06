"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";

/**
 * Marcador personal: guarda en localStorage del visitante (sin backend,
 * sin métricas falsas). Estado honesto por producto.
 */
const STORAGE_KEY = "pe-bookmarks";

function readBookmarks(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function BookmarkButton({ productId, name }: { productId: string; name: string }) {
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Sincroniza con localStorage (sistema externo) tras montar; no puede leerse
    // durante el render porque rompería la hidratación.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(readBookmarks().includes(productId));
    setReady(true);
  }, [productId]);

  function toggle() {
    const current = readBookmarks();
    const next = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSaved(next.includes(productId));
    } catch {
      // Modo privado sin storage: se ignora silenciosamente.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={ready ? saved : undefined}
      aria-label={saved ? `Quitar ${name} de guardados` : `Guardar ${name}`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <Bookmark className={`h-4 w-4 ${saved ? "fill-current text-primary" : ""}`} aria-hidden />
    </button>
  );
}
