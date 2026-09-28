import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Leal Caps — Infraestrutura privada de vendas" },
      { name: "description", content: "Plataforma privada Leal Caps: catálogo, ofertas, checkout, pedidos e fulfillment." },
      { property: "og:title", content: "Leal Caps — Infraestrutura privada de vendas" },
      { property: "og:description", content: "Catálogo, ofertas, checkout, pedidos e fulfillment em um só lugar." },
    ],
  }),
  component: Home,
});

const FLOW = ["Produto", "Oferta", "Checkout", "Pagamento", "Pedido", "Fulfillment", "Entrega"];

function Home() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <Logo />
        <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">Entrar</Link>
      </header>
      <section className="relative z-10 mx-auto flex max-w-4xl flex-1 flex-col items-center justify-center px-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Acesso restrito à operação
        </span>
        <h1 className="mt-6 text-4xl font-semibold leading-tight text-foreground md:text-6xl">
          Da oferta à entrega,<br /><span className="text-primary">sob controle.</span>
        </h1>
        <p className="mt-5 max-w-xl text-muted-foreground">
          Infraestrutura privada de vendas e fulfillment da Leal Caps. Catálogo, ofertas, vendedores, pedidos e operação num só painel.
        </p>
        <Link to="/auth" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90">
          Acessar painel <ArrowRight className="h-4 w-4" />
        </Link>
        <div className="mt-14 flex flex-wrap items-center justify-center gap-2 font-mono text-xs text-muted-foreground">
          {FLOW.map((s, i) => (
            <span key={s} className="flex items-center gap-2">
              <span className="rounded border px-2 py-1">{s}</span>
              {i < FLOW.length - 1 && <span className="text-primary">→</span>}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary font-mono text-sm text-primary-foreground">LC</span>
      Leal Caps
    </span>
  );
}
