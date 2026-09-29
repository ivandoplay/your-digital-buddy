import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { inviteUser, listUsers, setUserRole } from "@/lib/admin.functions";
import { ErrorState, LoadingState, PageHeader, Panel } from "@/components/lc/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errMsg } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({ meta: [{ title: "Usuários — Leal Caps" }, { name: "description", content: "Equipe e papéis." }] }),
  component: Usuarios,
});

const ROLES = ["admin", "vendedor", "fulfillment"] as const;

function Usuarios() {
  const list = useServerFn(listUsers);
  const setRole = useServerFn(setUserRole);
  const invite = useServerFn(inviteUser);
  const q = useQuery({ queryKey: ["users"], queryFn: () => list() });
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setR] = useState<(typeof ROLES)[number]>("vendedor");

  const toggle = async (userId: string, r: (typeof ROLES)[number], grant: boolean) => {
    try { await setRole({ data: { userId, role: r, grant } }); q.refetch(); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <>
      <PageHeader title="Usuários" subtitle="Convide a equipe e defina os papéis" />
      <Panel title="Convidar" className="mb-6">
        <form className="grid gap-2 md:grid-cols-4" onSubmit={async (e) => {
          e.preventDefault();
          try { await invite({ data: { email, full_name: name, role, redirectTo: `${window.location.origin}/reset-password` } }); toast.success("Convite enviado"); setEmail(""); setName(""); q.refetch(); }
          catch (err) { toast.error(errMsg(err)); }
        }}>
          <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
          <Input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <select value={role} onChange={(e) => setR(e.target.value as typeof role)} className="h-9 rounded-md border bg-background px-3 text-sm">
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <Button type="submit">Enviar convite</Button>
        </form>
      </Panel>
      {q.isLoading ? <LoadingState /> : q.error ? <ErrorState message={errMsg(q.error)} /> : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="p-3">Nome</th><th className="p-3">E-mail</th>{ROLES.map((r) => <th key={r} className="p-3 capitalize">{r}</th>)}</tr>
            </thead>
            <tbody>
              {q.data!.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-3">{u.full_name} {u.isMe && <span className="text-xs text-muted-foreground">(você)</span>}</td>
                  <td className="p-3 text-muted-foreground">{u.email}</td>
                  {ROLES.map((r) => {
                    const has = u.roles.includes(r);
                    return <td key={r} className="p-3"><input type="checkbox" checked={has} aria-label={`${r} ${u.email}`} className="h-4 w-4 accent-primary" onChange={() => toggle(u.id, r, !has)} /></td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
