"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, ExternalLink, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { apiGet, apiSend, ApiError } from "@/lib/admin-client";
import { ImageUploader } from "./image-uploader";
import { formatPrice } from "@/lib/whatsapp";

interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  details: string;
  price: number;
  currency: string;
  categoryId: string | null;
  categoryName: string | null;
  isPack: boolean;
  isPublished: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  images: { id: string; url: string; alt: string }[];
}

interface AdminCategory {
  id: string;
  name: string;
}

const TAG_OPTIONS = ["Nuevo", "Más vendido", "Pack", "Edición limitada"];

const emptyForm = {
  name: "",
  description: "",
  details: "",
  price: "35000",
  categoryId: "",
  isPack: false,
  isPublished: true,
  isAvailable: true,
  isFeatured: false,
  sortOrder: "0",
  tags: [] as string[],
  seoTitle: "",
  seoDescription: "",
  imageIds: [] as string[],
  imageUrls: [] as string[],
};

export function ProductsManager() {
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminProduct | null>(null);

  async function load() {
    setLoadError(null);
    try {
      const [prods, cats] = await Promise.all([
        apiGet<AdminProduct[]>("/api/admin/products"),
        apiGet<AdminCategory[]>("/api/admin/categories"),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "No se pudo cargar el catálogo.");
    }
  }

  useEffect(() => {
    // Carga inicial de datos: el setState ocurre tras await, no en el cuerpo del efecto.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setCreating(true);
  }

  function openEdit(product: AdminProduct) {
    setEditing(product);
    setFormError(null);
    setForm({
      name: product.name,
      description: product.description,
      details: product.details,
      price: String(product.price),
      categoryId: product.categoryId ?? "",
      isPack: product.isPack,
      isPublished: product.isPublished,
      isAvailable: product.isAvailable,
      isFeatured: product.isFeatured,
      sortOrder: String(product.sortOrder),
      tags: product.tags,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      imageIds: product.images.map((img) => img.id),
      imageUrls: product.images.map((img) => img.url),
    });
    setCreating(true);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const price = Number(form.price);
    if (!form.name.trim()) return setFormError("El nombre es obligatorio.");
    if (!Number.isInteger(price) || price < 0) return setFormError("El precio debe ser un número entero sin decimales.");
    if (form.tags.includes("Pack") && !form.isPack) {
      // Coherencia: etiqueta Pack implica producto pack para la plantilla de WhatsApp.
      setForm({ ...form, isPack: true });
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      details: form.details.trim(),
      price,
      currency: "COP",
      categoryId: form.categoryId || null,
      isPack: form.isPack,
      isPublished: form.isPublished,
      isAvailable: form.isAvailable,
      isFeatured: form.isFeatured,
      sortOrder: Number(form.sortOrder) || 0,
      tags: form.tags,
      seoTitle: form.seoTitle.trim(),
      seoDescription: form.seoDescription.trim(),
      imageIds: form.imageIds,
    };

    setSaving(true);
    try {
      if (editing) {
        await apiSend("/api/admin/products", "PUT", { id: editing.id, ...payload });
        toast.success("Producto actualizado y publicado en el catálogo");
      } else {
        await apiSend("/api/admin/products", "POST", payload);
        toast.success("Producto creado");
      }
      setCreating(false);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo guardar el producto.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await apiSend(`/api/admin/products?id=${encodeURIComponent(deleting.id)}`, "DELETE");
      toast.success(`"${deleting.name}" eliminado`);
      setDeleting(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar.");
      setDeleting(null);
    }
  }

  const previewHref = useMemo(
    () => (editing ? `/productos/${editing.slug}` : "/"),
    [editing],
  );

  if (loadError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {loadError}{" "}
        <button type="button" onClick={() => void load()} className="font-semibold underline">
          Reintentar
        </button>
      </div>
    );
  }

  if (products === null) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Cargando productos…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {products.length} {products.length === 1 ? "producto" : "productos"}
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" aria-hidden /> Nuevo producto
        </button>
      </div>

      {products.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Aún no hay productos. Crea el primero para poblar el catálogo.
        </div>
      )}

      <ul className="space-y-2.5">
        {products.map((product) => (
          <li
            key={product.id}
            className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 card-shadow"
          >
            <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
              {product.images[0] ? (
                <Image src={product.images[0].url} alt="" fill sizes="56px" className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-lg" aria-hidden>🕯️</span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {product.name}{" "}
                {!product.isPublished && <span className="font-normal text-muted-foreground">· borrador</span>}
                {!product.isAvailable && <span className="font-normal text-destructive">· agotado</span>}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {product.categoryName ?? "Sin categoría"} · {formatPrice(product.price, product.currency)}
                {product.isPack ? " · pack" : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <a
                href={`/productos/${product.slug}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`Ver ${product.name} en el catálogo`}
                className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
              <button
                type="button"
                onClick={() => openEdit(product)}
                aria-label={`Editar ${product.name}`}
                className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Pencil className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setDeleting(product)}
                aria-label={`Eliminar ${product.name}`}
                className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Editor de producto */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editing ? `Editar ${editing.name}` : "Nuevo producto"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <ImageUploader
              label="Fotos del producto"
              aspect="wide"
              currentUrl={form.imageUrls[0] ?? null}
              onUploaded={(id, url) =>
                setForm((f) => ({ ...f, imageIds: [...f.imageIds, id], imageUrls: [...f.imageUrls, url] }))
              }
              onRemoved={
                form.imageIds.length > 0
                  ? () => setForm((f) => ({
                      ...f,
                      imageIds: f.imageIds.slice(0, -1),
                      imageUrls: f.imageUrls.slice(0, -1),
                    }))
                  : undefined
              }
            />
            {form.imageUrls.length > 1 && (
              <p className="text-xs text-muted-foreground">
                {form.imageUrls.length} fotos en la galería. La primera es la principal.
              </p>
            )}

            <Field label="Nombre">
              <input
                required
                maxLength={120}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                placeholder="Ej. Aurora"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Precio (COP)">
                <input
                  required
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value.replace(/\D/g, "") })}
                  className={inputClass}
                  placeholder="35000"
                />
              </Field>
              <Field label="Orden en el feed">
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value.replace(/\D/g, "") })}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Categoría">
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className={inputClass}
              >
                <option value="">Sin categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Descripción">
              <textarea
                rows={5}
                maxLength={4000}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={inputClass}
                placeholder="Qué es, qué notas tiene y cómo se usa en el ritual. Sé sensorial, sin claims de salud."
              />
            </Field>

            <Field label="Detalles (una línea por item)">
              <textarea
                rows={3}
                maxLength={1000}
                value={form.details}
                onChange={(e) => setForm({ ...form, details: e.target.value })}
                className={inputClass}
                placeholder={"Momento: 6:00 – 11:00 AM\nCera de soja · 180–200 g"}
              />
            </Field>

            <Field label="Etiquetas">
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map((tag) => {
                  const active = form.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          tags: active ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
                        }))
                      }
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-accent"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </Field>

            <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-3.5">
              <ToggleRow
                label="Publicado"
                hint="Visible en el catálogo público"
                checked={form.isPublished}
                onChange={(v) => setForm({ ...form, isPublished: v })}
              />
              <ToggleRow
                label="Disponible"
                hint="Si se desactiva, el catálogo muestra 'Agotado'"
                checked={form.isAvailable}
                onChange={(v) => setForm({ ...form, isAvailable: v })}
              />
              <ToggleRow
                label="Pack"
                hint="Usa la plantilla de WhatsApp para packs (sin precio)"
                checked={form.isPack}
                onChange={(v) => setForm({ ...form, isPack: v })}
              />
              <ToggleRow
                label="Destacado"
                hint="Aparece en el carrusel de destacados"
                checked={form.isFeatured}
                onChange={(v) => setForm({ ...form, isFeatured: v })}
              />
            </div>

            <details className="rounded-xl border border-border/60 p-3.5">
              <summary className="cursor-pointer text-sm font-medium">SEO (opcional)</summary>
              <div className="mt-3 space-y-3">
                <Field label="Título SEO">
                  <input
                    maxLength={180}
                    value={form.seoTitle}
                    onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Descripción SEO">
                  <textarea
                    rows={2}
                    maxLength={300}
                    value={form.seoDescription}
                    onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
                    className={inputClass}
                  />
                </Field>
              </div>
            </details>

            {editing && (
              <a
                href={previewHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <Eye className="h-4 w-4" aria-hidden /> Previsualizar en el catálogo
              </a>
            )}

            {formError && (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="h-11 flex-1 rounded-xl border border-border text-sm font-medium hover:bg-accent"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex h-11 flex-[2] items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground active:scale-[0.98] disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear producto"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmación de borrado */}
      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar "{deleting?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El producto desaparecerá del catálogo público.
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

const inputClass =
  "w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}
