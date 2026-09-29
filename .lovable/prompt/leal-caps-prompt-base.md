# LEAL CAPS — Prompt Base

Você é uma IA sênior de produto, UX/UI, arquitetura de software, backend, frontend, banco de dados, segurança e integrações.

Sua tarefa é CONSTRUIR uma plataforma web full-stack funcional chamada LEAL CAPS, baseada rigorosamente no blueprint de produto fornecido.

Não trate isso como uma landing page, protótipo visual ou dashboard fake.

Quero uma aplicação real, estruturada para operação, com frontend, backend, banco de dados, autenticação, permissões, estados, validações, histórico, auditoria e arquitetura preparada para integrações reais.

## 1. VISÃO DO PRODUTO

A Leal Caps é uma infraestrutura privada de vendas e fulfillment.

O fluxo principal da operação é:

- Aquisição → Lead → Atendimento → Oferta → Checkout → Pagamento → Pedido → Fulfillment → Envio → Entrega → Pós-venda → Recompra

A plataforma não deve ser construída como marketplace.

### Perfis

**ADMIN**
- Controle central da operação
- Administra: produtos, SKUs, documentação, ofertas, preços, descontos, combos, cupons, campanhas, usuários, vendedores, pedidos, pagamentos, logística, fulfillment, CRM, analytics, regras comerciais, compliance, auditoria, integrações, configurações

**VENDEDOR**
- Origem comercial da venda
- Pode: visualizar leads permitidos, atender clientes, visualizar clientes atribuídos, visualizar ofertas autorizadas, selecionar ofertas autorizadas, gerar links, gerar cupons dentro das regras, acompanhar pedidos permitidos, consultar status, atender dúvidas sobre pedidos, acompanhar suas métricas
- Não pode editar preços ou quebrar regras comerciais. Apenas utiliza condições autorizadas pelo motor comercial.

**CLIENTE**
- Experiência simples e mobile-first
- Pode: abrir uma oferta, visualizar produto/combo, aplicar cupom, informar CEP, calcular frete, preencher seus dados, realizar pagamento, receber confirmação, acompanhar pedido, consultar rastreio, receber comunicação de pós-venda

## 2. PRINCÍPIO FUNDAMENTAL

Separar claramente:

**PRODUTO**
- ID, SKU, nome interno, nome comercial, categoria, descrição, composição, apresentação, quantidade, imagens, documentação, lote, validade, status, informações regulatórias, claims aprovados, advertências, modo de uso, restrições, informações de rotulagem, timestamps, histórico de alterações

**OFERTA**
- ID da oferta, produto ou combo, quantidade, preço, preço promocional, desconto, cupom, validade, limite de utilização, frete, extras, vendedor, campanha, status, regras de elegibilidade, data de início, data de encerramento

**CAMPANHA**
- campanha, canal, origem, mídia, anúncio, criativo, UTM source, UTM medium, UTM campaign, UTM content, vendedor responsável, demais atributos de atribuição

Produto, oferta e campanha são entidades distintas.

## 3. ARQUITETURA GERAL

- Modular: frontend, backend, banco, autenticação, autorização, serviços de pagamento, serviço de frete, serviço de comunicação, CRM, analytics, auditoria, compliance
- Nunca coloque regra comercial importante apenas no frontend. Toda regra crítica deve ser validada também no backend.

## 4. AUTENTICAÇÃO

- login, logout, recuperação de senha, redefinição de senha, sessão segura, controle de sessão, proteção de rotas, RBAC, 2FA para administração, controle de permissões, registro de acessos relevantes
- Papéis iniciais: ADMIN, VENDEDOR, FULFILLMENT (preparar arquitetura para novos papéis)

## 5. DASHBOARD ADMIN

KPIs: vendas, pedidos, conversão, ticket médio, CAC, ROAS, margem de contribuição, LTV, refund, chargeback, SLA, pedidos pendentes, pedidos em preparação, pedidos enviados, pedidos em trânsito, pedidos entregues, pagamentos pendentes

Gráficos e filtros por: período, campanha, vendedor, produto, oferta, canal, status

