import type { NextRequest } from "next/server";

/**
 * robots.txt determinista: el MetadataRoute de Next 16 omitía los Disallow
 * con el formato de reglas combinadas. Un handler simple no falla.
 */
export function GET(_request: NextRequest) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const body = [
    "User-agent: *",
    "Disallow: /admin",
    "Disallow: /api/",
    "Allow: /",
    "",
    `Sitemap: ${base}/sitemap.xml`,
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
