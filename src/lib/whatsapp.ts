import type { BrandSettings } from "./catalog";

/**
 * Utilidades de WhatsApp: normalización de número y construcción del mensaje
 * a partir de plantillas configurables desde el panel.
 *
 * Plantillas soportan los marcadores {marca}, {producto} y {precio}.
 * El precio se formatea con la moneda/locale de la marca antes de insertarse.
 */

export function formatPrice(price: number, currency = "COP", locale = "es-CO"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Normaliza un número de WhatsApp a formato internacional sin símbolos.
 * - Elimina todo lo que no sea dígito.
 * - `00…` → quita el prefijo internacional.
 * - Móvil colombiano de 10 dígitos que empieza por 3 → antepone 57.
 */
export function normalizeWhatsAppNumber(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("3")) digits = `57${digits}`;
  return digits;
}

export function fillTemplate(
  template: string,
  vars: { producto: string; precio?: string; marca: string },
): string {
  return template
    .replaceAll("{producto}", vars.producto)
    .replaceAll("{precio}", vars.precio ?? "")
    .replaceAll("{marca}", vars.marca)
    .trim();
}

export interface WhatsAppIntent {
  link: string;
  message: string;
}

/**
 * Construye el enlace wa.me para un producto.
 * - Productos individuales usan la plantilla con precio.
 * - Packs usan la plantilla de pack (sin precio, según la estrategia comercial).
 * Si la marca no tiene número configurado devuelve null (el caller oculta el CTA).
 */
export function buildProductWhatsApp(
  brandName: string,
  settings: Pick<BrandSettings, "whatsappNumber" | "whatsappTemplateProduct" | "whatsappTemplatePack" | "currency" | "locale">,
  product: { name: string; price: number; isPack: boolean },
): WhatsAppIntent | null {
  const number = normalizeWhatsAppNumber(settings.whatsappNumber);
  if (!number) return null;
  const template = product.isPack ? settings.whatsappTemplatePack : settings.whatsappTemplateProduct;
  // Formato canónico del plan: "$35.000 COP" (sin espacio tras el símbolo,
  // con código de moneda explícito en el mensaje).
  const precio = `${formatPrice(product.price, settings.currency, settings.locale).replace(/[\s\u00A0\u202F]/g, "")} ${settings.currency}`;
  const message = fillTemplate(template, {
    producto: product.name,
    marca: brandName,
    precio,
  });
  return {
    link: `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
    message,
  };
}

export function buildGeneralWhatsApp(brandName: string, settings: Pick<BrandSettings, "whatsappNumber" | "whatsappTemplateGeneral">): WhatsAppIntent | null {
  const number = normalizeWhatsAppNumber(settings.whatsappNumber);
  if (!number) return null;
  const message = fillTemplate(settings.whatsappTemplateGeneral, { producto: "", marca: brandName });
  return { link: `https://wa.me/${number}?text=${encodeURIComponent(message)}`, message };
}
