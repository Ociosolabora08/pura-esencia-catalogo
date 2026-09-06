"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Loader2, ImagePlus, X, CheckCircle2, AlertCircle } from "lucide-react";
import { apiUpload, ApiError } from "@/lib/admin-client";

interface UploadResult {
  id: string;
  url: string;
  optimization?: { originalSize: string; optimizedSize: string; reduction: string };
}

/**
 * Subida de imágenes al backend validado (/api/admin/uploads).
 * Muestra estado de carga, estadísticas reales de optimización y errores reales.
 */
export function ImageUploader({
  currentUrl,
  onUploaded,
  onRemoved,
  label = "Imagen",
  aspect = "square",
}: {
  currentUrl?: string | null;
  onUploaded: (imageId: string, url: string) => void;
  onRemoved?: () => void;
  label?: string;
  aspect?: "square" | "wide";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setStats(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Formato no permitido. Usa JPEG, PNG o WebP.");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setError("La imagen supera 6 MB. Reduce el tamaño e inténtalo de nuevo.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = (await apiUpload("/api/admin/uploads", formData)) as UploadResult;
      setStats(
        result.optimization
          ? `${result.optimization.originalSize} → ${result.optimization.optimizedSize} (${result.optimization.reduction} menos)`
          : "Imagen optimizada",
      );
      onUploaded(result.id, result.url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo subir la imagen.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {currentUrl && (
        <div className={`relative overflow-hidden rounded-xl border border-border ${aspect === "square" ? "aspect-square max-w-[180px]" : "aspect-[3/1] w-full max-w-md"}`}>
          <Image src={currentUrl} alt={`Previsualización de ${label.toLowerCase()}`} fill sizes="180px" className="object-cover" />
          {onRemoved && (
            <button
              type="button"
              onClick={onRemoved}
              aria-label={`Quitar ${label.toLowerCase()}`}
              className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </div>
      )}
      <div
        className={`relative rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
          loading ? "pointer-events-none opacity-60" : "hover:border-primary/60"
        } border-border`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={`Subir ${label.toLowerCase()}`}
          disabled={loading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        {loading ? (
          <span className="flex flex-col items-center gap-1.5 py-1 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
            Optimizando imagen…
          </span>
        ) : (
          <span className="flex flex-col items-center gap-1 py-1 text-sm text-muted-foreground">
            <ImagePlus className="h-5 w-5" aria-hidden />
            Arrastra o haz clic para subir
            <span className="text-xs">JPEG, PNG o WebP · máx. 6 MB · se convierte a WebP</span>
          </span>
        )}
      </div>
      {stats && (
        <p className="flex items-center gap-1.5 rounded-lg bg-equilibrio/10 px-2.5 py-1.5 text-xs text-equilibrio">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden /> {stats}
        </p>
      )}
      {error && (
        <p role="alert" className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden /> {error}
        </p>
      )}
    </div>
  );
}
