# 🔍 AUDITORIA DE CAMPOS ESPECÍFICOS - PÁGINA /DEVOLUCOES-ML

**Data:** 2025-01-12  
**Objetivo:** Comparar campos específicos solicitados com documentação oficial da API ML  
**Campos Auditados:** Status, Status Dinheiro, Subtipo, Rastreio, Tipo Logística, Previsão Entrega, Prazo Limite, Status Envio, Motivo, Custos Logística

---

## 📊 COMPARATIVO: IMPLEMENTADO vs. DISPONÍVEL NA API ML

### 1. ✅ **STATUS** - IMPLEMENTADO CORRETAMENTE

**Campo no Sistema:** `status_devolucao` (BasicDataMapper.ts)  
**Origem API:** `/post-purchase/v2/claims/{id}/returns` → `status`

**Mapeamento Atual:**
```typescript
status_devolucao: claim.status || 'cancelled'
```

**Valores Possíveis Segundo Documentação ML:**
- `pending_cancel` - Em processo de cancelamento
- `pending` - Devolução criada e envio sendo iniciado
- `failed` - Não foi possível criar e/ou iniciar o envio
- `shipped` - Devolução enviada, dinheiro retido
- `pending_delivered` - Em processo de entrega
- `return_to_buyer` - Devolução retornando ao comprador
- `pending_expiration` - Em processo de expiração
- `scheduled` - Agendada para retirada
- `pending_failure` - Em processo de falha
- `label_generated` - Devolução pronta para envio
- `cancelled` - Devolução cancelada, dinheiro disponível
- `not_delivered` - Devolução não entregue
- `expired` - Devolução expirada
- `delivered` - Devolução recebida pelo vendedor

**Status:** ✅ **CORRETO** - Campo está sendo mapeado e exibido na tabela

---

### 2. ✅ **STATUS DINHEIRO** - IMPLEMENTADO CORRETAMENTE

**Campo no Sistema:** `status_dinheiro` (FinancialDataMapper.ts)  
**Origem API:** `/post-purchase/v2/claims/{id}/returns` → `status_money`

**Mapeamento Atual:**
```typescript
status_dinheiro: claim.return_details?.money_status || 
                 claim.resolution?.money_status || null
```

**Valores Possíveis Segundo Documentação ML:**
- `retained` - Dinheiro na conta, mas retido
- `refunded` - Dinheiro devolvido ao comprador
- `available` - Dinheiro disponível

**Status:** ✅ **CORRETO** - Campo está sendo mapeado corretamente e exibido na coluna "💰 Status $"

---

### 3. ✅ **SUBTIPO** - IMPLEMENTADO CORRETAMENTE

**Campo no Sistema:** `subtipo_claim` (BasicDataMapper.ts)  
**Origem API:** `/post-purchase/v2/claims/{id}/returns` → `subtype`

**Mapeamento Atual:**
```typescript
subtipo_claim: claim.stage || null
```

**Valores Possíveis Segundo Documentação ML:**
- `low_cost` - Devolução automática de baixo custo
- `return_partial` - Devolução parcial
- `return_total` - Devolução total

**Status:** ⚠️ **INCORRETO** - O campo está mapeando `claim.stage` ao invés de `return_details.subtype`

**Correção Necessária:**
```typescript
// BasicDataMapper.ts - linha 36
subtipo_claim: claim.return_details?.subtype || claim.stage || null
```

---

### 4. ✅ **RASTREIO (Tracking Number)** - IMPLEMENTADO CORRETAMENTE

**Campo no Sistema:** `codigo_rastreamento` (TrackingDataMapper.ts)  
**Origem API:** `/post-purchase/v2/claims/{id}/returns` → `shipment.tracking_number`

**Mapeamento Atual:**
```typescript
tracking_number: returnData?.tracking_number || claim.tracking_number || null,
codigo_rastreamento: returnData?.tracking_number || claim.tracking_number || null
```

**Status:** ✅ **CORRETO** - Campo está sendo mapeado e exibido na coluna "Tracking"

---

### 5. ❌ **TIPO DE LOGÍSTICA (Fulfillment, Flex, etc.)** - NÃO IMPLEMENTADO

**Campo Esperado:** `tipo_logistica` ou `logistic_type`  
**Origem API:** `/orders/{order_id}` → `shipping.logistic_type`

