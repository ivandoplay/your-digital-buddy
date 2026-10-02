# LEAL CAPS — copiar, integrar e melhorar a plataforma enviada

## Objetivo
Transformar o projeto atual na versão operacional completa mostrada no arquivo enviado, preservando o login, os dados e o catálogo já existentes. A interface e os fluxos úteis serão reproduzidos e refinados; a arquitetura insegura de demonstração do arquivo não será copiada.

## O que será entregue

### 1. Base visual e navegação
- Evoluir o painel para a identidade visual da referência, com melhor contraste, hierarquia e aproveitamento de espaço.
- Menu por perfil com áreas de Administrador, Vendedor e Fulfillment.
- Navegação responsiva, cabeçalho de sessão, estados de carregamento/erro/vazio e confirmação em ações críticas.
- Visão inicial operacional com indicadores, alertas, tendências e atalhos úteis.

### 2. Produtos, ofertas e compliance
- Manter e melhorar o catálogo atual: ficha técnica, imagens, documentos, claims, lote, validade e status regulatório.
- Criar ofertas unitárias, kits e combos com itens, preços, validade, limite, frete, campanha e vendedor autorizado.
- Regras reais de margem mínima, teto de desconto e comissão, validadas no servidor.
- Fluxo de compliance com revisão, checklist, aprovação/rejeição e bloqueio de publicação enquanto houver pendências.
- Cupons com escopo, validade, limite global e limite por cliente.

### 3. Área do vendedor
- “Maquininha” para selecionar oferta, negociar dentro dos limites permitidos e gerar link único.
- Histórico de links com acessos e conversões.
- Visão dos próprios pedidos, clientes, atendimentos e ganhos.
- Pipeline de leads com registro de interações e ofertas apresentadas.

### 4. Compra pública e pedidos
- Página pública por link de oferta, otimizada para celular e sem exigir login.
- Checkout em etapas: identificação, endereço/CEP, frete, cupom, pagamento e revisão.
- Criação transacional de cliente, pedido, itens, pagamento, comissão e eventos.
- Tela de sucesso e consulta pública de pedido/rastreio sem exposição indevida de dados pessoais.
- Provedores de pagamento, frete e notificações em modo DEMO claramente identificado até a conexão de fornecedores reais.

### 5. Operação, relacionamento e governança
- Pedidos com estados financeiro, operacional e logístico separados e histórico completo.
- Fila de fulfillment: aguardando, separação, embalagem, pronto para envio, enviado, entregue, devolvido e exceção.
- Clientes, CRM, recompra, campanhas e origem/UTMs.
- Comissões congeladas no momento da venda.
- Analytics de vendas, conversão, ticket, receita, margem e desempenho por vendedor/campanha.
- Economia unitária, automações, privacidade, usuários, permissões, integrações e auditoria.

## Melhorias sobre o arquivo enviado
- Remover credenciais e perfis demonstrativos embutidos; usar somente autenticação real e permissões verificadas no servidor.
- Substituir o armazenamento local/servidor monolítico da referência pelo banco já conectado, com proteção por perfil em todas as operações.
- Separar cada área em páginas e módulos menores, em vez de manter telas gigantes em um único arquivo.
- Não copiar configurações privadas, chaves, arquivos de ambiente ou a integração Firebase presente no ZIP.
- Reutilizar as quatro imagens de produtos da referência por meio do armazenamento de assets do projeto.
- Melhorar acessibilidade, responsividade, formulários, tabelas, filtros e feedback de ações.

## Segurança e dados
- Manter papéis em tabela separada e aplicar acesso mínimo por Administrador, Vendedor, Fulfillment e público.
- Validar entradas, valores, transições de estado, descontos, comissões e idempotência no servidor.
- Proteger dados pessoais; as páginas públicas recebem apenas os campos necessários.
- Registrar alterações críticas em auditoria imutável.
- Preservar registros atuais e evoluir o banco apenas com migrações compatíveis.

## Sequência de implementação
1. Design system, estrutura do painel e navegação por perfil.
2. Banco e regras de ofertas, campanhas, cupons e compliance.
3. Área do vendedor e geração de links.
4. Oferta pública, checkout, pedido e pagamento DEMO.
5. Fulfillment, rastreio, CRM, comissões e analytics.
6. Configurações, automações, privacidade, auditoria e revisão final.
7. Testes de permissões e regras; validação completa em desktop e celular, incluindo fluxos autenticados.

## Critérios de conclusão
- Nenhum botão principal será apenas decorativo.
- Administrador, Vendedor e Fulfillment verão somente as áreas e dados permitidos.
- Um fluxo completo funcionará de ponta a ponta: produto aprovado → oferta aprovada → link do vendedor → checkout → pedido → pagamento DEMO → fulfillment → rastreio.
- O app continuará preparado para conectar provedores reais sem reescrever os módulos centrais.
