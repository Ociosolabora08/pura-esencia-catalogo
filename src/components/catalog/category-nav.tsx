"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FlameMark } from "./flame-mark";
import { cn } from "@/lib/utils";

export interface CategoryChip {
  id: string;
  name: string;
  imageUrl: string | null;
  accentColor: string;
}

/**
 * Navegación de categorías estilo stories. La sección activa se detecta con
 * IntersectionObserver (no con listeners de scroll): solo dispara cuando
 * cambia la sección visible. Los chips son <button> reales: navegables con
 * teclado y con aria-current cuando están activos.
 */
export function CategoryNav({ categories }: { categories: CategoryChip[] }) {
  const [activeId, setActiveId] = useState<string>(categories[0]?.id ?? "");

  useEffect(() => {
    if (categories.length === 0) return;
    const sections = categories
      .map((cat) => document.getElementById(`section-${cat.id}`))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target.id) {
          setActiveId(visible.target.id.replace("section-", ""));
        }
      },
      { rootMargin: "-96px 0px -55% 0px", threshold: 0 },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [categories]);

  function handleCategoryClick(id: string) {
    setActiveId(id);
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav aria-label="Categorías" className="sticky top-[57px] z-30 border-b border-border/60 bg-background/95 backdrop-blur-sm">
      <ul className="hide-scrollbar flex gap-5 overflow-x-auto px-4 py-3.5">
        {categories.map((cat) => {
          const isActive = cat.id === activeId;
          return (
            <li key={cat.id} className="shrink-0">
              <button
                type="button"
                onClick={() => handleCategoryClick(cat.id)}
                aria-current={isActive ? "true" : undefined}
                className="flex flex-col items-center gap-1.5"
              >
                <span
                  className={cn(
                    "flex h-[62px] w-[62px] items-center justify-center rounded-full border-2 p-[3px] transition-transform hover:scale-105",
                    isActive ? "border-primary" : "border-border",
                  )}
                  style={isActive && cat.accentColor ? { borderColor: cat.accentColor } : undefined}
                >
                  {cat.imageUrl ? (
                    <span className="relative h-full w-full overflow-hidden rounded-full">
                      <Image
                        src={cat.imageUrl}
                        alt=""
                        fill
                        sizes="62px"
                        className="object-cover"
                      />
                    </span>
                  ) : (
                    <span
                      className="flex h-full w-full items-center justify-center rounded-full"
                      style={{
                        background: `color-mix(in srgb, ${cat.accentColor || "var(--brand-primary)"} 18%, var(--brand-card))`,
                      }}
                    >
                      <FlameMark className="h-6 w-6" accent={cat.accentColor || "var(--brand-primary)"} />
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "max-w-[68px] truncate text-xs",
                    isActive ? "font-semibold text-foreground" : "text-muted-foreground",
                  )}
                >
                  {cat.name}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
