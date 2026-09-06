import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getBrand, adminUpdateSettings, adminUpdateTheme } from "@/lib/catalog";
import { guardAdmin, readJson, jsonError } from "@/lib/api-helpers";
import { settingsInputSchema, themeInputSchema, zodErrorMessage } from "@/lib/validation";

/** Ajustes de marca + tema. GET devuelve el paquete completo para el panel. */
export async function GET(request: NextRequest) {
  const denied = guardAdmin(request);
  if (denied) return denied;

  const brand = await getBrand();
  if (!brand) return jsonError("No hay marca configurada.", 404);
  return NextResponse.json({ settings: brand.settings, theme: brand.theme });
}

export async function PUT(request: NextRequest) {
  const denied = guardAdmin(request);
  if (denied) return denied;

  const brand = await getBrand();
  if (!brand) return jsonError("No hay marca configurada.", 404);

  const body = await readJson<{ kind?: string } & Record<string, unknown>>(request);
  if (!body || (body.kind !== "settings" && body.kind !== "theme")) {
    return jsonError("Indica kind: 'settings' o 'theme'.", 400);
  }

  if (body.kind === "settings") {
    const parsed = settingsInputSchema.safeParse(body);
    if (!parsed.success) return jsonError(zodErrorMessage(parsed.error), 400);
    if (parsed.data.whatsappNumber) {
      const digits = parsed.data.whatsappNumber.replace(/\D/g, "");
      if (digits.length < 8 || digits.length > 15) {
        return jsonError("whatsappNumber: el número debe tener entre 8 y 15 dígitos.", 400);
      }
    }
    await adminUpdateSettings(brand.id, parsed.data);
  } else {
    const parsed = themeInputSchema.safeParse(body);
    if (!parsed.success) return jsonError(zodErrorMessage(parsed.error), 400);
    await adminUpdateTheme(brand.id, parsed.data);
  }

  // Los ajustes afectan a la home, al layout (tema) y a todas las fichas de
  // producto (plantillas de WhatsApp, moneda): se revalidan en cascada.
  revalidatePath("/", "layout");
  revalidatePath("/productos/[slug]", "page");
  return NextResponse.json({ success: true });
}
