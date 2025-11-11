# 📊 ANÁLISE DE COLUNAS - DEVOLUÇÕES MERCADO LIVRE

**Baseado na documentação oficial**: https://developers.mercadolivre.com.br/pt_br/gerenciar-devolucoes

---

## ✅ COLUNAS COM DADOS VÁLIDOS (API responde normalmente)

### Informações Básicas do Claim
- `claim_id` - ✅ ID único da reclamação
- `order_id` - ✅ ID do pedido associado
- `return_id` - ✅ ID da devolução
- `data_criacao_claim` - ✅ Data de criação (date_created)
- `data_fechamento_claim` - ✅ Data de fechamento (date_closed)
- `claim_stage` - ✅ Estágio do claim
- `tipo_claim` - ✅ Tipo (claim, dispute, automatic)
- `status_devolucao` - ✅ Status atual da devolução

### Informações do Return
- `data_criacao_devolucao` - ✅ Data criação da devolução
- `data_atualizacao_devolucao` - ✅ Última atualização
- `subtype` - ✅ Subtipo (return_total, return_partial, low_cost)
- `resource_type` - ✅ Tipo de recurso (order, claim, shipment, other)
- `status_money` - ✅ Status do dinheiro (retained, refunded, available)
- `refund_at` - ✅ Quando o reembolso ocorre (shipped, delivered, n/a)

### Razão/Motivo
- `reason_id` - ✅ ID do motivo
- `reason_name` - ✅ Nome do motivo  
- `reason_detail` - ✅ Detalhe do motivo
- `reason_category` - ✅ Categoria
- `reason_type` - ✅ Tipo da razão

### Informações do Produto
- `produto_titulo` - ✅ Título do produto (do order)
- `sku` - ✅ SKU/item_id
- `quantidade` - ✅ Quantidade (de orders.return_quantity)
- `valor_original_produto` - ✅ Valor do produto

### Informações do Comprador
- `comprador_nickname` - ✅ Nickname (de players.buyer)
- `comprador_nome_completo` - ✅ Nome completo
- `comprador_cpf` - ✅ CPF (quando disponível)

### Review/Revisão (vem de endpoint /reviews separado)
- `review_status` - ✅ Status (success, failed, pending)
- `review_method` - ✅ Método (triage, none)
- `product_condition` - ✅ Condição (saleable, unsaleable, discard, missing)
- `product_destination` - ✅ Destino (seller, buyer, meli)

### Shipments/Envio
- `shipment_id` - ✅ ID do envio
- `codigo_rastreamento` - ✅ tracking_number
- `status_rastreamento` - ✅ Status do shipment
- `shipment_destination` - ✅ Destino (seller_address, warehouse)
- `shipment_type` - ✅ Tipo (return, return_from_triage)

---

## ⚠️ COLUNAS QUE **NUNCA** TERÃO RESPOSTA (API não fornece)

### Removidas pela API v2 (documentação confirma)
- `warehouse_review` - ❌ **REMOVIDO** - agora via /reviews endpoint
- `seller_review` - ❌ **REMOVIDO** - agora via /reviews endpoint  
- `shipping.origin` - ❌ **REMOVIDO** - API não expõe mais origem
- `shipping.lead_time` - ❌ **REMOVIDO** - sem previsão
- `shipping.status_history` - ❌ **REMOVIDO** - migrado para /history endpoint

### Campos Internos do ML (não expostos na API)
- `score_qualidade` - ❌ **NÃO EXISTE** - cálculo interno ML
- `nivel_prioridade` - ❌ **NÃO EXPOSTO** - lógica interna
- `impacto_reputacao` - ❌ **NÃO EXPOSTO** - métrica interna
- `categoria_problema` - ❌ **NÃO EXPOSTO** - classificação interna
- `resultado_mediacao` - ❌ **LIMITADO** - apenas em resolution.reason
- `satisfacao_comprador` - ❌ **NÃO EXISTE** - não é capturado

