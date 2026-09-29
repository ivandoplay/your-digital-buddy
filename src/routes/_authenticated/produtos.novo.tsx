import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/lc/ui-kit";
import { ProductForm } from "@/components/lc/product-form";

export const Route = createFileRoute("/_authenticated/produtos/novo")({
  head: () => ({ meta: [{ title: "Novo produto — Leal Caps" }, { name: "description", content: "Cadastro de produto." }] }),
  component: () => {
    const nav = useNavigate();
    return (
      <>
        <PageHeader title="Novo produto" subtitle="Começa como rascunho. Só pode ser ativado com status regulatório regular." />
        <ProductForm onSaved={(id) => nav({ to: "/produtos/$id", params: { id } })} />
      </>
    );
  },
});
