import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminRequest, hasSessionSecret } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { guardAdmin, readJson, jsonError } from "@/lib/api-helpers";
import { passwordChangeSchema, zodErrorMessage } from "@/lib/validation";

/** Estado de sesión para el panel (GET). */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    authenticated: isAdminRequest(request),
    secretConfigured: hasSessionSecret(),
    hasAccount: (await db.execute("SELECT 1 FROM admin_account LIMIT 1")).rows.length > 0,
  });
}

/** Cambio de contraseña: exige la actual (no como el prototipo anterior). */
export async function PUT(request: NextRequest) {
  const denied = guardAdmin(request);
  if (denied) return denied;

  const body = await readJson<unknown>(request);
  const parsed = passwordChangeSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(zodErrorMessage(parsed.error), 400);
  }

  const account = await db.execute("SELECT id, password_hash FROM admin_account LIMIT 1");
  const row = account.rows[0];
  if (!row) {
    return jsonError("No existe cuenta de administrador. Ejecuta el seed.", 404);
  }

  const currentOk = await bcrypt.compare(parsed.data.currentPassword, String(row.password_hash));
  if (!currentOk) {
    return jsonError("La contraseña actual no es correcta.", 401);
  }

  const hash = await bcrypt.hash(parsed.data.newPassword, 12);
  await db.execute({
    sql: "UPDATE admin_account SET password_hash = ?, updated_at = datetime('now') WHERE id = ?",
    args: [hash, String(row.id)],
  });
  return NextResponse.json({ success: true });
}
