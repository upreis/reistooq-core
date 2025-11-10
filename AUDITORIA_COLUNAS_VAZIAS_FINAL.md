# 🔍 AUDITORIA FINAL - COLUNAS VAZIAS
## Análise completa de campos da API ML vs Implementação

**Data:** 10 de novembro de 2025  
**Escopo:** Identificar colunas sem dados e motivos (mapeamento incorreto vs inexistente na API)

---

## 📋 METODOLOGIA

1. ✅ Análise da documentação oficial da API ML
2. ✅ Revisão dos dados reais retornados pelo endpoint get-devolucoes
3. ✅ Comparação com mapeamento em get-devolucoes/index.ts
4. ✅ Verificação do uso em DevolucaoTable e DevolucaoTableRow

---

## 🚨 COLUNAS SEM DADOS - ANÁLISE DETALHADA

### ✅ GRUPO 1: CAMPOS QUE **EXISTEM NA API** MAS ESTÃO MAL MAPEADOS

#### 1. **Variação ID (variation_id)**
- **Status:** ⚠️ **MAPEAMENTO PARCIAL**
- **API ML:** Campo existe em `orders[].variation_id`
- **Banco:** Campo `dados_order.order_items[0].item.variation_id` existe
- **Mapeamento atual:**
  ```typescript
  variation_id: item.dados_order?.order_items?.[0]?.item?.variation_id || null
  ```
- **Problema:** Campo está sendo mapeado corretamente, mas aparece vazio nos dados reais
- **Causa raiz:** Produtos sem variação (variation_id = null é válido)
- **Ação:** ✅ **MANTER COMO ESTÁ** - Campo correto, apenas produtos sem variação

---

#### 2. **Status $ (status_money)**
- **Status:** ✅ **EXISTE NA API ML**
- **API ML:** Campo `status_money` retorna:
  - `retained` - dinheiro retido
  - `refunded` - dinheiro devolvido
  - `available` - dinheiro disponível
- **Banco:** Campo `status_dinheiro` na tabela `devolucoes_avancadas`
- **Mapeamento atual:**
  ```typescript
  status_money: item.status_dinheiro ? { id: item.status_dinheiro } : null
  ```
- **Problema:** Campo `status_dinheiro` não está sendo populado durante sync
- **Causa raiz:** Edge Function `sync-devolucoes` não extrai este campo da API
- **Ação:** 🔧 **CORRIGIR sync-devolucoes** para salvar `status_money` no campo `status_dinheiro`

---

#### 3. **Tipo Recurso (resource_type)**
- **Status:** ✅ **EXISTE NA API ML**
- **API ML:** Campo `resource_type` retorna:
  - `order`
  - `claim`
  - `shipment`
  - `other`
- **Banco:** Campo `return_resource_type` na tabela
- **Mapeamento atual:**
  ```typescript
  resource_type: item.return_resource_type ? { id: item.return_resource_type } : null
  ```
- **Problema:** Campo não está sendo salvo no banco
- **Causa raiz:** Edge Function `sync-devolucoes` não extrai este campo
- **Ação:** 🔧 **CORRIGIR sync-devolucoes** para salvar `resource_type`

---

#### 4. **Tipo Envio (shipment_type)**
- **Status:** ✅ **EXISTE NA API ML**
- **API ML:** Campo `shipment.type` retorna:
  - `return` - envio ao vendedor
  - `return_from_triage` - envio ao depósito para revisão
- **Banco:** Campo `tipo_envio_devolucao`
- **Mapeamento atual:**
  ```typescript
  shipment_type: item.tipo_envio_devolucao || null
  ```
- **Problema:** Campo não está sendo populado
- **Causa raiz:** Edge Function não extrai `shipment.type`
- **Ação:** 🔧 **CORRIGIR sync-devolucoes**

---

#### 5. **Destino (shipment_destination)**
- **Status:** ✅ **EXISTE NA API ML**
- **API ML:** Campo `shipment.destination.name` retorna:
  - `seller_address` - endereço do vendedor
  - `warehouse` - depósito ML
  - `shipping_address` - endereço de envio
- **Banco:** Campo `destino_devolucao`
- **Mapeamento atual:**
  ```typescript
  shipment_destination: item.destino_devolucao || null
  ```
- **Problema:** Campo não populado
- **Causa raiz:** Edge Function não extrai `shipment.destination.name`
- **Ação:** 🔧 **CORRIGIR sync-devolucoes**

---

#### 6. **⏰ Prazo Limite (delivery_limit)**
- **Status:** ⚠️ **MAPEAMENTO PARCIAL**
- **API ML:** Campo não documentado claramente, mas existe em `estimated_schedule_limit`
- **Banco:** Campo `dados_lead_time.delivery_limit`
- **Mapeamento atual:**
  ```typescript
  delivery_limit: item.dados_lead_time?.delivery_limit || null
  ```
