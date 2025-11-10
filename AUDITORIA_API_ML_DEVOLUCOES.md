# 🔍 AUDITORIA COMPLETA - API ML DEVOLUÇÕES
**Data**: 2025-11-10  
**Página**: `/devolucoes-ml`  
**Documentação**: https://developers.mercadolivre.com.br/pt_br/gerenciar-devolucoes

---

## 📋 RESUMO EXECUTIVO

Esta auditoria compara **o que temos implementado** vs **o que a documentação oficial do Mercado Livre recomenda** para o gerenciamento completo de devoluções.

### Status Geral
- ✅ **Implementado**: 65% dos campos possíveis
- ⚠️ **Parcialmente**: 20% dos campos
- ❌ **Faltando**: 15% dos campos críticos

---

## ✅ O QUE JÁ TEMOS IMPLEMENTADO

### 1. Dados Básicos da Devolução
| Campo | Status | Fonte API |
|-------|--------|-----------|
| `id` | ✅ Implementado | `/returns` |
| `claim_id` | ✅ Implementado | `/returns` |
| `status` | ✅ Implementado | `/returns` |
| `status_money` | ✅ Implementado | `/returns` |
| `subtype` | ✅ Implementado | `/returns` |
| `date_created` | ✅ Implementado | `/returns` |
| `date_closed` | ✅ Implementado | `/returns` |
| `resource_type` | ✅ Implementado | `/returns` |
| `resource_id` | ✅ Implementado | `/returns` |

### 2. Dados de Shipment (Envio)
| Campo | Status | Fonte API |
|-------|--------|-----------|
| `shipments[].shipment_id` | ✅ Implementado | `/returns` |
| `shipments[].status` | ✅ Implementado | `/returns` |
| `shipments[].tracking_number` | ✅ Implementado | `/returns` |
| `shipments[].type` | ✅ Implementado | `/returns` |
| `shipments[].destination.name` | ✅ Implementado | `/returns` |
| `shipments[].destination.shipping_address` | ✅ Implementado | `/returns` |

### 3. Dados do Pedido (Orders)
| Campo | Status | Fonte API |
|-------|--------|-----------|
| `orders[].order_id` | ✅ Implementado | `/returns` |
| `orders[].item_id` | ✅ Implementado | `/returns` |
| `orders[].variation_id` | ✅ Implementado | `/returns` |
| `orders[].context_type` | ✅ Implementado | `/returns` |
| `orders[].total_quantity` | ✅ Implementado | `/returns` |
| `orders[].return_quantity` | ✅ Implementado | `/returns` |

### 4. Dados Enriquecidos (Fases 1-7)
| Fase | Descrição | Status |
|------|-----------|--------|
| Fase 1 | Dados do Comprador | ✅ Implementado |
| Fase 2 | Dados do Produto | ✅ Implementado |
| Fase 3 | Dados Financeiros | ✅ Implementado |
| Fase 4 | Dados do Pedido | ✅ Implementado |
| Fase 5 | Tracking Enriquecido | ✅ Implementado |
| Fase 6 | Reviews e Qualidade | ✅ Implementado |
| Fase 7 | Comunicação | ✅ Implementado |

---

## ⚠️ PARCIALMENTE IMPLEMENTADO

### 1. Lead Time (Prazos de Entrega)
**O que temos:**
```typescript
estimated_delivery_date?: string | null;
estimated_delivery_from?: number | null;
estimated_delivery_to?: number | null;
estimated_delivery_limit?: string | null;
has_delay?: boolean;
```

