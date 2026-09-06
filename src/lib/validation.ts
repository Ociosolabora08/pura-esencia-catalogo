import { z } from "zod";

/**
 * Contratos de validación del servidor (Zod). Toda entrada de API pasa por aquí.
 */

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color hexadecimal inválido");

export const loginSchema = z.object({
  password: z.string().min(1, "Contraseña requerida").max(200),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z
      .string()
      .min(8, "La nueva contraseña debe tener al menos 8 caracteres")
      .max(200)
      .regex(/[a-zA-Z]/, "Debe incluir letras")
      .regex(/[0-9]/, "Debe incluir números"),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "La nueva contraseña debe ser distinta de la actual",
    path: ["newPassword"],
  });

export const productInputSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(120),
  description: z.string().max(4000).default(""),
  details: z.string().max(1000).default(""),
  price: z.number().int().min(0).max(100_000_000),
  currency: z.enum(["COP", "USD", "MXN", "ARS", "CLP", "PEN", "EUR"]).default("COP"),
  categoryId: z.string().max(64).nullable().default(null),
  isPack: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  tags: z.array(z.string().min(1).max(40)).max(6).default([]),
  seoTitle: z.string().max(180).default(""),
  seoDescription: z.string().max(300).default(""),
  imageIds: z.array(z.string().max(64)).max(6).default([]),
});

export const categoryInputSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(80),
  accentColor: hexColor.or(z.literal("")).default(""),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  imageId: z.string().max(64).nullable().default(null),
});

export const settingsInputSchema = z.object({
  description: z.string().max(1000).default(""),
  whatsappNumber: z.string().max(24).default(""),
  whatsappTemplateProduct: z.string().max(500).default(""),
  whatsappTemplatePack: z.string().max(500).default(""),
  whatsappTemplateGeneral: z.string().max(500).default(""),
  currency: z.enum(["COP", "USD", "MXN", "ARS", "CLP", "PEN", "EUR"]).default("COP"),
  locale: z.enum(["es-CO", "es-MX", "es-AR", "es-CL", "es-PE", "en-US"]).default("es-CO"),
  footerNote: z.string().max(300).default(""),
  instagramUrl: z.string().max(300).default(""),
  logoImageId: z.string().max(64).nullable().default(null),
});

export const themeInputSchema = z.object({
  primaryColor: hexColor,
  accentColor: hexColor,
  backgroundColor: hexColor,
  cardColor: hexColor,
  textColor: hexColor,
  mutedColor: hexColor,
  auroraColor: hexColor,
  equilibrioColor: hexColor,
  nectarColor: hexColor,
});

export function zodErrorMessage(error: z.ZodError): string {
  const first = error.issues[0];
  return first ? `${first.path.join(".")}: ${first.message}` : "Datos inválidos";
}
