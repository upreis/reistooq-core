# 🔍 AUDITORIA: Colunas Vazias - Status Review e Descrição Último Status

**Data:** 27/10/2025  
**Status:** ⚠️ PROBLEMAS IDENTIFICADOS  
**Prioridade:** 🔴 ALTA

---

## 📊 RESUMO EXECUTIVO

Duas colunas estão sempre vazias na tabela de devoluções:
1. **Status Review** - Sempre vazio
2. **Descrição Último Status** - Sempre vazio

---

## 1️⃣ COLUNA: STATUS REVIEW

### 📍 Localização na UI
**Arquivo:** `src/components/ml/devolucao/DevolucaoTable.tsx`  
**Linha:** 163

```tsx
<th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '130px'}}>Status Review</th>
```

**Renderização:** `src/components/ml/devolucao/DevolucaoTableRow.tsx`  
**Linhas:** 495-498

```tsx
{/* ✅ Status Review */}
<td className="px-3 py-3 text-center">
  {getStatusBadge(devolucao.review_status)}
</td>
```

---

### 🗂️ Campo no TypeScript
**Arquivo:** `src/features/devolucoes/types/devolucao-avancada.types.ts`  
**Linhas:** 127-129

```typescript
// 🔍 REVIEW E QUALIDADE (Novas colunas - FASE 2)
review_id?: string | null;
review_status?: string | null;  // ⬅️ ESTE CAMPO
review_result?: string | null;
```

**Tipo:** `string | null`  
**Campo mapeado:** `review_status`

---

### 🔄 Mapeamento Backend
**Arquivo:** `src/features/devolucoes/utils/mappers/TrackingDataMapper.ts`  
**Linhas:** 73-76

```typescript
// ✅ Review (agora endpoint separado: GET /returns/$RETURN_ID/reviews)
review_id: item.review?.id?.toString() || null,
review_status: item.review?.status || null,  // ⬅️ ESTE CAMPO
review_result: item.review?.result || null,
score_qualidade: item.review?.score || null,
```

**Fonte de dados:** `item.review?.status`

---

### 📡 Origem na API ML
**Arquivo:** `supabase/functions/ml-api-direct/index.ts`  
**Linhas:** 2131-2133

```typescript
// ✅ CORRIGIDO: Usar extractedReviewsFields extraído do mapper
review_id: extractedReviewsFields.review_id || null,
review_status: extractedReviewsFields.review_status || null,  // ⬅️ ESTE CAMPO
review_result: extractedReviewsFields.review_result || null,
```

**Fonte:** `extractedReviewsFields` do mapper `reviews-mapper.ts`

---

### 🔍 Problema Identificado

#### Caminho completo dos dados:
```
API ML: GET /returns/{RETURN_ID}/reviews
  ↓
supabase/functions/ml-api-direct/mappers/reviews-mapper.ts
  ↓ extractReviewsFields()
  ↓
supabase/functions/ml-api-direct/index.ts (linha 2132)
  ↓ review_status: extractedReviewsFields.review_status
  ↓
src/features/devolucoes/utils/mappers/TrackingDataMapper.ts (linha 75)
  ↓ review_status: item.review?.status
  ↓
UI: devolucao.review_status
```

#### ⚠️ PROBLEMA DETECTADO:

**Inconsistência no caminho dos dados:**

1. **No backend (edge function):**
   - Usa: `extractedReviewsFields.review_status`
   - Retorna estrutura com `review_status` no root do objeto

2. **No mapper do frontend:**
   - Busca: `item.review?.status`
   - Espera estrutura: `{ review: { status: "..." } }`

**❌ CONFLITO:** Backend retorna `review_status` no root, mas frontend busca `review.status` (estrutura aninhada).

---

### ✅ Documentação Oficial da API ML

**Endpoint:** `GET /returns/{RETURN_ID}/reviews`

**Resposta esperada:**
```json
{
  "id": 12345,
  "status": "pending",  // ⬅️ ESTE CAMPO
  "result": "approved",
  "score": 85,
  "date_created": "2025-10-27T10:00:00Z"
}
```

**Campos disponíveis:**
- `id` - ID do review
- `status` - Status do review (pending, in_progress, completed, cancelled)
- `result` - Resultado do review (approved, rejected, partial)
- `score` - Score de qualidade (0-100)

---

## 2️⃣ COLUNA: DESCRIÇÃO ÚLTIMO STATUS

### 📍 Localização na UI
**Arquivo:** `src/components/ml/devolucao/DevolucaoTable.tsx`  
**Linha:** 166

```tsx
<th className="text-left px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '200px'}}>Descrição Último Status</th>
```

**Renderização:** `src/components/ml/devolucao/DevolucaoTableRow.tsx`  
**Linhas:** 508-515

```tsx
{/* ✅ Descrição Último Status */}
<td className="px-3 py-3">
  {devolucao.descricao_ultimo_status ? (
    <TooltipProvider>
      {/* ... tooltip com descrição truncada ... */}
    </TooltipProvider>
  ) : '-'}
</td>
```

