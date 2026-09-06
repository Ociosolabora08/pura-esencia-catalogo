"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, KeyRound, LogOut } from "lucide-react";
import { apiSend, ApiError } from "@/lib/admin-client";

const inputClass =
  "w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function AccountManager({ onLogout }: { onLogout: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleChange(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (newPassword !== repeat) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }
    setSaving(true);
    try {
      await apiSend("/api/admin/session", "PUT", { currentPassword, newPassword });
      toast.success("Contraseña actualizada");
      setCurrentPassword("");
      setNewPassword("");
      setRepeat("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cambiar la contraseña.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await apiSend("/api/admin/login", "DELETE");
    } catch {
      // La cookie se invalida localmente aunque la petición falle.
    } finally {
      onLogout();
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleChange} className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 card-shadow">
        <h2 className="font-display flex items-center gap-2 text-base font-semibold">
          <KeyRound className="h-4 w-4 text-primary" aria-hidden /> Cambiar contraseña
        </h2>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Contraseña actual</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Nueva contraseña</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
            placeholder="Mínimo 8 caracteres, con letras y números"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Repetir nueva contraseña</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
            className={inputClass}
          />
        </label>
        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {saving ? "Guardando…" : "Actualizar contraseña"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => void handleLogout()}
        disabled={loggingOut}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-destructive/40 px-5 text-sm font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" aria-hidden /> Cerrar sesión
      </button>
    </div>
  );
}