---

## 🔄 COLUNAS DUPLICADAS (REMOVER PARA EVITAR CONFUSÃO)

### Duplicação #1: Status Devolução
- `status_devolucao` ✅ **MANTER** (vem de returns.status)
- `status_envio_devolucao` ❌ **REMOVER** (duplicata de status_rastreamento)

### Duplicação #2: Data Criação  
- `data_criacao_claim` ✅ **MANTER** (claim.date_created)
- `data_criacao_devolucao` ✅ **MANTER** (return criado após claim)
- `data_criacao` ❌ **REMOVER** (ambíguo - qual data?)

### Duplicação #3: Subtipo
- `subtipo_claim` ❌ **REMOVER** (não existe na API)
- `subtipo_devolucao` ✅ **MANTER** (returns.subtype)
- OU renomear `subtipo_devolucao` → `subtype` (seguir API)

### Duplicação #4: Shipment Status
- `status_rastreamento` ✅ **MANTER** (shipments.status)
- `status_rastreamento_devolucao` ❌ **REMOVER** (duplicata)
- `status_rastreamento_pedido` ❌ **REMOVER** (não é escopo de returns)

### Duplicação #5: Review Status
- `review_status` ✅ **MANTER** (reviews.status)
- `seller_status` ❌ **REMOVER** (confunde - vem de reviews.seller_status, mas já está em dados_review)

### Duplicação #6: Destino
- `destino_devolucao` ✅ **MANTER** (shipments.destination.name)
- `endereco_destino_devolucao` ❌ **REMOVER** (é objeto shipping_address, não string)
- `endereco_destino` ✅ **MANTER JSONB** (objeto completo)

### Duplicação #7: Tipo Envio
- `tipo_envio_devolucao` ✅ **MANTER** (shipments.type)
- `shipment_type` ❌ **REMOVER** (duplicata em inglês)

### Duplicação #8: Motivo
- `motivo_categoria` ✅ **MANTER** (de reason_id)
- `reason_category` ❌ **REMOVER** (duplicata em inglês)

---

## 🧩 COLUNAS JSONB (MANTER - ARMAZENAM OBJETOS COMPLEXOS)

### Dados Brutos da API
- `dados_claim` ✅ Objeto claim completo
- `dados_order` ✅ Objeto order completo  
- `dados_return` ✅ Objeto return completo
- `dados_review` ✅ Array de reviews

### Dados Estruturados (Fase 8)
- `dados_buyer_info` ✅ Informações do comprador
- `dados_product_info` ✅ Detalhes do produto
- `dados_financial_info` ✅ Valores e reembolsos
- `dados_tracking_info` ✅ Rastreamento completo
- `dados_quantities` ✅ Quantidades (total vs devolvida)
- `dados_available_actions` ✅ Ações disponíveis para seller

### Outros JSONB
- `dados_shipping_costs` ✅ Custos de envio
- `dados_lead_time` ✅ Prazos de entrega
- `dados_deadlines` ✅ Deadlines calculados
- `timeline_events` ✅ Histórico de eventos

---

## 📋 COMPORTAMENTO ESPERADO (NORMAL ESTAR VAZIO ÀS VEZES)

### Campos Opcionais por Tipo de Devolução
- `variation_id` - ⚪ Vazio se produto não tem variações
- `intermediate_check` - ⚪ Vazio se não for MPT (Mercado Ponto)
- `related_entities` - ⚪ Vazio se não tem reviews/outros relacionados
- `parcelas` - ⚪ Vazio se pagamento à vista
- `valor_parcela` - ⚪ Vazio se sem parcelas

### Campos que Dependem de Status
- `data_fechamento_claim` - ⚪ Null enquanto claim aberto
- `data_fechamento_devolucao` - ⚪ Null enquanto return em andamento
- `codigo_rastreamento` - ⚪ Null antes de shipped
- `data_reembolso` - ⚪ Null antes de refunded

