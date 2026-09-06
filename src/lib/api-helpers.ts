import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminRequest, isSameOrigin } from "./auth";

export function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/**
 * Guardia única para handlers administrativos:
 * 1) sesión firmada válida, 2) origin check en mutaciones.
 * Devuelve una respuesta de error o null si la petición puede continuar.
 */
export function guardAdmin(request: NextRequest): NextResponse | null {
  const unsafe = request.method !== "GET" && request.method !== "HEAD";
  if (unsafe && !isSameOrigin(request)) {
    return jsonError("Origen no permitido.", 403);
  }
  if (!isAdminRequest(request)) {
    return jsonError("Sesión inválida o expirada. Inicia sesión de nuevo.", 401);
  }
  return null;
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