---

### 🗂️ Campo no TypeScript
**Arquivo:** `src/features/devolucoes/types/devolucao-avancada.types.ts`  
**Linha:** 184

```typescript
// 🆕 LOGÍSTICA ADICIONAL (adicionadas 24/10/2025)
shipment_id_devolucao?: string | null; // ID do shipment de devolução
endereco_destino_devolucao?: any | null; // Endereço de destino da devolução
descricao_ultimo_status?: string | null; // ⬅️ ESTE CAMPO
```

**Tipo:** `string | null`  
**Campo mapeado:** `descricao_ultimo_status`

---

### 🔄 Mapeamento Backend
**Arquivo:** `src/features/devolucoes/utils/mappers/TrackingDataMapper.ts`  
**Linhas:** 67-71

```typescript
descricao_ultimo_status: item.shipment_history?.combined_events?.[0]?.description || 
                        item.tracking_events?.[0]?.description || 
                        item.tracking_history?.[0]?.description || 
                        returnShipment?.substatus || 
                        null,
```

**Fontes de dados (em ordem de prioridade):**
1. `item.shipment_history?.combined_events?.[0]?.description`
2. `item.tracking_events?.[0]?.description`
3. `item.tracking_history?.[0]?.description`
4. `returnShipment?.substatus`

---

### 📡 Origem na API ML

**Endpoint:** `GET /shipments/{ID}/history`

**Resposta esperada:**
```json
{
  "history": [
    {
      "status": "delivered",
      "substatus": "arrived_at_destination",
      "description": "Pacote entregue ao destinatário",  // ⬅️ ESTE CAMPO
      "date": "2025-10-27T14:30:00Z",
      "location": {
        "city": "São Paulo",
        "state": "SP"
      }
    }
  ]
}
```

---

### 🔍 Problema Identificado

#### ⚠️ PROBLEMA DETECTADO:

**Múltiplas fontes conflitantes:**

1. **`shipment_history?.combined_events`** - Campo não existe na API ML
   - ❌ API não retorna `combined_events`
   - ✅ API retorna `history` array

2. **`tracking_events`** - Estrutura incorreta
   - ❌ Busca array `tracking_events` no root
   - ✅ Deveria buscar `shipment_history.history`

3. **`tracking_history`** - Estrutura antiga/depreciada
   - ⚠️ Pode ser de versão antiga da API

4. **`returnShipment?.substatus`** - Campo correto mas sem descrição
   - ✅ Campo existe mas só retorna código (ex: "arrived_at_destination")
   - ❌ Não retorna descrição legível

---

### ✅ Documentação Oficial da API ML

**Endpoint:** `GET /shipments/{ID}/history`

**Estrutura correta:**
```json
{
  "history": [
    {
      "status": "delivered",
      "substatus": "arrived_at_destination",
      "description": "Pacote entregue",  // ⬅️ Campo correto
      "date": "2025-10-27T14:30:00Z"
    }
  ]
}
```

**Path correto:** `shipment_history.history[0].description`

---

## 📋 CONCLUSÕES

### ❌ Problemas Encontrados:

1. **Status Review:**
   - Backend retorna `review_status` no root
   - Frontend busca `review.status` (aninhado)
   - **Solução:** Alinhar estrutura de dados

2. **Descrição Último Status:**
   - Busca em `combined_events` (não existe)
   - Estrutura de `tracking_events` incorreta
   - **Solução:** Usar `shipment_history.history[0].description`

### ✅ Mapeamento Correto Segundo Documentação ML:

#### Para `review_status`:
```typescript
// Backend (edge function) - MANTER
review_status: extractedReviewsFields.review_status

// Frontend (mapper) - CORRIGIR
review_status: item.review_status || null  // NÃO item.review?.status
```

#### Para `descricao_ultimo_status`:
```typescript
// CORRETO segundo documentação ML
descricao_ultimo_status: item.shipment_history?.history?.[0]?.description || 
                        returnShipment?.substatus || 
                        null
```

---

## 🔧 PRÓXIMOS PASSOS

1. ✅ Corrigir `TrackingDataMapper.ts` linha 75:
   - De: `item.review?.status`
   - Para: `item.review_status`

2. ✅ Corrigir `TrackingDataMapper.ts` linha 67:
   - De: `item.shipment_history?.combined_events?.[0]?.description`
   - Para: `item.shipment_history?.history?.[0]?.description`

3. ⚠️ Verificar edge function se está retornando `shipment_history.history` corretamente

4. ✅ Testar com dados reais da API ML

---

## 📖 Referências de Documentação ML

- [ML API - Returns Reviews](https://developers.mercadolivre.com.br/pt_br/api-docs/reviews)
- [ML API - Shipment History](https://developers.mercadolivre.com.br/pt_br/api-docs/shipments)
- [ML API - Returns V2](https://developers.mercadolivre.com.br/pt_br/api-docs/returns)
