import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sin output: "standalone" (no lo exige ningún objetivo de despliegue actual)
  // y sin ignoreBuildErrors: los errores de tipo se corrigen, no se ocultan.
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