- **Problema:** Campo JSONB vazio ou mal estruturado
- **Causa raiz:** Edge Function não salva `dados_lead_time` corretamente
- **Ação:** 🔧 **CORRIGIR sync-devolucoes** para extrair prazos

---

#### 7. **💰 Reembolso (refund_at)**
- **Status:** ✅ **EXISTE NA API ML**
- **API ML:** Campo `shipment.refund_at` retorna:
  - `shipped` - ao enviar
  - `delivered` - 3 dias após recebimento
  - `n/a` - casos de baixo custo
- **Banco:** Campo `dados_refund_info.when` e `reembolso_quando`
- **Mapeamento atual:**
  ```typescript
  refund_at: item.dados_refund_info?.when || 
             item.dados_refund_info?.refund_at || 
             item.reembolso_quando || null
  ```
- **Problema:** Campos JSONB vazios
- **Causa raiz:** Edge Function não extrai `shipment.refund_at`
- **Ação:** 🔧 **CORRIGIR sync-devolucoes**

---

#### 8. **Condição Produto (product_condition)**
- **Status:** ✅ **EXISTE NA API ML - ENDPOINT /reviews**
- **API ML:** Campo `reviews[].resource_reviews[].product_condition` retorna:
  - `saleable` - vendável
  - `discard` - descartado
  - `unsaleable` - não vendável
  - `missing` - não chegou
- **Banco:** Campo `dados_product_condition.status`
- **Mapeamento atual:**
  ```typescript
  product_condition: item.dados_product_condition?.status || null
  ```
- **Problema:** Requer chamada adicional à API `/returns/{id}/reviews`
- **Causa raiz:** Edge Function `enrich-devolucoes` não busca review data
- **Ação:** 🔧 **ADICIONAR chamada a /reviews no enrich-devolucoes**

---

#### 9. **Destino Produto (product_destination)**
- **Status:** ✅ **EXISTE NA API ML - ENDPOINT /reviews**
- **API ML:** Campo `reviews[].resource_reviews[].product_destination` retorna:
  - `meli` - para o ML
  - `buyer` - para comprador
  - `seller` - para vendedor
- **Banco:** Campo `dados_product_condition.destination`
- **Mapeamento atual:**
  ```typescript
  product_destination: item.dados_product_condition?.destination || null
  ```
- **Problema:** Requer chamada adicional à API `/reviews`
- **Ação:** 🔧 **ADICIONAR chamada a /reviews no enrich-devolucoes**

---

#### 10. **Status Review (review_status)**
- **Status:** ✅ **EXISTE NA API ML - ENDPOINT /reviews**
- **API ML:** Campo `reviews[].resource_reviews[].status` retorna:
  - `success` - produto OK
  - `failed` - produto com problema
  - `null` - sem revisão
- **Banco:** Campo `review_status` e `dados_review.status`
- **Mapeamento atual:**
  ```typescript
  review_status: item.review_status || item.dados_review?.status || null
  ```
- **Problema:** Requer chamada adicional à API `/reviews`
- **Ação:** 🔧 **ADICIONAR chamada a /reviews no enrich-devolucoes**

---

#### 11. **Atraso? (has_delay)**
- **Status:** ⚠️ **CAMPO CALCULADO**
- **API ML:** Não existe, precisa ser calculado
- **Mapeamento atual:**
  ```typescript
  has_delay: item.has_delay || false  // ❌ Sempre false!
  ```
- **Problema:** Campo hardcoded como `false`
- **Causa raiz:** Não implementado cálculo de atraso
- **Ação:** 🔧 **IMPLEMENTAR lógica de cálculo** comparando `delivery_limit` com data atual

---

#### 12. **MPT (método de revisão?)**
- **Status:** ❓ **NÃO IDENTIFICADO**
- **API ML:** Não encontrado na documentação
- **Problema:** Não identificado o que significa "MPT"
- **Ação:** ❓ **ESCLARECER com usuário** o que é este campo

---

#### 13. **Reviews (review_info)**
- **Status:** ✅ **EXISTE NA API ML - ENDPOINT /reviews**
- **API ML:** Endpoint `/returns/{id}/reviews` retorna objeto completo
- **Banco:** Campo JSONB `dados_review`
- **Mapeamento atual:**
  ```typescript
  review_info: item.dados_review || {
    id: item.review_id || null,
    status: item.review_status || null,
    result: item.review_result || null
  }
  ```
- **Problema:** Campo JSONB vazio
- **Causa raiz:** Edge Function não busca dados de `/reviews`
- **Ação:** 🔧 **ADICIONAR chamada a /reviews no enrich-devolucoes**

---

#### 14. **Reembolso Após (refund_at já analisado acima)**
- Mesmo que item 7

---