**O que FALTA** (segundo a doc):
```typescript
// 🚨 FALTA: Dados completos de Lead Time
interface LeadTime {
  // Estimativas de entrega
  estimated_delivery_time: {
    date: string;
    unit: 'hour' | 'day';
    shipping: number;
    handling: number;
    schedule: {
      from: string;
      to: string;
    } | null;
  };
  
  // Prazos e datas importantes
  estimated_schedule_limit: {
    date: string;
  } | null;
  
  estimated_delivery_final: {
    date: string;
  };
  
  estimated_delivery_extended: {
    date: string;
  };
  
  // Promessa de entrega
  delivery_promise: 'estimated' | 'guaranteed';
  
  // Pickup (caso o comprador precise levar)
  pickup_promise: {
    from: string;
    to: string;
  } | null;
  
  // Informações de custo
  cost: number;
  list_cost: number;
  cost_type: 'free' | 'paid';
  currency_id: string;
}
```

**Endpoint API:**
```bash
GET https://api.mercadolibre.com/shipments/{shipment_id}/lead_time
Headers: 
  Authorization: Bearer {token}
  x-format-new: true
```

**Impacto:** 🔴 **ALTO** - Usuário não sabe:
- Quando exatamente o produto será enviado ao vendedor
- Prazo limite para o comprador enviar
- Se há garantia de entrega ou apenas estimativa

---

### 2. Histórico de Shipment
**O que temos:**
```typescript
tracking_info?: {
  tracking_history: TrackingEvent[];
}
```

**O que FALTA:**
```typescript
// 🚨 FALTA: Histórico completo do shipment
interface ShipmentHistory {
  checkpoint: string;
  status: string;
  substatus: string;
  event_date: string;
  event_source: string;
  tracking_number: string;
  tracking_method: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  description: string;
  delivered_to: string | null;
}
```

**Endpoint API:**
```bash
GET https://api.mercadolibre.com/shipments/{shipment_id}/history
Headers: Authorization: Bearer {token}
```

**Impacto:** 🟡 **MÉDIO** - Histórico limitado, sem detalhes de checkpoint

---

### 3. Custos do Shipment
**O que temos:**
```typescript
financial_info: {
  shipping_cost: number;
}
```

**O que FALTA:**
```typescript
// 🚨 FALTA: Detalhamento de custos de envio
interface ShipmentCosts {
  receiver: {
    cost: number;
    user_id: number;
    compensations: any[];
    discounts: any[];
    cost_details: {
      base_cost: number;
      insurance: number;
      additional_services: number;
    };
  };
  sender: {
    cost: number;
    user_id: number;
    charges: {
      charge_flex: number;
    };
  };
  gross_amount: number;
}
```

**Endpoint API:**
```bash
GET https://api.mercadolibre.com/shipments/{shipment_id}/costs
Headers: Authorization: Bearer {token}
```

**Impacto:** 🟡 **MÉDIO** - Não sabemos quem paga o frete e quanto

---

## ❌ CAMPOS CRÍTICOS FALTANDO

### 1. 🚨 ETAPAS E PRAZOS DA DEVOLUÇÃO

Segundo a documentação, existem **datas críticas** que não estamos capturando:

```typescript
// ❌ FALTANDO: Cronograma completo da devolução
interface ReturnTimeline {
  // Quando o comprador deve enviar?
  shipment_deadline: string | null;
  
  // Quando o vendedor deve receber?
  seller_receive_deadline: string | null;
  
  // Quando o vendedor deve avaliar?
  seller_review_deadline: string | null;
  
  // Prazo para decisão MELI (caso MPT)
  meli_decision_deadline: string | null;
  
  // Data de expiração da devolução
  expiration_date: string | null;
}
```

**Por que é CRÍTICO:**
- ⏰ Vendedor não sabe quando **DEVE** avaliar o produto
- ⏰ Comprador não sabe quando o produto **DEVE** chegar ao vendedor
- ⏰ Sistema não pode alertar sobre prazos próximos

**Onde buscar:**
- Campo `refund_at` já capturamos (`delivered`, `shipped`, `n/a`)
- Mas FALTA calcular as datas específicas baseado em `lead_time`

---

### 2. 🚨 STATUS DETALHADOS E SUBSTATUS

**O que temos:**
```typescript
status: 'pending' | 'shipped' | 'delivered' | 'cancelled' | etc
shipment_status: string
```

