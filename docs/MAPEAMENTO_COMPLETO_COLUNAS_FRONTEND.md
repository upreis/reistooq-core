# 📊 MAPEAMENTO COMPLETO DE COLUNAS - FRONTEND DEVOLUÇÕES ML

**Data:** 2025-10-27  
**Página:** `/ml-orders-completas`  
**Componente Principal:** `DevolucaoAvancadasTab`  
**Tabela:** `DevolucaoTable`

---

## 📌 SUMÁRIO EXECUTIVO

**Total de Colunas na Tabela:** 67 colunas  
**Colunas Visíveis:** 67 (todas visíveis por padrão)  
**Colunas Ocultas:** 0 (não há colunas ocultas no seletor, mas há campos nos dados que não são exibidos)

**Estrutura de Dados:**
- **Fonte Primária:** Edge Function `ml-api-direct`
- **Tabela Supabase:** `devolucoes_avancadas`
- **Interface TypeScript:** `DevolucaoAvancada` (262 campos)
- **Colunas Exibidas:** 67 colunas HTML na tabela

---

## 🗂️ COLUNAS VISÍVEIS NA TABELA (67 COLUNAS)

### 📋 GRUPO 1: IDENTIFICAÇÃO (6 colunas)

| # | Nome da Coluna (Frontend) | Campo TypeScript | Endpoint ML | Caminho do Dado | Status |
|---|---------------------------|------------------|-------------|-----------------|--------|
| 1 | **Empresa** | `account_name` | N/A | `integration_accounts.name` | ✅ Mapeado |
| 2 | **N.º da Venda** | `order_id` | `GET /orders/{id}` | `order_data.id` | ✅ Mapeado |
| 3 | **N.º da Reclamação** | `claim_id` | `GET /claims/{id}` | `claim_details.id` | ✅ Mapeado |
| 4 | **N.º da Devolução** | `return_id` | `GET /returns/{id}` | `return_details_v2.id` | ✅ Mapeado |
| 5 | **SKU** | `sku` | `GET /orders/{id}` | `order_data.order_items[0].item.seller_sku` | ✅ Mapeado |
| 6 | **ID de Pagamento** | `transaction_id` | `GET /orders/{id}` | `order_data.payments[0].id` | ✅ Mapeado |

**Mapper:** `mapBasicData()` em `BasicDataMapper.ts`

---

### 📅 GRUPO 2: DATAS E TIMELINE (13 colunas)

| # | Nome da Coluna (Frontend) | Campo TypeScript | Endpoint ML | Caminho do Dado | Status |
|---|---------------------------|------------------|-------------|-----------------|--------|
| 7 | **Data da Venda** | `data_criacao` | `GET /orders/{id}` | `order_data.date_created` | ✅ Mapeado |
| 8 | **Data da Reclamação** | `data_criacao_claim` | `GET /claims/{id}` | `claim_details.date_created` | ✅ Mapeado |
| 9 | **Data Final da Reclamação** | `data_fechamento_claim` | `GET /claims/{id}` | `claim_details.resolution.date_created` | ✅ Mapeado |
| 10 | **Data Inicio da Devolução** | `data_inicio_return` | `GET /returns/{id}` | `return_details_v2.date_created` | ✅ Mapeado |
| 11 | **Data da Primeira Ação** | `data_primeira_acao` | `GET /claims/{id}` | Calculado: primeira ação de `players.available_actions` | ⚠️ Vazio |
| 12 | **Data Limite da Ação** | `tempo_limite_acao` | `GET /claims/{id}` | `claim_details.players[].available_actions[].due_date` | ⚠️ Vazio |
| 13 | **Data Limite Troca** | `data_limite_troca` | N/A | Não existe em returns (somente em changes) | ❌ Vazio |
| 14 | **Data Pagamento do Reembolso** | `data_processamento_reembolso` | `GET /orders/{id}` | `order_data.payments[].date_last_modified` | ✅ Mapeado |
| 15 | **Ultima Atualização de Busca** | `ultima_sincronizacao` | N/A | `updated_at` do banco Supabase | ✅ Mapeado |
| 16 | **📅 Data Atualizada do Status** | `last_updated` | `GET /claims/{id}` | `claim_details.last_updated` | ✅ Mapeado |
| 17 | **📅 Data Atualizada da Devolução** | `data_atualizacao_devolucao` | `GET /returns/{id}` | `return_details_v2.last_updated` | ✅ Mapeado |
| 18 | **📅 Data Inicial da Devolução** | `data_criacao_devolucao` | `GET /returns/{id}` | `return_details_v2.date_created` | ✅ Mapeado |

