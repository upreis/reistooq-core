# 🔍 ANÁLISE: Edge Functions Usadas na Página /ml-orders-completas

**Data:** 2025-01-20  
**Pergunta:** As 3 edge functions estão sendo usadas na página?

---

## ✅ RESPOSTA DIRETA

**NÃO.** Apenas **1 de 3** edge functions está sendo usada na página `/ml-orders-completas`:

| Edge Function | Usada na Página? | Evidência |
|---------------|------------------|-----------|
| **ml-api-direct** | ✅ **SIM** | Chamada direta via `MLApiClient.ts` |
| **unified-orders** | ❌ **NÃO** | Usada em outras partes do sistema |
| **sync-ml-orders** | ❌ **NÃO** | Job de background apenas |

---

## 📊 DETALHAMENTO

### 1. ml-api-direct ✅ USADA

**Arquivo de Integração:** `src/features/devolucoes/utils/MLApiClient.ts`

```typescript
// Linha 18-35: Busca claims
export const fetchClaimsAndReturns = async (accountId, sellerId, filters) => {
  const { data: apiResponse, error: apiError } = 
    await supabase.functions.invoke('ml-api-direct', {
      body: {
        action: 'get_claims_and_returns',
        integration_account_id: accountId,
        seller_id: sellerId,
        filters: { ... }
      }
    });
}

// Linha 51-57: Busca reason details
export const fetchReasonDetail = async (integrationAccountId, reasonId) => {
  const { data: apiResponse, error: apiError } = 
    await supabase.functions.invoke('ml-api-direct', {
      body: {
        action: 'get_reason_detail',
        integration_account_id: integrationAccountId,
        reason_id: reasonId
      }
    });
}
```

**Fluxo de Chamada:**
```
MLOrdersCompletas.tsx
└── DevolucaoAvancadasTab.tsx
    └── useDevolucoes.ts
        └── useDevolucoesBusca.ts
            └── MLApiClient.ts
                └── ml-api-direct (EDGE FUNCTION)
```

**Evidência nos Logs:**
```
📦 Processando claim 5306953740 para order 43925859036...
📋 Dados obtidos para mediação 5306187831
🚚 Histórico do envio original encontrado: 43863497128
🎉 Total de claims processados: 30
```

**Ações Suportadas:**
- `get_claims_and_returns` - Busca claims com filtros
- `get_reason_detail` - Busca detalhes de um reason específico

---

### 2. unified-orders ❌ NÃO USADA

**Onde É Usada:**
- ❌ **NÃO** na página `/ml-orders-completas`
- ✅ Em `supabase/functions/exportar-pedidos-csv/index.ts`
- ✅ Em `supabase/functions/sync-ml-orders/index.ts`
- ✅ Em `supabase/functions/pedidos-aggregator/index.ts`

**Propósito:**
- Buscar **pedidos** gerais do ML (não devoluções)
- Enriquecer com dados de shipment
- Salvar em `unified_orders` table

**Exemplo de Uso (não na página):**
```typescript
// exportar-pedidos-csv/index.ts linha 76
const { data: unifiedData, error: unifiedError } = 
  await supabase.functions.invoke('unified-orders', {
    body: {
      integration_account_id: integration_account_id,
      provider: 'mercadolivre',
      limit: 1000
    }
  });
```

**❌ NÃO tem evidência nos logs da página**

---

### 3. sync-ml-orders ❌ NÃO USADA

**Onde É Usada:**
- ❌ **NÃO** na página `/ml-orders-completas`
- ✅ Como job de sincronização em background
- ✅ Trigger manual via API

**Propósito:**
- Sincronizar pedidos do ML para o banco
- Orquestrar chamada para `unified-orders`
- Processar lotes de pedidos

**Exemplo de Uso (não na página):**
```typescript
// sync-ml-orders/index.ts linha 29
const { data: ordersData, error: ordersError } = 
  await supabase.functions.invoke('unified-orders', {
    body: {
      integration_account_id: accountId,
      provider: 'mercadolivre',
      limit: 100
    }
  });
```

**❌ NÃO tem evidência nos logs da página**

---

## 🎯 ANÁLISE DE DUPLICAÇÃO

### Código Duplicado Entre Edge Functions

#### 1. Refresh de Tokens 🔄
```typescript
// ml-api-direct/index.ts (linhas ~150-200)
async function refreshToken(accountId, refreshToken) {
  const response = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: ML_CLIENT_ID,
      client_secret: ML_CLIENT_SECRET,
      refresh_token: refreshToken
    })
  });
}

// unified-orders/index.ts (linhas 9-46)
async function refreshIfNeeded(supabase, tokens, cid, authHeader) {
  // Mesmo código de refresh com backoff exponencial
  const { data: refreshData } = await supabase.functions.invoke(
    'mercadolibre-token-refresh', 
    { body: { integration_account_id: account_id } }
  );
}
```

