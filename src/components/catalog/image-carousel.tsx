"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CarouselImage {
  url: string;
  alt: string;
}

/**
 * Carrusel accesible: roving tabindex, flechas y puntos operables con teclado,
 * tamaño explícito vía contenedor de aspecto fijo y next/image (fill).
 */
export function ImageCarousel({
  images,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 576px",
}: {
  images: CarouselImage[];
  priority?: boolean;
  sizes?: string;
}) {
  const [current, setCurrent] = useState(0);
  const total = images.length;
  const trackRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (index: number) => {
      setCurrent((index + total) % total);
    },
    [total],
  );

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(current - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(current + 1);
    }
  }

  return (
    <div
      className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted"
      role="group"
      aria-roledescription="carrusel"
      aria-label={`Galería de ${total} ${total === 1 ? "imagen" : "imágenes"}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={trackRef}
        className="flex h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {images.map((image, i) => (
          <div key={image.url} className="relative h-full min-w-0 flex-[0_0_100%]">
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes={sizes}
              priority={priority && i === 0}
              loading={priority && i === 0 ? undefined : "lazy"}
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            aria-label="Imagen anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-card/85 p-2 shadow-sm backdrop-blur-sm transition-colors hover:bg-card"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => goTo(current + 1)}
            aria-label="Imagen siguiente"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-card/85 p-2 shadow-sm backdrop-blur-sm transition-colors hover:bg-card"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5" role="tablist" aria-label="Imágenes">
            {images.map((image, i) => (
              <button
                key={image.url}
                type="button"
                role="tab"
                aria-selected={i === current}
                aria-label={`Ver imagen ${i + 1}`}
                onClick={() => goTo(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === current ? "w-5 bg-foreground/80" : "w-1.5 bg-foreground/35 hover:bg-foreground/60",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