#### 15. **🎬 Ações Disponíveis (available_actions)**
- **Status:** ✅ **EXISTE NA API ML**
- **API ML:** Campo `available_actions` dentro de `players[]`
- **Banco:** Campo JSONB `dados_available_actions` e `dados_acoes_disponiveis`
- **Mapeamento atual:**
  ```typescript
  available_actions: item.dados_available_actions || item.dados_acoes_disponiveis || {}
  ```
- **Problema:** Campo JSONB vazio
- **Causa raiz:** Edge Function não extrai `players[].available_actions`
- **Ação:** 🔧 **CORRIGIR sync-devolucoes**

---

### ❌ GRUPO 2: CAMPOS QUE **NÃO EXISTEM NA API ML**

#### 16. **🔍 Revisão (coluna genérica)**
- **Status:** ❌ **NÃO EXISTE COMO CAMPO ÚNICO**
- **API ML:** Existe endpoint `/reviews` separado com múltiplos campos
- **Problema:** Coluna muito vaga
- **Ação:** ✅ **REMOVER** ou substituir por campos específicos (product_condition, review_status)

---

#### 17. **💬 Comunicação (coluna genérica)**
- **Status:** ❌ **NÃO EXISTE COMO CAMPO ÚNICO**
- **API ML:** Existe endpoint `/messages` separado
- **Banco:** Campo `dados_comunicacao` com mensagens
- **Problema:** Coluna muito genérica
- **Ação:** ✅ **REMOVER** - já existem colunas específicas (Msgs Não Lidas, Última Msg, etc.)

---

## 📊 RESUMO EXECUTIVO

### Campos com dados disponíveis na API ML mas não mapeados:
1. ✅ `status_money` - **CORRIGIR sync**
2. ✅ `resource_type` - **CORRIGIR sync**
3. ✅ `shipment_type` - **CORRIGIR sync**
4. ✅ `shipment_destination` - **CORRIGIR sync**
5. ✅ `delivery_limit` - **CORRIGIR sync (dados_lead_time)**
6. ✅ `refund_at` - **CORRIGIR sync (shipment.refund_at)**
7. ✅ `product_condition` - **ADICIONAR /reviews no enrich**
8. ✅ `product_destination` - **ADICIONAR /reviews no enrich**
9. ✅ `review_status` - **ADICIONAR /reviews no enrich**
10. ✅ `review_info` - **ADICIONAR /reviews no enrich**
11. ✅ `available_actions` - **CORRIGIR sync (players.available_actions)**

### Campos calculados que precisam implementação:
12. ⚠️ `has_delay` - **IMPLEMENTAR lógica de cálculo**

### Campos a REMOVER da tabela:
13. ❌ `🔍 Revisão` (genérico) - **REMOVER**
14. ❌ `💬 Comunicação` (genérico) - **REMOVER**
15. ❓ `MPT` - **ESCLARECER significado**

### Campos corretos (vazios por natureza dos dados):
16. ✅ `variation_id` - Produtos sem variação retornam null corretamente

---

## 🔧 PLANO DE CORREÇÃO

### PRIORIDADE 1 - Corrigir sync-devolucoes
```typescript
// Adicionar extração de campos faltantes:
- status_money (de dados_return.status_money)
- resource_type (de dados_return.resource_type)
- shipment_type (de dados_return.shipment.type)
- shipment_destination (de dados_return.shipment.destination.name)
- refund_at (de dados_return.shipment.refund_at)
- delivery_limit (de dados_return.estimated_schedule_limit)
- available_actions (de dados_claim.players[seller].available_actions)
```

### PRIORIDADE 2 - Adicionar endpoint /reviews no enrich-devolucoes
```typescript
// Para cada devolução com related_entities.includes('reviews'):
const reviews = await fetchReviews(return_id);
// Salvar em:
- dados_review (JSONB completo)
- dados_product_condition (extrair product_condition + product_destination)
- review_status (extrair status)
```

### PRIORIDADE 3 - Implementar cálculo de atraso
```typescript
// Calcular has_delay comparando:
if (delivery_limit && new Date(delivery_limit) < new Date()) {
  has_delay = true;
}
```

### PRIORIDADE 4 - Limpar colunas inúteis
- Remover coluna "🔍 Revisão" (genérica)
- Remover coluna "💬 Comunicação" (genérica)
- Esclarecer significado de "MPT" ou remover

---

## ✅ CONCLUSÃO

**Total de campos analisados:** 17  
**Campos com correção viável:** 11 (65%)  
**Campos a remover:** 3 (18%)  
**Campos a esclarecer:** 1 (6%)  
**Campos corretos:** 2 (12%)

**Próximos passos:**
1. Corrigir Edge Function `sync-devolucoes` para extrair 7 campos
2. Adicionar chamada a `/reviews` no `enrich-devolucoes` para 4 campos
3. Implementar cálculo de `has_delay`
4. Remover colunas genéricas da tabela
5. Esclarecer significado de "MPT" com usuário