### Campos de Review (só existem se related_entities contém "reviews")
- `review_status` - ⚪ Null se sem review
- `review_method` - ⚪ Null se sem review
- `product_condition` - ⚪ Null se sem review
- `product_destination` - ⚪ Null se sem review
- `seller_reason` - ⚪ Null se revisão não falhou

---

## 🎯 AÇÃO RECOMENDADA - LIMPEZA DE SCHEMA

### FASE 1: Remover Colunas Inexistentes na API
```sql
-- Campos que nunca terão dados
ALTER TABLE devolucoes_avancadas DROP COLUMN IF EXISTS score_qualidade;
ALTER TABLE devolucoes_avancadas DROP COLUMN IF EXISTS nivel_prioridade;
ALTER TABLE devolucoes_avancadas DROP COLUMN IF EXISTS impacto_reputacao;
ALTER TABLE devolucoes_avancadas DROP COLUMN IF EXISTS categoria_problema;
ALTER TABLE devolucoes_avancadas DROP COLUMN IF EXISTS satisfacao_comprador;
```

### FASE 2: Remover Duplicatas
```sql
-- Status duplicados
ALTER TABLE devolucoes_avancadas DROP COLUMN IF EXISTS status_envio_devolucao;
ALTER TABLE devolucoes_avancadas DROP COLUMN IF EXISTS status_rastreamento_devolucao;
ALTER TABLE devolucoes_avancadas DROP COLUMN IF EXISTS status_rastreamento_pedido;

-- Datas duplicadas  
ALTER TABLE devolucoes_avancadas DROP COLUMN IF EXISTS data_criacao;

-- Subtipos duplicados
ALTER TABLE devolucoes_avancadas DROP COLUMN IF EXISTS subtipo_claim;

-- Campos em inglês duplicados
ALTER TABLE devolucoes_avancadas DROP COLUMN IF EXISTS shipment_type;
ALTER TABLE devolucoes_avancadas DROP COLUMN IF EXISTS reason_category;
ALTER TABLE devolucoes_avancadas DROP COLUMN IF EXISTS seller_status;

-- Campos ambíguos
ALTER TABLE devolucoes_avancadas DROP COLUMN IF EXISTS endereco_destino_devolucao;
```

### FASE 3: Atualizar Lista de Campos Válidos no sync-devolucoes
Remover os campos deletados da lista `validColumns` na Edge Function.

---

## 📊 RESUMO FINAL

| Categoria | Quantidade | Ação |
|-----------|-----------|------|
| ✅ Colunas válidas com dados | ~40 | Manter |
| ⚪ Colunas opcionais (normal vazio) | ~15 | Manter |
| ❌ Colunas inexistentes na API | ~6 | **REMOVER** |
| 🔄 Colunas duplicadas | ~10 | **REMOVER** |
| 🧩 Colunas JSONB | ~15 | Manter |

**Total de colunas a REMOVER: ~16**

---

## 🔍 VALIDAÇÃO NA INTERFACE

Após limpeza, as seguintes colunas **NÃO** devem mais aparecer vazias:
- Status (status_devolucao) ✅
- Status $ (status_money) ✅
- Subtipo (subtype) ✅  
- Tipo Recurso (resource_type) ✅
- Item ID (item_id/sku) ✅
- Variação ID (variation_id) ⚪ Normal vazio sem variações
- Destino (shipment_destination) ✅
- Tipo Envio (tipo_envio_devolucao) ✅
- Prazo Limite (delivery_limit) ⚪ Via lead_time quando disponível
- Reembolso (refund_at) ✅
- Condição Produto (product_condition) ⚪ Só se related_entities = "reviews"
- Destino Produto (product_destination) ⚪ Só se related_entities = "reviews"
- Review Status (review_status) ⚪ Só se related_entities = "reviews"

---

**✅ Validado contra documentação oficial ML em 11/11/2025**
