import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Leal Caps" },
      { name: "description", content: "Acesso restrito à operação Leal Caps." },
      { property: "og:title", content: "Entrar — Leal Caps" },
      { property: "og:description", content: "Acesso restrito à operação Leal Caps." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      setBusy(false);
      if (error) return toast.error(error.message);
      return toast.success("Se o e-mail existir, enviamos o link de redefinição");
    }
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return toast.error("E-mail ou senha inválidos");
      return nav({ to: "/produtos" });
    }
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Confira seu e-mail para confirmar a conta");
  }

  const title = { in: "Entrar", up: "Criar conta", forgot: "Recuperar senha" }[mode];
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-6">
        <div className="font-mono text-sm text-primary">LEAL CAPS</div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <Input type="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
        {mode !== "forgot" && <Input type="password" required minLength={8} placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} />}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Aguarde…" : mode === "forgot" ? "Enviar link" : title}</Button>
        <div className="flex justify-between text-sm text-muted-foreground">
          <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")}>{mode === "in" ? "Criar conta" : "Voltar para entrar"}</button>
          {mode === "in" && <button type="button" onClick={() => setMode("forgot")}>Esqueci a senha</button>}
        </div>
      </form>
    </main>
  );
}