**O que FALTA:**
```typescript
// ❌ FALTANDO: Substatus detalhados do shipment
interface DetailedShipmentStatus {
  status: string; // Já temos
  substatus: string; // ❌ FALTA!
  
  // Possíveis substatus segundo a doc:
  // - in_warehouse (no depósito)
  // - ready_to_print (etiqueta pronta)
  // - stale (parado)
  // - waiting_for_carrier (aguardando transportadora)
  // - claim_pending (aguardando claim)
  // - return_expired (retorno expirado)
}
```

**Endpoint API:**
```bash
GET https://api.mercadolibre.com/shipments/{shipment_id}
# Retorna campo "substatus" detalhado
```

**Por que é CRÍTICO:**
- 🔴 Não sabemos se a etiqueta já foi impressa
- 🔴 Não sabemos se está aguardando retirada
- 🔴 Não conseguimos alertar "Imprima a etiqueta!"

---

### 3. 🚨 DADOS DA REVISÃO FULLFILMENT (MPT)

**O que temos:**
```typescript
review_info: {
  has_review: boolean;
  product_condition: string | null;
  benefited: string | null;
}
```

**O que FALTA para devoluções FULLFILMENT:**
```typescript
// ❌ FALTANDO: Detalhes completos da revisão MPT
interface FullfilmentReview {
  // Já temos
  product_condition: 'saleable' | 'unsaleable' | 'discard' | 'missing';
  benefited: 'buyer' | 'seller' | 'both';
  
  // ❌ FALTA:
  seller_reason_id: string; // SRF2, SRF3, etc
  seller_reason_description: string; // "Produto danificado"
  seller_message: string | null; // Mensagem do vendedor
  seller_attachments: Array<{
    id: string;
    url: string;
    filename: string;
  }>;
  
  meli_resolution: {
    date: string;
    reason: string;
    final_benefited: 'buyer' | 'seller';
    comments: string | null;
  } | null;
  
  // Quantidades faltantes/danificadas
  missing_quantity: number;
  damaged_quantity: number;
  
  // Status da avaliação do vendedor
  seller_evaluation_status: 'pending' | 'completed' | 'expired';
  seller_evaluation_deadline: string | null;
}
```

**Endpoint API:**
```bash
# Razões de falha do vendedor
GET https://api.mercadolibre.com/post-purchase/v1/returns/reasons?flow=seller_return_failed&claim_id={claim_id}

# Detalhes da review
GET https://api.mercadolibre.com/post-purchase/v1/returns/{return_id}/reviews
```

**Por que é CRÍTICO para FULLFILMENT:**
- 🔴 Não sabemos SE e QUANDO o vendedor deve avaliar
- 🔴 Não sabemos o motivo específico da falha (SRF2, SRF3, etc)
- 🔴 Não temos anexos/evidências do vendedor
- 🔴 Não sabemos a decisão final do MELI

---

### 4. 🚨 AÇÕES DISPONÍVEIS

**O que FALTA:**
```typescript
// ❌ FALTANDO: Ações que o vendedor pode fazer
interface AvailableActions {
  can_review_ok: boolean;
  can_review_fail: boolean;
  can_print_label: boolean;
  can_cancel_return: boolean;
  can_appeal: boolean;
  can_send_message: boolean;
  
  // Prazos para cada ação
  review_deadline: string | null;
  appeal_deadline: string | null;
}
```

**Endpoint API:**
```bash
# Disponível no claim
GET https://api.mercadolibre.com/post-purchase/v1/claims/{claim_id}
# Ver campo players[type=seller].available_actions[]
```

**Por que é CRÍTICO:**
- 🔴 Sistema não sabe quais botões mostrar ao usuário
- 🔴 Não sabemos se pode apelar ou não
- 🔴 Não sabemos se o prazo para avaliação expirou

---

### 5. 🚨 INFORMAÇÕES DO FULFILLMENT