## 6. CATÁLOGO

Funcionalidades: listar, pesquisar, filtrar, criar, editar, duplicar, arquivar, ativar/desativar, visualizar documentação, anexar arquivos, controlar status regulatório, gerenciar imagens, gerenciar SKU, gerenciar estoque futuramente

Categorias iniciais: Emagrecimento, Pele cabelos e unhas, Queima de gordura, Celulite, Massa magra, Articulações, Ansiedade, Endometriose, Menopausa, Libido

## 7. MOTOR DE OFERTAS

Offer Engine: criar oferta, selecionar produto/combo, definir quantidade, preço, preço promocional, desconto, cupom, limite de uso, validade, associar vendedor, associar campanha, definir regras, ativar/desativar, duplicar, visualizar histórico

Tipos de oferta: 1 unidade, Kit 2, Kit 3+, Combo

O vendedor consome esse motor. Nunca permitir que o vendedor altere preço no navegador.

## 8. LINKS DE OFERTA

Sistema de links rastreáveis: `/o/XXXXX`

O link deve carregar: oferta, campanha, vendedor, parâmetros, regras, validade, status

Página pública de oferta: validar link, validar validade, validar limite, carregar produto/combo, carregar condição comercial, mostrar checkout

## 9. CUPONS

Suportar: percentual, valor fixo, quantidade máxima, validade, uso por cliente, uso global, vendedor autorizado, campanhas autorizadas, produtos autorizados, ofertas autorizadas, status ativo/inativo

Registrar toda utilização, evitar reutilização indevida, validar no backend.

## 10. CHECKOUT

Mobile-first, extremamente simples.

Fluxo: LINK → OFERTA → CEP → FRETE → DADOS DO CLIENTE → PAGAMENTO → CONFIRMAÇÃO → PEDIDO

Resumo da oferta: produto, quantidade, preço, desconto, cupom, subtotal, frete, total

Dados: nome, telefone, e-mail, CPF (quando operacionalmente necessário), CEP, endereço, número, complemento, bairro, cidade, estado

## 11. FRETE

Módulo desacoplado baseado em provider. Interface: ShippingProvider

Suporte para: cotação, serviço, prazo, preço, etiqueta, rastreio

Fluxo: CEP → cotação → serviços disponíveis → escolha → preço → prazo

Fallback quando provedor indisponível. Fornecedor trocável sem reconstruir checkout.

## 12. PAGAMENTO

Arquitetura de gateway desacoplada. Entidade Payment com estados: CREATED, PENDING, APPROVED, DECLINED, EXPIRED, REFUNDED, CHARGEBACK

Fluxo: Pagamento criado → aguardando → webhook → validação → aprovado/recusado → pedido atualizado

Implementar: idempotência, validação de webhook, assinatura do webhook, logs, reconciliação, proteção contra duplicidade, separação entre status financeiro e status logístico

Interface PaymentProvider: createPayment, getPayment, refund, validateWebhook

## 13. PEDIDO

Entidade Order: número do pedido, cliente, vendedor, oferta, campanha, cupom, itens, subtotal, desconto, frete, total, pagamento, endereço, serviço logístico, rastreio, status financeiro, status operacional, status logístico, timestamps, histórico, auditoria

Formato visual: #LC-XXXXX. Nunca expor dados pessoais desnecessários por meio do código público do pedido.

## 14. TIMELINE DO PEDIDO

- PEDIDO CRIADO → PAGAMENTO PENDENTE → PAGAMENTO APROVADO → PREPARAÇÃO → SEPARAÇÃO → EMBALAGEM → ENVIADO → EM TRÂNSITO → ENTREGUE

Cada alteração registra: evento, usuário/sistema responsável, timestamp, valor anterior, novo valor, observação

## 15. FULFILLMENT

Fila: Pagos → Separação → Embalagem → Expedição → Enviado → Em trânsito → Entregue + Exceções

Exibir exceções: endereço inválido, frete indisponível, atraso, devolução, chargeback

## 16. CRM

