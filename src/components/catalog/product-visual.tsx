import { FlameMark } from "./flame-mark";

/**
 * Visual editorial para productos que aún no tienen fotografía oficial.
 * Usa el color de acento de la categoría y la tipografía de marca para que la
 * ausencia de foto se sienta intencional, no rota. Cuando el admin suba las
 * fotos reales, este componente desaparece del render.
 */
export function ProductVisual({
  name,
  accent,
  className,
  large = false,
}: {
  name: string;
  accent: string | null;
  className?: string;
  large?: boolean;
}) {
  return (
    <div
      className={`product-visual relative flex h-full w-full flex-col items-center justify-center gap-3 overflow-hidden ${
        className ?? ""
      }`}
      style={{ ["--visual-accent" as string]: accent || "var(--brand-aurora)" }}
    >
      <FlameMark
        className={large ? "h-14 w-14 opacity-90" : "h-9 w-9 opacity-90"}
        accent="var(--visual-accent)"
      />
      <span
        className={`font-display text-center leading-tight text-foreground/80 ${
          large ? "text-2xl" : "text-lg"
        }`}
      >
        {name}
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-x-8 bottom-6 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, color-mix(in srgb, var(--visual-accent) 60%, transparent), transparent)",
        }}
      />
    </div>
  );
}