**Valores Possíveis Segundo Documentação ML:**
- `fulfillment` - Mercado Envios Full
- `flex` - Mercado Envios Flex
- `self_service` - Envio por conta própria
- `drop_off` - Envio por ponto de coleta
- `cross_docking` - Cross docking
- `xd_drop_off` - Drop off com cross docking

**Status:** ❌ **NÃO IMPLEMENTADO**

**Onde Buscar:**
```typescript
// Em get-devolucoes-direct/index.ts, após buscar orderData
const logisticType = orderData?.shipping?.logistic_type || null;
```

**Correção Necessária:**
1. Adicionar campo `tipo_logistica` no BasicDataMapper.ts
2. Extrair de `orderData.shipping.logistic_type`
3. Adicionar coluna na tabela com ícones para cada tipo

---

### 6. ✅ **PREVISÃO DE ENTREGA** - IMPLEMENTADO NA FASE 2

**Campo no Sistema:** `previsao_chegada_vendedor` (TrackingDataMapper.ts)  
**Origem API:** `/post-purchase/v2/claims/{id}/returns` → `estimated_delivery_date` ou `estimated_delivery_limit.date`

**Mapeamento Atual:**
```typescript
previsao_chegada_vendedor: returnData?.estimated_delivery_date || 
                           returnData?.estimated_delivery_limit?.date || null
```

**Status:** ✅ **CORRETO** - Campo implementado na FASE 2 (Shipping Avançado) e exibido na coluna "📅 Previsão Chegada"

---

### 7. ✅ **PRAZO LIMITE** - IMPLEMENTADO NA FASE 1

**Campo no Sistema:** `prazo_limite_analise` (TrackingDataMapper.ts)  
**Origem API:** `/post-purchase/v2/claims/{id}/returns` → `estimated_handling_limit.date`

**Mapeamento Atual:**
```typescript
prazo_limite_analise: returnData?.estimated_handling_limit?.date || 
                      returnData?.estimated_delivery_date || null
```

**Status:** ✅ **CORRETO** - Campo implementado na FASE 1 (Dados Temporais Críticos)

---

### 8. ✅ **STATUS DO ENVIO (Shipment Status)** - IMPLEMENTADO

**Campo no Sistema:** `shipment_status` (TrackingDataMapper.ts)  
**Origem API:** `/orders/{order_id}` → `shipping.status`

**Mapeamento Atual:**
```typescript
shipment_status: claim.shipment_data?.status || claim.shipment_status || null
```

**Valores Possíveis Segundo Documentação ML:**
- `pending` - Quando o envio é gerado
- `ready_to_ship` - Etiqueta pronta para envio
- `shipped` - Enviado
- `not_delivered` - Não entregue
- `delivered` - Entregue
- `cancelled` - Envio cancelado

**Status:** ✅ **CORRETO** - Campo está sendo mapeado e exibido na coluna "Status Shipment"

---

### 9. ✅ **MOTIVO** - IMPLEMENTADO CORRETAMENTE

**Campo no Sistema:** `motivo_categoria` (BasicDataMapper.ts) + campos reason detalhados  
**Origem API:** `/post-purchase/v1/claims/{id}` → `reason_id` + dados de reason

**Mapeamento Atual:**
```typescript
motivo_categoria: reasonId,
reason_detail: claim.dados_reasons?.reason_detail || null,
reason_flow: claim.dados_reasons?.reason_flow || null,
tipo_problema: claim.dados_reasons?.reason_flow || null,
subtipo_problema: claim.dados_reasons?.reason_name || null
```

**Status:** ✅ **CORRETO** - Múltiplos campos de motivo implementados e exibidos na coluna "Motivo"

---

### 10. ⚠️ **CUSTOS LOGÍSTICA** - PARCIALMENTE IMPLEMENTADO

**Campo no Sistema:** `shipping_costs` + breakdown detalhado  
**Origem API:** `/shipments/{shipment_id}/costs`

**Mapeamento Atual (FinancialDataMapper.ts):**
```typescript
shipping_costs: claim.shipping_costs_enriched || null,
custo_devolucao: claim.shipping_costs_enriched?.return_costs?.net_cost || 
                 claim.return_details?.shipping_cost || null
```

**Dados Disponíveis na API ML (segundo documentação):**
- `shipping_cost` - Custo total do envio
- `handling_cost` - Custo de manuseio
- `insurance_cost` - Custo de seguro
- `discount` - Desconto aplicado
- `net_cost` - Custo líquido final