Pipeline: LEAD → INTERESSADO → OFERTA → CHECKOUT → CLIENTE → RECOMPRA

Cada lead: nome, contato, origem, campanha, vendedor, status, data de criação, últimas interações, ofertas apresentadas, ofertas compradas, histórico

Guardar ofertas apresentadas e não apenas as compradas.

## 17. VENDEDOR

Painel: leads, clientes, ofertas, links, pedidos, conversões, faturamento atribuído, comissão, ticket médio, conversão, histórico

Permitir criar links de oferta autorizada. Não permitir: alteração arbitrária de preço, alteração de regra comercial, alteração de comissão, acesso a dados de outros vendedores sem permissão

Atribuição: CLIENTE = pertence à operação, VENDA = atribuída ao vendedor

## 18. COMISSÕES

Entidade Commission: vendedor, pedido, base de cálculo, percentual, valor, status, data, regra usada

Comissão congelada no pedido, para que mudanças futuras nas regras não alterem pedidos antigos.

## 19. RECUPERAÇÃO

Estrutura baseada em eventos: checkout abandonado, PIX pendente, pagamento aprovado, pedido enviado, pedido entregue

Cada automação: evento gatilho, atraso, canal, mensagem, janela permitida, opt-out, limite, status

Canais preparados: WhatsApp, e-mail. Interface NotificationProvider para desacoplar.

## 20. PÓS-VENDA

Jornada: D0 (compra) → ENVIO (rastreio) → ENTREGA (confirmação + suporte) → RECOMPRA (nova oportunidade)

A recompra deve depender de regras configuráveis.

## 21. ANALYTICS

Sistema de eventos: lead criado, oferta visualizada, link acessado, checkout iniciado, cupom aplicado, pagamento criado, pagamento aprovado, pagamento recusado, pedido criado, pedido enviado, pedido entregue, recompra

Funil: VISITAS → OFERTAS → CHECKOUTS → PAGAMENTOS → PEDIDOS → ENTREGAS → RECOMPRAS

## 22. ECONOMIA UNITÁRIA

Fórmula: RECEITA BRUTA − descontos − impostos/encargos − gateway − comissão − produto − embalagem/operação − frete subsidiado − CAC = CONTRIBUIÇÃO DA VENDA

Permitir configurar: margem mínima, teto de desconto, comissão, CAC suportável. Sistema deve impedir ofertas que violem regras comerciais.

## 23. GOVERNANÇA E AUDITORIA

AuditLog: usuário, ação, entidade, entity_id, valor anterior, valor novo, timestamp, IP quando aplicável, metadata

Alterações relevantes registradas. Histórico não apagado por alterações normais.

## 24. COMPLIANCE

Compliance Gate: DRAFT → UNDER_REVIEW → APPROVED/REJECTED/ARCHIVED

Permitir aprovação para: produto, oferta, landing page, anúncio, criativo, copy, depoimento

Checklist interno: documentação existente, status regulatório, claims aprovados, rotulagem, comunicação comercial, advertências, responsável pela aprovação

## 25. BANCO DE DADOS

Estrutura relacional normalizada. Tabelas mínimas: users, roles, permissions, products, product_documents, product_images, product_claims, product_regulatory_status, offers, offer_items, offer_rules, coupons, coupon_usages, campaigns, leads, customers, customer_events, orders, order_items, order_events, payments, payment_events, shipments, shipment_events, commissions, automation_rules, automation_executions, notifications, audit_logs, compliance_reviews

## 26. STATUS INDEPENDENTES

Separar: Status financeiro, Status operacional, Status do pedido (visão consolidada derivada dos estados internos)

## 27. INTERFACE

Tema dark premium tecnológico moderno clean profissional. Sidebar fixa, barra superior, cards modulares.

Paleta: fundo quase preto, painéis escuros, verde-lima principal, azul/ciano secundário, laranja atenção, vermelho risco, verde sucesso

## 28. TELAS ADMIN

