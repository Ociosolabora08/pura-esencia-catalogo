"use client";

import { useState } from "react";
import { Loader2, FlameKindling } from "lucide-react";
import { apiSend, ApiError } from "@/lib/admin-client";

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiSend("/api/admin/login", "POST", { password });
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-sm space-y-5 px-6 py-16">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <FlameKindling className="h-7 w-7 text-primary" aria-hidden />
        </div>
        <h1 className="font-display mt-4 text-xl font-semibold">Panel de administración</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gestiona el catálogo de Pura Esencia</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="admin-password" className="text-sm font-medium">
          Contraseña
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Tu contraseña de administrador"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || password.length === 0}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {loading ? "Verificando…" : "Entrar"}
      </button>
    </form>
  );
}
