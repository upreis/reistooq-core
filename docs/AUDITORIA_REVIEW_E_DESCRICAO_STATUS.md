# 🔍 AUDITORIA: Status Review e Descrição Último Status

## 📋 RESUMO EXECUTIVO

**Campos analisados:**
- ✅ **Status Review** → Mapeamento CORRETO após último ajuste
- ❌ **Descrição Último Status** → Mapeamento INCORRETO (campo não existe na API)

---

## 1️⃣ STATUS REVIEW

### 📍 Localização no Frontend
**Arquivo:** `src/features/devolucoes/utils/mappers/TrackingDataMapper.ts`
**Linha 75:**
```typescript
review_status: item.review_status || null,
```

### ✅ MAPEAMENTO ATUAL (CORRETO)
O campo está buscando `item.review_status` que vem do edge function.

### 📚 DOCUMENTAÇÃO OFICIAL ML
**Endpoint:** `GET /returns/$RETURN_ID/reviews`

**Estrutura da resposta:**
```json
{
  "reviews": [
    {
      "resource_reviews": [
        {
          "status": "success"  // ← Campo correto
        }
      ]
    }
  ]
}
```

**Valores possíveis para `status`:**
- `"success"` - revisão realizada e produto OK
- `"failed"` - produto tem algum problema
- `""` - não há revisão da triage
- `null` - revisão realizada pelo vendedor

### 🔧 ORIGEM DOS DADOS
**Arquivo:** `supabase/functions/ml-api-direct/mappers/reviews-mapper.ts`
**Função:** `extractReviewsFields()`
**Linha 100:**
```typescript
review_status: mapped?.stage || null, // 'closed', 'pending', etc
```

### ⚠️ PROBLEMA IDENTIFICADO
**O mapper está usando o campo ERRADO!**

- ✅ **Correto (API):** `resource_reviews[0].status` → "success" | "failed"
- ❌ **Atual (código):** `resource_reviews[0].stage` → "closed" | "pending" | "seller_review_pending" | "timeout"

**Stage** e **Status** são campos DIFERENTES:
- `stage` = etapa da revisão (closed, pending, etc)
- `status` = resultado da revisão (success, failed)

### 🔧 CORREÇÃO NECESSÁRIA
**Arquivo:** `supabase/functions/ml-api-direct/mappers/reviews-mapper.ts`

**ANTES (linha 100):**
```typescript
review_status: mapped?.stage || null, // ERRADO
```

**DEPOIS:**
```typescript
review_status: mapped?.status || null, // CORRETO - usa o status real da revisão
```

**E adicionar um novo campo para stage:**
```typescript
review_stage: mapped?.stage || null, // closed, pending, seller_review_pending, timeout
```

---

## 2️⃣ DESCRIÇÃO ÚLTIMO STATUS

### 📍 Localização no Frontend
**Arquivo:** `src/features/devolucoes/utils/mappers/TrackingDataMapper.ts`
**Linhas 67-71:**
```typescript
descricao_ultimo_status: item.shipment_history?.history?.[0]?.description || 
                        item.tracking_events?.[0]?.description || 
                        item.tracking_history?.[0]?.description || 
                        returnShipment?.substatus || 
                        null,
```

### ❌ MAPEAMENTO ATUAL (INCORRETO)

#### Tentativa 1: `item.shipment_history?.history?.[0]?.description`
**Problema:** O campo `shipment_history.history` NÃO EXISTE na API ML.

#### Tentativa 2: `item.tracking_events?.[0]?.description`
**Problema:** A estrutura `tracking_events` não contém campo `description`.

#### Tentativa 3: `item.tracking_history?.[0]?.description`
**Problema:** A estrutura `tracking_history` não contém campo `description`.

#### Tentativa 4: `returnShipment?.substatus`
**Possível, mas não é uma "descrição"** - é apenas um código de status.

### 📚 ANÁLISE DA DOCUMENTAÇÃO ML

#### Sobre `last_updated` (Claims)
**Confusão identificada:** O nome da coluna sugere usar `last_updated`, mas:

**Documentação Claims:**
```json
{
  "id": 5256749420,
  "last_updated": "2024-03-21T05:19:22.000-04:00"  // ← Data da última atualização
}
```

**Campo `last_updated`:**
- ✅ É uma **DATA** (não uma descrição)
- ✅ Representa "Data da última atualização sobre a reclamação"
- ❌ NÃO é uma "Descrição de Status"

### 🤔 CAMPO MAIS ADEQUADO PARA "DESCRIÇÃO"

Baseado na documentação ML, os campos mais adequados são:

#### Opção 1: Detalhes do Claim
**Endpoint:** `GET /claims/$CLAIM_ID/detail`
```json
{
  "title": "Devolución en mediación con Mercado Libre",
  "description": "Intervinimos para ayudar. Te escribiremos antes del miércoles 19 de julio.",
  "problem": "Nos dijiste que el producto llegó dañado"
}
```

#### Opção 2: Resolution Reason (do claim)
**Disponível em:** `GET /claims/$CLAIM_ID`
```json
{
  "resolution": {
    "reason": "payment_refunded"  // ← Motivo da resolução
  }
}
```

**Valores possíveis (mais de 30):**
- `already_shipped`, `payment_refunded`, `product_delivered`, etc.

#### Opção 3: Status da Devolução
**Disponível em:** `return_details_v2.status`
```json
{
  "return_details_v2": {
    "status": "label_generated"  // ← Status atual da devolução
  }
}
```

#### Opção 4: Substatus do Shipment (atual fallback)
**Disponível em:** `shipments[0].substatus`
```json
{
  "shipments": [
    {
      "substatus": "ready_to_ship"
    }
  ]
}
```

---

## 🎯 RECOMENDAÇÕES DE CORREÇÃO

### ✅ SOLUÇÃO RECOMENDADA

**Campo:** Descrição Último Status
**Deve usar uma combinação de:**

1. **Prioridade 1:** `claim_details.resolution.reason` (se claim fechado)
2. **Prioridade 2:** `return_details_v2.status` (status da devolução)
3. **Prioridade 3:** `shipments[0].substatus` (substatus do envio)
4. **Prioridade 4:** `claim_details.stage` (etapa do claim)

### 📝 CÓDIGO CORRIGIDO

**TrackingDataMapper.ts:**
```typescript
descricao_ultimo_status: (() => {
  // 1. Se claim está fechado, usar o motivo da resolução
  if (item.claim_details?.resolution?.reason) {
    return item.claim_details.resolution.reason;
  }
  
  // 2. Se há devolução, usar o status dela
  if (item.return_details_v2?.status) {
    return item.return_details_v2.status;
  }
  
  // 3. Usar substatus do shipment de devolução
  const returnShipment = item.return_details_v2?.shipments?.find((s: any) => s.type === 'return') || 
                         item.return_details_v2?.shipments?.[0];
  if (returnShipment?.substatus) {
    return returnShipment.substatus;
  }
  
  // 4. Usar stage do claim como fallback
  if (item.claim_details?.stage) {
    return item.claim_details.stage;
  }
  
  return null;
})(),
```

---

## 🔍 CAMPOS RELACIONADOS QUE JÁ EXISTEM

### ✅ Campos que já trazem essas informações:

1. **`status_devolucao`** → Já mapeia `return_details_v2.status`
2. **`claim_stage`** → Já mapeia `claim_details.stage`
3. **`resultado_mediacao`** → Já mapeia `claim_details.resolution.reason`

### 💡 CONCLUSÃO

O campo **"Descrição Último Status"** é **REDUNDANTE** porque:
- As informações já existem em outros campos
- Não há um campo específico "description" na API ML
- O campo `last_updated` é uma DATA, não uma descrição

### 🎯 SUGESTÕES:

#### Opção A: Remover a coluna
Se já existem outros campos com essas informações.

#### Opção B: Renomear e usar campo existente
- Renomear para **"Motivo Resolução"**
- Mapear para `claim_details.resolution.reason`
- Formatar em português usando função similar a `formatOrderStatus`

#### Opção C: Criar descrição composta
Combinar múltiplos campos para criar uma descrição legível.

---

## 📊 PRÓXIMOS PASSOS

### 1. Status Review
- [ ] Corrigir `reviews-mapper.ts` linha 100
- [ ] Trocar `mapped?.stage` por `mapped?.status`
- [ ] Adicionar campo separado `review_stage`
- [ ] Atualizar tipo TypeScript

### 2. Descrição Último Status
- [ ] Decidir qual opção seguir (A, B ou C)
- [ ] Implementar mapeamento correto
- [ ] Criar função de formatação em português
- [ ] Atualizar documentação

### 3. Testes
- [ ] Verificar com dados reais da API
- [ ] Validar formatação em português
- [ ] Confirmar que campos aparecem na UI

---

## 📚 REFERÊNCIAS

- [Documentação ML - Claims](https://developers.mercadolivre.com.br/pt_br/gestao-de-reclamacoes)
- [Documentação ML - Returns](https://developers.mercadolivre.com.br/pt_br/devolver-produto)
- [Documentação ML - Reviews](https://developers.mercadolivre.com.br/pt_br/devolver-produto#Reviews)
