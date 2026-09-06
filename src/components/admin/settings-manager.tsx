"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, MessageCircle, Palette, RotateCcw } from "lucide-react";
import { apiGet, apiSend, ApiError } from "@/lib/admin-client";
import { formatPrice, normalizeWhatsAppNumber } from "@/lib/whatsapp";
import { ImageUploader } from "./image-uploader";

interface BrandSettings {
  description: string;
  whatsappNumber: string;
  whatsappTemplateProduct: string;
  whatsappTemplatePack: string;
  whatsappTemplateGeneral: string;
  currency: string;
  locale: string;
  footerNote: string;
  instagramUrl: string;
  logoImageId: string | null;
}

interface BrandTheme {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  cardColor: string;
  textColor: string;
  mutedColor: string;
  auroraColor: string;
  equilibrioColor: string;
  nectarColor: string;
}

const PRESET_THEME: BrandTheme = {
  primaryColor: "#726849",
  accentColor: "#907521",
  backgroundColor: "#F5F3EF",
  cardColor: "#FFFFFF",
  textColor: "#272623",
  mutedColor: "#8B8881",
  auroraColor: "#D4A843",
  equilibrioColor: "#7A9A6D",
  nectarColor: "#4A5580",
};

const inputClass =
  "w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function SettingsManager() {
  const [settings, setSettings] = useState<BrandSettings | null>(null);
  const [theme, setTheme] = useState<BrandTheme | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);

  async function load() {
    setError(null);
    try {
      const data = await apiGet<{ settings: BrandSettings; theme: BrandTheme }>("/api/admin/settings");
      setSettings(data.settings);
      setTheme(data.theme);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar la configuración.");
    }
  }

  useEffect(() => {
    // Carga inicial de datos: el setState ocurre tras await, no en el cuerpo del efecto.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  async function saveSettings(event: React.FormEvent) {
    event.preventDefault();
    if (!settings) return;
    setSavingSettings(true);
    try {
      await apiSend("/api/admin/settings", "PUT", { kind: "settings", ...settings });
      toast.success("Ajustes guardados y aplicados al catálogo");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar.");
    } finally {
      setSavingSettings(false);
    }
  }

  async function saveTheme() {
    if (!theme) return;
    setSavingTheme(true);
    try {
      await apiSend("/api/admin/settings", "PUT", { kind: "theme", ...theme });
      toast.success("Tema aplicado al catálogo");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar el tema.");
    } finally {
      setSavingTheme(false);
    }
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {error}{" "}
        <button type="button" onClick={() => void load()} className="font-semibold underline">
          Reintentar
        </button>
      </div>
    );
  }

  if (!settings || !theme) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Cargando configuración…
      </div>
    );
  }

  const digits = normalizeWhatsAppNumber(settings.whatsappNumber);
  const waPreview = digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent(
        (settings.whatsappTemplateProduct || "")
          .replaceAll("{producto}", "Aurora")
          .replaceAll("{marca}", "Pura Esencia")
          .replaceAll("{precio}", formatPrice(35000, settings.currency, settings.locale)),
      )}`
    : null;

  return (
    <div className="space-y-8">
      {/* WhatsApp */}
      <form onSubmit={saveSettings} className="space-y-5">
        <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 card-shadow">
          <h2 className="font-display flex items-center gap-2 text-base font-semibold">
            <MessageCircle className="h-4 w-4 text-wa" aria-hidden /> WhatsApp (canal de venta)
          </h2>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Número de WhatsApp</span>
            <input
              inputMode="tel"
              value={settings.whatsappNumber}
              onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
              className={inputClass}
              placeholder="Ej. +57 300 123 4567"
            />
            <span className="text-xs text-muted-foreground">
              {digits
                ? `Se usará como wa.me/${digits}`
                : "Sin número configurado el botón de pedido no aparece en el catálogo."}
            </span>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Mensaje para productos</span>
            <textarea
              rows={3}
              maxLength={500}
              value={settings.whatsappTemplateProduct}
              onChange={(e) => setSettings({ ...settings, whatsappTemplateProduct: e.target.value })}
              className={inputClass}
            />
            <span className="text-xs text-muted-foreground">
              Marcadores: {"{producto}"}, {"{precio}"}, {"{marca}"}
            </span>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Mensaje para packs</span>
            <textarea
              rows={2}
              maxLength={500}
              value={settings.whatsappTemplatePack}
              onChange={(e) => setSettings({ ...settings, whatsappTemplatePack: e.target.value })}
              className={inputClass}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Mensaje general (encabezado)</span>
            <textarea
              rows={2}
              maxLength={500}
              value={settings.whatsappTemplateGeneral}
              onChange={(e) => setSettings({ ...settings, whatsappTemplateGeneral: e.target.value })}
              className={inputClass}
            />
          </label>

          {waPreview && (
            <div className="rounded-xl border border-wa/30 bg-wa/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Vista previa del enlace
              </p>
              <p className="mt-1 break-all rounded-lg bg-card p-2 text-xs text-muted-foreground">{waPreview}</p>
              <a
                href={waPreview}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-wa hover:underline"
              >
                Probar enlace <MessageCircle className="h-3 w-3" aria-hidden />
              </a>
            </div>
          )}
        </section>

        {/* Marca */}
        <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 card-shadow">
          <h2 className="font-display text-base font-semibold">Identidad</h2>
          <ImageUploader
            label="Logo (circular)"
            currentUrl={settings.logoImageId ? `/api/images/${settings.logoImageId}` : null}
            onUploaded={(id) => setSettings({ ...settings, logoImageId: id })}
            onRemoved={
              settings.logoImageId
                ? () => setSettings({ ...settings, logoImageId: null })
                : undefined
            }
          />
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Descripción</span>
            <textarea
              rows={3}
              maxLength={1000}
              value={settings.description}
              onChange={(e) => setSettings({ ...settings, description: e.target.value })}
              className={inputClass}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Moneda</span>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className={inputClass}
              >
                {["COP", "USD", "MXN", "ARS", "CLP", "PEN", "EUR"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Formato regional</span>
              <select
                value={settings.locale}
                onChange={(e) => setSettings({ ...settings, locale: e.target.value })}
                className={inputClass}
              >
                {["es-CO", "es-MX", "es-AR", "es-CL", "es-PE", "en-US"].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Instagram (URL)</span>
            <input
              type="url"
              maxLength={300}
              value={settings.instagramUrl}
              onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
              className={inputClass}
              placeholder="https://instagram.com/puraesencia"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Nota del pie de página</span>
            <textarea
              rows={2}
              maxLength={300}
              value={settings.footerNote}
              onChange={(e) => setSettings({ ...settings, footerNote: e.target.value })}
              className={inputClass}
            />
          </label>
        </section>

        <button
          type="submit"
          disabled={savingSettings}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground active:scale-[0.98] disabled:opacity-50"
        >
          {savingSettings && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {savingSettings ? "Guardando…" : "Guardar ajustes"}
        </button>
      </form>

      {/* Tema */}
      <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 card-shadow">
        <h2 className="font-display flex items-center gap-2 text-base font-semibold">
          <Palette className="h-4 w-4 text-primary" aria-hidden /> Colores del tema
        </h2>
        <p className="text-xs text-muted-foreground">
          Se aplican a todo el catálogo público al guardar.
        </p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {(
            [
              ["primaryColor", "Primario (terracota)"],
              ["accentColor", "Acento (ámbar)"],
              ["backgroundColor", "Fondo"],
              ["cardColor", "Tarjetas"],
              ["textColor", "Texto"],
              ["mutedColor", "Texto suave"],
              ["auroraColor", "Aurora"],
              ["equilibrioColor", "Equilibrio"],
              ["nectarColor", "Nectar"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-2 rounded-xl border border-border/60 p-2.5">
              <span className="text-xs font-medium">{label}</span>
              <span className="flex items-center gap-1.5">
                <code className="text-[10px] text-muted-foreground">{theme[key]}</code>
                <input
                  type="color"
                  value={theme[key]}
                  onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
                  className="h-8 w-10 cursor-pointer rounded-lg border border-input"
                  aria-label={`Color ${label}`}
                />
              </span>
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTheme(PRESET_THEME)}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border px-3.5 text-sm font-medium hover:bg-accent"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Restaurar paleta oficial
          </button>
          <button
            type="button"
            onClick={() => void saveTheme()}
            disabled={savingTheme}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {savingTheme && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Aplicar tema
          </button>
        </div>
      </section>
    </div>
  );
}
