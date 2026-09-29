import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getSettings, updateSettings } from "@/lib/admin.functions";
import { ErrorState, Field, LoadingState, PageHeader, Panel } from "@/components/lc/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errMsg, fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Leal Caps" }, { name: "description", content: "Regras comerciais." }] }),
  component: Config,
});

const FIELDS = [
  ["min_margin_pct", "Margem mínima (%)"], ["max_discount_pct", "Teto de desconto (%)"], ["default_commission_pct", "Comissão padrão (%)"],
  ["max_cac", "CAC suportável (R$)"], ["gateway_fee_pct", "Taxa do gateway (%)"], ["tax_pct", "Impostos (%)"], ["packaging_cost", "Custo de embalagem (R$)"],
] as const;
type K = (typeof FIELDS)[number][0];

function Config() {
  const get = useServerFn(getSettings);
  const upd = useServerFn(updateSettings);
  const q = useQuery({ queryKey: ["settings"], queryFn: () => get() });
  const [f, setF] = useState<Record<K, string>>({} as Record<K, string>);
  useEffect(() => {
    if (q.data) setF(Object.fromEntries(FIELDS.map(([k]) => [k, q.data[k] == null ? "" : String(q.data[k])])) as Record<K, string>);
  }, [q.data]);
  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState message={errMsg(q.error)} />;
  return (
    <>
      <PageHeader title="Configurações comerciais" subtitle={`Campos vazios ficam como CONFIGURAR. Última alteração: ${fmtDateTime(q.data?.updated_at)}`} />
      <Panel>
        <form className="grid gap-4 md:grid-cols-3" onSubmit={async (e) => {
          e.preventDefault();
          try {
            await upd({ data: Object.fromEntries(FIELDS.map(([k]) => [k, f[k] === "" || f[k] == null ? null : Number(f[k])])) as Record<K, number | null> });
            toast.success("Configurações salvas"); q.refetch();
          } catch (err) { toast.error(errMsg(err)); }
        }}>
          {FIELDS.map(([k, l]) => (
            <Field key={k} label={l} {...(f[k] ? {} : { hint: "CONFIGURAR" })}>
              <Input type="number" step="0.01" min="0" value={f[k] ?? ""} onChange={(e) => setF((s) => ({ ...s, [k]: e.target.value }))} />
            </Field>
          ))}
          <div className="md:col-span-3"><Button type="submit">Salvar</Button></div>
        </form>
      </Panel>
    </>
  );
}
