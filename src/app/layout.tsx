import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { getBrand } from "@/lib/catalog";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand().catch(() => null);
  const name = brand?.name ?? "Pura Esencia";
  const description =
    brand?.settings.description ||
    "Velas artesanales de cera de soja para acompañar los momentos del día. Mañana, tarde y noche: un ritual para cada momento.";
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: `${name} | Velas artesanales y rituales sensoriales`,
      template: `%s | ${name}`,
    },
    description,
    applicationName: name,
    openGraph: {
      type: "website",
      locale: "es_CO",
      siteName: name,
      title: `${name} | Velas artesanales y rituales sensoriales`,
      description,
    },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Sin maximumScale ni userScalable: el zoom del usuario nunca se bloquea (accesibilidad).
  themeColor: "#726849",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // El tema se lee de brand_theme y se inyecta como variables CSS: el panel
  // admin puede cambiar los colores sin tocar el código.
  let themeVars = "";
  try {
    const brand = await getBrand();
    if (brand) {
      const t = brand.theme;
      themeVars = [
        ["--brand-primary", t.primaryColor],
        ["--brand-accent", t.accentColor],
        ["--brand-background", t.backgroundColor],
        ["--brand-card", t.cardColor],
        ["--brand-text", t.textColor],
        ["--brand-muted", t.mutedColor],
        ["--brand-aurora", t.auroraColor],
        ["--brand-equilibrio", t.equilibrioColor],
        ["--brand-nectar", t.nectarColor],
      ]
        .map(([k, v]) => `${k}:${v}`)
        .join(";");
    }
  } catch {
    // Sin BD disponible se usan los valores por defecto de globals.css.
  }

  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        {themeVars ? (
          <style
            dangerouslySetInnerHTML={{
              __html: `:root{${themeVars}}`,
            }}
          />
        ) : null}
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
