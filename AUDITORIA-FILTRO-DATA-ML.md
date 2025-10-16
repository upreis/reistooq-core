# 🔍 AUDITORIA COMPLETA - Filtro de Data em /ml-orders-completas

**Data**: 16/10/2025  
**Problema**: Sistema filtra por "🔄 Últ Sync" em vez de "📅 Data Venda"

---

## ✅ PROBLEMA IDENTIFICADO

### **CAUSA RAIZ:**
A API do Mercado Livre **NÃO SUPORTA** filtros por `date_created.from` e `date_created.to` na endpoint de claims.

### **EVIDÊNCIA:**
```typescript
// supabase/functions/ml-api-direct/index.ts - Linhas 794-803
// ❌ TENTATIVA INCORRETA DE FILTRAR POR DATE_CREATED
if (filters?.date_from && filters.date_from.trim().length > 0) {
  console.log(`✅ Aplicando filtro date_from (Data Venda): ${filters.date_from}`)
  params.append('date_created.from', filters.date_from)  // ❌ NÃO FUNCIONA
}

if (filters?.date_to && filters.date_to.trim().length > 0) {
  console.log(`✅ Aplicando filtro date_to (Data Venda): ${filters.date_to}`)
  params.append('date_created.to', filters.date_to)     // ❌ NÃO FUNCIONA
}
```

---

## 📊 ANÁLISE TÉCNICA

### 1. **API do Mercado Livre - Endpoint de Claims**
```
GET https://api.mercadolibre.com/post-purchase/v1/claims/search
```

**Parâmetros Suportados (Documentação ML):**
- ✅ `player_role` - Papel do usuário (respondent, complainant)
- ✅ `player_user_id` - ID do vendedor
- ✅ `status` - Status do claim (opened, closed, etc)
- ✅ `type` - Tipo do claim (mediations, etc)
- ✅ `offset` - Paginação
- ✅ `limit` - Limite de resultados
- ❌ `date_created.from` - **NÃO EXISTE**
- ❌ `date_created.to` - **NÃO EXISTE**

### 2. **Fluxo Atual (INCORRETO)**
```
Frontend (dataInicio/dataFim)
    ↓
Edge Function ml-api-direct
    ↓
API ML com params date_created.from/to  ← ❌ IGNORADOS PELA API
    ↓
API retorna TODOS os claims (sem filtro de data)
    ↓
Edge Function recebe TODOS os dados
    ↓
Frontend recebe TODOS os dados
    ↓
Usuário vê todos os dados sem filtro de data aplicado
```

### 3. **Resultado Observado**
- Filtro de data no frontend envia `dataInicio: "2025-10-15"` e `dataFim: "2025-10-15"`
- Edge function tenta aplicar na API ML
- **API ML IGNORA** esses parâmetros
- API retorna claims de **TODAS AS DATAS**
- Frontend mostra claims de 13/10, 10/10, 07/10, 04/10, 03/10, etc.
- **Aparentemente filtra por última sincronização (🔄 Últ Sync = 15/10)** porque todos foram buscados no mesmo momento

---

## 🔄 SOLUÇÃO CORRETA

### **Abordagem 1: Filtro no Frontend (RECOMENDADO)**
A API ML não suporta filtro de data, então devemos:

1. **Edge Function**: Buscar TODOS os claims (sem filtro de data)
2. **Frontend**: Aplicar filtro de data localmente após receber os dados

```typescript
// Frontend - src/features/devolucoes/hooks/useDevolucoesBusca.ts
// Aplicar filtro APÓS receber dados da API

const devolucoesFiltradas = devolucoesProcesadas.filter(item => {
  if (!filtros.dataInicio && !filtros.dataFim) return true;
  
  const dataCriacao = new Date(item.data_criacao);
  const dataInicio = filtros.dataInicio ? new Date(filtros.dataInicio + 'T00:00:00') : null;
  const dataFim = filtros.dataFim ? new Date(filtros.dataFim + 'T23:59:59') : null;
  
  if (dataInicio && dataCriacao < dataInicio) return false;
  if (dataFim && dataCriacao > dataFim) return false;
  
  return true;
});
```

### **Abordagem 2: Filtro no Backend (ALTERNATIVA)**
Aplicar filtro na Edge Function após buscar dados da API:

```typescript
// supabase/functions/ml-api-direct/index.ts
// APÓS buscar todos os claims da API ML

let claimsParaProcessar = allClaims;

// Aplicar filtro de data LOCALMENTE
if (filters?.date_from || filters?.date_to) {
  claimsParaProcessar = allClaims.filter(claim => {
    if (!claim.date_created) return false;
    
    const claimDate = new Date(claim.date_created);
    const dateFrom = filters.date_from ? new Date(filters.date_from + 'T00:00:00') : null;
    const dateTo = filters.date_to ? new Date(filters.date_to + 'T23:59:59') : null;
    
    if (dateFrom && claimDate < dateFrom) return false;
    if (dateTo && claimDate > dateTo) return false;
    
    return true;
  });
}
```

---

## 🎯 CAMPOS DE DATA NO SISTEMA

### **date_created (da API ML)**
- Origem: `order_data.date_created` (pedido original)
- Mapeado para: `data_criacao`
- Representa: **📅 Data Venda** (data de criação do pedido)
- Exemplo: `"2025-10-13T19:30:00.000-04:00"`

### **created_at (sistema local)**
- Origem: Sistema Supabase
- Representa: **🔄 Últ Sync** (data de sincronização no banco)
- Exemplo: `"2025-10-15T22:17:00.000Z"`

### **Mapeamento Correto:**
```typescript
// src/features/devolucoes/hooks/useDevolucoesBusca.ts - Linha 362
data_criacao: item.date_created || null,  // ✅ Data do pedido (Data Venda)
created_at: new Date().toISOString(),     // 🔄 Data de sincronização (Últ Sync)
```

---

## 🔍 OUTROS LOCAIS COM FILTRO DE DATA

### 1. **Histórico de Vendas** (`/historico`)
**Arquivo**: `supabase/functions/historico-vendas-browse/index.ts`
```typescript
// ✅ CORRETO - Filtra por data_pedido usando query Supabase
if (filters.data_inicio) {
  query = query.gte('data_pedido', filters.data_inicio)
}
if (filters.data_fim) {
  query = query.lte('data_pedido', filters.data_fim)
}
```
**Status**: ✅ Funcionando corretamente

### 2. **Devoluções Mercado Livre** (`/ml-orders-completas`)
**Arquivos**: 
- `src/features/devolucoes/hooks/useDevolucoesBusca.ts`
- `supabase/functions/ml-api-direct/index.ts`

**Status**: ❌ PROBLEMA IDENTIFICADO (este documento)

### 3. **Pedidos OMS** (`/pedidos`)
**Arquivo**: `src/features/pedidos/hooks/usePedidosData.ts`
```typescript
// ✅ CORRETO - Filtra por data_pedido usando query Supabase
if (filters.dataInicio) {
  query = query.gte('data_pedido', filters.dataInicio.toISOString())
}
if (filters.dataFim) {
  query = query.lte('data_pedido', filters.dataFim.toISOString())
}
```
**Status**: ✅ Funcionando corretamente

---

## 📋 CHECKLIST DE CORREÇÃO

- [ ] **Remover** parâmetros `date_created.from/to` da chamada API ML
- [ ] **Implementar** filtro de data no frontend OU backend
- [ ] **Atualizar** logs para indicar que filtro é aplicado localmente
- [ ] **Testar** filtro com diferentes períodos
- [ ] **Validar** que `data_criacao` (Data Venda) é usado, não `created_at` (Últ Sync)
- [ ] **Documentar** limitação da API ML

---

## ⚠️ LIMITAÇÕES DA API MERCADO LIVRE

1. **Sem filtro de data nativo**: API não suporta filtrar claims por data
2. **Paginação limitada**: Máximo 500 claims por busca
3. **Rate limiting**: Limite de requisições por segundo
4. **Timeout**: Edge functions têm limite de 60 segundos

---

## 🎬 CONCLUSÃO

**Problema**: Sistema tenta filtrar por data na API ML, mas a API não suporta.  
**Resultado**: API retorna TODOS os claims, dando impressão que filtra por última sync.  
**Solução**: Aplicar filtro de data LOCALMENTE (frontend ou backend) após buscar dados.  

**Prioridade**: 🔥 ALTA - Afeta experiência do usuário  
**Impacto**: 💥 MÉDIO - Dados são retornados, mas sem filtro aplicado  
**Complexidade**: 🟢 BAIXA - Mover filtro para frontend/backend

---

## 📎 REFERÊNCIAS

- Edge Function: `supabase/functions/ml-api-direct/index.ts`
- Hook Principal: `src/features/devolucoes/hooks/useDevolucoesBusca.ts`
- Componente: `src/components/ml/DevolucaoAvancadasTab.tsx`
- Filtros: `src/components/ml/devolucao/DevolucaoFiltersUnified.tsx`
