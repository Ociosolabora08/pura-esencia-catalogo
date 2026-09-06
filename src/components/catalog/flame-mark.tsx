import { cn } from "@/lib/utils";

/**
 * Marca gráfica de Pura Esencia: llama de vela en trazo fino.
 * Se usa mientras no exista un logo oficial cargado desde el panel.
 */
export function FlameMark({ className, accent }: { className?: string; accent?: string }) {
  return (
    <svg
      viewBox="0 0 24 32"
      fill="none"
      aria-hidden="true"
      className={cn("h-6 w-6", className)}
      color={accent}
    >
      <path
        d="M12 2.5c2.6 3.4 4.6 6 4.6 9.2a4.6 4.6 0 0 1-9.2 0c0-3.2 2-5.8 4.6-9.2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M12 26.5v-8.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M8.6 29.5c.4-1.8 1.8-3 3.4-3s3 1.2 3.4 3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
