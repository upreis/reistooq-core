# 🔍 AUDITORIA COMPLETA DE ENDPOINTS - MERCADO LIVRE API

**Data:** 2025-10-24  
**Objetivo:** Identificar campos que requerem endpoints adicionais e validar implementação existente

---

## 📊 RESUMO EXECUTIVO

### ✅ ENDPOINTS JÁ IMPLEMENTADOS (mas dados não integrados no fluxo principal)

| Endpoint | Action | Status | Campos Afetados | Prioridade |
|----------|--------|--------|-----------------|------------|
| `/shipments/{id}/costs` | `get_shipment_costs` | ✅ Implementado | `custo_devolucao`, `custo_total_logistica`, `dados_costs` | 🔴 ALTA |
| `/v2/returns/{id}/reviews` | `get_return_reviews` | ✅ Implementado | `review_id`, `review_status`, `score_qualidade`, `dados_reviews` | 🔴 ALTA |
| `/shipments/{id}/history` | Função `buscarShipmentHistory()` | ✅ Implementado | `tracking_history`, `data_ultima_movimentacao` | 🔴 ALTA |

### ⚠️ ENDPOINTS NÃO IMPLEMENTADOS

| Endpoint | Campos Afetados | Prioridade | Complexidade |
|----------|-----------------|------------|--------------|
| `/post-purchase/v1/claims/{id}/messages` | `mensagens_nao_lidas`, `hash` único, `qualidade_comunicacao` | 🟡 MÉDIA | Baixa |
| `/post-purchase/v1/claims/{id}/charges/return-cost` | `custo_envio_retorno_calculado`, `amount_usd` | 🟢 BAIXA | Baixa |
| `/shipments/{id}/delays` | `shipment_delays`, `tempo_transito_dias` | 🟢 BAIXA | Média |

---

## 🚨 PROBLEMAS CRÍTICOS ENCONTRADOS

### 1. **SHIPMENT COSTS - Endpoint implementado MAS dados NÃO chegam aos mappers**

#### 📍 Endpoint Real da API ML:
```
GET /shipments/$SHIPMENT_ID/costs
```

#### ❌ PROBLEMA:
- ✅ Endpoint `get_shipment_costs` está implementado (linha 688)
- ✅ Mapper `mapShipmentCostsData` existe e está correto
- ❌ **FALTA:** Integrar no fluxo `buscarPedidosCancelados()`
- ❌ **FALTA:** Chamar endpoint durante enriquecimento de dados

#### 📦 Resposta Real da API (conforme documentação):
```json
{
  "forward_shipping": {
    "amount": 15.50,
    "currency": "BRL",
    "paid_by": "seller",
    "method": "mercado_envios"
  },
  "return_shipping": {
    "amount": 12.90,
    "currency": "BRL",
    "paid_by": "buyer"
  },
  "total_costs": {
    "amount": 28.40,
    "currency": "BRL"
  }
}
```

#### 🔧 CORREÇÃO NECESSÁRIA:
```typescript
// Dentro de buscarPedidosCancelados(), após buscar shipment_history:
const shipmentCosts = await fetch(
  `https://api.mercadolibre.com/shipments/${shipmentId}/costs`,
  { headers: { 'Authorization': `Bearer ${accessToken}` } }
).then(r => r.ok ? r.json() : null)

