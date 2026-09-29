import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listProducts } from "@/lib/catalog.functions";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "@/components/lc/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errMsg, fmtDateTime } from "@/lib/format";
import { useMe } from "./route";

export const Route = createFileRoute("/_authenticated/produtos/")({
  head: () => ({ meta: [{ title: "Catálogo — Leal Caps" }, { name: "description", content: "Produtos cadastrados." }] }),
  component: Produtos,
});

type St = "" | "draft" | "active" | "inactive" | "archived";

function Produtos() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<St>("");
  const fn = useServerFn(listProducts);
  const me = useMe();
  const isAdmin = (me.data?.roles ?? []).includes("admin");
  const q = useQuery({
    queryKey: ["products", search, status],
    queryFn: () => fn({ data: { search: search || undefined, status: status || undefined } }),
  });
  return (
    <>
      <PageHeader title="Catálogo" subtitle="Produtos, status regulatório e documentação"
        actions={isAdmin && <Button asChild><Link to="/produtos/novo">Novo produto</Link></Button>} />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <Input placeholder="Buscar por SKU ou nome" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
        <select value={status} onChange={(e) => setStatus(e.target.value as St)} className="h-9 rounded-md border bg-background px-3 text-sm">
          <option value="">Todos (exceto arquivados)</option>
          <option value="draft">Rascunho</option><option value="active">Ativo</option>
          <option value="inactive">Inativo</option><option value="archived">Arquivado</option>
        </select>
      </div>
      {q.isLoading ? <LoadingState /> : q.error ? <ErrorState message={errMsg(q.error)} onRetry={() => q.refetch()} /> :
        !q.data?.length ? <EmptyState title="Nenhum produto" description="Cadastre o primeiro produto do catálogo." /> : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="p-3">SKU</th><th className="p-3">Produto</th><th className="p-3">Categoria</th><th className="p-3">Status</th><th className="p-3">Regulatório</th><th className="p-3">Atualizado</th></tr>
              </thead>
              <tbody>
                {q.data.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-muted/30">
                    <td className="p-3 font-mono"><Link to="/produtos/$id" params={{ id: p.id }} className="text-primary">{p.sku}</Link> {p.is_demo && <StatusBadge status="demo" />}</td>
                    <td className="p-3">{p.commercial_name}<div className="text-xs text-muted-foreground">{p.internal_name}</div></td>
                    <td className="p-3">{(p.category as { name: string } | null)?.name ?? "—"}</td>
                    <td className="p-3"><StatusBadge status={p.status} /></td>
                    <td className="p-3"><StatusBadge status={p.regulatory_status} /></td>
                    <td className="p-3 text-muted-foreground">{fmtDateTime(p.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </>
  );
}