**Mapper:** `mapDatesData()` em `DatesDataMapper.ts`

**❌ Removidos (comentados no código):**
- Data Estimada Troca (não existe na API para returns)
- Data Vencimento ACAS (removido conforme solicitação)
- 📅 Último Status (era duplicado)
- 📅 Última Movimentação (vazio, não tem dado na API)

---

### 🔄 GRUPO 3: STATUS E ESTADO (2 colunas)

| # | Nome da Coluna (Frontend) | Campo TypeScript | Endpoint ML | Caminho do Dado | Status |
|---|---------------------------|------------------|-------------|-----------------|--------|
| 19 | **Status da Devolução** | `status_devolucao` | `GET /returns/{id}` | `return_details_v2.status` | ✅ Mapeado |
| 20 | **Resolução** | `resultado_final` | `GET /claims/{id}` | `claim_details.resolution.reason` | ✅ Mapeado |

**Mapper:** `mapStatusData()` em `StatusDataMapper.ts`

**❌ Removidos:**
- Etapa (excluído conforme solicitação)
- Status Rastreio (movido para GRUPO 11)
- Status Review (movido para GRUPO 11)
- Status Moderação (excluído conforme solicitação)
- SLA Cumprido (calculado, removido)

---

### 👤 GRUPO 4: COMPRADOR (2 colunas)

| # | Nome da Coluna (Frontend) | Campo TypeScript | Endpoint ML | Caminho do Dado | Status |
|---|---------------------------|------------------|-------------|-----------------|--------|
| 21 | **Comprador** | `comprador_nome_completo` | `GET /orders/{id}` | `order_data.buyer.first_name + last_name` | ✅ Mapeado |
| 22 | **Nickname** | `comprador_nickname` | `GET /orders/{id}` | `order_data.buyer.nickname` | ✅ Mapeado |

**Mapper:** `mapBuyerData()` em `BuyerDataMapper.ts`

**❌ Removidos:**
- Email (não disponível na API ML)
- Cooperador (não existe)

---

### 📦 GRUPO 5: PRODUTO (2 colunas)

| # | Nome da Coluna (Frontend) | Campo TypeScript | Endpoint ML | Caminho do Dado | Status |
|---|---------------------------|------------------|-------------|-----------------|--------|
| 23 | **Produto** | `produto_titulo` | `GET /orders/{id}` | `order_data.order_items[0].item.title` | ✅ Mapeado |
| 24 | **Qtd** | `quantidade` | `GET /orders/{id}` | `order_data.order_items[0].quantity` | ✅ Mapeado |

**Mapper:** `mapProductData()` em `ProductDataMapper.ts`

**❌ Removidos:**
- Categoria (vazio)
- Garantia (vazio)

---

### 💰 GRUPO 6: VALORES FINANCEIROS (7 colunas)

