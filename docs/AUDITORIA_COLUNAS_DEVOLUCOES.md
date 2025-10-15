# 🔍 AUDITORIA COMPLETA - Colunas vs API Mercado Livre

**Data:** 2025-10-15  
**Objetivo:** Identificar colunas vazias, dados perdidos e mapeamentos incorretos

---

## 📊 RESUMO EXECUTIVO

### ✅ Estatísticas Gerais
- **Total de colunas na tabela:** ~180 colunas
- **Colunas preenchidas corretamente:** ~140 (78%)
- **Colunas sempre vazias:** ~25 (14%)
- **Colunas com problemas:** ~15 (8%)

---

## 🔴 PROBLEMA 1: COLUNAS QUE NUNCA RECEBEM DADOS DA API

### ❌ Grupo 1: Campos que NÃO existem na API ML

| Coluna | Motivo | Recomendação |
|--------|--------|--------------|
| `reason_flow` | Campo não retornado pela API `/reasons/{id}` | ❌ **REMOVER** ou aceitar NULL |
| `reason_rules_engine` | Campo não retornado pela API `/reasons/{id}` | ❌ **REMOVER** ou aceitar NULL |
| `produto_warranty` | Nunca é mapeado no código | ⚠️ Mapear de `order_items[0].item.warranty` |
| `produto_categoria` | Nunca é mapeado no código | ⚠️ Mapear de `order_items[0].item.category_id` |
| `produto_thumbnail` | Nunca é mapeado no código | ⚠️ Mapear de `order_items[0].item.thumbnail` |

### ❌ Grupo 2: Endpoint não disponível ou bloqueado

| Coluna | Motivo | Impacto |
|--------|--------|---------|
| `anexos_*` (todas) | API `/attachments` retorna 405 (Method Not Allowed) | ⚠️ Sempre vazio até ML liberar |
| `data_estimada_troca` | Só existe se for EXCHANGE, e endpoint não retorna | ⚠️ Sempre NULL para returns |
| `produto_troca_*` | Só existe se `change_details` for retornado (raramente) | ⚠️ ~0% de preenchimento |

### ❌ Grupo 3: Dados opcionais que dependem do status

| Coluna | Disponibilidade | Motivo |
|--------|----------------|--------|
| `data_vencimento_acao` | ~20% | API retorna `NULL` para claims antigos |
| `ultima_mensagem_data` | ~40% | Só existe se houver mensagens no claim |
| `mensagens_nao_lidas` | ~40% | Idem acima |
| `numero_interacoes` | ~40% | Idem acima |
| `status_rastreamento` | ~20% | Só existe se return criar shipment |
| `codigo_rastreamento_devolucao` | ~20% | Idem acima |

---

## 🟡 PROBLEMA 2: DADOS DA API QUE NÃO TÊM COLUNA

### 📦 Dados Disponíveis mas NÃO Salvos

| Dado da API | Caminho JSON | Coluna Correspondente | Status |
|-------------|--------------|----------------------|--------|
| `claim.stage` | `claim_details.stage` | ❌ NÃO EXISTE | Criar coluna `claim_stage` |
| `claim.resource` | `claim_details.resource` | ❌ NÃO EXISTE | Criar coluna `claim_resource_type` |
| `claim.quantity_type` | `claim_details.quantity_type` | ❌ NÃO EXISTE | Criar coluna `claim_quantity_type` |
| `claim.claimed_quantity` | `claim_details.claimed_quantity` | ❌ NÃO EXISTE | Criar coluna `claim_quantidade_reclamada` |
| `claim.fulfilled` | `claim_details.fulfilled` | ❌ NÃO EXISTE | Criar coluna `claim_fulfilled` |
| `claim.parent_id` | `claim_details.parent_id` | ❌ NÃO EXISTE | Criar coluna `claim_parent_id` |
| `return.resource_type` | `return_details.resource_type` | ❌ NÃO EXISTE | Criar coluna `return_resource_type` |
| `return.intermediate_check` | `return_details.intermediate_check` | ❌ NÃO EXISTE | Criar coluna `return_intermediate_check` |
| `return.related_entities` | `return_details.related_entities` | ⚠️ PARCIAL | Salvo em `dados_return` mas não extraído |
| `shipment.destination.shipping_address.*` | Vários subcampos | ⚠️ PARCIAL | Salvo em JSON mas não em colunas individuais |

### 📋 Campos de Mensagens Não Mapeados

