import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { setAdminCookie, clearAdminCookie, checkLoginRateLimit, recordFailedLogin, clearFailedLogins, hasSessionSecret, isSameOrigin } from "@/lib/auth";
import { readJson, jsonError } from "@/lib/api-helpers";
import { loginSchema, zodErrorMessage } from "@/lib/validation";

/** Login del panel. Rate limited; sin respuestas que distingan usuario inexistente. */
export async function POST(request: NextRequest) {
  if (!hasSessionSecret()) {
    return jsonError(
      "El servidor no tiene ADMIN_SESSION_SECRET configurado. El acceso admin está deshabilitado.",
      503,
    );
  }

  const rate = checkLoginRateLimit(request);
  if (!rate.allowed) {
    return jsonError(
      `Demasiados intentos. Vuelve a intentarlo en ${rate.retryInMinutes} minutos.`,
      429,
    );
  }

  const body = await readJson<unknown>(request);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(zodErrorMessage(parsed.error), 400);
  }

  const account = await db.execute(
    "SELECT password_hash FROM admin_account LIMIT 1",
  );
  const row = account.rows[0];
  const valid = row ? await bcrypt.compare(parsed.data.password, String(row.password_hash)) : false;

  if (!valid) {
    recordFailedLogin(request);
    return jsonError("Contraseña incorrecta.", 401);
  }

  clearFailedLogins(request);
  const cookieSet = await setAdminCookie();
  if (!cookieSet) {
    return jsonError("No se pudo iniciar la sesión.", 500);
  }
  return NextResponse.json({ success: true });
}

/** Cerrar sesión: invalida la cookie. */
export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return jsonError("Origen no permitido.", 403);
  }
  await clearAdminCookie();
  return NextResponse.json({ success: true });
}