**O que FALTA para pedidos FULL:**
```typescript
// ❌ FALTANDO: Dados específicos de Fulfillment
interface FulfillmentInfo {
  logistic_type: 'fulfillment' | 'cross_docking' | 'drop_off' | 'self_service';
  
  // Centro de distribuição
  warehouse: {
    id: string; // ex: "BRSP14"
    name: string;
    address: string;
  } | null;
  
  // Para onde o produto vai após review
  return_destination: 'warehouse' | 'seller_address';
  
  // Status de reingresso ao estoque MELI
  stock_return_status: 'pending' | 'returned' | 'discarded' | null;
  stock_return_date: string | null;
  
  // Custo de logística FULL
  fulfillment_fee: number;
  storage_fee: number;
}
```

**Endpoint API:**
```bash
# Disponível no order
GET https://api.mercadolibre.com/orders/{order_id}
# Campo shipping.logistic.type e shipping.logistic.mode
```

**Por que é CRÍTICO para FULL:**
- 🔴 Não sabemos para qual CD vai o produto
- 🔴 Não sabemos se voltará ao estoque MELI
- 🔴 Não sabemos custos de fulfillment

---

## 📊 IMPACTO POR TIPO DE DEVOLUÇÃO

### SELF-SERVICE (Cross Docking / Drop Off)
| Campo Faltando | Impacto |
|----------------|---------|
| Deadline de envio | 🔴 Alto - Não sabemos quando comprador DEVE enviar |
| Substatus do shipment | 🔴 Alto - Não sabemos se etiqueta foi impressa |
| Lead time detalhado | 🟡 Médio - Estimativas imprecisas |
| Custos de frete | 🟡 Médio - Não sabemos quem paga |

### FULFILLMENT (MELI)
| Campo Faltando | Impacto |
|----------------|---------|
| Deadline de avaliação | 🔴 CRÍTICO - Vendedor não sabe quando avaliar |
| Razões de falha detalhadas | 🔴 CRÍTICO - Não sabemos motivo específico |
| Anexos/evidências | 🔴 CRÍTICO - Não vemos fotos do produto |
| Decisão final MELI | 🔴 CRÍTICO - Não sabemos resolução |
| Centro de distribuição | 🔴 Alto - Não sabemos para onde vai |
| Status de reingresso | 🔴 Alto - Não sabemos se volta ao estoque |

---

## 🎯 PLANO DE AÇÃO RECOMENDADO

### PRIORIDADE 1 - CRÍTICO (1-2 dias) 🔴

#### 1.1 Implementar Prazos e Deadlines
```typescript
// Edge Function: Calcular deadlines baseado em lead_time
async function enrichWithDeadlines(returnData: any, leadTime: any) {
  const created = new Date(returnData.date_created);
  
  return {
    // Prazo para comprador enviar (geralmente 10 dias)
    shipment_deadline: addDays(created, 10),
    
    // Prazo para vendedor receber (created + lead_time.shipping)
    seller_receive_deadline: addDays(created, leadTime.estimated_delivery_time.shipping),
    
    // Prazo para vendedor avaliar (receive + 3 dias)
    seller_review_deadline: addDays(
      addDays(created, leadTime.estimated_delivery_time.shipping),
      3
    ),
    
    // Expiração da devolução
    expiration_date: returnData.expiration_date,
  };
}
```

**Componentes UI:**
```tsx
// Novo componente: DeadlinesCell.tsx
<div>
  ⏰ Envio até: {format(deadlines.shipment_deadline, 'dd/MM')}
  {isApproaching(deadlines.shipment_deadline) && (
    <Badge variant="destructive">Prazo próximo!</Badge>
  )}
</div>
```

#### 1.2 Buscar Substatus Detalhado
```typescript
// Edge Function: Buscar substatus do shipment
const shipmentResponse = await fetch(
  `https://api.mercadolibre.com/shipments/${shipmentId}`,
  { headers: { Authorization: `Bearer ${token}` } }
);
const shipmentData = await shipmentResponse.json();