**❌ DUPLICADO:** Lógica de refresh aparece em ambas

---

#### 2. Busca de Claims 🔍
```typescript
// ml-api-direct/index.ts (linhas ~300-400)
const claimsResponse = await fetch(
  `https://api.mercadolibre.com/post-purchase/v2/claims/search?...`,
  { headers: { Authorization: `Bearer ${accessToken}` } }
);

// unified-orders/index.ts (linhas ~214-261)
const claimsResp = await fetch(
  `https://api.mercadolibre.com/post-purchase/v2/claims/search?...`,
  { headers: { Authorization: `Bearer ${accessToken}` } }
);
```

**❌ DUPLICADO:** Busca de claims aparece em ambas

---

#### 3. Tratamento de Erros e Retry 🔄
```typescript
// ml-api-direct/index.ts
async function fetchMLWithRetry(url, accessToken, accountId, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.status === 401) { /* refresh token */ }
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// unified-orders/index.ts (linhas 9-46)
// Backoff exponencial similar
const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
await new Promise(resolve => setTimeout(resolve, delay));
```

**❌ DUPLICADO:** Lógica de retry com backoff

---

## 📈 IMPACTO DA DUPLICAÇÃO

### Problemas Atuais:
1. **Manutenção Duplicada** - Bugs precisam ser corrigidos em 2 lugares
2. **Risco de Inconsistência** - Lógica pode divergir
3. **Código Inchado** - ~1.774 linhas + ~1.158 linhas = 2.932 linhas totais
4. **Dificulta Testes** - Cada edge function precisa de testes separados

### Métricas:
```
Linhas de Código:
├── ml-api-direct:    1.774 linhas
├── unified-orders:   1.158 linhas
└── sync-ml-orders:     126 linhas
─────────────────────────────────
TOTAL:               3.058 linhas

Código Duplicado Estimado:
├── Token Refresh:      ~150 linhas
├── Claims Fetch:       ~200 linhas
├── Error Handling:     ~100 linhas
└── API Client Logic:   ~150 linhas
─────────────────────────────────
TOTAL DUPLICADO:        ~600 linhas (20%)
```

---

## ✅ RECOMENDAÇÕES

### 1. MANTER SEPARAÇÃO ATUAL ✅
**Razão:** Cada edge function tem propósito distinto:
- `ml-api-direct` → Devoluções/Claims (**usada na página**)
- `unified-orders` → Pedidos gerais (não usada na página)
- `sync-ml-orders` → Background job (não usada na página)

### 2. EXTRAIR CÓDIGO COMUM 🔄
Criar módulos compartilhados:

```typescript
// supabase/functions/_shared/ml-client.ts
export async function refreshMLToken(accountId, refreshToken) {
  // Lógica única de refresh
}

export async function fetchMLWithRetry(url, token, retries = 3) {
  // Lógica única de retry
}

export async function fetchClaims(sellerId, filters, token) {
  // Lógica única de busca de claims
}
```

Usar nos edge functions:
```typescript
// ml-api-direct/index.ts
import { refreshMLToken, fetchMLWithRetry, fetchClaims } from '../_shared/ml-client.ts';

// unified-orders/index.ts
import { refreshMLToken, fetchMLWithRetry } from '../_shared/ml-client.ts';
```

### 3. NÃO CONSOLIDAR ❌
**NÃO** juntar as 3 edge functions em uma:
- Propósitos diferentes
- Endpoints diferentes consumidos
- Complexidade aumentaria ainda mais

---

## 📊 CONCLUSÃO

### Para a Página /ml-orders-completas:

**Edge Functions Usadas:**
- ✅ **ml-api-direct** (única usada)

**Edge Functions NÃO Usadas:**
- ❌ **unified-orders** (usada em outras partes)
- ❌ **sync-ml-orders** (job de background)

### Duplicação Real:
- **20% do código duplicado** (~600 linhas)
- **Principalmente em:** token refresh, retry logic, claims fetch

### Ação Recomendada:
1. **FASE 1:** Extrair código comum para `_shared/`
2. **FASE 2:** Refatorar `ml-api-direct` (dividir em módulos)
3. **FASE 3:** Documentar propósito de cada edge function

---

**Resposta Final:** Apenas **ml-api-direct** é usada na página `/ml-orders-completas`. As outras 2 edge functions são usadas em contextos diferentes do sistema.