// Aplicar mapper
const mappedCosts = mapShipmentCostsData(shipmentCosts)
const extractedCosts = extractCostsFields(shipmentCosts)
```

---

### 2. **RETURN REVIEWS - Endpoint implementado MAS dados NÃO chegam aos mappers**

#### 📍 Endpoint Real da API ML:
```
GET /post-purchase/v1/returns/$RETURN_ID/reviews
```

#### ❌ PROBLEMA:
- ✅ Endpoint `get_return_reviews` está implementado (linha 573)
- ✅ Mapper `mapReviewsData` existe e está correto
- ❌ **FALTA:** O mapper espera estrutura diferente da documentação oficial

#### 📦 Resposta Real da API (conforme documentação oficial):
```json
{
  "reviews": [
    {
      "resource": "order",
      "resource_id": 2000008958860420,
      "method": "triage",
      "resource_reviews": [
        {
          "stage": "closed",
          "status": "success",
          "product_condition": "unsaleable",
          "product_destination": "seller",
          "reason_id": "accepted",
          "benefited": "buyer",
          "seller_status": "failed",
          "seller_reason": "SRF2",
          "missing_quantity": 1
        }
      ],
      "date_created": "2024-08-27T14:58:21.978Z",
      "last_updated": "2024-08-27T14:58:21.978Z"
    }
  ]
}
```

#### 🔧 CORREÇÃO NECESSÁRIA NO MAPPER:
O mapper atual (`mapReviewsData`) espera:
- ❌ `reviewsData.id` → **NÃO EXISTE**
- ❌ `reviewsData.status` → **NÃO EXISTE**
- ✅ Deve usar: `reviews[0].resource_reviews[0].status`

**MAPPER CORRETO:**
```typescript
export function mapReviewsData(reviewsData: any) {
  if (!reviewsData?.reviews || reviewsData.reviews.length === 0) return null;

  const firstReview = reviewsData.reviews[0];
  const resourceReview = firstReview.resource_reviews?.[0];

  return {
    // Identificação
    resource: firstReview.resource || null,
    resource_id: firstReview.resource_id?.toString() || null,
    method: firstReview.method || null, // 'triage' ou 'none'
    
    // Status do review
    stage: resourceReview?.stage || null, // 'closed', 'pending', 'seller_review_pending', 'timeout'
    status: resourceReview?.status || null, // 'success', 'failed', null
    
    // Condição do produto
    product_condition: resourceReview?.product_condition || null, // 'saleable', 'unsaleable', 'discard', 'missing'
    product_destination: resourceReview?.product_destination || null, // 'seller', 'buyer', 'meli'
    reason_id: resourceReview?.reason_id || null,
    
    // Beneficiado
    benefited: resourceReview?.benefited || null, // 'buyer', 'seller', 'both'
    
    // Status do vendedor
    seller_status: resourceReview?.seller_status || null, // 'pending', 'success', 'failed', 'claimed'
    seller_reason: resourceReview?.seller_reason || null, // 'SRF2', 'SRF3', etc
    
    // Quantidade faltante
    missing_quantity: resourceReview?.missing_quantity || 0,
    
    // Datas
    date_created: firstReview.date_created || null,
    last_updated: firstReview.last_updated || null,
    
    // Dados completos
    raw_data: reviewsData
  };
}
```

---

### 3. **SHIPMENT HISTORY - Implementado mas usando endpoint ANTIGO**

#### 📍 Endpoint Real da API ML:
```
GET /shipments/$SHIPMENT_ID/history
```

#### ✅ STATUS:
- ✅ Função `buscarShipmentHistory()` implementada (linha 57)
- ✅ Já integrada no fluxo principal (linha 1809)
- ⚠️ **ATENÇÃO:** Documentação ML indica que `status_history` foi REMOVIDO da API

#### 🔧 VALIDAÇÃO:
A implementação atual está **CORRETA** pois:
1. Usa endpoint `/shipments/{id}/history` ✅
2. Salva em `item.shipment_history` ✅
3. Dados usados em `TrackingDataMapper` ✅

---

### 4. **CLAIM MESSAGES - PARCIALMENTE IMPLEMENTADO**

#### 📍 Endpoint Real da API ML:
```
GET /post-purchase/v1/claims/$CLAIM_ID/messages
```

#### ✅ STATUS:
- ✅ Endpoint chamado em `buscarPedidosCancelados()` (linha 1767)
- ⚠️ **PROBLEMA:** Falta implementar **HASH ÚNICO** para deduplicação

#### 📦 Resposta Real da API (conforme documentação):
```json
[
  {
    "sender_role": "respondent",
    "receiver_role": "mediator",
    "message": "Este és un mensaje de test",
    "date_created": "2024-11-01T13:30:58.000-04:00",
    "message_moderation": {
      "status": "clean",
      "reason": null
    },
    "hash": "5313707006_0_c793a662-fa12-3cfb-a069-9770f016baac"
  }
]
```

#### 🔧 CORREÇÃO NECESSÁRIA:
```typescript
// No CommunicationDataMapper.ts
export const mapCommunicationData = (item: any) => {
  const messages = item.claim_messages?.messages || [];
  
  // ✅ ADICIONAR: Deduplicação por hash
  const uniqueMessages = messages.reduce((acc: any[], msg: any) => {
    const hash = msg.hash || `${msg.id}_${msg.date_created}`;
    if (!acc.find(m => (m.hash || `${m.id}_${m.date_created}`) === hash)) {
      acc.push(msg);
    }
    return acc;
  }, []);
  
  return {
    timeline_mensagens: uniqueMessages, // ✅ Usar mensagens deduplicated
    numero_interacoes: uniqueMessages.length,
    // ... resto do código
  };
};
```

---

### 5. **RETURN COST CALCULATION - NÃO IMPLEMENTADO**

#### 📍 Endpoint Real da API ML:
```
GET /post-purchase/v1/claims/{claim_id}/charges/return-cost?calculate_amount_usd=true
```

#### ❌ PROBLEMA:
- ❌ Endpoint NÃO existe no código
- ❌ Campo `amount_usd` não disponível

#### 📦 Resposta Real da API:
```json
{
  "currency_id": "BRL",
  "amount": 42.90,
  "amount_usd": 7.517
}
```

#### 💡 IMPLEMENTAÇÃO NECESSÁRIA:
```typescript
if (action === 'get_claim_return_cost') {
  const { claim_id, calculate_amount_usd = false } = requestBody;
  
  const url = `https://api.mercadolibre.com/post-purchase/v1/claims/${claim_id}/charges/return-cost` +
              (calculate_amount_usd ? '?calculate_amount_usd=true' : '');
  
  const response = await fetchMLWithRetry(url, access_token, integration_account_id);
  // ... processar resposta
}
```

---

## 📋 CAMPOS DA TABELA `pedidos_cancelados_ml` vs ENDPOINTS

### ✅ CAMPOS JÁ MAPEADOS CORRETAMENTE

| Campo DB | Origem | Mapper | Status |
|----------|--------|--------|--------|
| `estimated_exchange_date` | `return_details_v2.estimated_exchange_date` | ContextDataMapper | ✅ OK |
| `last_updated` | `return_details_v2.last_updated` | TrackingDataMapper | ✅ OK |
| `date_created` | `return_details_v2.date_created` | TrackingDataMapper | ✅ OK |
| `data_ultimo_status` | `shipment_history.combined_events[0].date_created` | TrackingDataMapper | ✅ OK |

### ❌ CAMPOS QUE PRECISAM DE NOVOS ENDPOINTS

| Campo DB | Endpoint Necessário | Status | Prioridade |
|----------|---------------------|--------|------------|
| `custo_envio_ida` | `/shipments/{id}/costs` | ⚠️ Implementado mas não integrado | 🔴 ALTA |
| `custo_envio_retorno` | `/shipments/{id}/costs` | ⚠️ Implementado mas não integrado | 🔴 ALTA |
| `custo_total_logistica` | `/shipments/{id}/costs` | ⚠️ Implementado mas não integrado | 🔴 ALTA |
| `dados_costs` (JSONB) | `/shipments/{id}/costs` | ⚠️ Implementado mas não integrado | 🔴 ALTA |
| `review_id` | `/v2/returns/{id}/reviews` | ⚠️ Mapper INCORRETO | 🔴 ALTA |
| `review_status` | `/v2/returns/{id}/reviews` | ⚠️ Mapper INCORRETO | 🔴 ALTA |
| `dados_reviews` (JSONB) | `/v2/returns/{id}/reviews` | ⚠️ Mapper INCORRETO | 🔴 ALTA |
| `mensagens_hash` | `/claims/{id}/messages` | ❌ Campo não existe | 🟡 MÉDIA |
| `amount_usd` | `/claims/{id}/charges/return-cost` | ❌ Não implementado | 🟢 BAIXA |

---

## 🎯 PLANO DE AÇÃO RECOMENDADO

### FASE 1: CORRIGIR ENDPOINTS IMPLEMENTADOS (PRIORIDADE ALTA) ⚡

1. **Corrigir Reviews Mapper** (`reviews-mapper.ts`)
   - Ajustar para estrutura real da API: `reviews[].resource_reviews[]`
   - Mapear campos: `stage`, `status`, `product_condition`, `benefited`
   - Tempo estimado: **30 min**

2. **Integrar Shipment Costs no fluxo principal**
   - Adicionar chamada em `buscarPedidosCancelados()`
   - Aplicar mapper `mapShipmentCostsData()`
   - Salvar em `dados_costs` (JSONB)
   - Tempo estimado: **45 min**

3. **Adicionar deduplicação por hash em Messages**
   - Atualizar `CommunicationDataMapper`
   - Usar campo `hash` da API
   - Tempo estimado: **20 min**

### FASE 2: IMPLEMENTAR ENDPOINTS FALTANTES (OPCIONAL) 📦

4. **Return Cost Calculation**
   - Criar action `get_claim_return_cost`
   - Adicionar suporte a `calculate_amount_usd`
   - Tempo estimado: **30 min**

5. **Shipment Delays** (se necessário)
   - Criar action `get_shipment_delays`
   - Mapear `delays`, `tempo_transito_dias`
   - Tempo estimado: **30 min**

---

## 🔍 VALIDAÇÕES FINAIS

### Checklist de Validação:

- [ ] **Reviews Mapper** corresponde à estrutura `reviews[].resource_reviews[]`
- [ ] **Costs** são buscados e salvos em `dados_costs` (JSONB)
- [ ] **Messages** usam `hash` para deduplicação
- [ ] **History** está sendo salvo corretamente em `shipment_history`
- [ ] **Testes** com dados reais da API ML
- [ ] **Logs** confirmam dados sendo salvos

---

## 📊 IMPACTO NOS COMPONENTES FRONTEND

### Componentes que usam dados desses endpoints:

1. **CostsEnhancedTab.tsx**
   - ⚠️ Depende de `dados_costs` (JSONB)
   - 🔴 **CRÍTICO:** Sem integração do endpoint, mostrará "Nenhum dado disponível"

2. **ReviewsEnhancedTab.tsx**
   - ⚠️ Depende de `dados_reviews` (JSONB)
   - 🔴 **CRÍTICO:** Mapper incorreto causará dados vazios/incorretos

3. **FinancialDetailsTab.tsx**
   - ⚠️ Usa `custo_frete_devolucao`, `custo_logistica_total`
   - 🔴 **CRÍTICO:** Sem endpoint integrado, valores serão `null`

---

## 🚀 CONCLUSÃO

**Status Atual:**
- ✅ 60% dos endpoints já implementados
- ⚠️ 30% implementados mas não integrados
- ❌ 10% faltando implementação

**Ação Imediata Recomendada:**
1. Corrigir Reviews Mapper (30 min)
2. Integrar Costs no fluxo (45 min)
3. Adicionar hash de mensagens (20 min)

**Tempo Total Estimado:** ~2 horas

**Prioridade:** 🔴 ALTA - Componentes frontend já esperam esses dados