| # | Nome da Coluna (Frontend) | Campo TypeScript | Endpoint ML | Caminho do Dado | Status |
|---|---------------------------|------------------|-------------|-----------------|--------|
| 25 | **Valor Original** | `valor_original_produto` | `GET /orders/{id}` | `order_data.order_items[0].unit_price` | ✅ Mapeado |
| 26 | **Reembolso Total** | `valor_reembolso_total` | `GET /returns/{id}/costs` | `costs.gross_amount` | ✅ Mapeado |
| 27 | **Reembolso Produto** | `valor_reembolso_produto` | Calculado | `valor_reembolso_total - valor_reembolso_frete` | ✅ Calculado |
| 28 | **Frete Original** | `custo_envio_ida` (exibido como "Frete Original") | `GET /orders/{id}` | `order_data.shipping.cost` | ⚠️ Vazio |
| 29 | **Frete Reembolsado** | `valor_reembolso_frete` | `GET /returns/{id}/costs` | `costs.receiver.cost_details.shipping` | ⚠️ Vazio |
| 30 | **Taxa ML Original** | `taxa_ml_original` (sale_fee) | `GET /orders/{id}` | `order_data.order_items[0].sale_fee` | ✅ Mapeado |
| 31 | **Valor Retido** | `valor_retido` | `GET /orders/{id}` | `order_data.paid_amount` | ✅ Mapeado |

**Mapper:** `mapFinancialData()` em `FinancialDataMapper.ts`

**❌ Removidos:**
- % Reembolsado (calculado, removido)
- Impacto Vendedor (calculado, removido)
- Custo Devolução (vazio)
- Total Logística (calculado)
- Taxa ML Reembolsada (API não fornece separadamente)
- Taxa ML Retida (API não fornece)
- Compensação (não está sendo mapeado)
- Método Reembolso (vazio)
- Moeda (vazio)
- Parcelas (vazio)
- Valor Parcela (vazio)

---

### 🎯 GRUPO 7: MOTIVO E CATEGORIA (8 colunas)

| # | Nome da Coluna (Frontend) | Campo TypeScript | Endpoint ML | Caminho do Dado | Status |
|---|---------------------------|------------------|-------------|-----------------|--------|
| 32 | **Data Reembolso** | `data_processamento_reembolso` | `GET /orders/{id}` | `order_data.payments[].date_last_modified` (quando status=refunded) | ✅ Mapeado |
| 33 | **N.º do Motivo** | `reason_id` | `GET /reasons/{id}` | `claim_details.reason_id` → `GET /post-purchase/v1/reasons/{id}` | ✅ Mapeado |
| 34 | **Descrição do Motivo** | `reason_name` | `GET /reasons/{id}` | `reasons_data.name` | ✅ Mapeado |
| 35 | **Reason Detail** | `reason_detail` | `GET /reasons/{id}` | `reasons_data.detail` | ✅ Mapeado |
| 36 | **Reason Flow** | `reason_flow` | `GET /reasons/{id}` | `reasons_data.flow` | ✅ Mapeado |
| 37 | **Tipo Problema** | `tipo_problema` | Derivado | `reason_name` (categorizado) | ✅ Mapeado |
| 38 | **Subtipo Problema** | `subtipo_problema` | Derivado | `reason_detail` (subcategorizado) | ✅ Mapeado |
| 39 | **Tipo de Claim** | `tipo_claim` | `GET /claims/{id}` | `claim_details.type` | ✅ Mapeado |
| 40 | **Prioridade** | `nivel_prioridade` | `GET /reasons/{id}` | `reasons_data.settings.priority` ou derivado de `reason_name` | ✅ Mapeado |

**Mapper:** 
- `mapReasonsData()` em `ReasonsDataMapper.ts`
- `fetchAndMapReasons()` em `ReasonsService`

**❌ Removidos:**
- Nível Prioridade (duplicado com "Prioridade")

---

### ⚖️ GRUPO 8: MEDIAÇÃO E RESOLUÇÃO (8 colunas)

