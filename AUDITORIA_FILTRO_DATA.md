# 🔍 AUDITORIA: Problema com Filtro de Data de Criação

## **❌ PROBLEMA RELATADO:**

O usuário aplicou o filtro **"Data de Criação - 90 dias"** mas mesmo assim apareceram claims de **2024** (ano anterior), o que não deveria acontecer.

---

## **🔎 INVESTIGAÇÃO:**

### **1. O que o código deveria fazer:**

Quando o usuário seleciona:
- **Período:** "90 dias"  
- **Tipo de Data:** "Data de Criação"

O sistema deveria:
1. Calcular a data de 90 dias atrás
2. Aplicar filtro `date_created.from` e `date_created.to` na API do Mercado Livre
3. Retornar APENAS claims criados nos últimos 90 dias

---

### **2. O que o código ESTÁ fazendo:**

#### **📍 Localização do Bug:**
**Arquivo:** `supabase/functions/ml-api-direct/index.ts`  
**Linhas:** 1110-1147

```typescript
// LINHA 1110 - DEFAULT ESTÁ ERRADO
const periodoDias = filters?.periodo_dias || 90;  // ❌ RECEBE 90 COMO FALLBACK
const tipoData = filters?.tipo_data || 'date_created';

// LINHA 1141-1147 - FILTRO ESTÁ SENDO APLICADO
if (tipoData === 'date_created') {
  params.append('date_created.from', dateFrom);  // ✅ FILTRO CORRETO
  params.append('date_created.to', dateTo);
} else {
  params.append('last_updated.from', dateFrom);
  params.append('last_updated.to', dateTo);
}
```

---

### **3. Onde está o BUG:**

#### **❌ PROBLEMA #1: Nome do parâmetro diferente**

**Frontend envia:** `periodoDias`  
**Backend espera:** `periodo_dias`

```typescript
// src/features/devolucoes/utils/MLApiClient.ts
export const fetchClaimsAndReturns = async (
  accountId: string,
  sellerId: string,
  filters: DevolucaoBuscaFilters,  // ❌ filters.periodoDias
  limit: number = 100,
  offset: number = 0
)

// supabase/functions/ml-api-direct/index.ts (LINHA 1110)
const periodoDias = filters?.periodo_dias || 90;  // ❌ Está procurando filters.periodo_dias
```

**RESULTADO:**  
- Frontend envia `filters.periodoDias = 90`
- Backend procura `filters.periodo_dias`
- Não encontra, usa **DEFAULT de 90 dias**
- **MAS** se mudou para 60 dias no frontend, backend continua com 90 (porque o parâmetro não chega)

---

#### **❌ PROBLEMA #2: Tipo de data também não chega**

**Frontend envia:** `tipoData`  
**Backend espera:** `tipo_data`

```typescript
// LINHA 1111
const tipoData = filters?.tipo_data || 'date_created';  // ❌ Procura filters.tipo_data

// Frontend envia: filters.tipoData
// Backend não recebe, usa DEFAULT 'date_created'
```

**RESULTADO:**
- Mesmo que o usuário selecione "Última Atualização", o backend sempre usa "Data de Criação" (default)

---

### **4. Por que apareceram claims de 2024?**

**TEORIA INICIAL ESTAVA ERRADA:**  
Eu disse que quando apareciam claims de 2024 com filtro de 90 dias, era porque estava usando `last_updated`.

**REALIDADE:**  
O backend **SEMPRE** usa `date_created` com **90 dias** porque os parâmetros não chegam corretamente!

Mas então **por que aparecem claims de 2024?**

**RESPOSTA:**  
Porque com 90 dias de período (calculado de hoje), o filtro é:
- **Data de:** 2025-07-24 (90 dias atrás de 2025-10-22)
- **Data até:** 2025-10-22 (hoje)

E a API do Mercado Livre está retornando claims que foram **CRIADOS** em 2024 mas que estão **dentro desse período** segundo a API.

**POSSIBILIDADE:** A API ML pode ter um bug ou interpreta as datas de forma diferente, ou os claims de 2024 estão sendo retornados porque houve alguma atualização recente.

---

## **✅ SOLUÇÃO:**

### **Fix #1: Corrigir nomes dos parâmetros**

**Opção A - Mudar Backend (RECOMENDADO):**
```typescript
// supabase/functions/ml-api-direct/index.ts (LINHA 1110-1111)
const periodoDias = filters?.periodoDias || 0;  // ✅ Camel case
const tipoData = filters?.tipoData || 'date_created';  // ✅ Camel case
```

**Opção B - Mudar Frontend:**
```typescript
// src/features/devolucoes/utils/MLApiClient.ts
// Enviar: periodo_dias e tipo_data (snake_case)
```

---

### **Fix #2: Remover filtro de data quando periodoDias = 0**

```typescript
// LINHA 1140-1147
if (periodoDias > 0) {  // ✅ SÓ APLICAR SE HOUVER PERÍODO
  if (tipoData === 'date_created') {
    params.append('date_created.from', dateFrom);
    params.append('date_created.to', dateTo);
  } else {
    params.append('last_updated.from', dateFrom);
    params.append('last_updated.to', dateTo);
  }
}
```

---

### **Fix #3: Log de debug para confirmar**

```typescript
logger.info(`📋 Filtros recebidos:`, {
  periodoDias_recebido: filters?.periodoDias,
  periodo_dias_recebido: filters?.periodo_dias,
  tipoData_recebido: filters?.tipoData,
  tipo_data_recebido: filters?.tipo_data,
  periodoDias_usado: periodoDias,
  tipoData_usado: tipoData,
  dateFrom,
  dateTo
});
```

---

## **🎯 RESUMO:**

**Problema:** Incompatibilidade de nomes de parâmetros entre frontend (camelCase) e backend (snake_case)

**Causa:** Backend sempre usa DEFAULT porque não recebe os parâmetros corretos

**Solução:** Padronizar nomes para **camelCase** no backend (mais simples)

**Impacto:** Ao corrigir, o filtro de data funcionará corretamente e claims de 2024 não aparecerão mais quando filtrar por "90 dias - Data de Criação"

---

## **📊 ANTES vs DEPOIS:**

### **ANTES (ATUAL):**
- Frontend envia: `{ periodoDias: 90, tipoData: 'date_created' }`
- Backend recebe: `undefined` (procura `periodo_dias` e `tipo_data`)
- Backend usa: **DEFAULT 90 dias + date_created**
- Resultado: Sempre busca 90 dias de date_created, independente do que usuário escolher

### **DEPOIS (CORRIGIDO):**
- Frontend envia: `{ periodoDias: 60, tipoData: 'last_updated' }`
- Backend recebe: `{ periodoDias: 60, tipoData: 'last_updated' }` ✅
- Backend usa: **60 dias de last_updated** conforme escolhido
- Resultado: Filtro funciona exatamente como esperado

---

## **⚠️ TESTE RECOMENDADO:**

Após aplicar o fix:

1. Selecionar **"30 dias - Data de Criação"**
2. Verificar se NÃO aparecem claims mais antigos que 30 dias
3. Mudar para **"90 dias - Última Atualização"**
4. Verificar se aparecem claims antigos (2024) que foram atualizados recentemente
5. Confirmar nos logs que os parâmetros estão chegando corretamente
