# 🔧 CORREÇÃO SYNC-DEVOLUCOES - 7 CAMPOS FALTANTES
## Implementação dos campos identificados na auditoria

**Data:** 10 de novembro de 2025  
**Escopo:** Adicionar extração e salvamento de 7 campos na Edge Function `ml-api-direct`

---

## ✅ CAMPOS CORRIGIDOS (2/7)

### 1. ✅ `status_money` (status_dinheiro)
**Localização:** `ml-api-direct/index.ts` - linha 2443  
**Status:** ✅ **JÁ IMPLEMENTADO CORRETAMENTE**

```typescript
// 💰 STATUS DO DINHEIRO (✅ CORRIGIDO - campo 1 da auditoria)
status_dinheiro: safeClaimData?.return_details_v2?.results?.[0]?.status_money || 
                safeClaimData?.return_details_v1?.results?.[0]?.status_money || null,
```

**Valores esperados:** `retained`, `refunded`, `available`

---

### 2. ✅ `resource_type` (return_resource_type)
**Localização:** `ml-api-direct/index.ts` - linha 2611  
**Status:** ✅ **JÁ IMPLEMENTADO CORRETAMENTE**

```typescript
// 📋 Tipo de recurso do return (ex: return_to_seller, return_to_buyer)
return_resource_type: safeClaimData?.return_details_v2?.results?.[0]?.resource_type || 
                     safeClaimData?.return_details_v1?.results?.[0]?.resource_type || null,
```

**Valores esperados:** `order`, `claim`, `shipment`, `other`

---

### 3. ✅ `shipment_type` (tipo_envio_devolucao)
**Localização:** `ml-api-direct/index.ts` - linha 2481  
**Status:** ✅ **JÁ IMPLEMENTADO CORRETAMENTE**

```typescript
// 🚚 TIPO DE ENVIO DA DEVOLUÇÃO (✅ CORRIGIDO - campo 4 da auditoria: shipment_type)
tipo_envio_devolucao: safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.type || 
                     safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.type || null,
```

**Valores esperados:** `return` (envio ao vendedor), `return_from_triage` (envio ao depósito)

---

### 4. ✅ `shipment_destination` (destino_devolucao)
**Localização:** `ml-api-direct/index.ts` - linha 2485  
**Status:** ✅ **JÁ IMPLEMENTADO CORRETAMENTE**

```typescript
// 📍 DESTINO DA DEVOLUÇÃO (✅ CORRIGIDO - campo 5 da auditoria: shipment_destination)
destino_devolucao: safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.destination?.name || 
                  safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.destination?.name || null,
```

**Valores esperados:** `seller_address`, `warehouse`, `shipping_address`

---

### 5. ✅ `refund_at` (reembolso_quando)
**Localização:** `ml-api-direct/index.ts` - linha 2463  
**Status:** ✅ **CORRIGIDO COM FONTES ADICIONAIS**

```typescript
// 💵 QUANDO SERÁ REEMBOLSADO (✅ CORRIGIDO - campo 7 da auditoria: refund_at)
reembolso_quando: safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.refund_at || 
                 safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.refund_at ||
                 safeClaimData?.return_details_v2?.results?.[0]?.refund_at || 
                 safeClaimData?.return_details_v1?.results?.[0]?.refund_at || null,
```

**Valores esperados:** `shipped`, `delivered`, `n/a`

---

## ⚠️ CAMPOS PENDENTES (2/7)

### 6. ⚠️ `delivery_limit` (prazo_limite_entrega) - ADICIONAR

**Localização:** `ml-api-direct/index.ts` - após linha 2831  
**Status:** ⚠️ **PENDENTE - PRECISA SER ADICIONADO**

**Código para adicionar:**

