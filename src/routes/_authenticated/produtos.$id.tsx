import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { addClaim, duplicateProduct, getProduct, registerFile, removeFile, reviewClaim, setProductStatus } from "@/lib/catalog.functions";
import { EmptyState, ErrorState, LoadingState, PageHeader, Panel, StatusBadge } from "@/components/lc/ui-kit";
import { ProductForm } from "@/components/lc/product-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { errMsg, fmtDateTime } from "@/lib/format";
import { useMe } from "./route";

export const Route = createFileRoute("/_authenticated/produtos/$id")({
  head: () => ({ meta: [{ title: "Produto — Leal Caps" }, { name: "description", content: "Detalhes do produto." }] }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const me = useMe();
  const isAdmin = (me.data?.roles ?? []).includes("admin");
  const get = useServerFn(getProduct);
  const setStatus = useServerFn(setProductStatus);
  const dup = useServerFn(duplicateProduct);
  const add = useServerFn(addClaim);
  const review = useServerFn(reviewClaim);
  const reg = useServerFn(registerFile);
  const rm = useServerFn(removeFile);
  const q = useQuery({ queryKey: ["product", id], queryFn: () => get({ data: { id } }) });
  const [editing, setEditing] = useState(false);
  const [claim, setClaim] = useState("");
  const [source, setSource] = useState("");
  const [uploading, setUploading] = useState(false);

  const run = async (p: Promise<unknown>, ok: string) => {
    try { await p; toast.success(ok); q.refetch(); } catch (e) { toast.error(errMsg(e)); }
  };

  async function upload(kind: "document" | "image", file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const safe = file.name.replace(/[^\w.\-]/g, "_").slice(-100);
      const path = `${id}/${kind}s/${Date.now()}-${safe}`;
      const { error } = await supabase.storage.from("product-files").upload(path, file);
      if (error) throw error;
      await reg({ data: { product_id: id, kind, storage_path: path, file_name: file.name, doc_type: kind === "document" ? "laudo" : undefined } });
      toast.success("Arquivo enviado");
      q.refetch();
    } catch (e) { toast.error(errMsg(e)); } finally { setUploading(false); }
  }

  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState message={errMsg(q.error)} onRetry={() => q.refetch()} />;
  if (!q.data) return <EmptyState title="Produto não encontrado" />;
  const { product: p, claims, documents, images } = q.data;

  if (editing) return (
    <>
      <PageHeader title={`Editar ${p.sku}`} actions={<Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>} />
      <ProductForm initial={p} onSaved={() => { setEditing(false); q.refetch(); }} />
    </>
  );

  return (
    <>
      <PageHeader title={p.commercial_name} subtitle={`${p.sku} · ${p.internal_name}`}
        actions={isAdmin && <>
          <Button variant="outline" onClick={() => setEditing(true)}>Editar</Button>
          <Button variant="outline" onClick={async () => { try { const r = await dup({ data: { id } }); toast.success("Cópia criada"); nav({ to: "/produtos/$id", params: { id: r.id } }); } catch (e) { toast.error(errMsg(e)); } }}>Duplicar</Button>
          {p.status !== "active" && <Button onClick={() => run(setStatus({ data: { id, status: "active" } }), "Produto ativado")}>Ativar</Button>}
          {p.status === "active" && <Button variant="outline" onClick={() => run(setStatus({ data: { id, status: "inactive" } }), "Produto inativado")}>Inativar</Button>}
          {p.status !== "archived" && <Button variant="destructive" onClick={() => confirm("Arquivar este produto?") && run(setStatus({ data: { id, status: "archived" } }), "Arquivado")}>Arquivar</Button>}
        </>} />
      <div className="mb-4 flex gap-2"><StatusBadge status={p.status} /><StatusBadge status={p.regulatory_status} />{p.is_demo && <StatusBadge status="demo" />}</div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Ficha técnica">
          <dl className="space-y-2 text-sm">
            {([["Composição", p.composition], ["Apresentação", p.presentation], ["Quantidade", p.quantity], ["Lote", p.batch], ["Validade", p.expiry_date], ["Modo de uso", p.usage_instructions], ["Advertências", p.warnings], ["Restrições", p.restrictions], ["Rotulagem", p.labeling_info], ["Notas regulatórias", p.regulatory_notes]] as const).map(([l, v]) => (
              <div key={l}><dt className="text-xs text-muted-foreground">{l}</dt><dd className="whitespace-pre-wrap">{v || "—"}</dd></div>
            ))}
          </dl>
        </Panel>
        <div className="space-y-4">
          <Panel title="Claims">
            {!claims.length && <p className="text-sm text-muted-foreground">Nenhum claim. Apenas claims aprovados poderão ser usados em ofertas.</p>}
            <ul className="space-y-2">
              {claims.map((c) => (
                <li key={c.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-start justify-between gap-2"><span>{c.claim_text}</span><StatusBadge status={c.status} /></div>
                  {c.source_reference && <p className="mt-1 text-xs text-muted-foreground">Fonte: {c.source_reference}</p>}
                  {isAdmin && c.status === "under_review" && (
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" onClick={() => run(review({ data: { id: c.id, status: "approved" } }), "Aprovado")}>Aprovar</Button>
                      <Button size="sm" variant="outline" onClick={() => run(review({ data: { id: c.id, status: "rejected" } }), "Rejeitado")}>Rejeitar</Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {isAdmin && (
              <form className="mt-3 space-y-2" onSubmit={(e) => { e.preventDefault(); run(add({ data: { product_id: id, claim_text: claim, source_reference: source } }).then(() => { setClaim(""); setSource(""); }), "Claim enviado para revisão"); }}>
                <Input placeholder="Texto do claim" value={claim} onChange={(e) => setClaim(e.target.value)} required minLength={3} />
                <Input placeholder="Referência / fonte (opcional)" value={source} onChange={(e) => setSource(e.target.value)} />
                <Button size="sm" type="submit">Adicionar claim</Button>
              </form>
            )}
          </Panel>
          <Panel title="Documentos">
            <ul className="space-y-1 text-sm">
              {documents.map((d) => (
                <li key={d.id} className="flex justify-between gap-2">
                  <a href={d.url ?? "#"} target="_blank" rel="noreferrer" className="truncate text-primary">{d.file_name}</a>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">{fmtDateTime(d.created_at)}
                    {isAdmin && <button className="text-destructive" onClick={() => confirm("Remover documento?") && run(rm({ data: { id: d.id, kind: "document" } }), "Removido")}>remover</button>}</span>
                </li>
              ))}
              {!documents.length && <li className="text-muted-foreground">Nenhum documento.</li>}
            </ul>
            {isAdmin && <Input className="mt-3" type="file" disabled={uploading} onChange={(e) => upload("document", e.target.files?.[0])} />}
          </Panel>
          <Panel title="Imagens">
            <div className="grid grid-cols-3 gap-2">
              {images.map((i) => (
                <div key={i.id} className="relative">
                  {i.url && <img src={i.url} alt="" className="aspect-square w-full rounded-md object-cover" />}
                  {isAdmin && <button className="absolute right-1 top-1 rounded bg-background/80 px-1 text-xs text-destructive" onClick={() => run(rm({ data: { id: i.id, kind: "image" } }), "Removida")}>×</button>}
                </div>
              ))}
            </div>
            {!images.length && <p className="text-sm text-muted-foreground">Nenhuma imagem.</p>}
            {isAdmin && <Input className="mt-3" type="file" accept="image/*" disabled={uploading} onChange={(e) => upload("image", e.target.files?.[0])} />}
          </Panel>
        </div>
      </div>
    </>
  );
}