| Campo | Caminho JSON | Sugestão de Coluna |
|-------|--------------|-------------------|
| `message.id` | `messages[0].id` | `mensagem_ml_id` (útil para tracking) |
| `message.status` | `messages[0].status` | `mensagem_status` |
| `message.from.id` | `messages[0].from.id` | Já temos `ultima_mensagem_remetente` |
| `message.message_moderation.*` | `messages[0].message_moderation` | Já temos `status_moderacao` |

---

## 🟠 PROBLEMA 3: MAPEAMENTO INCORRETO OU CONFUSO

### ⚠️ Colunas com Nome Confuso

| Coluna | Nome Atual | Problema | Sugestão |
|--------|------------|----------|----------|
| `data_criacao_claim` | ✅ OK | Mas o código às vezes busca de `claim_details.date_created` | Garantir source consistente |
| `data_inicio_return` | ✅ OK | Mas o código busca de 3 fontes diferentes | Documentar prioridade |
| `data_finalizacao_timeline` | ❌ CONFUSO | Não é do "timeline", é `claim.date_closed` | Renomear para `data_fechamento_claim` |
| `marcos_temporais` | ❌ CONFUSO | É um JSONB com datas, mas não documenta quais | Adicionar schema no comentário |
| `eventos_sistema` | ❌ CONFUSO | É JSONB construído, não vem da API | Renomear para `eventos_sistema_gerados` |

### ⚠️ Colunas Duplicadas ou Redundantes

| Grupo | Colunas | Problema |
|-------|---------|----------|
| **Rastreamento de Devolução** | `codigo_rastreamento_devolucao` vs `codigo_rastreamento` | Ambos guardam tracking number, mas de shipments diferentes |
| **Status** | `status_devolucao` vs `return_status` | MESMO dado, colunas diferentes! |
| **Transportadora** | `transportadora` vs `transportadora_devolucao` | Shipment original vs return |

**🔧 AÇÃO:** Renomear para deixar claro:
- `codigo_rastreamento` → `codigo_rastreamento_envio_original`
- `codigo_rastreamento_devolucao` → `codigo_rastreamento_return`
- `transportadora` → `transportadora_envio_original`
- `transportadora_devolucao` → `transportadora_return`

---

## 🟢 PROBLEMA 4: COLUNAS COM DADOS CORRETOS (Validadas ✅)

### ✅ Grupo 1: Dados Básicos do Order
| Coluna | Source API | Status |
|--------|-----------|--------|
| `order_id` | `order.id` | ✅ Correto |
| `claim_id` | `claim.id` | ✅ Correto |
| `data_criacao` | `order.date_created` | ✅ Correto |
| `status_devolucao` | `order.status` | ✅ Correto |
| `produto_titulo` | `order_items[0].item.title` | ✅ Correto |
| `sku` | `order_items[0].item.seller_sku` | ✅ Correto |
| `quantidade` | `order_items[0].quantity` | ✅ Correto |
| `valor_retido` | `order.total_amount` | ✅ Correto |

### ✅ Grupo 2: Dados do Comprador
| Coluna | Source API | Status |
|--------|-----------|--------|
| `comprador_nome_completo` | `buyer.first_name + last_name` | ✅ Correto |
| `comprador_nickname` | `buyer.nickname` | ✅ Correto |
| `metodo_pagamento` | `payments[0].payment_method_id` | ✅ Correto |
| `tipo_pagamento` | `payments[0].payment_type` | ✅ Correto |
| `parcelas` | `payments[0].installments` | ✅ Correto |

### ✅ Grupo 3: Dados de Return Details
| Coluna | Source API | Status |
|--------|-----------|--------|
| `status_dinheiro` | `return_details.status_money` | ✅ Correto |
| `subtipo_devolucao` | `return_details.subtype` | ✅ Correto |
| `reembolso_quando` | `return_details.refund_at` | ✅ Correto |
| `shipment_id_devolucao` | `return_details.shipments[0].id` | ✅ Correto |
| `status_envio_devolucao` | `return_details.shipments[0].status` | ✅ Correto |

### ✅ Grupo 4: Dados de Rastreamento (Shipment History)
| Coluna | Source API | Status |
|--------|-----------|--------|
| `tracking_history` | `shipment_history.combined_events` | ✅ Correto (JSONB) |
| `tracking_events` | Processado de `tracking_history` | ✅ Correto |
| `carrier_info` | `shipment_history.carrier_info` | ✅ Correto (JSONB) |
| `shipment_costs` | `return_details.shipping_cost` | ✅ Correto (JSONB) |
| `shipment_delays` | Calculado de `tracking_history` | ✅ Correto |

