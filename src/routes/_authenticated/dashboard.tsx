import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { dashboardStats } from "@/lib/admin.functions";
import { ErrorState, Kpi, LoadingState, PageHeader, Panel, StatusBadge } from "@/components/lc/ui-kit";
import { errMsg } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Leal Caps" }, { name: "description", content: "Visão geral da operação." }] }),
  component: Dashboard,
});

const LABEL: Record<string, string> = { min_margin_pct: "Margem mínima", max_discount_pct: "Teto de desconto", default_commission_pct: "Comissão padrão", max_cac: "CAC suportável" };

function Dashboard() {
  const fn = useServerFn(dashboardStats);
  const q = useQuery({ queryKey: ["dash"], queryFn: () => fn() });
  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState message={errMsg(q.error)} onRetry={() => q.refetch()} />;
  const d = q.data!;
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Situação atual do catálogo e da configuração comercial" />
      {d.pendingSettings.length > 0 && (
        <div className="mb-6 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <b className="text-warning">Configuração pendente:</b> {d.pendingSettings.map((k) => LABEL[k]).join(", ")}.{" "}
          <Link to="/configuracoes" className="text-primary underline">Configurar agora</Link>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Produtos" value={d.productsTotal} tone="primary" />
        <Kpi label="Ativos" value={d.productsByStatus.active ?? 0} tone="success" />
        <Kpi label="Claims em revisão" value={d.claimsByStatus.under_review ?? 0} tone="info" />
        <Kpi label="Usuários" value={d.users} />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Panel title="Status regulatório">
          <Rows obj={d.productsByReg} />
        </Panel>
        <Panel title="Status dos produtos">
          <Rows obj={d.productsByStatus} />
        </Panel>
      </div>
    </>
  );
}

function Rows({ obj }: { obj: Record<string, number> }) {
  const e = Object.entries(obj);
  if (!e.length) return <p className="text-sm text-muted-foreground">Sem dados ainda.</p>;
  return <ul className="space-y-2">{e.map(([k, v]) => <li key={k} className="flex justify-between"><StatusBadge status={k} /><span className="font-mono">{v}</span></li>)}</ul>;
}
