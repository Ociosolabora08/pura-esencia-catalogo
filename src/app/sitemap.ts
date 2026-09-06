import type { MetadataRoute } from "next";
import { getPublishedProducts } from "@/lib/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  let productUrls: MetadataRoute.Sitemap = [];
  try {
    const products = await getPublishedProducts();
    productUrls = products.map((p) => ({
      url: `${base}/productos/${p.slug}`,
      lastModified: new Date(`${p.updatedAt.replace(" ", "T")}Z`),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    productUrls = [];
  }
  return [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ...productUrls,
  ];
}
