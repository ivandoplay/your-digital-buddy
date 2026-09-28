import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertRole } from "./rbac.server";

const STATUS = ["draft", "active", "inactive", "archived"] as const;
const REG = ["pendente", "em_analise", "regular", "irregular", "suspenso"] as const;

const opt = (max: number) =>
  z.string().trim().max(max).optional().nullable().transform((v) => (v ? v : null));

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9\-_.]+$/, "SKU: apenas letras, números, - _ ."),
  internal_name: z.string().trim().min(2).max(160),
  commercial_name: z.string().trim().min(2).max(160),
  category_id: z.string().uuid().nullable().optional(),
  description: opt(4000),
  composition: opt(4000),
  presentation: opt(300),
  quantity: opt(100),
  batch: opt(80),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional().or(z.literal("").transform(() => null)),
  usage_instructions: opt(4000),
  warnings: opt(4000),
  restrictions: opt(4000),
  labeling_info: opt(4000),
  unit_cost: z.number().min(0).max(1_000_000).nullable().optional(),
  regulatory_status: z.enum(REG).default("pendente"),
  regulatory_notes: opt(4000),
});
export type ProductInput = z.input<typeof productSchema>;

export const listCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("product_categories")
      .select("id,name")
      .order("name");
    if (error) throw new Error(error.message);
    return data;
  });

export const listProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        search: z.string().trim().max(100).optional(),
        status: z.enum(STATUS).optional(),
        categoryId: z.string().uuid().optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("products")
      .select("id,sku,internal_name,commercial_name,status,regulatory_status,is_demo,updated_at,category:product_categories(name)")
      .order("updated_at", { ascending: false })
      .limit(500);
    if (data.status) q = q.eq("status", data.status);
    else q = q.neq("status", "archived");
    if (data.categoryId) q = q.eq("category_id", data.categoryId);
    if (data.search) {
      const s = data.search.replace(/[%,()]/g, "");
      q = q.or(`sku.ilike.%${s}%,internal_name.ilike.%${s}%,commercial_name.ilike.%${s}%`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows;
  });

export const getProduct = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: product, error } = await sb.from("products").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!product) return null;
    const [claims, docs, images] = await Promise.all([
      sb.from("product_claims").select("*").eq("product_id", data.id).order("created_at"),
      sb.from("product_documents").select("*").eq("product_id", data.id).order("created_at", { ascending: false }),
      sb.from("product_images").select("*").eq("product_id", data.id).order("position"),
    ]);
    const signed = async (path: string) =>
      (await sb.storage.from("product-files").createSignedUrl(path, 3600)).data?.signedUrl ?? null;
    const docsOut = await Promise.all((docs.data ?? []).map(async (d) => ({ ...d, url: await signed(d.storage_path) })));
    const imgsOut = await Promise.all((images.data ?? []).map(async (i) => ({ ...i, url: await signed(i.storage_path) })));
    return { product, claims: claims.data ?? [], documents: docsOut, images: imgsOut };
  });

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => productSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, ["admin"]);
    const { id, ...fields } = data;
    const payload = { ...fields, category_id: fields.category_id ?? null, unit_cost: fields.unit_cost ?? null, expiry_date: fields.expiry_date ?? null };
    if (id) {
      const { error } = await context.supabase.from("products").update(payload).eq("id", id);
      if (error) throw new Error(error.code === "23505" ? "SKU já existe" : error.message);
      return { id };
    }
    const { data: row, error } = await context.supabase
      .from("products")
      .insert({ ...payload, created_by: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.code === "23505" ? "SKU já existe" : error.message);
    return { id: row.id };
  });

export const setProductStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), status: z.enum(STATUS) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, ["admin"]);
    if (data.status === "active") {
      const { data: p } = await context.supabase.from("products").select("regulatory_status").eq("id", data.id).single();
      if (p?.regulatory_status !== "regular")
        throw new Error("Produto só pode ser ativado com status regulatório 'regular'");
    }
    const { error } = await context.supabase.from("products").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const duplicateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, ["admin"]);
    const { data: p, error } = await context.supabase.from("products").select("*").eq("id", data.id).single();
    if (error) throw new Error(error.message);
    const { id: _id, created_at: _c, updated_at: _u, ...rest } = p;
    const { data: row, error: e2 } = await context.supabase
      .from("products")
      .insert({ ...rest, sku: `${p.sku}-COPIA-${Date.now().toString(36).toUpperCase()}`.slice(0, 40), status: "draft", created_by: context.userId })
      .select("id")
      .single();
    if (e2) throw new Error(e2.message);
    return { id: row.id };
  });

export const addClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ product_id: z.string().uuid(), claim_text: z.string().trim().min(3).max(500), source_reference: opt(500) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, ["admin"]);
    const { error } = await context.supabase.from("product_claims").insert({ ...data, status: "under_review" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reviewClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), status: z.enum(["approved", "rejected"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, ["admin"]);
    const { error } = await context.supabase
      .from("product_claims")
      .update({ status: data.status, approved_by: context.userId, approved_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const pathSchema = z.string().min(3).max(300).regex(/^[a-f0-9-]{36}\/[\w\-./]+$/);

export const registerFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        product_id: z.string().uuid(),
        kind: z.enum(["document", "image"]),
        storage_path: pathSchema,
        file_name: z.string().trim().min(1).max(200),
        doc_type: z.string().trim().max(60).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, ["admin"]);
    if (!data.storage_path.startsWith(`${data.product_id}/`)) throw new Error("Caminho inválido");
    if (data.kind === "document") {
      const { error } = await context.supabase.from("product_documents").insert({
        product_id: data.product_id,
        storage_path: data.storage_path,
        file_name: data.file_name,
        doc_type: data.doc_type || "outro",
        uploaded_by: context.userId,
      });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("product_images")
        .insert({ product_id: data.product_id, storage_path: data.storage_path });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const removeFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), kind: z.enum(["document", "image"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, ["admin"]);
    const table = data.kind === "document" ? "product_documents" : "product_images";
    const { data: row } = await context.supabase.from(table).select("storage_path").eq("id", data.id).single();
    const { error } = await context.supabase.from(table).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    if (row) await context.supabase.storage.from("product-files").remove([row.storage_path]);
    return { ok: true };
  });
