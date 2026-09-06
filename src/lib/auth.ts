import crypto from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

/**
 * Sesión administrativa firmada con HMAC-SHA256.
 * Token: `v1.<expiraMs>.<nonce>.<firma>` — no falsificable sin ADMIN_SESSION_SECRET.
 * Reemplaza el token base64 del prototipo, que cualquiera podía generar.
 */

export const ADMIN_COOKIE = "pe_admin";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

function getSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 16) return null;
  return secret;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function hmac(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionToken(): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const nonce = crypto.randomBytes(16).toString("base64url");
  const payload = `v1.${expiresAt}.${nonce}`;
  return `${payload}.${hmac(payload, secret)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const secret = getSecret();
  if (!secret) return false;
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return false;
  const [, expiresAt, nonce, signature] = parts;
  const payload = `v1.${expiresAt}.${nonce}`;
  const expected = hmac(payload, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  if (!crypto.timingSafeEqual(a, b)) return false;
  const exp = Number(expiresAt);
  return Number.isFinite(exp) && exp > Date.now();
}

export function hasSessionSecret(): boolean {
  return getSecret() !== null;
}

/** Cookie de sesión lista para usar con `cookies()` del servidor. */
export async function setAdminCookie(): Promise<boolean> {
  const token = createSessionToken();
  if (!token) return false;
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
  return true;
}

export async function clearAdminCookie(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
}

/**
 * Verifica la sesión leyendo la petición (fuente de verdad en cada handler admin).
 */
export function isAdminRequest(request: NextRequest): boolean {
  return verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
}

/**
 * CSRF/origin check para mutaciones: el navegador siempre envía Origin en POST/PUT/DELETE.
 * Se compara contra el Host de la petición; se ignora x-forwarded-for.
 */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const host = request.headers.get("host");
  return !!host && originHost === host;
}

/**
 * Rate limiting en memoria para el login. Limitación documentada: es por
 * instancia de proceso; en serverless cada instancia cuenta aparte.
 */
const attempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function clientKey(request: NextRequest): string {
  // La IP directa del socket (x-forwarded-for es falsificable); en serverless
  // la plataforma suele reescribirla, por eso se combina con el User-Agent.
  const ip =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const ua = request.headers.get("user-agent") || "";
  return crypto.createHash("sha256").update(`${ip}|${ua}`).digest("hex");
}

export function checkLoginRateLimit(request: NextRequest): { allowed: boolean; retryInMinutes: number } {
  const key = clientKey(request);
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry) return { allowed: true, retryInMinutes: 0 };
  if (entry.count >= MAX_ATTEMPTS && now - entry.lastAttempt < LOCKOUT_MS) {
    return {
      allowed: false,
      retryInMinutes: Math.ceil((LOCKOUT_MS - (now - entry.lastAttempt)) / 60000),
    };
  }
  if (entry.count >= MAX_ATTEMPTS) attempts.delete(key);
  return { allowed: true, retryInMinutes: 0 };
}

export function recordFailedLogin(request: NextRequest): void {
  const key = clientKey(request);
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.lastAttempt > LOCKOUT_MS) {
    attempts.set(key, { count: 1, lastAttempt: now });
  } else {
    attempts.set(key, { count: entry.count + 1, lastAttempt: now });
  }
}

export function clearFailedLogins(request: NextRequest): void {
  attempts.delete(clientKey(request));
}
