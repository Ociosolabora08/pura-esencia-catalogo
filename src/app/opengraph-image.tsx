import { ImageResponse } from "next/og";
import { getBrand } from "@/lib/catalog";

export const alt = "Pura Esencia — Velas artesanales y rituales sensoriales";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const brand = await getBrand().catch(() => null);
  const name = brand?.name ?? "Pura Esencia";
  const tagline = brand?.tagline ?? "Un ritual para cada momento del día";
  const primary = brand?.theme.primaryColor ?? "#726849";
  const background = brand?.theme.backgroundColor ?? "#F5F3EF";
  const text = brand?.theme.textColor ?? "#272623";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          background: `linear-gradient(150deg, ${background} 55%, ${primary}22 100%)`,
          color: text,
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: 999,
            border: `3px solid ${primary}`,
            fontSize: 44,
            background: `radial-gradient(circle at 35% 30%, ${primary}55, transparent 70%)`,
          }}
        />
        <div style={{ display: "flex", fontSize: 72, fontWeight: 700, letterSpacing: -2 }}>{name}</div>
        <div style={{ display: "flex", fontSize: 30, opacity: 0.75 }}>{tagline}</div>
        <div
          style={{
            display: "flex",
            marginTop: 16,
            fontSize: 24,
            padding: "10px 28px",
            borderRadius: 999,
            background: primary,
            color: "#fff",
          }}
        >
          Velas artesanales · Pedidos por WhatsApp
        </div>
      </div>
    ),
    size,
  );
}