### ✅ Grupo 5: Dados Financeiros
| Coluna | Source API | Status |
|--------|-----------|--------|
| `valor_reembolso_total` | `financial_data.valor_reembolso_total` | ✅ Correto |
| `valor_reembolso_produto` | `financial_data.valor_reembolso_produto` | ✅ Correto |
| `valor_reembolso_frete` | `financial_data.valor_reembolso_frete` | ✅ Correto |
| `taxa_ml_reembolso` | `financial_data.taxa_ml_reembolso` | ✅ Correto |
| `impacto_financeiro_vendedor` | Calculado | ✅ Correto |
| `descricao_custos` | Objeto construído | ✅ Correto (JSONB) |

---

## 🎯 RECOMENDAÇÕES PRIORITÁRIAS

### 🔴 CRÍTICO - Resolver Imediatamente
1. **Corrigir `reason_flow`** - Remover coluna ou aceitar NULL
2. **Mapear dados de produto faltantes** - `warranty`, `category_id`, `thumbnail`
3. **Renomear colunas confusas** - `data_finalizacao_timeline` → `data_fechamento_claim`

### 🟡 IMPORTANTE - Resolver em Breve  
4. **Criar colunas para dados perdidos** - `claim_stage`, `claim_quantity_type`, etc.
5. **Documentar schema de JSONB** - Adicionar comentários nas colunas JSONB
6. **Padronizar nomenclatura** - Rastreamento original vs return

### 🟢 MELHORIAS - Backlog
7. **Otimizar colunas duplicadas** - Considerar unificar onde faz sentido
8. **Adicionar índices** - Para colunas mais consultadas (order_id, claim_id, etc.)
9. **Criar views** - Para simplificar queries complexas com dados JSONB

---

## 📋 LISTA DE VERIFICAÇÃO

### Colunas que NÃO recebem dados da API (vazias)
- [x] `reason_flow` - API não retorna
- [x] `reason_rules_engine` - API não retorna  
- [x] `anexos_*` - Endpoint bloqueado (405)
- [x] `produto_warranty` - Não mapeado
- [x] `produto_categoria` - Não mapeado
- [x] `produto_thumbnail` - Não mapeado
- [x] `data_estimada_troca` - Só para exchanges
- [x] `data_vencimento_acao` - Opcional (~20%)

### Dados da API sem coluna correspondente
- [ ] `claim.stage` - Criar `claim_stage`
- [ ] `claim.resource` - Criar `claim_resource_type`
- [ ] `claim.quantity_type` - Criar `claim_quantity_type`
- [ ] `claim.claimed_quantity` - Criar `claim_quantidade_reclamada`
- [ ] `claim.fulfilled` - Criar `claim_fulfilled`
- [ ] `return.intermediate_check` - Criar `return_intermediate_check`

### Mapeamentos a corrigir
- [ ] Renomear `data_finalizacao_timeline` → `data_fechamento_claim`
- [ ] Documentar schema de `marcos_temporais` (JSONB)
- [ ] Documentar schema de `eventos_sistema` (JSONB)
- [ ] Padronizar nomenclatura de rastreamento

---

## 💾 DADOS JSONB - Schema Documentado

### `tracking_history` (JSONB Array)
```typescript
{
  date_created: string,
  status: string,
  substatus: string,
  tracking: {
    checkpoint: string,
    location: string,
    description: string
  },
  shipment_type: 'original' | 'return',
  shipment_id: number
}[]
```

### `carrier_info` (JSONB Object)
```typescript
{
  name: string,
  tracking_method: string,
  service_id: string
}
```

### `shipment_costs` (JSONB Object)
```typescript
{
  shipping_cost: number,
  handling_cost: number,
  total_cost: number
}
```

### `marcos_temporais` (JSONB Object)
```typescript
{
  data_criacao_claim: string,
  data_inicio_return: string,
  data_finalizacao_timeline: string,
  data_criacao_order: string,
  data_ultimo_update: string
}
```

### `eventos_sistema` (JSONB Array)
```typescript
{
  tipo: 'order_created' | 'claim_created' | 'return_created' | 'mediation_started' | 'claim_closed',
  data: string,
  descricao: string,
  reason_id?: string,
  status?: string,
  resolution?: string
}[]
```

---

**FIM DA AUDITORIA** ✅
