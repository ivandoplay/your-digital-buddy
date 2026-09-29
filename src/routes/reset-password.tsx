import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Nova senha — Leal Caps" }, { name: "description", content: "Defina uma nova senha de acesso." },
    { property: "og:title", content: "Nova senha — Leal Caps" }, { property: "og:description", content: "Defina uma nova senha de acesso." },
  ] }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <form className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-6" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true);
        const { error } = await supabase.auth.updateUser({ password: pw });
        setBusy(false);
        if (error) return toast.error(error.message);
        toast.success("Senha atualizada"); return nav({ to: "/dashboard" });
      }}>
        <h1 className="text-xl font-semibold">Definir nova senha</h1>
        <Input type="password" required minLength={8} placeholder="Nova senha (mín. 8)" value={pw} onChange={(e) => setPw(e.target.value)} />
        <Button className="w-full" disabled={busy}>{busy ? "Salvando…" : "Salvar senha"}</Button>
      </form>
    </main>
  );
}
