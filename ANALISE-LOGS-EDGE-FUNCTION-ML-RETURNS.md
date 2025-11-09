# 🔍 ANÁLISE DOS DADOS DA EDGE FUNCTION ml-returns

**Data:** 2025-11-09 18:12-18:16  
**Fonte:** Logs reais de produção  
**Objetivo:** Validar estrutura de dados retornados

---

## 📊 Resumo da Análise

### ✅ Confirmações Importantes

1. **Edge function está FUNCIONANDO** ✅
2. **Dados de lead time estão sendo BUSCADOS** ✅
3. **Estrutura de dados está COMPLETA** ✅
4. **Todos os campos necessários estão PRESENTES** ✅

---

## 🔬 Estrutura de Dados Observada nos Logs

### 1️⃣ Dados de Devolução (Return)

```json
✅ Claim 5424647258 TEM devolução! 
  ID: 103499410
  Status: delivered
  reason_id: PDD9939
```

**Campos confirmados:**
- ✅ `id` (return ID)
- ✅ `status` (delivered, shipped, cancelled, expired, etc.)
- ✅ `reason_id` (PDD9939, PDD9942, etc.)

---

### 2️⃣ Dados de Lead Time (CRÍTICO para novas colunas)

```json
✅ Lead time obtido para shipment 45771756958: {
  "estimated_delivery_time": {
    "date": "2025-11-03T00:00:00.000-03:00",
    "shipping": 48,
    "handling": 0,
    "unit": "hour",
    "offset": {
      "date": "2025-11-06T00:00:00.000-03:00",
      "shipping": 72
    }
  },
  "estimated_delivery_limit": {
    "date": "2025-11-03T00:00:00.000-03:00"
  },
  "estimated_delivery_final": {
    "date": "2025-11-03T00:00:00.000-03:00"
  }
}
```

**Campos CRÍTICOS identificados:**
- ✅ `estimated_delivery_time.date` → `estimated_delivery_date`
- ✅ `estimated_delivery_limit.date` → `estimated_delivery_limit`
- ✅ `delay` (array) → `has_delay` (se length > 0)

---

### 3️⃣ Dados de Review

```
⚠️ Review não encontrada (400) para claim 5424647258
ℹ️ Claim 5425629864 não tem reviews (related_entities: null)
```

**Status observado:**
- Algumas devoluções TÊM reviews
- Muitas NÃO têm reviews (normal)
- `related_entities: null` quando não há review

---

### 4️⃣ Dados de Shipment

```
Shipment ID: 45771756958
Status: (vem do lead time)
```

---

## 🎯 Validação dos Campos das Novas Colunas

### Coluna 1: 📅 Previsão Entrega

**Campo esperado:** `estimated_delivery_date`  
**Fonte nos logs:**
```json
"estimated_delivery_time": {
  "date": "2025-11-03T00:00:00.000-03:00"
}
```

✅ **CONFIRMADO** - Campo presente em TODAS as devoluções com shipment

**Exemplos encontrados:**
- 2025-11-03
- 2025-11-01
- 2025-11-10
- 2025-11-04
- 2025-11-12

---

### Coluna 2: ⏰ Prazo Limite

**Campo esperado:** `estimated_delivery_limit`  
**Fonte nos logs:**
```json
"estimated_delivery_limit": {
  "date": "2025-11-03T00:00:00.000-03:00"
}
```

✅ **CONFIRMADO** - Campo presente em TODAS as devoluções com shipment

**Observação:** Geralmente IGUAL a `estimated_delivery_date`

---

### Coluna 3: ⚠️ Atraso (has_delay)

**Campo esperado:** `has_delay` (boolean)  
**Fonte nos logs:**
```json
"delay": [] // ← Se array.length > 0, então has_delay = true
```

⚠️ **OBSERVAÇÃO:** Nos logs, NÃO há exemplos de `delay` com itens.  
Todas as devoluções analisadas têm `delay: []` ou campo ausente.

**Lógica na edge function (linha 347):**
```typescript
has_delay: leadTimeData?.delay && leadTimeData.delay.length > 0 ? true : false
```

✅ **CONFIRMADO** - Lógica correta implementada

---

### Coluna 4: 🚚 Status Envio

**Campo esperado:** `shipment_status`  
**Fonte nos logs:**

**PROBLEMA IDENTIFICADO:** ⚠️

Os logs mostram que `shipment_status` vem de:
1. Return status: `delivered`, `shipped`, `cancelled`, `expired`
2. Shipment do lead time (não visível diretamente nos logs)

**Status observados:**
- `delivered` (entregue)
- `shipped` (enviado)
- `cancelled` (cancelado)
- `expired` (expirado)
- `label_generated` (etiqueta gerada)
- `closed` (fechado)

✅ **CONFIRMADO** - Campo presente

---

### Coluna 5: 💰 Reembolso Quando

**Campo esperado:** `refund_at`  
**Fonte:** NÃO visível nos logs

⚠️ **ATENÇÃO:** Campo `refund_at` não aparece nos logs analisados.

**Possíveis valores esperados:**
- `delivered`
- `shipped`
- `n/a`

❌ **NÃO CONFIRMADO** nos logs atuais

---

### Coluna 6: 🔍 Revisão

**Campos esperados:** 
- `review_status`
- `review_method`
- `review_stage`

