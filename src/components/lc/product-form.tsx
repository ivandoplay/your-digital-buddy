import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listCategories, saveProduct } from "@/lib/catalog.functions";
import { Field, Panel } from "./ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { errMsg } from "@/lib/format";

type P = Record<string, unknown>;
const TEXT = [["sku", "SKU *"], ["internal_name", "Nome interno *"], ["commercial_name", "Nome comercial *"], ["presentation", "Apresentação"], ["quantity", "Quantidade"], ["batch", "Lote"]] as const;
const AREAS = [["description", "Descrição"], ["composition", "Composição"], ["usage_instructions", "Modo de uso"], ["warnings", "Advertências"], ["restrictions", "Restrições"], ["labeling_info", "Rotulagem"], ["regulatory_notes", "Observações regulatórias"]] as const;

export function ProductForm({ initial, onSaved }: { initial?: P; onSaved: (id: string) => void }) {
  const [f, setF] = useState<P>(initial ?? { regulatory_status: "pendente" });
  const [busy, setBusy] = useState(false);
  const cats = useServerFn(listCategories);
  const save = useServerFn(saveProduct);
  const c = useQuery({ queryKey: ["cats"], queryFn: () => cats() });
  const set = (k: string, v: unknown) => setF((s) => ({ ...s, [k]: v }));
  const s = (k: string) => (f[k] as string | null) ?? "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const pick = Object.fromEntries(
        [...TEXT, ...AREAS].map(([k]) => [k, s(k)]),
      );
      const r = await save({
        data: {
          ...pick,
          id: f.id as string | undefined,
          category_id: (f.category_id as string) || null,
          expiry_date: s("expiry_date") || null,
          unit_cost: f.unit_cost === "" || f.unit_cost == null ? null : Number(f.unit_cost),
          regulatory_status: f.regulatory_status as "pendente",
        } as never,
      });
      toast.success("Produto salvo");
      onSaved(r.id);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Panel title="Identificação">
        <div className="grid gap-4 md:grid-cols-3">
          {TEXT.map(([k, l]) => <Field key={k} label={l}><Input value={s(k)} onChange={(e) => set(k, e.target.value)} required={l.endsWith("*")} /></Field>)}
          <Field label="Categoria">
            <select value={s("category_id")} onChange={(e) => set("category_id", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">—</option>
              {c.data?.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </Field>
          <Field label="Validade"><Input type="date" value={s("expiry_date")} onChange={(e) => set("expiry_date", e.target.value)} /></Field>
          <Field label="Custo unitário (R$)"><Input type="number" step="0.01" min="0" value={(f.unit_cost as number | null) ?? ""} onChange={(e) => set("unit_cost", e.target.value)} /></Field>
          <Field label="Status regulatório">
            <select value={s("regulatory_status")} onChange={(e) => set("regulatory_status", e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="pendente">Pendente</option><option value="em_analise">Em análise</option><option value="regular">Regular</option>
              <option value="irregular">Irregular</option><option value="suspenso">Suspenso</option>
            </select>
          </Field>
        </div>
      </Panel>
      <Panel title="Conteúdo técnico">
        <div className="grid gap-4 md:grid-cols-2">
          {AREAS.map(([k, l]) => <Field key={k} label={l}><Textarea rows={3} value={s(k)} onChange={(e) => set(k, e.target.value)} /></Field>)}
        </div>
      </Panel>
      <Button type="submit" disabled={busy}>{busy ? "Salvando…" : "Salvar produto"}</Button>
    </form>
  );
}