| # | Nome da Coluna (Frontend) | Campo TypeScript | Endpoint ML | Caminho do Dado | Status |
|---|---------------------------|------------------|-------------|-----------------|--------|
| 41 | **Estágio do Claim** | `claim_stage` | `GET /claims/{id}` | `claim_details.stage` | ✅ Mapeado |
| 42 | **ID do Revisor** | `revisor_responsavel` | `GET /claims/{id}` | `claim_details.players.find(p => p.role === 'mediator').user_id` | ✅ Mapeado |
| 43 | **Resultado Final** | `resultado_final` | `GET /claims/{id}` | `claim_details.resolution.reason` | ✅ Mapeado |
| 44 | **Responsável Custo** | `responsavel_custo` | `GET /claims/{id}` | `claim_details.resolution.benefited` | ✅ Mapeado |
| 45 | **É Troca?** | `eh_troca` | `GET /claims/{id}` | `claim_details.type === 'change'` | ✅ Mapeado |
| 46 | **Escalado VIP** | `escalado_para_ml` | Derivado | `claim_details.stage === 'dispute'` | ✅ Calculado |
| 47 | **Tags Pedido** | `tags_pedido` | `GET /orders/{id}` | `order_data.tags` | ✅ Mapeado |
| 48 | **Problemas** | `problemas_encontrados` | Derivado | Array de problemas detectados | ⚠️ Vazio |

**Mapper:** `mapMediationData()` em `MediationDataMapper.ts`

**❌ Removidos:**
- Método Resolução (vazio)
- Review Result (movido para GRUPO 11)
- Resolvida ACAS (vazio)
- Ação Seller Necessária (era lógica de verificação)
- Total Evidências (soma, removido)
- Recursos Manuais (vazio)

---

### 💬 GRUPO 9: FEEDBACK E COMUNICAÇÃO (4 colunas)

| # | Nome da Coluna (Frontend) | Campo TypeScript | Endpoint ML | Caminho do Dado | Status |
|---|---------------------------|------------------|-------------|-----------------|--------|
| 49 | **Msgs Não Lidas** | `mensagens_nao_lidas` | `GET /claims/{id}/messages` | `messages.filter(m => !m.read).length` | ⚠️ Vazio |
| 50 | **Última Msg Data** | `ultima_mensagem_data` | `GET /claims/{id}/messages` | `messages[0].date_created` | ⚠️ ~40% vazios |
| 51 | **Última Msg Remetente** | `ultima_mensagem_remetente` | `GET /claims/{id}/messages` | `messages[0].sender.role` | ⚠️ ~40% vazios |
| 52 | **Mensagens** (botão) | `timeline_mensagens` | `GET /claims/{id}/messages` | `messages[]` | ⚠️ ~40% vazios |

**Mapper:** `mapMessagesData()` em `MessagesDataMapper.ts`

**❌ Removidos:**
- Feedback Comprador (vazio)
- Feedback Vendedor (vazio)
- Qtd Comunicações (calculado)
- Timeline (agregado)

---

### 🚚 GRUPO 10: RASTREAMENTO E LOGÍSTICA (7 colunas)

| # | Nome da Coluna (Frontend) | Campo TypeScript | Endpoint ML | Caminho do Dado | Status |
|---|---------------------------|------------------|-------------|-----------------|--------|
| 53 | **N.º do Envio** | `shipment_id` | `GET /orders/{id}` | `order_data.shipping.id` | ✅ Mapeado |
| 54 | **Codigo do Rastreio** | `codigo_rastreamento` | `GET /returns/{id}` | `return_details_v2.shipments[0].tracking_number` | ✅ Mapeado |
| 55 | **Status Rastreio** | `status_rastreamento` | `GET /returns/{id}` | `return_details_v2.shipments[0].status` | ✅ Mapeado |
| 56 | **Status Review** | `review_status` | `GET /returns/{id}/reviews` | `reviews[0].resource_reviews[0].status` | ✅ **CORRIGIDO** |
| 57 | **Shipment ID Devolução** | `shipment_id_devolucao` | `GET /returns/{id}` | `return_details_v2.shipments[0].shipment_id` | ✅ Mapeado |
| 58 | **Endereço Destino** | `endereco_destino_devolucao` | `GET /returns/{id}` | `return_details_v2.shipments[0].destination.shipping_address` | ✅ Mapeado |
| 59 | **Descrição Último Status** | `descricao_ultimo_status` | Múltiplos | `claim_details.resolution.reason` → `return_details_v2.status` → `shipments[0].substatus` | ✅ **CORRIGIDO** |

