# 🔍 ENDPOINTS ADICIONAIS DA API ML NECESSÁRIOS

**Data:** 2025-11-12  
**Objetivo:** Identificar quais endpoints adicionais da API do Mercado Livre precisam ser chamados para popular todas as colunas da página /devolucoes-ml.

---

## ✅ ENDPOINTS JÁ IMPLEMENTADOS

| Endpoint | Dados Retornados | Status |
|----------|------------------|--------|
| `/post-purchase/v1/claims/search` | Lista básica de claims | ✅ OK |
| `/orders/{order_id}` | Dados completos do pedido (buyer, payments, shipping, items) | ✅ OK |
| `/post-purchase/v1/claims/{claim_id}/messages` | Mensagens do claim | ✅ OK |
| `/post-purchase/v2/claims/{claim_id}/returns` | Dados de devolução (return_details_v2) | ✅ OK |
| `/post-purchase/v1/returns/{return_id}/reviews` | Reviews do return | ✅ OK |
| `/items/{item_id}` | Dados do produto (thumbnail, sku, preço) | ✅ OK |
| `/orders/{order_id}/billing_info` | CPF/CNPJ do comprador | ✅ OK |
| `/users/{seller_id}` | Reputação do vendedor (power_seller, mercado_lider) | ✅ OK |
| `/shipments/{shipment_id}` | Histórico de rastreamento (via ShipmentHistoryService) | ✅ OK |

---

## ❌ ENDPOINTS FALTANTES (NECESSÁRIOS)

### 1. **Change Details (Detalhes de Troca)**
**Endpoint:** `GET /post-purchase/v1/claims/{claim_id}/change_details`  
**Quando usar:** Quando o claim é do tipo "change" (troca)  
**Dados necessários:**
- `produto_troca_id` - ID do novo produto na troca
- `novo_pedido_id` - ID do novo pedido gerado pela troca
- `valor_diferenca_troca` - Diferença de valor entre produto original e novo

**Condição:** Chamar apenas se `claim.stage === 'change'` ou `claim.type === 'change'`

```typescript
// Exemplo de implementação
if (claim.stage === 'change' || claim.type === 'change') {
  const changeRes = await fetch(
    `https://api.mercadolibre.com/post-purchase/v1/claims/${claim.id}/change_details`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  );
  if (changeRes.ok) {
    changeDetailsData = await changeRes.json();
  }
}
```

**Campos populados:**
- ✅ `produto_troca_id`
- ✅ `novo_pedido_id`
- ✅ `valor_diferenca_troca`

---

### 2. **Shipment Data (Dados Detalhados do Envio)**
**Endpoint:** `GET /shipments/{shipment_id}`  
**Quando usar:** Para TODOS os claims que têm shipment_id  
**Dados necessários:**
- `shipment_status` - Status atual do envio
- `tracking_events` - Eventos de rastreamento
- `estimated_delivery_limit` - Limite de entrega estimado
- `receiver_address` - Endereço de destino

**Condição:** Já sendo chamado via ShipmentHistoryService, mas precisa mapear mais campos

```typescript
// JÁ IMPLEMENTADO via ShipmentHistoryService
// Precisa apenas mapear mais campos da resposta
```

**Campos populados:**
- ✅ `shipment_status` (de shipment_history_enriched)
- ✅ `tracking_events` (de shipment_history_enriched)
- ✅ `estimated_delivery_limit` (de shipment_history_enriched)
- ✅ `localizacao_atual` (último tracking_event)
- ✅ `status_transporte_atual` (último tracking_event status)

---

### 3. **Claim Attachments (Anexos/Evidências)**
**Endpoint:** `GET /post-purchase/v1/claims/{claim_id}/attachments`  
**Quando usar:** Para TODOS os claims  
**Dados necessários:**
- `anexos_ml` - Array de anexos/evidências do claim
- `total_evidencias` - Contagem total de evidências

**Condição:** Chamar para todos os claims

```typescript
const attachmentsRes = await fetch(
  `https://api.mercadolibre.com/post-purchase/v1/claims/${claim.id}/attachments`,
  { headers: { 'Authorization': `Bearer ${accessToken}` } }
);
if (attachmentsRes.ok) {
  attachmentsData = await attachmentsRes.json();
}
```

**Campos populados:**
- ✅ `total_evidencias` (attachmentsData.length)
- ✅ `anexos_ml` (attachmentsData array completo)

---

### 4. **Resolution Details (Detalhes da Resolução)**
**Endpoint:** INCLUÍDO no claim principal (`claim.resolution`)  
**Quando usar:** Já vem no claim base  
**Dados necessários:**
- `resultado_mediacao` - Resultado da mediação
- `detalhes_mediacao` - Detalhes da resolução

**Condição:** Já disponível em `claim.resolution`, apenas precisa ser mapeado

```typescript
// Já disponível no claim base
const resolution = claim.resolution;
const resultado_mediacao = resolution?.reason || null;
const detalhes_mediacao = resolution?.details || resolution?.comment || null;
```

**Campos populados:**
- ✅ `resultado_mediacao`
- ✅ `detalhes_mediacao`

---

## 🔧 CAMPOS CALCULADOS (NÃO REQUEREM ENDPOINTS)

Estes campos devem ser calculados no backend a partir dos dados já disponíveis:

### 1. **Percentual Reembolsado**
```typescript
percentual_reembolsado = claim.seller_amount && claim.total_amount
  ? (claim.seller_amount / claim.total_amount) * 100
  : null