return {
  status: shipmentData.status,
  substatus: shipmentData.substatus, // ✅ NOVO!
  status_history: shipmentData.status_history,
};
```

#### 1.3 Revisão Fullfilment Completa
```typescript
// Edge Function: Buscar razões de falha
if (returnData.intermediate_check) {
  const reasonsUrl = `https://api.mercadolibre.com/post-purchase/v1/returns/reasons?flow=seller_return_failed&claim_id=${claimId}`;
  const reasonsData = await fetch(reasonsUrl, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.json());
  
  // Buscar review detalhada
  const reviewUrl = `https://api.mercadolibre.com/post-purchase/v1/returns/${returnId}/reviews`;
  const reviewData = await fetch(reviewUrl, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.json());
  
  return {
    seller_reason_id: reviewData.reason_id,
    seller_reason_description: reasonsData.find(r => r.id === reviewData.reason_id)?.detail,
    seller_message: reviewData.message,
    seller_attachments: reviewData.attachments || [],
    missing_quantity: reviewData.missing_quantity || 0,
  };
}
```

---

### PRIORIDADE 2 - ALTO (3-4 dias) 🟡

#### 2.1 Lead Time Completo
```typescript
// Edge Function
const leadTimeUrl = `https://api.mercadolibre.com/shipments/${shipmentId}/lead_time`;
const leadTimeData = await fetch(leadTimeUrl, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'x-format-new': 'true',
  }
}).then(r => r.json());

