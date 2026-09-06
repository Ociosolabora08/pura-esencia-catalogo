"use client";

/**
 * Cliente HTTP del panel: comprueba response.ok, extrae el error real del
 * servidor y nunca simula éxito. Todas las mutaciones envían JSON con
 * credentials same-origin (la cookie viaja sola; el navegador añade Origin).
 */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    if (data?.error) return data.error;
  } catch {
    // Sin cuerpo JSON.
  }
  return `Error ${response.status}`;
}

export async function apiGet<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new ApiError(await parseError(response), response.status);
  return (await response.json()) as T;
}

export async function apiSend<T>(
  url: string,
  method: "POST" | "PUT" | "DELETE",
  body?: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new ApiError(await parseError(response), response.status);
  return (await response.json()) as T;
}

export async function apiUpload(url: string, formData: FormData): Promise<unknown> {
  const response = await fetch(url, { method: "POST", body: formData });
  if (!response.ok) throw new ApiError(await parseError(response), response.status);
  return await response.json();
}
