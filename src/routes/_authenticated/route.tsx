import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { LayoutDashboard, Package, Users, Settings, ScrollText, LogOut, Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyRoles } from "@/lib/admin.functions";
import { StatusBadge } from "@/components/lc/ui-kit";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: Shell,
});

export function useMe() {
  const fn = useServerFn(getMyRoles);
  return useQuery({ queryKey: ["me"], queryFn: () => fn() });
}

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin"] },
  { to: "/produtos", label: "Catálogo", icon: Package, roles: ["admin", "vendedor", "fulfillment"] },
  { to: "/usuarios", label: "Usuários", icon: Users, roles: ["admin"] },
  { to: "/configuracoes", label: "Configurações", icon: Settings, roles: ["admin"] },
  { to: "/auditoria", label: "Auditoria", icon: ScrollText, roles: ["admin"] },
] as const;

function Shell() {
  const { data } = useMe();
  const roles = (data?.roles ?? []) as string[];
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className={cn("fixed inset-y-0 left-0 z-40 w-60 border-r bg-card p-4 transition-transform md:static md:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="mb-8 px-2 font-mono text-lg font-semibold tracking-tight text-primary">LEAL CAPS</div>
        <nav className="space-y-1">
          {NAV.filter((n) => n.roles.some((r) => roles.includes(r))).map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-primary/10 text-primary" }}>
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-background/70 md:hidden" onClick={() => setOpen(false)} />}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4">
          <button className="md:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu className="h-5 w-5" /></button>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-muted-foreground sm:inline">{data?.profile?.full_name ?? data?.profile?.email}</span>
            {roles.map((r) => <StatusBadge key={r} status={r} />)}
            <button onClick={signOut} className="flex items-center gap-1 text-muted-foreground hover:text-foreground"><LogOut className="h-4 w-4" /> Sair</button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">
          {data && roles.length === 0 ? (
            <div className="rounded-xl border p-8 text-center text-muted-foreground">Sua conta ainda não tem um papel atribuído. Peça ao administrador.</div>
          ) : <Outlet />}
        </main>
      </div>
    </div>
  );
}