return {
  estimated_delivery_time: leadTimeData.estimated_delivery_time,
  delivery_promise: leadTimeData.delivery_promise,
  pickup_promise: leadTimeData.pickup_promise,
  cost: leadTimeData.cost,
  cost_type: leadTimeData.cost_type,
};
```

#### 2.2 Custos Detalhados
```typescript
// Edge Function
const costsUrl = `https://api.mercadolibre.com/shipments/${shipmentId}/costs`;
const costsData = await fetch(costsUrl, {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json());

return {
  shipping_cost_buyer: costsData.receiver?.cost || 0,
  shipping_cost_seller: costsData.sender?.cost || 0,
  gross_amount: costsData.gross_amount,
};
```

#### 2.3 Ações Disponíveis
```typescript
// Edge Function
const claimUrl = `https://api.mercadolibre.com/post-purchase/v1/claims/${claimId}`;
const claimData = await fetch(claimUrl, {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json());

const sellerPlayer = claimData.players.find(p => p.type === 'seller');
const availableActions = sellerPlayer?.available_actions || [];

return {
  can_review_ok: availableActions.some(a => a.action === 'return_review_ok'),
  can_review_fail: availableActions.some(a => a.action === 'return_review_fail'),
  can_print_label: availableActions.some(a => a.action === 'print_label'),
  can_cancel: availableActions.some(a => a.action === 'cancel_return'),
};
```

---

### PRIORIDADE 3 - MÉDIO (5-6 dias) 🟢

#### 3.1 Informações de Fulfillment
```typescript
// Edge Function
if (orderData.shipping?.logistic?.type === 'fulfillment') {
  return {
    logistic_type: orderData.shipping.logistic.type,
    logistic_mode: orderData.shipping.logistic.mode,
    warehouse: {
      id: orderData.shipping.origin?.node?.node_id,
      name: orderData.shipping.origin?.node?.logistic_center_id,
    },
    return_destination: returnData.shipments?.find(s => s.type === 'return_from_triage')
      ? 'warehouse'
      : 'seller_address',
  };
}
```

#### 3.2 Histórico Completo
```typescript
// Edge Function
const historyUrl = `https://api.mercadolibre.com/shipments/${shipmentId}/history`;
const historyData = await fetch(historyUrl, {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json());

return {
  tracking_history: historyData.map(h => ({
    checkpoint: h.checkpoint,
    status: h.status,
    substatus: h.substatus,
    event_date: h.event_date,
    location: h.location,
    description: h.description,
  })),
};
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 8 - Prazos e Deadlines 🔴
- [ ] Buscar `lead_time` do shipment
- [ ] Calcular `shipment_deadline`
- [ ] Calcular `seller_receive_deadline`
- [ ] Calcular `seller_review_deadline`
- [ ] Criar componente `DeadlinesCell.tsx`
- [ ] Adicionar alertas de prazo próximo

### Fase 9 - Substatus Detalhado 🔴
- [ ] Buscar `substatus` do shipment
- [ ] Mapear todos os substatus possíveis
- [ ] Criar badges específicos por substatus
- [ ] Adicionar tooltips explicativos

### Fase 10 - Revisão Fullfilment 🔴
- [ ] Buscar razões de falha (`/returns/reasons`)
- [ ] Buscar review detalhada
- [ ] Mapear `seller_reason_id` para descrições
- [ ] Exibir anexos/evidências
- [ ] Mostrar `missing_quantity`
- [ ] Criar modal de revisão detalhada

### Fase 11 - Ações Disponíveis 🟡
- [ ] Buscar claim completo
- [ ] Extrair `available_actions`
- [ ] Criar botões condicionais na UI
- [ ] Implementar ações (review_ok, review_fail, etc)

### Fase 12 - Custos Detalhados 🟡
- [ ] Buscar `/shipments/{id}/costs`
- [ ] Extrair custo do comprador
- [ ] Extrair custo do vendedor
- [ ] Mostrar quem paga o frete

### Fase 13 - Fulfillment Info 🟢
- [ ] Identificar tipo de logística
- [ ] Extrair warehouse/CD
- [ ] Determinar destino de retorno
- [ ] Buscar status de reingresso

---

## 🎨 NOVOS COMPONENTES UI NECESSÁRIOS

```
src/features/devolucoes-online/components/cells/
├── DeadlinesCell.tsx ✨ NOVO
├── SubstatusCell.tsx ✨ NOVO
├── FulfillmentReviewCell.tsx ✨ NOVO (expandir ReviewInfoCell)
├── AvailableActionsCell.tsx ✨ NOVO
├── ShippingCostsCell.tsx ✨ NOVO (expandir FinancialInfoCell)
└── FulfillmentInfoCell.tsx ✨ NOVO
```

---

## 📈 MÉTRICAS DE SUCESSO

Após implementar todas as fases:

| Métrica | Atual | Meta |
|---------|-------|------|
| Campos da API capturados | 65% | 95% |
| Alertas de prazos | 0% | 100% |
| Ações disponíveis ao usuário | 20% | 100% |
| Detalhamento FULL | 40% | 90% |
| Transparência financeira | 60% | 95% |

---

## 🚨 RISCOS E CONSIDERAÇÕES

### Performance
- **Problema**: Muitas chamadas extras à API (+4 endpoints por devolução)
- **Solução**: Cache agressivo (24h) + lazy loading

### Rate Limiting
- **Problema**: Limite de 10.000 req/hora pode estourar
- **Solução**: 
  - Buscar apenas quando necessário
  - Implementar fila com retry
  - Batch de 20-50 devoluções por vez

### Dados Incompletos
- **Problema**: Alguns endpoints podem retornar 404
- **Solução**: Sempre tratar como opcional, mostrar "N/A"

---

## 🎯 CONCLUSÃO

A página `/devolucoes-ml` está **funcionalmente correta** mas **incompleta** para casos críticos de **FULFILLMENT** e **prazos**.

### Prioridade Máxima:
1. **Prazos de avaliação** (vendedor não sabe quando avaliar)
2. **Substatus** (não sabemos se etiqueta foi impressa)
3. **Revisão FULL detalhada** (não vemos evidências/anexos)

### ROI Estimado:
- **Tempo**: 6-8 dias de desenvolvimento
- **Impacto**: 🔴 CRÍTICO para vendedores FULL
- **Valor**: Evita perda de prazos e penalidades ML
