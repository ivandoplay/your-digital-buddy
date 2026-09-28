create type public.app_role as enum ('admin','vendedor','fulfillment');

create table public.profiles (
  id uuid primary key,
  full_name text,
  email text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own profile or admin" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "update own profile or admin" on public.profiles for update to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own roles or admin" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  ip text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on public.audit_logs (entity, entity_id);
create index on public.audit_logs (created_at desc);
grant select on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "admin reads audit" on public.audit_logs for select to authenticated
  using (public.has_role(auth.uid(),'admin'));

create or replace function public.audit_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs (user_id, action, entity, entity_id, old_value, new_value)
  values (
    auth.uid(), lower(tg_op), tg_table_name,
    (case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end)->>'id',
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create trigger audit_user_roles after insert or update or delete on public.user_roles
  for each row execute function public.audit_trigger();

create type public.regulatory_status as enum ('pendente','em_analise','regular','irregular','suspenso');
create type public.product_status as enum ('draft','active','inactive','archived');

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.product_categories to authenticated;
grant all on public.product_categories to service_role;
alter table public.product_categories enable row level security;
create policy "staff read categories" on public.product_categories for select to authenticated using (true);
create policy "admin write categories" on public.product_categories for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

insert into public.product_categories (name) values
 ('Emagrecimento'),('Pele, cabelos e unhas'),('Queima de gordura'),('Celulite'),('Massa magra'),
 ('Articulações'),('Ansiedade'),('Endometriose'),('Menopausa'),('Libido');

create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  internal_name text not null,
  commercial_name text not null,
  category_id uuid references public.product_categories(id),
  description text,
  composition text,
  presentation text,
  quantity text,
  batch text,
  expiry_date date,
  usage_instructions text,
  warnings text,
  restrictions text,
  labeling_info text,
  unit_cost numeric(12,2),
  status product_status not null default 'draft',
  regulatory_status regulatory_status not null default 'pendente',
  regulatory_notes text,
  is_demo boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.products (status);
create index on public.products (category_id);
grant select, insert, update on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "staff read products" on public.products for select to authenticated
  using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'vendedor') or public.has_role(auth.uid(),'fulfillment'));
create policy "admin insert products" on public.products for insert to authenticated
  with check (public.has_role(auth.uid(),'admin'));
create policy "admin update products" on public.products for update to authenticated
  using (public.has_role(auth.uid(),'admin'));
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();
create trigger audit_products after insert or update or delete on public.products for each row execute function public.audit_trigger();

create type public.claim_status as enum ('draft','under_review','approved','rejected');
create table public.product_claims (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  claim_text text not null,
  status claim_status not null default 'draft',
  source_reference text,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.product_claims to authenticated;
grant all on public.product_claims to service_role;
alter table public.product_claims enable row level security;
create policy "staff read claims" on public.product_claims for select to authenticated
  using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'vendedor'));
create policy "admin write claims" on public.product_claims for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger audit_claims after insert or update or delete on public.product_claims for each row execute function public.audit_trigger();

create table public.product_documents (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  doc_type text not null,
  file_name text not null,
  storage_path text not null,
  uploaded_by uuid,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.product_documents to authenticated;
grant all on public.product_documents to service_role;
alter table public.product_documents enable row level security;
create policy "admin docs" on public.product_documents for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger audit_docs after insert or update or delete on public.product_documents for each row execute function public.audit_trigger();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.product_images to authenticated;
grant all on public.product_images to service_role;
alter table public.product_images enable row level security;
create policy "staff read images" on public.product_images for select to authenticated
  using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'vendedor'));
create policy "admin write images" on public.product_images for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.commercial_settings (
  id int primary key default 1 check (id = 1),
  min_margin_pct numeric(5,2),
  max_discount_pct numeric(5,2),
  default_commission_pct numeric(5,2),
  max_cac numeric(12,2),
  gateway_fee_pct numeric(5,2),
  tax_pct numeric(5,2),
  packaging_cost numeric(12,2),
  updated_by uuid,
  updated_at timestamptz not null default now()
);
insert into public.commercial_settings (id) values (1);
grant select, update on public.commercial_settings to authenticated;
grant all on public.commercial_settings to service_role;
alter table public.commercial_settings enable row level security;
create policy "admin read settings" on public.commercial_settings for select to authenticated
  using (public.has_role(auth.uid(),'admin'));
create policy "admin update settings" on public.commercial_settings for update to authenticated
  using (public.has_role(auth.uid(),'admin'));
create trigger audit_settings after update on public.commercial_settings for each row execute function public.audit_trigger();

create policy "admin manage product files" on storage.objects for all to authenticated
  using (bucket_id = 'product-files' and public.has_role(auth.uid(),'admin'))
  with check (bucket_id = 'product-files' and public.has_role(auth.uid(),'admin'));
create policy "vendedor read product files" on storage.objects for select to authenticated
  using (bucket_id = 'product-files' and public.has_role(auth.uid(),'vendedor'));