Dashboard, Produtos (criar/editar), Documentação, Ofertas (criar/editar), Combos, Cupons, Campanhas, Leads, Clientes, Pedidos (detalhes), Pagamentos, Logística, Fulfillment, Vendedores, Comissões, CRM, Automações, Analytics, Economia, Compliance, Usuários, Permissões, Auditoria, Integrações, Configurações

## 29. TELAS DO VENDEDOR

Dashboard, Leads, Clientes, Ofertas autorizadas, Criar link, Pedidos, Detalhes do pedido, Comissão, Histórico

## 30. ÁREA PÚBLICA

Página de oferta (produto, descrição, quantidade, preço, desconto, benefícios permitidos, imagens, prazo, CTA), Checkout mobile-first, Sucesso (pedido, status do pagamento, próximos passos, código do pedido), Rastreamento (apenas informações permitidas)

## 31. SEGURANÇA

RBAC, princípio do menor privilégio, proteção contra acesso horizontal, validação de input, sanitização, proteção contra XSS, proteção contra CSRF quando aplicável, rate limiting, proteção de webhooks, idempotência, logs, controle de sessões, expiração de sessão, armazenamento seguro de credenciais, secrets em variáveis de ambiente, nenhuma chave secreta hardcoded no frontend

## 32. PRIVACIDADE

Minimização de dados, mecanismos para acesso, correção, anonimização/eliminação quando aplicável, registro de solicitações, controle de finalidade, restrição de acesso. Não exibir CPF, endereço completo ou dados sensíveis em páginas públicas de pedido.

## 33. EXPERIÊNCIA RESPONSIVA

Desktop, notebook, tablet, celular. Checkout especialmente otimizado para celular. Admin prioriza desktop. Vendedor deve funcionar bem em celular.

## 34. COMPONENTES REUTILIZÁVEIS

Design system: Sidebar, Header, Button, Input, Select, Modal, Drawer, Table, DataTable, Badge, StatusBadge, Card, KPI, Chart, Timeline, EmptyState, LoadingState, ErrorState, Toast, ConfirmDialog, Form, FileUploader, Search, Filters, Pagination

## 35. ESTADOS DE UX

Toda tela: loading, vazio, erro, sucesso, indisponibilidade, permissão negada, dados incompletos. Não mostrar páginas quebradas ou placeholders sem contexto.

## 36. DADOS DEMONSTRATIVOS

Mockados identificados como DEMO. Não fingir transações reais, não usar valores de produção, não criar integrações falsas que aparentem funcionar. Separar adapters/mock providers dos providers reais.

## 37. INTEGRAÇÕES

Interfaces abstratas para:
- PaymentProvider: createPayment, getPayment, refund, validateWebhook
- ShippingProvider: quote, createShipment, getTracking, cancelShipment
- NotificationProvider: sendWhatsApp, sendEmail

## 38. API

Organizar endpoints por domínio:
- POST /auth/login
- GET /products
- POST /products
- PATCH /products/:id
- GET /offers
- POST /offers
- PATCH /offers/:id
- POST /offers/:id/publish
- POST /coupons/validate
- POST /checkout
- POST /payments
- POST /webhooks/payment
- GET /orders/:id
- PATCH /orders/:id/status
- GET /shipments/:id/tracking
- GET /crm/leads
- POST /crm/leads
- GET /analytics
- GET /audit-logs

## 39. REGRAS IMPORTANTES

Não permitir: desconto acima do limite, cupom expirado, cupom excedendo limite, oferta expirada, oferta desativada, pagamento duplicado, atualização indevida de pedido, acesso a dados de outro vendedor, publicação sem aprovação necessária, alteração silenciosa de valores históricos, alteração retroativa de comissão, mudança de pedido sem auditoria

## 40. ROADMAP DE IMPLEMENTAÇÃO

**P0 — FUNDAÇÃO**: autenticação, usuários, RBAC, produtos, documentação, ofertas, combos, cupons, regras comerciais

**P0 — TRANSAÇÃO**: página de oferta, checkout, CEP, frete, pagamento, webhook, pedido, código único

**P1 — OPERAÇÃO**: fulfillment, rastreio, exceções, notificações, atendimento

