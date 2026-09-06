import type { MetadataRoute } from "next";
import { getBrand } from "@/lib/catalog";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const brand = await getBrand().catch(() => null);
  return {
    name: `${brand?.name ?? "Pura Esencia"} · Catálogo`,
    short_name: brand?.name ?? "Pura Esencia",
    description: brand?.tagline ?? "Velas artesanales y rituales sensoriales",
    start_url: "/",
    display: "standalone",
    background_color: brand?.theme.backgroundColor ?? "#F5F3EF",
    theme_color: brand?.theme.primaryColor ?? "#726849",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
