# LEAL CAPS — Plano de construção (V1: ciclo ponta a ponta)

O escopo completo é grande demais para uma única entrega com qualidade. Vou construir em fases, garantindo primeiro o ciclo completo funcionando de verdade (sem botões falsos) e depois expandir cada módulo.

## Fase 1 — Fundação (esta entrega)
- Lovable Cloud ativado: banco, login, recuperação/redefinição de senha.
- Papéis em tabela separada: ADMIN, VENDEDOR, FULFILLMENT (preparado para novos papéis). Rotas protegidas por papel.
- Visual: tema escuro premium, verde-lima principal, ciano secundário, laranja/vermelho para alerta/risco. Sidebar fixa + barra superior + cards.
- Design system base: Sidebar, Header, KPI, StatusBadge, DataTable, Timeline, EmptyState/Loading/Error, ConfirmDialog, Filtros.
- Catálogo: produtos (SKU, nome interno/comercial, categoria, composição, lote, validade, advertências, modo de uso, claims aprovados, status regulatório), documentos e imagens (armazenamento de arquivos), duplicar/arquivar.
- Configurações comerciais (admin): margem mínima, teto de desconto, comissão padrão, CAC suportável — todos começam como "CONFIGURAR".

## Fase 2 — Ofertas, cupons, compliance
- Offer Engine: 1 unidade, Kit 2, Kit 3+, Combo; preço, promo, validade, limite de uso, vendedores autorizados, campanha.
- Validação no servidor contra teto de desconto e margem mínima.
- Compliance Gate: DRAFT → UNDER_REVIEW → APPROVED/REJECTED/ARCHIVED com checklist; oferta só publica se aprovada.
- Cupons (percentual/fixo, limites global e por cliente, vendedores/ofertas autorizados) com registro de uso.
- Campanhas com UTMs.

## Fase 3 — Transação
- Vendedor gera link rastreável `/o/XXXXX` de ofertas autorizadas.
- Página pública da oferta + checkout mobile-first: CEP → frete → dados → pagamento.
- ShippingProvider e PaymentProvider como interfaces; adapters DEMO claramente identificados (nenhum fornecedor real inventado).
- Webhook de pagamento com assinatura, idempotência e anti-duplicidade. Pedido só confirma via evento do gateway.
- Pedido `#LC-XXXXX`, status financeiro / operacional / logístico separados, timeline e auditoria.
- Página de sucesso e rastreio público sem dados pessoais.

## Fase 4 — Operação
- Fila de fulfillment: Pagos → Separação → Embalagem → Expedição → Enviado → Em trânsito → Entregue + Exceções.
- Comissão congelada no pedido.
- Painel do vendedor (leads, pedidos, comissão, conversão) restrito aos próprios dados.

## Fase 5 — Growth e governança
- CRM (pipeline, ofertas apresentadas e compradas), eventos de analytics e funil, dashboard admin com KPIs e filtros.
- Automações por evento com NotificationProvider (WhatsApp/e-mail, adapter DEMO).
- Economia unitária, log de auditoria navegável, solicitações de privacidade, 2FA para admin, testes das regras críticas.

## Detalhes técnicos
- TanStack Start + server functions por domínio (`catalog`, `offers`, `checkout`, `payments`, `orders`, `fulfillment`, `crm`, `audit`); rotas `/api/public/webhooks/payment` para webhooks.
- Postgres com RLS em todas as tabelas; `has_role()` security definer; vendedor vê só o que é seu.
- Triggers de auditoria (valor anterior/novo) nas tabelas críticas; histórico nunca apagado.
- Regras comerciais puras em módulos testáveis (vitest), chamadas só no servidor.
- Dados demo marcados como DEMO.

Cada fase termina verificada no preview antes da próxima. Aprovando, começo pela Fase 1 e sigo em sequência.
