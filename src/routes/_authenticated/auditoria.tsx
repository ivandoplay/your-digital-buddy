import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listAudit } from "@/lib/admin.functions";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/lc/ui-kit";
import { errMsg, fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/auditoria")({
  head: () => ({ meta: [{ title: "Auditoria — Leal Caps" }, { name: "description", content: "Histórico de alterações." }] }),
  component: Auditoria,
});

function Auditoria() {
  const [entity, setEntity] = useState("");
  const fn = useServerFn(listAudit);
  const q = useQuery({ queryKey: ["audit", entity], queryFn: () => fn({ data: { entity: entity || undefined } }) });
  return (
    <>
      <PageHeader title="Auditoria" subtitle="Últimos 200 eventos. O histórico nunca é apagado." />
      <select value={entity} onChange={(e) => setEntity(e.target.value)} className="mb-4 h-9 rounded-md border bg-background px-3 text-sm">
        <option value="">Todas as áreas</option>
        {["products", "product_claims", "product_documents", "commercial_settings", "user_roles", "users"].map((x) => <option key={x}>{x}</option>)}
      </select>
      {q.isLoading ? <LoadingState /> : q.error ? <ErrorState message={errMsg(q.error)} /> : !q.data?.length ? <EmptyState title="Sem eventos" /> : (
        <ul className="space-y-2">
          {q.data.map((r) => (
            <li key={r.id} className="rounded-lg border bg-card p-3 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <span><b className="text-primary">{r.action}</b> · {r.entity} · <span className="text-muted-foreground">{r.actor}</span></span>
                <span className="text-xs text-muted-foreground">{fmtDateTime(r.created_at)}</span>
              </div>
              {(r.old_value || r.new_value) && (
                <details className="mt-2"><summary className="cursor-pointer text-xs text-muted-foreground">Ver valores</summary>
                  <pre className="mt-2 max-h-64 overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify({ antes: r.old_value, depois: r.new_value }, null, 2)}</pre>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
