-- Leal Caps — Fase 1: Fundação
-- Autenticação, RBAC, catálogo, ofertas, compliance e auditoria

-- ============================================================
-- 1. EXTENSÕES E TIPOS ENUM
-- ============================================================

CREATE TYPE public.app_role AS ENUM ('ADMIN', 'VENDEDOR', 'FULFILLMENT');

CREATE TYPE public.product_status AS ENUM ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED');

CREATE TYPE public.offer_status AS ENUM ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED');

CREATE TYPE public.compliance_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TYPE public.coupon_type AS ENUM ('PERCENT', 'FIXED');

CREATE TYPE public.offer_type AS ENUM ('SINGLE', 'KIT_2', 'KIT_3', 'COMBO');

CREATE TYPE public.financial_status AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'EXPIRED', 'REFUNDED', 'CHARGEBACK');

CREATE TYPE public.operational_status AS ENUM ('WAITING', 'PICKING', 'PACKING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'RETURNED', 'EXCEPTION');

-- ============================================================
-- 2. TABELAS DE SEGURANÇA E IDENTIDADE
-- ============================================================

-- Perfis de usuário (1:1 com auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Roles por usuário (suporta múltiplos papéis, preparado para expansão)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Permissões granulares (preparado para RBAC avançado)
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role, permission_id)
);

-- ============================================================
-- 3. CATÁLOGO (PRODUTOS)
-- ============================================================

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  internal_name TEXT NOT NULL,
  commercial_name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  description TEXT,
  composition TEXT,
  presentation TEXT,
  quantity TEXT,
  lot TEXT,
  validity DATE,
  warnings TEXT,
  usage_instructions TEXT,
  regulatory_status TEXT,
  claims_approved TEXT[],
  status product_status NOT NULL DEFAULT 'DRAFT',
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.product_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Histórico de alterações de produtos (não apagado por alterações normais)
CREATE TABLE public.product_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id),
  change_type TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. CAMPANHAS (origem da aquisição)
-- ============================================================

CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  channel TEXT,
  origin TEXT,
  media TEXT,
  ad_name TEXT,
  creative TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  responsible_seller_id UUID REFERENCES auth.users(id),
  attributes JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. OFERTAS (motor de ofertas)
-- ============================================================

CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type offer_type NOT NULL DEFAULT 'SINGLE',
  price NUMERIC(10,2) NOT NULL,
  promotional_price NUMERIC(10,2),
  discount_percent NUMERIC(5,2),
  quantity INT NOT NULL DEFAULT 1,
  validity_start TIMESTAMPTZ,
  validity_end TIMESTAMPTZ,
  usage_limit INT,
  usage_count INT NOT NULL DEFAULT 0,
  shipping_fixed_price NUMERIC(10,2),
  shipping_free BOOLEAN NOT NULL DEFAULT false,
  extras JSONB DEFAULT '{}'::jsonb,
  seller_id UUID REFERENCES auth.users(id),
  campaign_id UUID REFERENCES campaigns(id),
  status offer_status NOT NULL DEFAULT 'DRAFT',
  compliance_status compliance_status NOT NULL DEFAULT 'PENDING',
  rules JSONB DEFAULT '{}'::jsonb,
  min_margin_override NUMERIC(5,2),
  max_discount_override NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Item da oferta (produto ou combo)
CREATE TABLE public.offer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Regras de elegibilidade por oferta
CREATE TABLE public.offer_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Links rastreáveis de oferta
CREATE TABLE public.offer_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  clicks INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. CUPONS
-- ============================================================

CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type coupon_type NOT NULL DEFAULT 'PERCENT',
  value NUMERIC(10,2) NOT NULL,
  max_global_uses INT,
  max_uses_per_customer INT,
  usage_count INT NOT NULL DEFAULT 0,
  validity_start TIMESTAMPTZ,
  validity_end TIMESTAMPTZ,
  allowed_sellers UUID[] DEFAULT '{}',
  allowed_campaigns UUID[] DEFAULT '{}',
  allowed_offers UUID[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id),
  customer_email TEXT,
  customer_cpf TEXT,
  order_id UUID,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. CLIENTES E CRM
-- ============================================================

CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  phone TEXT,
  name TEXT,
  cpf TEXT,
  address JSONB,
  first_order_at TIMESTAMPTZ,
  last_order_at TIMESTAMPTZ,
  total_orders INT NOT NULL DEFAULT 0,
  total_spent NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  contact TEXT NOT NULL,
  origin TEXT,
  campaign_id UUID REFERENCES campaigns(id),
  seller_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'LEAD',
  presented_offers UUID[] DEFAULT '{}',
  purchased_offers UUID[] DEFAULT '{}',
  interactions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.customer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  lead_id UUID REFERENCES leads(id),
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. PEDIDOS
-- ============================================================

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id),
  seller_id UUID REFERENCES auth.users(id),
  offer_id UUID NOT NULL REFERENCES offers(id),
  campaign_id UUID REFERENCES campaigns(id),
  coupon_id UUID REFERENCES coupons(id),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12,2) NOT NULL,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  freight NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  address JSONB,
  financial_status financial_status NOT NULL DEFAULT 'PENDING',
  operational_status operational_status NOT NULL DEFAULT 'WAITING',
  tracking_code TEXT,
  tracking_url TEXT,
  shipping_provider TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  event_user_id UUID REFERENCES auth.users(id),
  observation TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. PAGAMENTOS
-- ============================================================

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  provider TEXT NOT NULL DEFAULT 'DEMO',
  provider_payment_id TEXT,
  amount NUMERIC(12,2) NOT NULL,
  status financial_status NOT NULL DEFAULT 'PENDING',
  method TEXT,
  paid_at TIMESTAMPTZ,
  webhook_signature TEXT,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. LOGÍSTICA
-- ============================================================

CREATE TABLE public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  provider TEXT NOT NULL,
  service TEXT,
  tracking_code TEXT,
  tracking_url TEXT,
  label_url TEXT,
  status TEXT NOT NULL DEFAULT 'CREATED',
  quoted_price NUMERIC(12,2),
  quoted_deadline INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.shipment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 11. COMISSÕES
-- ============================================================

CREATE TABLE public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  base_amount NUMERIC(12,2) NOT NULL,
  percent NUMERIC(5,2) NOT NULL,
  value NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  rule_used JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 12. AUTOMAÇÕES E NOTIFICAÇÕES
-- ============================================================

CREATE TABLE public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_trigger TEXT NOT NULL,
  delay_minutes INT NOT NULL DEFAULT 0,
  channel TEXT NOT NULL,
  message TEXT NOT NULL,
  allowed_window_hours INT,
  opt_out BOOLEAN NOT NULL DEFAULT true,
  max_attempts INT NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id),
  order_id UUID REFERENCES orders(id),
  customer_id UUID REFERENCES customers(id),
  status TEXT NOT NULL DEFAULT 'PENDING',
  attempt_count INT NOT NULL DEFAULT 0,
  last_error TEXT,
  scheduled_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  order_id UUID REFERENCES orders(id),
  channel TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'DEMO',
  recipient TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  sent_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 13. AUDITORIA
-- ============================================================

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 14. CONFIGURAÇÕES ECONÔMICAS
-- ============================================================

CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 15. ÍNDICES
-- ============================================================