```

### 2. **Has Delay (Tem Atraso)**
```typescript
has_delay = return_details_v2?.estimated_delivery_date
  ? new Date() > new Date(return_details_v2.estimated_delivery_date)
  : null
```

### 3. **Dias Restantes para Ação**
```typescript
dias_restantes_acao = return_details_v2?.due_date
  ? Math.ceil((new Date(return_details_v2.due_date) - new Date()) / 86400000)
  : null
```

### 4. **Prazo Revisão em Dias**
```typescript
prazo_revisao_dias = return_details_v2?.estimated_handling_limit?.date
  ? Math.ceil((new Date(return_details_v2.estimated_handling_limit.date) - new Date()) / 86400000)
  : null
```

### 5. **Is Pack**
```typescript
is_pack = !!order_data?.pack_id
```

### 6. **Qualidade Comunicação**
```typescript
// Baseado no número de mensagens e tipo de resolução
qualidade_comunicacao = calculateCommunicationQuality(
  claim_messages?.length || 0,
  claim.resolution?.type
)
```

### 7. **Marcos Temporais**
```typescript
marcos_temporais = {
  data_criacao_claim: claim.date_created,
  data_inicio_return: return_details_v2?.date_created,
  data_fechamento_claim: claim.date_closed || return_details_v2?.closed_at,
  data_estimada_entrega: return_details_v2?.estimated_delivery_date
}
```

---

## 📋 PLANO DE IMPLEMENTAÇÃO

### FASE 1: Adicionar Endpoints Faltantes (CRÍTICO)
- [ ] Implementar chamada a `/post-purchase/v1/claims/{claim_id}/change_details` (condicional)
- [ ] Implementar chamada a `/post-purchase/v1/claims/{claim_id}/attachments`
- [ ] Mapear `claim.resolution` para campos de resultado de mediação

### FASE 2: Implementar Campos Calculados
- [ ] Adicionar função `calculatePercentualReembolsado()`
- [ ] Adicionar função `calculateHasDelay()`
- [ ] Adicionar função `calculateDiasRestantesAcao()`
- [ ] Adicionar função `calculatePrazoRevisaoDias()`
- [ ] Adicionar função `calculateMarcosTemporais()`
- [ ] Adicionar função `calculateQualidadeComunicacao()`

### FASE 3: Melhorar Mapeamento de Dados Existentes
- [ ] Extrair mais campos de `shipment_history_enriched`
- [ ] Extrair mais campos de `order_data` (pack_id, cancel_detail)
- [ ] Extrair campos financeiros de `order_data.payments[]`
- [ ] Mapear corretamente campos temporais

---

## ⚡ IMPACTO ESPERADO

**Antes:**
- 6 campos populados (~13%)
- 40 campos vazios (~87%)

**Depois:**
- ~40 campos populados (~87%)
- ~6 campos vazios (~13%)

**Campos que permanecerão vazios:**
- Campos que a API ML não fornece (ex: `timeline_events` se não existir na API)
- Campos que dependem de ações futuras (ex: `usuario_ultima_acao` pode não existir)
