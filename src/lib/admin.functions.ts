import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertRole } from "./rbac.server";

const ROLES = ["admin", "vendedor", "fulfillment"] as const;

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    const { data: profile } = await context.supabase.from("profiles").select("full_name,email").eq("id", context.userId).maybeSingle();
    return { roles: (data ?? []).map((r) => r.role), profile };
  });

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRole(context.supabase, context.userId, ["admin"]);
    const [{ data: profiles, error }, { data: roles }] = await Promise.all([
      context.supabase.from("profiles").select("id,full_name,email,active,created_at").order("created_at"),
      context.supabase.from("user_roles").select("user_id,role"),
    ]);
    if (error) throw new Error(error.message);
    return (profiles ?? []).map((p) => ({
      ...p,
      roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role),
      isMe: p.id === context.userId,
    }));
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ userId: z.string().uuid(), role: z.enum(ROLES), grant: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, ["admin"]);
    if (data.userId === context.userId && data.role === "admin" && !data.grant)
      throw new Error("Você não pode remover seu próprio acesso de administrador");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    await supabaseAdmin.from("audit_logs").insert({
      user_id: context.userId,
      action: data.grant ? "role_granted" : "role_revoked",
      entity: "user_roles",
      entity_id: data.userId,
      new_value: { role: data.role },
    });
    return { ok: true };
  });

export const inviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        full_name: z.string().trim().min(2).max(120),
        role: z.enum(ROLES),
        redirectTo: z.string().url().max(300),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, ["admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: res, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      data: { full_name: data.full_name },
      redirectTo: data.redirectTo,
    });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("user_roles").upsert({ user_id: res.user.id, role: data.role }, { onConflict: "user_id,role" });
    await supabaseAdmin.from("audit_logs").insert({
      user_id: context.userId,
      action: "user_invited",
      entity: "users",
      entity_id: res.user.id,
      new_value: { email: data.email, role: data.role },
    });
    return { ok: true };
  });

const pct = z.number().min(0).max(100).nullable();
const money = z.number().min(0).max(1_000_000).nullable();

export const getSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRole(context.supabase, context.userId, ["admin"]);
    const { data, error } = await context.supabase.from("commercial_settings").select("*").eq("id", 1).single();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        min_margin_pct: pct,
        max_discount_pct: pct,
        default_commission_pct: pct,
        max_cac: money,
        gateway_fee_pct: pct,
        tax_pct: pct,
        packaging_cost: money,
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, ["admin"]);
    const { error } = await context.supabase
      .from("commercial_settings")
      .update({ ...data, updated_by: context.userId, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ entity: z.string().max(60).optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, ["admin"]);
    let q = context.supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200);
    if (data.entity) q = q.eq("entity", data.entity);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const ids = [...new Set(rows.map((r) => r.user_id).filter(Boolean))] as string[];
    const { data: people } = ids.length
      ? await context.supabase.from("profiles").select("id,full_name,email").in("id", ids)
      : { data: [] as { id: string; full_name: string | null; email: string | null }[] };
    const map = new Map((people ?? []).map((p) => [p.id, p.full_name || p.email]));
    return rows.map((r) => ({ ...r, actor: r.user_id ? map.get(r.user_id) ?? "Usuário" : "Sistema" }));
  });

export const dashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRole(context.supabase, context.userId, ["admin"]);
    const sb = context.supabase;
    const { data: products } = await sb.from("products").select("status,regulatory_status");
    const { data: claims } = await sb.from("product_claims").select("status");
    const { data: settings } = await sb.from("commercial_settings").select("*").eq("id", 1).single();
    const { count: users } = await sb.from("profiles").select("id", { count: "exact", head: true });
    const by = <T extends string>(arr: { [k: string]: unknown }[] | null, key: string) =>
      (arr ?? []).reduce<Record<string, number>>((acc, r) => {
        const k = String(r[key] as T);
        acc[k] = (acc[k] ?? 0) + 1;
        return acc;
      }, {});
    const pending = settings
      ? (["min_margin_pct", "max_discount_pct", "default_commission_pct", "max_cac"] as const).filter((k) => settings[k] == null)
      : [];
    return {
      productsTotal: products?.length ?? 0,
      productsByStatus: by(products, "status"),
      productsByReg: by(products, "regulatory_status"),
      claimsByStatus: by(claims, "status"),
      users: users ?? 0,
      pendingSettings: pending,
    };
  });