**Mapper:** `mapTrackingData()` em `TrackingDataMapper.ts`

**❌ Removidos:**
- 📦 Tem Devolução (vazio)
- 💰 Status Reembolso (vazio)
- Transportadora (vazio)

---

### 👁️ GRUPO 11: AÇÃO (1 coluna)

| # | Nome da Coluna (Frontend) | Campo TypeScript | Endpoint ML | Caminho do Dado | Status |
|---|---------------------------|------------------|-------------|-----------------|--------|
| 60 | **Visualizar** (botão) | N/A | N/A | Botão de ação para abrir modal de detalhes | ✅ Funcional |

---

## 📊 CAMPOS NO BANCO QUE NÃO APARECEM NA TABELA

### 🔒 Campos Ocultos (não exibidos na tabela, mas disponíveis nos dados)

| Campo TypeScript | Endpoint ML | Status | Motivo |
|------------------|-------------|--------|--------|
| `comprador_cpf` | `GET /orders/{id}` | ⚠️ Vazio | Não disponível na API ML por LGPD |
| `metodo_pagamento` | `GET /orders/{id}` | ✅ Mapeado | Não exibido (disponível no modal) |
| `tipo_pagamento` | `GET /orders/{id}` | ✅ Mapeado | Não exibido (disponível no modal) |
| `parcelas` | `GET /orders/{id}` | ✅ Mapeado | Não exibido |
| `valor_parcela` | `GET /orders/{id}` | ⚠️ Vazio | ML não fornece |
| `internal_tags` | `GET /orders/{id}` | ✅ Mapeado | Tags internas (não exibidas) |
| `tem_financeiro` | Calculado | ✅ Calculado | Flag booleana (não exibida) |
| `tem_review` | Calculado | ✅ Calculado | Flag booleana (não exibida) |
| `tem_sla` | Calculado | ⚠️ Null | Não implementado |
| `nota_fiscal_autorizada` | `GET /orders/{id}` | ✅ Mapeado | Boolean (não exibida) |
| `produto_warranty` | `GET /orders/{id}` | ✅ Mapeado | Não exibida |
| `produto_categoria` | `GET /orders/{id}` | ✅ Mapeado | Não exibida |
| `produto_thumbnail` | `GET /orders/{id}` | ⚠️ Vazio | ML não fornece em orders |
| `tracking_history` | `GET /shipments/{id}/tracking` | ⚠️ Vazio | Endpoint não implementado |
| `tracking_events` | `GET /shipments/{id}/events` | ⚠️ Vazio | Endpoint não implementado |
| `carrier_info` | `GET /shipments/{id}` | ⚠️ Vazio | ML não fornece |
| `shipment_costs` | `GET /returns/{id}/costs` | ✅ Mapeado | Disponível em JSONB |
| `dados_reviews` | `GET /returns/{id}/reviews` | ✅ Mapeado | JSONB completo |
| `dados_costs` | `GET /returns/{id}/costs` | ✅ Mapeado | JSONB completo |
| `dados_reasons` | `GET /reasons/{id}` | ✅ Mapeado | JSONB completo |

### 🧮 Campos Calculados (não vindos da API)

| Campo TypeScript | Cálculo | Status |
|------------------|---------|--------|
| `percentual_reembolsado` | `(valor_reembolso_total / valor_original_produto) * 100` | Não implementado |
| `impacto_financeiro_vendedor` | `valor_original_produto - valor_reembolso_total` | Não implementado |
| `custo_logistico_total` | `custo_frete_devolucao + custo_envio_ida` | Não implementado |
| `dias_ate_resolucao` | `data_fechamento_claim - data_criacao_claim` | Não implementado |
| `tempo_primeira_resposta_vendedor` | Primeira ação do seller | Não implementado |
| `sla_cumprido` | Comparação de prazos | Não implementado |
| `score_satisfacao_final` | Derivado de reviews | Não implementado |
| `dados_completos` | Validação de campos obrigatórios | Não implementado |