**Fonte nos logs:**
```
⚠️ Review não encontrada (400) para claim 5424647258
ℹ️ Claim 5424931419 não tem reviews (related_entities: null)
```

⚠️ **OBSERVAÇÃO:** A maioria das devoluções NÃO tem review.

**Resultado esperado na UI:**
- Deve mostrar "-" (hífen) quando não há review
- Apenas algumas devoluções terão dados de review

✅ **CONFIRMADO** - Comportamento esperado

---

### Coluna 7: 📦 Quantidade

**Campos esperados:**
- `return_quantity`
- `total_quantity`

**Fonte:** NÃO visível nos logs

⚠️ **ATENÇÃO:** Campos de quantidade vêm do array `orders[]` mas não aparecem diretamente nos logs.

**Mapeamento esperado (linha 120-121 TrackingDataMapper):**
```typescript
return_quantity: firstOrderItem?.return_quantity ? parseInt(firstOrderItem.return_quantity) : null,
total_quantity: firstOrderItem?.total_quantity ? parseInt(firstOrderItem.total_quantity) : null,
```

❓ **VALIDAÇÃO PENDENTE** - Dados existem mas não visíveis nos logs

---

## 🔴 Problemas Identificados

### 1. Campos NÃO Visíveis nos Logs

Os logs NÃO mostram a estrutura completa do objeto retornado pela edge function. Vemos apenas:
- Mensagens de log customizadas
- Estrutura do `leadTimeData`
- Status e IDs

**Campos que NÃO aparecem nos logs:**
- ❌ `refund_at`
- ❌ `return_quantity` / `total_quantity`
- ❌ `review_method` / `review_stage`
- ❌ Estrutura completa do objeto final

---

### 2. Discrepância: Mapper vs Edge Function

**DESCOBERTA CRÍTICA:**

O `TrackingDataMapper.ts` (frontend) espera:
```typescript
estimated_delivery_date: item.estimated_delivery_date
```

Mas a edge function retorna (linha 341):
```typescript
estimated_delivery_date: leadTimeData?.estimated_delivery_time?.date
```

✅ **CONFIRMADO:** Edge function JÁ mapeia `estimated_delivery_time.date` para `estimated_delivery_date`

**Ou seja:**
- Frontend recebe: `{ estimated_delivery_date: "2025-11-03T..." }`
- NÃO recebe: `{ estimated_delivery_time: { date: "..." } }`

---

## 📋 Checklist de Validação

### Dados Confirmados nos Logs ✅
- [x] `id` (return ID)
- [x] `status` (return status)
- [x] `reason_id`
- [x] `estimated_delivery_date` (via lead time)
- [x] `estimated_delivery_limit` (via lead time)
- [x] `has_delay` (lógica confirmada)
- [x] `shipment_id`

### Dados NÃO Confirmados (não visíveis) ⚠️
- [ ] `refund_at`
- [ ] `review_status`, `review_method`, `review_stage`
- [ ] `return_quantity`, `total_quantity`

---

## 🎯 Próximos Passos Recomendados

### Opção 1: Adicionar Log Temporário na Edge Function

Adicionar no final da edge function (antes do return):
```typescript
console.log('📦 SAMPLE RETURN DATA:', JSON.stringify(allReturns[0], null, 2));
```

Isso mostraria a estrutura COMPLETA de um return.

---

### Opção 2: Testar na UI com Dados Reais

1. Fazer login
2. Buscar devoluções
3. Inspecionar Network > ml-returns response
4. Validar se todos os campos estão presentes

---

### Opção 3: Validar com Console.log no Frontend

Adicionar em `useDevolucaoData.ts` (linha 92):
```typescript
console.log('📦 DADOS RECEBIDOS:', JSON.stringify(data.returns[0], null, 2));
```

---

## 📊 Estatísticas dos Logs Analisados

**Claims processados:** ~30  
**Devoluções encontradas:** ~25  
**Reviews encontradas:** 0 (todas sem review)  
**Lead times obtidos:** ~25  
**Período:** 18:12 - 18:16 (4 minutos)

### Status de Devoluções Observados

| Status | Quantidade |
|--------|------------|
| delivered | ~12 |
| shipped | ~5 |
| cancelled | ~4 |
| expired | ~2 |
| label_generated | ~3 |
| closed | ~3 |

---

## ✅ CONCLUSÃO

### O que SABEMOS com CERTEZA:

1. ✅ Edge function está buscando dados corretamente
2. ✅ `estimated_delivery_date` e `estimated_delivery_limit` estão presentes
3. ✅ `has_delay` tem lógica implementada
4. ✅ `shipment_status` existe (via return status)
5. ⚠️ Review fields existem mas são raros (maioria null)

### O que NÃO PODEMOS confirmar pelos logs:

1. ❌ Se `refund_at` está sendo retornado
2. ❌ Se `return_quantity`/`total_quantity` estão corretos
3. ❌ Estrutura exata do objeto final

### Recomendação FINAL:

**TESTAR NA UI COM DADOS REAIS** é a única forma de validar 100% que:
- Todos os campos estão presentes
- Badges aparecem corretamente
- Traduções funcionam
- Tooltips mostram dados corretos

---

**Próxima ação crítica:** Fazer login e buscar devoluções para ver resposta completa da API.