CREATE INDEX idx_profiles_user_id ON public.profiles(id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_offers_status ON public.offers(status);
CREATE INDEX idx_offers_seller ON public.offers(seller_id);
CREATE INDEX idx_offers_campaign ON public.offers(campaign_id);
CREATE INDEX idx_offer_links_slug ON public.offer_links(slug);
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupon_usages_coupon ON public.coupon_usages(coupon_id);
CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_seller ON public.orders(seller_id);
CREATE INDEX idx_orders_number ON public.orders(order_number);
CREATE INDEX idx_payments_order ON public.payments(order_id);
CREATE INDEX idx_payments_idempotency ON public.payments(idempotency_key);
CREATE INDEX idx_shipments_order ON public.shipments(order_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity, entity_id);
CREATE INDEX idx_customer_events_customer ON public.customer_events(customer_id);
CREATE INDEX idx_lead_seller ON public.leads(seller_id);

-- ============================================================
-- 16. DADOS INICIAIS (DEMO)
-- ============================================================

INSERT INTO public.categories (name, slug) VALUES
  ('Emagrecimento', 'emagrecimento'),
  ('Pele, cabelos e unhas', 'pele-cabelos-unhas'),
  ('Queima de gordura', 'queima-de-gordura'),
  ('Celulite', 'celulite'),
  ('Massa magra', 'massa-magra'),
  ('Articulações', 'articulacoes'),
  ('Ansiedade', 'ansiedade'),
  ('Endometriose', 'endometriose'),
  ('Menopausa', 'menopausa'),
  ('Libido', 'libido');

INSERT INTO public.permissions (key, description) VALUES
  ('products.read', 'Visualizar produtos'),
  ('products.write', 'Criar/editar produtos'),
  ('offers.read', 'Visualizar ofertas'),
  ('offers.write', 'Criar/editar ofertas'),
  ('orders.read', 'Visualizar pedidos'),
  ('orders.write', 'Alterar status de pedidos'),
  ('fulfillment.read', 'Visualizar fila de fulfillment'),
  ('fulfillment.write', 'Atualizar status logístico'),
  ('crm.read', 'Visualizar CRM'),
  ('crm.write', 'Editar CRM'),
  ('users.read', 'Visualizar usuários'),
  ('users.write', 'Gerenciar usuários'),
  ('settings.read', 'Visualizar configurações'),
  ('settings.write', 'Alterar configurações');

-- ============================================================
-- 17. FUNÇÕES E TRIGGERS DE AUDITORIA
-- ============================================================

CREATE OR REPLACE FUNCTION public.log_audit(
  p_user_id UUID,
  p_action TEXT,
  p_entity TEXT,
  p_entity_id UUID,
  p_old JSONB,
  p_new JSONB,
  p_ip TEXT,
  p_ua TEXT
) RETURNS UUID AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, old_value, new_value, ip, user_agent)
  VALUES (p_user_id, p_action, p_entity, p_entity_id, p_old, p_new, p_ip, p_ua)
  RETURNING id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 18. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 19. HELPERS DE SEGURANÇA
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission_key TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = _user_id AND p.key = _permission_key
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 20. POLICIES
-- ============================================================

-- Perfis: usuário vê apenas o próprio; admin vê todos
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Roles: admin gerencia todas; usuário vê as próprias
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Produtos: admin e vendedor leem todos; admin edita; vendedor apenas produtos próprios quando aplicável
CREATE POLICY "Admin manages products" ON public.products
  FOR ALL USING (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Vendedor reads products" ON public.products
  FOR SELECT USING (public.has_role(auth.uid(), 'VENDEDOR') OR public.has_role(auth.uid(), 'FULFILLMENT'));

-- Ofertas: admin e vendedor leem; admin edita; vendedor edita apenas suas ofertas
CREATE POLICY "Admin manages offers" ON public.offers
  FOR ALL USING (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Vendedor reads offers" ON public.offers
  FOR SELECT USING (public.has_role(auth.uid(), 'VENDEDOR') OR public.has_role(auth.uid(), 'FULFILLMENT'));
CREATE POLICY "Vendedor manages own offers" ON public.offers
  FOR UPDATE USING (public.has_role(auth.uid(), 'VENDEDOR') AND seller_id = auth.uid());

-- Pedidos: admin vê todos; vendedor vê apenas pedidos de suas ofertas; fulfillment vê todos
CREATE POLICY "Admin manages orders" ON public.orders
  FOR ALL USING (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Fulfillment reads orders" ON public.orders
  FOR SELECT USING (public.has_role(auth.uid(), 'FULFILLMENT'));
CREATE POLICY "Vendedor reads own orders" ON public.orders
  FOR SELECT USING (public.has_role(auth.uid(), 'VENDEDOR') AND seller_id = auth.uid());

-- Pagamentos: admin e fulfillment leem; ninguém edita diretamente
CREATE POLICY "Admin and fulfillment read payments" ON public.payments
  FOR SELECT USING (public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'FULFILLMENT'));

-- Auditoria: admin lê tudo
CREATE POLICY "Admin reads audit logs" ON public.audit_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'ADMIN'));

-- Configurações: admin gerencia
CREATE POLICY "Admin manages settings" ON public.settings
  FOR ALL USING (public.has_role(auth.uid(), 'ADMIN'));

-- ============================================================
-- 21. TRIGGERS PARA updated_at
-- ============================================================

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_offers_updated_at BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_coupons_updated_at BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_shipments_updated_at BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_comissoes_updated_at BEFORE UPDATE ON public.commissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_settings_updated_at BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 22. GERAÇÃO DE NÚMERO DE PEDIDO (#LC-XXXXX)
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
  next_val INT;
BEGIN
  SELECT nextval('public.order_number_seq') INTO next_val;
  RETURN '#LC-' || lpad(next_val::text, 5, '0');
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1;

-- ============================================================
-- FIM DA MIGRATION
-- ============================================================
