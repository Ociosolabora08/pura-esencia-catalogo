"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiGet, apiSend, ApiError } from "@/lib/admin-client";

interface AdminCategory {
  id: string;
  slug: string;
  name: string;
  accentColor: string;
  imageUrl: string | null;
  sortOrder: number;
  productCount: number;
}

const inputClass =
  "w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function CategoriesManager() {
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [form, setForm] = useState({ name: "", accentColor: "", sortOrder: "0" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminCategory | null>(null);

  async function load() {
    setError(null);
    try {
      setCategories(await apiGet<AdminCategory[]>("/api/admin/categories"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar las categorías.");
    }
  }

  useEffect(() => {
    // Carga inicial de datos: el setState ocurre tras await, no en el cuerpo del efecto.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", accentColor: "#726849", sortOrder: String((categories?.length ?? 0) + 1) });
    setFormError(null);
    setEditing({ id: "", slug: "", name: "", accentColor: "", imageUrl: null, sortOrder: 0, productCount: 0 });
  }

  function openEdit(cat: AdminCategory) {
    setForm({ name: cat.name, accentColor: cat.accentColor, sortOrder: String(cat.sortOrder) });
    setFormError(null);
    setEditing(cat);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setFormError(null);
    if (!form.name.trim()) return setFormError("El nombre es obligatorio.");

    const payload = {
      name: form.name.trim(),
      accentColor: /^#[0-9a-fA-F]{6}$/.test(form.accentColor) ? form.accentColor : "",
      sortOrder: Number(form.sortOrder) || 0,
      imageId: null,
    };
    setSaving(true);
    try {
      if (editing.id) {
        await apiSend("/api/admin/categories", "PUT", { id: editing.id, ...payload });
        toast.success("Categoría actualizada");
      } else {
        await apiSend("/api/admin/categories", "POST", payload);
        toast.success("Categoría creada");
      }
      setEditing(null);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await apiSend(`/api/admin/categories?id=${encodeURIComponent(deleting.id)}`, "DELETE");
      toast.success(`"${deleting.name}" eliminada`);
      setDeleting(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar.");
      setDeleting(null);
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

  if (categories === null) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Cargando categorías…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Aparecen como círculos en la navegación. El color de acento tiñe sus secciones.
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" aria-hidden /> Nueva
        </button>
      </div>

      <ul className="space-y-2.5">
        {categories.map((cat) => (
          <li
            key={cat.id}
            className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 card-shadow"
          >
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              style={{
                background: `color-mix(in srgb, ${cat.accentColor || "#726849"} 18%, white)`,
                color: cat.accentColor || "#726849",
              }}
              aria-hidden
            >
              {cat.name.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{cat.name}</p>
              <p className="text-xs text-muted-foreground">
                {cat.productCount} {cat.productCount === 1 ? "producto" : "productos"} · orden {cat.sortOrder}
              </p>
            </div>
            <button
              type="button"
              onClick={() => openEdit(cat)}
              aria-label={`Editar ${cat.name}`}
              className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Pencil className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setDeleting(cat)}
              aria-label={`Eliminar ${cat.name}`}
              className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>

      {categories.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Sin categorías todavía. Crea al menos una (Mañana, Tarde, Noche, Packs…).
        </div>
      )}

      {/* Editor inline */}
      {editing && (
        <form
          onSubmit={handleSave}
          className="space-y-3 rounded-2xl border border-border bg-card p-4 card-shadow"
          aria-label={editing.id ? "Editar categoría" : "Nueva categoría"}
        >
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Nombre</span>
              <input
                required
                maxLength={80}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                placeholder="Ej. Mañana"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Orden</span>
              <input
                inputMode="numeric"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value.replace(/\D/g, "") })}
                className={`${inputClass} w-20`}
              />
            </label>
          </div>
          <label className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3">
            <span className="text-sm font-medium">Color de acento</span>
            <span className="flex items-center gap-2">
              <code className="text-xs text-muted-foreground">{form.accentColor || "—"}</code>
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(form.accentColor) ? form.accentColor : "#726849"}
                onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                className="h-9 w-12 cursor-pointer rounded-lg border border-input"
                aria-label="Elegir color de acento"
              />
            </span>
          </label>

          {formError && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="h-10 flex-1 rounded-xl border border-border text-sm font-medium hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex h-10 flex-[2] items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Guardar
            </button>
          </div>
        </form>
      )}

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar la categoría "{deleting?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Los productos de esta categoría NO se borran: quedarán sin categoría. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
