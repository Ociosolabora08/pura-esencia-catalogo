"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FlameKindling, Package, Shapes, Store, UserCog, Loader2 } from "lucide-react";
import { apiGet, ApiError } from "@/lib/admin-client";
import { LoginForm } from "./login-form";
import { ProductsManager } from "./products-manager";
import { CategoriesManager } from "./categories-manager";
import { SettingsManager } from "./settings-manager";
import { AccountManager } from "./account-manager";
import { cn } from "@/lib/utils";

type Tab = "products" | "categories" | "brand" | "account";

const TABS: { id: Tab; label: string; icon: typeof Package }[] = [
  { id: "products", label: "Productos", icon: Package },
  { id: "categories", label: "Categorías", icon: Shapes },
  { id: "brand", label: "Marca", icon: Store },
  { id: "account", label: "Cuenta", icon: UserCog },
];

export function AdminApp() {
  const [state, setState] = useState<"checking" | "login" | "ready">("checking");
  const [setupWarning, setSetupWarning] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("products");

  const checkSession = useCallback(async () => {
    try {
      const session = await apiGet<{ authenticated: boolean; secretConfigured: boolean; hasAccount: boolean }>(
        "/api/admin/session",
      );
      if (!session.secretConfigured) {
        setSetupWarning(
          "El servidor no tiene ADMIN_SESSION_SECRET configurado; el login está deshabilitado. Revisa el despliegue.",
        );
      } else if (!session.hasAccount) {
        setSetupWarning(
          "Aún no existe cuenta de administrador. Ejecuta el seed con ADMIN_INITIAL_PASSWORD para crearla.",
        );
      } else {
        setSetupWarning(null);
      }
      setState(session.authenticated ? "ready" : "login");
    } catch {
      setState("login");
    }
  }, []);

  useEffect(() => {
    // Verificación de sesión al montar: setState ocurre tras await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void checkSession();
  }, [checkSession]);

  if (state === "checking") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Verificando sesión…
      </div>
    );
  }

  if (state === "login") {
    return (
      <div>
        {setupWarning && (
          <p role="alert" className="mx-auto mt-8 max-w-sm rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {setupWarning}
          </p>
        )}
        <LoginForm onSuccess={() => void checkSession()} />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-xl pb-24 md:pb-8">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <FlameKindling className="h-5 w-5 text-primary" aria-hidden />
          <h1 className="font-display text-[15px] font-semibold">Panel de Pura Esencia</h1>
        </div>
        <Link
          href="/"
          target="_blank"
          className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
        >
          Ver catálogo ↗
        </Link>
      </header>

      <nav aria-label="Secciones del panel" className="border-b border-border/60 bg-card/50 px-2">
        <ul className="flex">
          {TABS.map(({ id, label, icon: Icon }) => (
            <li key={id} className="flex-1">
              <button
                type="button"
                onClick={() => setTab(id)}
                aria-current={tab === id ? "page" : undefined}
                className={cn(
                  "flex w-full items-center justify-center gap-1.5 border-b-2 py-3 text-xs font-medium transition-colors",
                  tab === id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden /> {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <main className="p-4">
        {tab === "products" && <ProductsManager />}
        {tab === "categories" && <CategoriesManager />}
        {tab === "brand" && <SettingsManager />}
        {tab === "account" && <AccountManager onLogout={() => setState("login")} />}
      </main>
    </div>
  );
}
