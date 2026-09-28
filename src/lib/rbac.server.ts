import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

/** Server-side role check. Throws 403-style error when caller lacks every listed role. */
export async function assertRole(
  supabase: SupabaseClient<Database>,
  userId: string,
  roles: AppRole[],
) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error("Falha ao verificar permissões");
  const mine = new Set((data ?? []).map((r) => r.role));
  if (!roles.some((r) => mine.has(r))) throw new Error("Permissão negada");
  return mine;
}
