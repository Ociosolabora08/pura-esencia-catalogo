import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CTA comercial principal: enlace profundo de WhatsApp.
 * Es un <a> normal: funciona sin JS, desde enlaces compartidos y en móvil.
 */
export function WhatsAppCta({
  href,
  label = "Pedir por WhatsApp",
  size = "md",
  className,
}: {
  href: string;
  label?: string;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full bg-wa font-semibold text-white shadow-sm transition-transform active:scale-[0.98] hover:bg-wa-dark",
        size === "lg" ? "h-13 px-7 text-base py-3.5" : "h-10 px-5 text-sm",
        className,
      )}
    >
      <MessageCircle className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} aria-hidden />
      {label}
    </a>
  );
}