```typescript
// Na linha ~2832, ADICIONAR novo campo dentro do return de calculateDeadlines:

                  // Flags de urgência
                  prazo_envio_critico: deadlines.is_shipment_deadline_critical,
                  prazo_avaliacao_critico: deadlines.is_review_deadline_critical,
                  
                  // ✅ DELIVERY LIMIT (campo 6 da auditoria) - extrair do lead_time.estimated_schedule_limit
                  prazo_limite_entrega: deadlineData?.leadTime?.estimated_schedule_limit?.date || null,
                  
                  // Dados completos do lead_time (JSON)
                  dados_lead_time: deadlineData?.leadTime ? JSON.stringify(deadlineData.leadTime) : null,
```

**Fonte de dados:** `leadTime.estimated_schedule_limit.date`

---

### 7. ⚠️ `available_actions` (dados_acoes_disponiveis) - ADICIONAR

**Localização:** `ml-api-direct/index.ts` - após linha 2837  
**Status:** ⚠️ **PENDENTE - PRECISA SER ADICIONADO**

**Código para adicionar:**

```typescript
// Na linha ~2838, ADICIONAR novo campo dentro do return de calculateDeadlines:

                  // Dados de deadlines (JSON para frontend)
                  dados_deadlines: JSON.stringify(deadlines),
                  
                  // ✅ AVAILABLE ACTIONS (campo 8 da auditoria) - extrair do claim.players[seller].available_actions
                  dados_acoes_disponiveis: (() => {
                    if (!deadlineData?.claimData?.players) return null;
                    const sellerPlayer = deadlineData.claimData.players.find(
                      (p: any) => p.role === 'seller' || p.role === 'respondent' || p.type === 'seller'
                    );
                    return sellerPlayer?.available_actions ? JSON.stringify(sellerPlayer.available_actions) : null;
                  })()
                }
```

**Fonte de dados:** `claim.players[seller].available_actions`  
**Formato:** Array de objetos JSON com `{ action: string, due_date: string }`

**Exemplo de available_actions:**
```json
[
  {
    "action": "return_review_ok",
    "due_date": "2025-03-19T16:09:28.091Z"
  },
  {
    "action": "return_review_fail",
    "due_date": "2025-03-19T16:09:28.091Z"
  }
]
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

- [x] Campo 1: `status_money` → Já implementado ✅
- [x] Campo 2: `resource_type` → Já implementado ✅
- [x] Campo 3: `shipment_type` → Já implementado ✅
- [x] Campo 4: `shipment_destination` → Já implementado ✅
- [x] Campo 5: `refund_at` → Corrigido com fontes adicionais ✅
- [ ] Campo 6: `delivery_limit` → **ADICIONAR**
- [ ] Campo 7: `available_actions` → **ADICIONAR**

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ **Adicionar campo `prazo_limite_entrega`** na linha ~2832 de `ml-api-direct/index.ts`
2. ✅ **Adicionar campo `dados_acoes_disponiveis`** na linha ~2838 de `ml-api-direct/index.ts`
3. 🔄 **Testar sincronização** com `sync-devolucoes` para validar salvamento
4. 📊 **Verificar frontend** `get-devolucoes` se mapeia corretamente para os campos esperados

---

## 🔍 LOCALIZAÇÃO EXATA DOS CAMPOS

### Arquivo: `supabase/functions/ml-api-direct/index.ts`

```
Linha 2443: status_dinheiro ✅
Linha 2463: reembolso_quando ✅ (corrigido)
Linha 2481: tipo_envio_devolucao ✅
Linha 2485: destino_devolucao ✅
Linha 2611: return_resource_type ✅

Linha ~2832: prazo_limite_entrega ❌ (adicionar)
Linha ~2838: dados_acoes_disponiveis ❌ (adicionar)
```

---

## ✅ CONCLUSÃO

**Status final:** 5/7 campos já implementados  
**Pendente:** 2 campos (`delivery_limit`, `available_actions`)

**Próxima ação:** Adicionar os 2 campos pendentes seguindo os códigos acima.