**Status:** ⚠️ **PARCIALMENTE IMPLEMENTADO**

**Problema Identificado:**
- Campo `shipping_costs_enriched` depende de ShippingCostsService que foi implementado na FASE 2
- Serviço busca dados de `/shipments/{shipment_id}/costs`
- Porém, na Edge Function, o enriquecimento pode não estar anexando corretamente ao claim

**Verificar:**
1. Se ShippingCostsService está sendo chamado em get-devolucoes-direct/index.ts
2. Se dados enriquecidos estão sendo anexados como `shipping_costs_enriched` antes do mapeamento
3. Se componente CustosLogisticaCell está recebendo dados corretamente

---

## 📋 RESUMO DE GAPS E CORREÇÕES NECESSÁRIAS

### ❌ CAMPOS NÃO IMPLEMENTADOS (1 campo)

1. **TIPO DE LOGÍSTICA** (`logistic_type`)
   - **Onde buscar:** `orderData.shipping.logistic_type`
   - **Valores:** fulfillment, flex, self_service, drop_off, cross_docking, xd_drop_off
   - **Prioridade:** ALTA (informação crítica para gestão de devoluções)

### ⚠️ CAMPOS INCORRETOS OU PARCIAIS (2 campos)

2. **SUBTIPO** - Mapeamento incorreto
   - **Problema:** Usa `claim.stage` ao invés de `return_details.subtype`
   - **Correção:** Priorizar `return_details.subtype`, fallback para `stage`

3. **CUSTOS LOGÍSTICA** - Implementação parcial
   - **Problema:** Dados enriquecidos podem não estar fluindo corretamente
   - **Verificar:** Pipeline completo desde ShippingCostsService até CustosLogisticaCell

### ✅ CAMPOS IMPLEMENTADOS CORRETAMENTE (7 campos)

- Status (14 valores possíveis)
- Status Dinheiro (3 valores possíveis)
- Rastreio (tracking_number)
- Previsão de Entrega (estimated_delivery_date)
- Prazo Limite (estimated_handling_limit)
- Status do Envio (6 valores possíveis)
- Motivo (reason_id + detalhes)

---

## 🎯 AÇÕES RECOMENDADAS

### PRIORIDADE 1 - IMPLEMENTAR AGORA

1. **Adicionar campo `tipo_logistica`**
   - Criar novo campo em BasicDataMapper.ts
   - Extrair de `orderData.shipping.logistic_type`
   - Adicionar coluna na tabela com badges coloridos por tipo
   - Criar componente `LogisticTypeCell` com ícones específicos:
     - 📦 Fulfillment (Full)
     - 🚚 Flex
     - 👤 Self Service
     - 📍 Drop Off
     - 🔄 Cross Docking

### PRIORIDADE 2 - CORRIGIR MAPEAMENTO

2. **Corrigir mapeamento de `subtipo_claim`**
   - Atualizar BasicDataMapper.ts linha 36
   - Priorizar `return_details.subtype` sobre `claim.stage`

### PRIORIDADE 3 - VALIDAR PIPELINE

3. **Auditar fluxo completo de Custos Logística**
   - Verificar se ShippingCostsService está sendo chamado
   - Confirmar que `shipping_costs_enriched` está sendo anexado
   - Testar CustosLogisticaCell com dados reais

---

## 📊 ESTATÍSTICAS DE IMPLEMENTAÇÃO

**Total de Campos Auditados:** 10  
**✅ Implementados Corretamente:** 7 (70%)  
**⚠️ Parcialmente Implementados:** 2 (20%)  
**❌ Não Implementados:** 1 (10%)

**Taxa de Conformidade com Documentação ML:** 70%  
**Taxa de Cobertura de Funcionalidades:** 90% (após correções de PRIORIDADE 1 e 2)

---

## 🔗 REFERÊNCIAS

- [Documentação Oficial ML - Gerenciar Devoluções](https://developers.mercadolivre.com.br/pt_br/gerenciar-devolucoes)
- `supabase/functions/get-devolucoes-direct/index.ts` - Edge Function principal
- `supabase/functions/get-devolucoes-direct/mapeamento.ts` - Mappers consolidados
- `src/pages/DevolucoesMercadoLivre.tsx` - Interface da página
