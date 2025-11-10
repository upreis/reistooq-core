# 🚨 DIAGNÓSTICO: Timeout na Edge Function ml-returns

**Data:** 2025-11-10  
**Problema:** Página não carrega dados, toasts não aparecem, erro 504 Gateway Timeout

## 📊 Sintomas Identificados

### 1. ✅ **Toasts Implementados Corretamente**
- ✅ `Sonner` renderizado no App.tsx (linha 111)
- ✅ Imports corretos em DevolucoesMercadoLivre.tsx (linha 27)
- ✅ Código de toasts na função `handleBuscar` (linhas 272-350)

### 2. ❌ **Edge Function com Timeout**
**Evidências do Console:**
```
ERROR_FAILED 504 (Gateway Timeout)
FunctionsFetchError: Failed to send a request to the Edge Function
```

**Logs da Edge Function:**
- ✅ Processamento paralelo funcionando
- ✅ Enriquecimento de dados completo
- ⚠️ **PROBLEMA:** Demora excessiva (>60s para processar)

### 3. 🔍 **Causa Raiz**
A **Fase 2** implementou processamento paralelo ilimitado:
```typescript
// ml-returns/index.ts linha 250
const accountResults = await Promise.all(
  accountIds.map(async (accountId) => {
    // Processa TODAS as contas simultaneamente
    const claimsResults = await Promise.all(
      claimsData.data.map(async (claim) => {
        // Processa TODOS os claims simultaneamente
        // ❌ PROBLEMA: Centenas de requests simultâneos à API ML
      })
    )
  })
)
```

**Resultado:**
- 4 contas × ~50 claims = **200 requests simultâneos**
- API ML rate limit: **429 Too Many Requests**
- Edge Function timeout: **504 Gateway Timeout**
- Tempo de execução: **>60s** (limite Supabase: 60s)

## 🎯 Soluções Propostas

### Solução 1: Throttling/Batching (RECOMENDADO)
Limitar requests simultâneos usando `p-limit`:

```typescript
import pLimit from 'p-limit';

const limit = pLimit(10); // Máximo 10 simultâneos

const claimsResults = await Promise.all(
  claimsData.data.map(claim => 
    limit(() => processarClaim(claim))
  )
);
```

**Vantagens:**
- ✅ Mantém paralelismo (10x mais rápido que sequencial)
- ✅ Evita rate limit 429
- ✅ Tempo: ~15-20s (dentro do limite)

### Solução 2: Reduzir Período de Busca
Aplicar filtro de 30 dias por padrão:

```typescript
const MAX_SAFE_DAYS = 30;
const days = Math.min(parseInt(periodo), MAX_SAFE_DAYS);
```

**Vantagens:**
- ✅ Menos claims para processar
- ✅ Performance melhor
- ❌ Usuário precisa fazer múltiplas buscas para histórico

### Solução 3: Cache Agressivo
Usar cache de 24h para dados enriquecidos:

```typescript
// Verificar cache antes de enriquecer
const cacheHours = 24;
const cacheThreshold = new Date(Date.now() - cacheHours * 60 * 60 * 1000);

if (existingData && existingData.enriched_at > cacheThreshold) {
  return existingData; // Usar cache
}
```

**Vantagens:**
- ✅ Evita re-processamento
- ✅ Performance instantânea
- ❌ Dados podem ficar desatualizados

## 📋 Plano de Ação

### Prioridade 1: Throttling (CRÍTICO)
1. Instalar `p-limit`: `npm install p-limit`
2. Implementar throttling no processamento de claims
3. Configurar 10 requests simultâneos + delay de 500ms entre lotes

### Prioridade 2: Cache Otimizado
1. Aumentar cache de 1h para 24h
2. Adicionar opção "Forçar atualização" para usuário

### Prioridade 3: UI de Loading
1. ✅ Toasts já implementados
2. Adicionar barra de progresso com % concluído
3. Mostrar "X de Y claims processados"

## 🧪 Teste de Validação

**Cenário:** Busca de 1 conta com 50 claims

### Estado Atual (SEM throttling):
- ❌ 50 requests simultâneos
- ❌ Rate limit 429
- ❌ Timeout 504
- ❌ Tempo: >60s

### Estado Esperado (COM throttling):
- ✅ 10 requests simultâneos
- ✅ Sem rate limit
- ✅ Sem timeout
- ✅ Tempo: 15-20s

## 📝 Notas Técnicas

### Limites do Mercado Livre API
- **Rate Limit:** ~20 req/s por token
- **Concurrent Limit:** ~10 simultâneos
- **Timeout:** 30s por request

### Limites Supabase Edge Functions
- **Timeout:** 60s máximo
- **Memory:** 512MB
- **Concurrent:** Ilimitado (mas custa $$$)

### Arquitetura Atual
```
Frontend (React)
    ↓ toast.loading()
Edge Function (ml-returns)
    ↓ Promise.all() ILIMITADO ❌
API Mercado Livre
    ↓ 429 Too Many Requests
Timeout 504
```

### Arquitetura Proposta
```
Frontend (React)
    ↓ toast.loading("X/Y processados")
Edge Function (ml-returns)
    ↓ pLimit(10) ✅
    ↓ delay(500ms) entre lotes
API Mercado Livre
    ↓ 200 OK
Success! Dados salvos
```