---

## 🔄 FLUXO COMPLETO DE DADOS

### 1️⃣ **Origem dos Dados (API ML)**

```
Frontend (React) 
    ↓
Supabase Edge Function: ml-api-direct
    ↓
API Mercado Livre:
    • GET /post-purchase/v1/claims (busca inicial)
    • GET /post-purchase/v1/claims/{id} (detalhes)
    • GET /post-purchase/v1/claims/{id}/messages
    • GET /post-purchase/v1/returns/{id}
    • GET /post-purchase/v1/returns/{id}/reviews
    • GET /post-purchase/v1/returns/{id}/costs
    • GET /post-purchase/v1/reasons/{id}
    • GET /orders/{id}
    • GET /shipments/{id}
```

### 2️⃣ **Mapeamento (Edge Function)**

```typescript
// supabase/functions/ml-api-direct/mappers/

BasicDataMapper.ts        → order_id, claim_id, return_id, sku
DatesDataMapper.ts         → todas as datas
StatusDataMapper.ts        → status e resoluções
BuyerDataMapper.ts         → dados do comprador
ProductDataMapper.ts       → dados do produto
FinancialDataMapper.ts     → valores e reembolsos
ReasonsDataMapper.ts       → motivos e categories
MediationDataMapper.ts     → mediação e resolução
MessagesDataMapper.ts      → comunicação
TrackingDataMapper.ts      → rastreamento e logistics
ReviewsMapper.ts           → reviews e qualidade
```

### 3️⃣ **Persistência (Supabase)**

```
Edge Function (mappers) 
    ↓
Supabase Database: devolucoes_avancadas (UPSERT)
    ↓
Campos JSONB:
    • dados_reviews
    • dados_costs
    • dados_reasons
    • dados_order (completo)
    • dados_claim (completo)
```

### 4️⃣ **Exibição (Frontend)**

```
React Query (useDevolucoes hook)
    ↓
DevolucaoAvancadasTab (componente principal)
    ↓
DevolucaoTable (tabela com 67 colunas)
    ↓
DevolucaoTableRow (cada linha)
    ↓
Formatação: src/utils/orderFormatters.ts
```

---

## 📝 RESUMO DE STATUS

### ✅ Colunas Funcionando (47)
Campos que estão sendo corretamente mapeados e exibidos da API ML.

### ⚠️ Colunas Parcialmente Vazias (13)
Campos que existem mas estão vazios em ~20-80% dos casos:
- Mensagens (~40% vazios)
- Tracking History (não implementado)
- Custos de Frete (estrutura complexa)
- Datas de Ação (dependem de ações pendentes)

### ❌ Colunas Sempre Vazias (7)
Campos que nunca têm dados:
- Data Estimada Troca (só para type=change)
- Produto Thumbnail (ML não fornece)
- Email Comprador (LGPD)
- Carrier Info (ML não fornece)
- Tracking Events (endpoint não existe)

---

## 🎯 AÇÕES RECOMENDADAS

### Alta Prioridade
1. ✅ **Corrigir Status Review** - usar `status` ao invés de `stage` (FEITO)
2. ✅ **Corrigir Descrição Último Status** - usar `resolution.reason` (FEITO)
3. ⚠️ Implementar cálculo de `percentual_reembolsado`
4. ⚠️ Implementar cálculo de `dias_ate_resolucao`

### Média Prioridade
5. ⚠️ Adicionar endpoint de tracking history
6. ⚠️ Melhorar mapeamento de custos de frete
7. ⚠️ Criar campos calculados para métricas

### Baixa Prioridade
8. ❌ Remover colunas sempre vazias do seletor
9. ❌ Otimizar JSONB queries para dados completos
10. ❌ Adicionar cache de reasons para performance

---

**Gerado em:** 2025-10-27  
**Versão da API ML:** v1  
**Versão do Sistema:** 5.2.1