**P1 — GROWTH**: CRM, recuperação, atribuição, analytics, recompra

## 41. O QUE NÃO CONSTRUIR AGORA

Não gastar esforço com: marketplace de terceiros, aplicativo mobile nativo, ERP completo, IA obrigatória, dezenas de integrações, funcionalidades que não impactem o ciclo principal

Objetivo inicial: provar o ciclo OFERTA → CHECKOUT → PAGAMENTO → PEDIDO → FULFILLMENT → ENTREGA

## 42. QUALIDADE DO CÓDIGO

Código modular, legível, tipado quando aplicável, documentado, testável, escalável, sem duplicação desnecessária, sem regras comerciais espalhadas pelo frontend, sem dados sensíveis hardcoded. Não criar aplicação monolítica impossível de manter.

## 43. TESTES

Testes para: Oferta (válida, expirada, limite excedido, cupom inválido, desconto acima do permitido), Checkout (CEP válido, CEP inválido, frete indisponível, erro de pagamento), Pagamento (webhook válido, inválido, duplicado, aprovado, recusado, reembolso), Pedido (criação, alteração de estado, duplicidade, auditoria), Permissões (admin, vendedor, fulfillment), Segurança (acesso indevido, endpoints sem autenticação, manipulação de ID, acesso horizontal)

## 44. IMPORTANTE SOBRE IMPLEMENTAÇÃO

Entregar: estrutura do projeto, banco de dados, migrations, models, autenticação, autorização, API, frontend, regras de negócio, validações, auditoria, testes, dados seed/demo, adapters de integração, documentação. Quando integração externa não estiver configurada, criar adapter/mock claramente identificado.

## 45. PRINCÍPIO DE EXECUÇÃO

Antes de escrever código: analisar arquitetura, definir entidades, relacionamentos, estados, permissões, fluxos, criar banco, criar backend, criar frontend, conectar tudo, testar, revisar inconsistências, corrigir bugs.

Quando existir decisão crítica não definida no blueprint: não inventar regra comercial, não inventar preço real, não inventar comissão real, não inventar gateway real, não inventar transportadora real, não inventar política de reembolso, não inventar claims, não inventar status regulatório. Usar TODO, CONFIGURAR, PENDENTE ou configuração administrativa.

Decisões pendentes incluem: preços, comissão, gateway, frete, reembolso, comunicação, permissões, recompra e margem mínima.

## 46. PRIMEIRA ENTREGA

Ciclo completo:
1. ADMIN cadastra produto
2. ADMIN cadastra oferta
3. ADMIN aprova oferta
4. ADMIN associa vendedor
5. VENDEDOR recebe oferta
6. VENDEDOR gera link
7. CLIENTE abre link
8. CLIENTE inicia checkout
9. CLIENTE informa CEP
10. CLIENTE recebe cotação
11. CLIENTE informa dados
12. CLIENTE realiza pagamento
13. GATEWAY confirma
14. SISTEMA cria pedido #LC-XXXXX
15. FULFILLMENT recebe pedido
16. PEDIDO é preparado
17. RASTREIO é associado
18. PEDIDO é enviado
19. PEDIDO é entregue
20. CRM registra cliente
21. PÓS-VENDA é iniciado

## 47. REGRA FINAL

Não remover funcionalidades para simplificar. Não transformar regras de negócio em elementos meramente visuais. Não criar botões que não fazem nada. Não criar fake functionality. Arquitetura preparada para expansão.

Centro da arquitetura: PRODUTO → OFERTA → TRANSAÇÃO → PEDIDO → OPERAÇÃO → RELACIONAMENTO

## RESULTADO ESPERADO

Plataforma LEAL CAPS moderna, privada, segura e modular com:
- CATÁLOGO
- OFERTAS
- VENDEDORES
- CHECKOUT
- PAGAMENTO
- PEDIDOS
- LOGÍSTICA
- FULFILLMENT
- CRM
- PÓS-VENDA
- ANALYTICS
- ECONOMIA
- COMPLIANCE
- AUDITORIA
