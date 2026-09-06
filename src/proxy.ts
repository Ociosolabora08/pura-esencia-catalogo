import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * Gate de red para las APIs administrativas (Next 16 reemplazó middleware.ts
 * por proxy.ts). La verificación real se repite dentro de cada handler con
 * requireAdmin(); esta capa bloquea temprano y reduce superficie.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api/admin/")) {
    return NextResponse.next();
  }

  // El login se evalúa en su handler (rate limiting + cuenta).
  if (pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  if (!verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json(
      { error: "Sesión inválida o expirada. Inicia sesión de nuevo." },
      { status: 401 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*"],
};
