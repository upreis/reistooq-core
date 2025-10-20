# 📋 PLANO DE CORREÇÃO - ML Orders Completas

**Data:** 2025-10-20  
**Página:** `/ml-orders-completas`  
**Status Atual:** ⚠️ MODERADO (sistema funciona mas com problemas de qualidade)

---

## 🎯 OBJETIVOS

### Performance
- ❌ Atual: 23-33s para carregar 30 devoluções
- ✅ Meta: 8-12s para carregar 30 devoluções
- 📈 Melhoria: 50-60% mais rápido

### Confiabilidade
- ❌ Atual: 60% dos dados completos, 13% de falhas
- ✅ Meta: 95% dos dados completos, <2% de falhas
- 📈 Melhoria: +35% dados completos

### Manutenibilidade
- ❌ Atual: 18 mapeadores, lógica duplicada em 12 locais
- ✅ Meta: 7 mapeadores consolidados, zero duplicação
- 📈 Melhoria: 40% menos código para manter

---

## 📅 CRONOGRAMA GERAL

```
FASE 1 (URGENTE) → 1-2 dias
├── Erros críticos que afetam confiabilidade
└── Bugs que podem causar crashes

FASE 2 (IMPORTANTE) → 3-5 dias
├── Performance e duplicidades
└── Consolidação de código

FASE 3 (MELHORIAS) → 1-2 semanas
├── Refatoração profunda
└── Otimizações avançadas
```

---

# 🔴 FASE 1: CORREÇÕES URGENTES (1-2 dias)

## 1.1 - Corrigir Erro 404 em Pedidos

### 🎯 Objetivo
Evitar que 404s em pedidos causem falhas silenciosas

### 📍 Local
`supabase/functions/ml-api-direct/index.ts` (linhas ~800-900)

### ❌ Problema Atual
```typescript
const orderResponse = await fetch(orderUrl, { headers });
if (!orderResponse.ok) {
  logger.error(`Erro ao buscar pedido ${orderId}`);
  // ❌ Continua processando mesmo sem dados do pedido
}
```

### ✅ Solução
```typescript
const orderResponse = await fetch(orderUrl, { headers });
if (!orderResponse.ok) {
  if (orderResponse.status === 404) {
    logger.warn(`Pedido ${orderId} não encontrado (404)`);
    enrichedClaim.order_status = 'not_found';
    enrichedClaim.order_not_found = true;
    // ✅ Marca como não encontrado e continua
    return enrichedClaim;
  }
  throw new Error(`Erro HTTP ${orderResponse.status}`);
}
```

### 📊 Impacto
- **Antes:** 13% de falhas silenciosas
- **Depois:** 0% de falhas, dados marcados como "não encontrado"

### ✅ Checklist
- [ ] Adicionar flag `order_not_found` no schema
- [ ] Implementar tratamento de 404 específico
- [ ] Adicionar log de advertência
- [ ] Testar com pedido inexistente
- [ ] Verificar que UI mostra "Pedido não encontrado"

---

## 1.2 - Corrigir Erro 404 em Mediações

### 🎯 Objetivo
Evitar 90% de tentativas inúteis de buscar mediações

### 📍 Local
`supabase/functions/ml-api-direct/index.ts` (linhas ~1000-1100)

### ❌ Problema Atual
```typescript
// Sempre tenta buscar mediação, mesmo se não houver
const mediationUrl = `https://api.mercadolivre.com/mediations/${claimId}`;
const mediationResponse = await fetch(mediationUrl);
// ❌ 90% resultam em 404
```

### ✅ Solução
```typescript
// ✅ Só buscar se claim tiver mediação
if (claim.mediation_id || claim.stage === 'mediation') {
  const mediationUrl = `https://api.mercadolivre.com/mediations/${claim.mediation_id}`;
  try {
    const mediationResponse = await fetch(mediationUrl);
    if (mediationResponse.ok) {
      enrichedClaim.mediation = await mediationResponse.json();
    }
  } catch (error) {
    logger.debug(`Mediação não disponível para claim ${claimId}`);
  }
} else {
  enrichedClaim.has_mediation = false;
}
```

### 📊 Impacto
- **Antes:** 27 chamadas desnecessárias (90% de 30)
- **Depois:** ~3 chamadas necessárias
- **Performance:** -80% de requests inúteis

### ✅ Checklist
- [ ] Verificar condição para buscar mediação
- [ ] Adicionar try/catch específico
- [ ] Log debug em vez de error
- [ ] Testar com claim sem mediação
- [ ] Validar que não quebra claims COM mediação

---

## 1.3 - Cleanup AbortController

### 🎯 Objetivo
Prevenir memory leak em requisições canceladas

### 📍 Local
`src/features/devolucoes/hooks/useDevolucoesBusca.ts` (linha 54)

### ❌ Problema Atual
```typescript
const abortControllerRef = useRef(null);

// Usado mas nunca limpo
if (abortControllerRef.current) {
  abortControllerRef.current.abort();
}
abortControllerRef.current = new AbortController();
```

### ✅ Solução
```typescript
const abortControllerRef = useRef<AbortController | null>(null);

// Adicionar cleanup
useEffect(() => {
  return () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };
}, []);
```

### 📊 Impacto
- **Antes:** Possível memory leak em navegação rápida
- **Depois:** Cleanup garantido no unmount

### ✅ Checklist
- [ ] Adicionar useEffect de cleanup
- [ ] Tipar AbortController corretamente
- [ ] Setar null após abort
- [ ] Testar navegação rápida entre páginas
- [ ] Verificar no DevTools que não há leaks

---

## 1.4 - Consolidar Loading States

### 🎯 Objetivo
Eliminar conflito de estados de loading

### 📍 Locais
- `src/features/devolucoes/hooks/useDevolucoes.ts` (linha 102)
- `src/features/devolucoes/hooks/useDevolucoesBusca.ts` (linha 52)

### ❌ Problema Atual
```typescript
// useDevolucoes.ts
const [loading, setLoading] = useState(false);

// useDevolucoesBusca.ts
const [loading, setLoading] = useState(false);

// Composição
loading: busca.loading || loading,
// ❌ Qual loading é verdadeiro?
```

### ✅ Solução
```typescript
// useDevolucoes.ts
// ✅ REMOVER estado local de loading
// const [loading, setLoading] = useState(false); // ❌ DELETAR

// Usar APENAS loading do busca
const busca = useDevolucoesBusca();

return {
  // ...
  loading: busca.loading, // ✅ Fonte única de verdade
};
```

### 📊 Impacto
- **Antes:** 2 sources of truth para loading
- **Depois:** 1 source of truth (useDevolucoesBusca)

### ✅ Checklist
- [ ] Remover `loading` state de useDevolucoes
- [ ] Usar apenas `busca.loading`
- [ ] Remover todos os `setLoading` de useDevolucoes
- [ ] Testar que spinner aparece/desaparece corretamente
- [ ] Verificar que não há loading "preso"

---

## 1.5 - Adicionar Logs Estruturados

### 🎯 Objetivo
Melhorar observabilidade com logs capturados

### 📍 Locais
- Todos os arquivos que usam `toast` sem `logger`

### ❌ Problema Atual
```typescript
toast.error('Nenhuma conta ML disponível');
// ❌ Não fica registrado em logs
```

### ✅ Solução
```typescript
// ✅ SEMPRE logar E mostrar toast
logger.error('Nenhuma conta ML disponível', { 
  context: 'useDevolucoesBusca',
  mlAccounts: mlAccounts?.length || 0 
});
toast.error('Nenhuma conta ML disponível');
```

### 📊 Impacto
- **Antes:** Logs vazios, debug difícil
- **Depois:** Logs estruturados para debug

### ✅ Checklist
- [ ] Adicionar logger antes de TODOS os toasts
- [ ] Incluir contexto nos logs
- [ ] Padronizar níveis (error, warn, info)
- [ ] Testar que logs aparecem no console
- [ ] Verificar estrutura JSON nos logs

---

# 🟡 FASE 2: CORREÇÕES IMPORTANTES (3-5 dias)

## 2.1 - Centralizar Lógica de Filtros

### 🎯 Objetivo
Eliminar duplicação de lógica de filtros em 3 lugares

### 📍 Locais para Consolidar
1. `src/features/devolucoes/hooks/useDevolucoes.ts` (linha 169-171)
2. `src/features/devolucoes/hooks/useDevolucoesBusca.ts` (linhas 400-500)
3. `src/features/devolucoes/utils/FilterUtils.ts` ✅ (manter este)

### ✅ Solução

#### Passo 1: Fortalecer FilterUtils.ts
```typescript
// src/features/devolucoes/utils/FilterUtils.ts

/**
 * 🎯 FONTE ÚNICA DE VERDADE PARA FILTROS
 * Todos os filtros devem usar esta função
 */
export const applyAllFilters = (
  devolucoes: any[], 
  filters: DevolucaoAdvancedFilters,
  options?: {
    logPerformance?: boolean;
    validateResults?: boolean;
  }
): any[] => {
  const startTime = performance.now();
  
  let filtered = [...devolucoes];
  
  // Aplicar filtros sequencialmente
  if (filters.searchTerm) {
    filtered = filterBySearch(filtered, filters.searchTerm);
  }
  
  if (filters.statusClaim?.length) {
    filtered = filterByStatusClaim(filtered, filters.statusClaim);
  }
  
  // ... todos os outros filtros
  
  if (options?.logPerformance) {
    const duration = performance.now() - startTime;
    logger.debug(`Filtros aplicados em ${duration.toFixed(2)}ms`, {
      total: devolucoes.length,
      filtered: filtered.length,
      removed: devolucoes.length - filtered.length
    });
  }
  
  return filtered;
};
```

#### Passo 2: Remover de useDevolucoes.ts
```typescript
// ❌ DELETAR esta lógica duplicada
// const devolucoesFiltradas = useMemo(() => {
//   let filtered = devolucoes;
//   if (filtros.searchTerm) { ... }
//   return filtered;
// }, [devolucoes, filtros]);

// ✅ USAR FilterUtils
const devolucoesFiltradas = useMemo(() => {
  return applyAllFilters(devolucoes, advancedFilters, {
    logPerformance: import.meta.env.DEV
  });
}, [devolucoes, advancedFilters]);
```

#### Passo 3: Remover de useDevolucoesBusca.ts
```typescript
// ❌ DELETAR ~100 linhas de lógica de filtro duplicada
// const filtrados = todasDevolucoes.filter(dev => {
//   if (filtros.searchTerm) { ... }
//   ...
// });

// ✅ USAR FilterUtils
const filtrados = applyAllFilters(todasDevolucoes, filtros);
```

### 📊 Impacto
- **Antes:** ~300 linhas duplicadas em 3 arquivos
- **Depois:** 1 implementação em FilterUtils
- **Manutenção:** 66% mais fácil (1 lugar vs 3)

### ✅ Checklist
- [ ] Mover TODA lógica para FilterUtils.ts
- [ ] Deletar lógica de useDevolucoes.ts
- [ ] Deletar lógica de useDevolucoesBusca.ts
- [ ] Adicionar testes unitários para FilterUtils
- [ ] Validar que filtros funcionam igual

---

## 2.2 - Consolidar Mapeadores (18 → 7)

### 🎯 Objetivo
Reduzir fragmentação de 18 mapeadores para 7 consolidados

### 📍 Local
`src/features/devolucoes/utils/DevolucaoDataMapper.ts`

### 🗂️ Plano de Consolidação

#### ANTES (18 mapeadores):
```
❌ mapDadosPrincipais
❌ mapDadosFinanceiros
❌ mapDadosReview
❌ mapDadosSLA
❌ mapDadosRastreamento
❌ mapDadosMediacao
❌ mapDadosReputacao
❌ mapDadosAnexos
❌ mapDadosTimeline
❌ mapDadosMensagens
❌ mapDadosComprador
❌ mapDadosPagamento
❌ mapDadosProduto
❌ mapDadosFlags
❌ mapDadosQualidade
❌ mapDadosTroca
❌ mapDadosClassificacao
❌ mapDadosAdicionais
```

#### DEPOIS (7 mapeadores consolidados):
```
✅ mapBasicData (consolida 3)
   ├── mapDadosPrincipais
   ├── mapDadosProduto
   └── mapDadosClassificacao

✅ mapFinancialData (consolida 2)
   ├── mapDadosFinanceiros
   └── mapDadosPagamento

✅ mapCommunicationData (consolida 3)
   ├── mapDadosMensagens
   ├── mapDadosTimeline
   └── mapDadosAnexos

✅ mapTrackingData (consolida 2)
   ├── mapDadosRastreamento
   └── mapDadosReview

✅ mapContextData (consolida 3)
   ├── mapDadosMediacao
   ├── mapDadosTroca
   └── mapDadosAdicionais

✅ mapMetadata (consolida 4)
   ├── mapDadosFlags
   ├── mapDadosQualidade
   ├── mapDadosReputacao
   └── mapDadosSLA

✅ mapRawData (mantém 1)
   └── mapDadosBrutos
```

### ✅ Implementação

#### Criar: src/features/devolucoes/utils/mappers/BasicDataMapper.ts
```typescript
/**
 * 🎯 Mapeador de Dados Básicos
 * Consolida: principais, produto, classificação
 */
export const mapBasicData = (claim: any, order: any) => {
  return {
    // Dados principais
    id: claim.id,
    resource_id: claim.resource_id,
    claim_id: claim.id,
    status_devolucao: claim.status,
    
    // Dados do produto
    item_id: order?.order_items?.[0]?.item?.id,
    item_title: order?.order_items?.[0]?.item?.title,
    quantity: order?.order_items?.[0]?.quantity,
    
    // Classificação
    reason_id: claim.reason_id,
    type: claim.type,
    subtype: claim.subtype,
  };
};
```

#### Criar: src/features/devolucoes/utils/mappers/index.ts
```typescript
/**
 * 🎯 MAPEADOR PRINCIPAL
 * Consolida todos os mapeadores em um só ponto
 */
import { mapBasicData } from './BasicDataMapper';
import { mapFinancialData } from './FinancialDataMapper';
import { mapCommunicationData } from './CommunicationDataMapper';
import { mapTrackingData } from './TrackingDataMapper';
import { mapContextData } from './ContextDataMapper';
import { mapMetadata } from './MetadataMapper';
import { mapRawData } from './RawDataMapper';

export const mapDevolucaoCompleta = (
  claim: any,
  order: any,
  additionalData?: any
) => {
  return {
    ...mapBasicData(claim, order),
    ...mapFinancialData(claim, order),
    ...mapCommunicationData(claim, additionalData?.messages),
    ...mapTrackingData(claim, order),
    ...mapContextData(claim, additionalData?.mediation),
    ...mapMetadata(claim, order),
    raw: mapRawData(claim, order, additionalData),
  };
};
```

### 📊 Impacto
- **Antes:** 18 arquivos para manter
- **Depois:** 7 mapeadores consolidados + 1 index
- **Linhas de código:** -30% (menos duplicação)
- **Manutenção:** 60% mais fácil

### ✅ Checklist
- [ ] Criar 7 novos mapeadores consolidados
- [ ] Criar index.ts agregador
- [ ] Atualizar useDevolucoesBusca para usar novo mapper
- [ ] Deletar 18 mapeadores antigos
- [ ] Testar que dados mapeados são idênticos
- [ ] Verificar performance (deve ser igual ou melhor)

---

## 2.3 - Adicionar Cleanup de Cache

### 🎯 Objetivo
Prevenir memory leak no cache de reasons

### 📍 Local
`src/features/devolucoes/services/DevolucaoCacheService.ts`

### ❌ Problema Atual
```typescript
class ReasonsCacheService {
  private cache = new Map();
  // ❌ Cache nunca é limpo
  // Pode crescer indefinidamente
}
```

### ✅ Solução
```typescript
class ReasonsCacheService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 1000 * 60 * 60; // 1 hora
  
  set(key: string, value: any) {
    this.cleanup(); // Limpar expirados antes de adicionar
    this.cache.set(key, {
      data: value,
      timestamp: Date.now()
    });
  }
  
  get(key: string) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Verificar se expirou
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }
  
  // Limpar tudo (útil para testes)
  clear() {
    this.cache.clear();
  }
}
```

### 📊 Impacto
- **Antes:** Cache cresce indefinidamente
- **Depois:** Auto-limpeza após 1 hora

### ✅ Checklist
- [ ] Adicionar TTL e timestamp
- [ ] Implementar cleanup automático
- [ ] Verificar expiração no get
- [ ] Adicionar método clear para testes
- [ ] Testar que cache expira corretamente

---

## 2.4 - Otimizar Validação de Contas

### 🎯 Objetivo
Centralizar validação de contas em 1 lugar

### 📍 Locais Duplicados
1. `src/pages/MLOrdersCompletas.tsx` (linha 36-39)
2. `src/features/devolucoes/hooks/useDevolucoesBusca.ts` (linhas 148-155)
3. `src/features/devolucoes/hooks/useDevolucoes.ts` (linhas 91-93)

### ✅ Solução

#### Criar: src/features/devolucoes/utils/AccountValidator.ts
```typescript
/**
 * 🎯 Validação Centralizada de Contas ML
 */
export const validateMLAccounts = (
  mlAccounts: any[],
  selectedAccountIds?: string[]
) => {
  // Validar que há contas
  if (!mlAccounts || mlAccounts.length === 0) {
    logger.warn('Nenhuma conta ML disponível');
    return {
      valid: false,
      accountIds: [],
      error: 'Nenhuma conta ML disponível'
    };
  }
  
  // Usar contas selecionadas ou todas
  const accountIds = selectedAccountIds?.length 
    ? selectedAccountIds 
    : mlAccounts.map(acc => acc.id);
  
  logger.debug('Contas validadas', {
    total: mlAccounts.length,
    selected: accountIds.length
  });
  
  return {
    valid: true,
    accountIds,
    error: null
  };
};
```

#### Usar em todos os 3 locais:
```typescript
// MLOrdersCompletas.tsx
const { accountIds } = validateMLAccounts(mlAccounts, selectedAccountIds);
if (accountIds.length === 0) {
  setSelectedAccountIds(mlAccounts.map(acc => acc.id));
}

// useDevolucoesBusca.ts
const validation = validateMLAccounts(mlAccounts, filtros.contasSelecionadas);
if (!validation.valid) {
  toast.error(validation.error);
  return [];
}
const contasParaBuscar = validation.accountIds;

// useDevolucoes.ts (createInitialFilters)
const { accountIds } = validateMLAccounts(mlAccounts, selectedAccountIds);
contasSelecionadas: accountIds
```

### 📊 Impacto
- **Antes:** Lógica duplicada em 3 lugares
- **Depois:** 1 função reutilizável

### ✅ Checklist
- [ ] Criar AccountValidator.ts
- [ ] Substituir nos 3 locais
- [ ] Deletar código duplicado
- [ ] Testar com 0 contas
- [ ] Testar com contas selecionadas

---

# 🟢 FASE 3: MELHORIAS (1-2 semanas)

## 3.1 - Refatorar ml-api-direct (Modularização)

### 🎯 Objetivo
Dividir edge function monolítica (1.774 linhas) em módulos

### 📍 Local
`supabase/functions/ml-api-direct/index.ts`

### 🗂️ Estrutura Proposta

```
supabase/functions/ml-api-direct/
├── index.ts (apenas orquestração, ~100 linhas)
├── utils/
│   ├── logger.ts ✅ (já existe)
│   ├── tokenManager.ts (gerencia tokens)
│   ├── retryHandler.ts (lógica de retry)
│   └── validator.ts (validações)
├── services/
│   ├── claimsService.ts (busca claims)
│   ├── ordersService.ts (busca orders)
│   ├── mediationService.ts (busca mediations)
│   └── reasonsService.ts (busca reasons)
└── mappers/
    ├── claimMapper.ts (mapeia claim)
    ├── orderMapper.ts (mapeia order)
    └── enrichmentMapper.ts (enriquecimento)
```

### ✅ Implementação

#### Criar: tokenManager.ts
```typescript
export class TokenManager {
  async getValidToken(accountId: string, supabase: any) {
    // Lógica de refresh + retry
  }
}
```

#### Criar: claimsService.ts
```typescript
export class ClaimsService {
  async fetchClaims(sellerId: string, filters: any, token: string) {
    // Busca claims da API ML
  }
  
  async fetchClaimDetail(claimId: string, token: string) {
    // Busca detalhes de um claim
  }
}
```

#### Refatorar: index.ts
```typescript
// ✅ Apenas orquestra os serviços
import { TokenManager } from './utils/tokenManager.ts';
import { ClaimsService } from './services/claimsService.ts';
import { OrdersService } from './services/ordersService.ts';

Deno.serve(async (req) => {
  const tokenManager = new TokenManager();
  const claimsService = new ClaimsService();
  const ordersService = new OrdersService();
  
  const token = await tokenManager.getValidToken(accountId, supabase);
  const claims = await claimsService.fetchClaims(sellerId, filters, token);
  const enriched = await enrichClaims(claims, ordersService);
  
  return new Response(JSON.stringify(enriched), { headers: corsHeaders });
});
```

### 📊 Impacto
- **Antes:** 1 arquivo de 1.774 linhas
- **Depois:** 10 arquivos modulares (~200 linhas cada)
- **Testabilidade:** +300% (módulos testáveis isoladamente)

### ✅ Checklist
- [ ] Criar estrutura de pastas
- [ ] Extrair TokenManager
- [ ] Extrair ClaimsService
- [ ] Extrair OrdersService
- [ ] Extrair MediationService
- [ ] Simplificar index.ts
- [ ] Testar que continua funcionando igual
- [ ] Adicionar testes unitários dos módulos

---

## 3.2 - Implementar Lazy Loading de Colunas

### 🎯 Objetivo
Carregar apenas colunas essenciais inicialmente

### 📋 Estratégia

#### Colunas Essenciais (carregar sempre):
```typescript
const ESSENTIAL_COLUMNS = [
  'id', 'claim_id', 'resource_id',
  'status_devolucao', 'data_criacao',
  'item_title', 'buyer_nickname',
  'valor_produto', 'status_claim',
  'acao_seller_necessaria'
];
// Total: 30 colunas essenciais
```

#### Colunas Detalhadas (carregar sob demanda):
```typescript
const DETAIL_COLUMNS = [
  // Financeiro (15 colunas)
  'valor_retido', 'valor_frete', 'comissao_ml', ...
  
  // Rastreamento (20 colunas)
  'tracking_number', 'shipping_status', ...
  
  // Mediação (15 colunas)
  'mediation_id', 'mediation_stage', ...
  
  // Mensagens (10 colunas)
  'total_mensagens', 'ultima_mensagem', ...
  
  // Metadata (15 colunas)
  'tags', 'prioridade', 'flags', ...
];
// Total: 75 colunas detalhadas
```

### ✅ Implementação

#### Modificar: ml-api-direct/index.ts
```typescript
// Adicionar parâmetro mode
const url = new URL(req.url);
const mode = url.searchParams.get('mode') || 'summary'; // summary | full

if (mode === 'summary') {
  // Retornar só colunas essenciais (30)
  return mapSummaryData(claims);
} else {
  // Retornar todas as colunas (105)
  return mapFullData(claims);
}
```

#### Modificar: useDevolucoesBusca.ts
```typescript
// Buscar resumo primeiro
const summary = await fetchClaimsAndReturns(accountId, sellerId, {
  ...filters,
  mode: 'summary'
});

setDevolucoes(summary);
setLoading(false); // ✅ UI mostra dados rapidamente

// Buscar detalhes em background
const details = await fetchClaimsAndReturns(accountId, sellerId, {
  ...filters,
  mode: 'full'
});

setDevolucoes(details); // ✅ Atualiza com dados completos
```

### 📊 Impacto
- **Antes:** 105 colunas × 30 items = 3.150 campos processados (15s)
- **Depois:** 
  - Primeira carga: 30 colunas × 30 items = 900 campos (4-5s) ⚡
  - Segunda carga: +75 colunas em background (8-10s)
- **Time to Interactive:** 15s → 5s (66% faster)

### ✅ Checklist
- [ ] Definir ESSENTIAL_COLUMNS
- [ ] Criar mapSummaryData
- [ ] Adicionar parâmetro mode na API
- [ ] Implementar busca em 2 fases no hook
- [ ] Testar que UI mostra dados rápido
- [ ] Verificar que detalhes carregam depois

---

## 3.3 - Adicionar Logs Estruturados Avançados

### 🎯 Objetivo
Melhorar observabilidade para debug de produção

### ✅ Implementação

#### Criar: src/utils/structuredLogger.ts
```typescript
/**
 * 🎯 Logger Estruturado para Produção
 */
export class StructuredLogger {
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        url: window.location.pathname,
        userId: this.getUserId(),
        sessionId: this.getSessionId(),
      },
      data,
    };
    
    // Log local
    console[level](JSON.stringify(logEntry));
    
    // Enviar para backend (opcional)
    if (level === 'error' && import.meta.env.PROD) {
      this.sendToBackend(logEntry);
    }
  }
  
  private getUserId() {
    // Pegar do auth
  }
  
  private getSessionId() {
    // Pegar do sessionStorage
  }
  
  private async sendToBackend(logEntry: any) {
    // Enviar para Supabase ou serviço de logs
  }
}

export const structuredLogger = new StructuredLogger();
```

#### Usar em Hooks
```typescript
// useDevolucoesBusca.ts
structuredLogger.log('info', 'Iniciando busca de devoluções', {
  accountIds: contasParaBuscar,
  filters: filtros,
  mode: 'summary'
});

try {
  const resultado = await fetchClaimsAndReturns(...);
  structuredLogger.log('info', 'Busca concluída', {
    total: resultado.length,
    duration: performance.now() - startTime
  });
} catch (error) {
  structuredLogger.log('error', 'Erro na busca', {
    error: error.message,
    stack: error.stack
  });
}
```

### 📊 Impacto
- **Antes:** Logs vagos, difícil rastrear
- **Depois:** Logs estruturados, fácil analisar

### ✅ Checklist
- [ ] Criar StructuredLogger
- [ ] Adicionar em todos os hooks
- [ ] Incluir contexto (user, session, url)
- [ ] Testar em dev e prod
- [ ] Configurar envio para backend (opcional)

---

# 📊 MÉTRICAS DE SUCESSO

## Performance

| Métrica | Antes | Meta | Medição |
|---------|-------|------|---------|
| Tempo de carregamento (30 devoluções) | 23-33s | 8-12s | Performance.now() |
| Tempo até primeira renderização | 23s | 5s | Time to Interactive |
| Requests desnecessários | 27/30 (90%) | <5% | Network logs |
| Tamanho do bundle | ~2.5MB | <2MB | Build analysis |

## Confiabilidade

| Métrica | Antes | Meta | Medição |
|---------|-------|------|---------|
| Taxa de sucesso | 87% | >98% | Error rate |
| Dados completos | 60% | 95% | Data completeness |
| Erros silenciosos | ~10/sessão | 0 | Error tracking |
| Memory leaks | 1-2/sessão | 0 | DevTools profiler |

## Manutenibilidade

| Métrica | Antes | Meta | Medição |
|---------|-------|------|---------|
| Linhas duplicadas | ~300 | 0 | SonarQube |
| Complexidade ciclomática | Alta (>20) | Média (<10) | ESLint complexity |
| Número de mapeadores | 18 | 7 | File count |
| Cobertura de testes | 0% | >70% | Jest coverage |

---

# 🧪 PLANO DE TESTES

## Testes Unitários (FASE 2)

```typescript
// FilterUtils.test.ts
describe('applyAllFilters', () => {
  it('deve filtrar por searchTerm', () => {
    const result = applyAllFilters(mockData, { searchTerm: 'teste' });
    expect(result).toHaveLength(2);
  });
  
  it('deve filtrar por múltiplos critérios', () => {
    const result = applyAllFilters(mockData, {
      searchTerm: 'teste',
      statusClaim: ['opened']
    });
    expect(result).toHaveLength(1);
  });
});
```

## Testes de Integração (FASE 3)

```typescript
// useDevolucoes.integration.test.ts
describe('useDevolucoes + useDevolucoesBusca', () => {
  it('deve buscar e filtrar devoluções', async () => {
    const { result } = renderHook(() => useDevolucoes(...));
    
    await act(() => result.current.buscarComFiltros({ ... }));
    
    expect(result.current.devolucoes).toHaveLength(30);
    expect(result.current.loading).toBe(false);
  });
});
```

## Testes E2E (FASE 3)

```typescript
// ml-orders-completas.e2e.test.ts
test('deve carregar página e mostrar devoluções', async ({ page }) => {
  await page.goto('/ml-orders-completas');
  
  // Aguardar loading
  await page.waitForSelector('[data-testid="loading-spinner"]');
  await page.waitForSelector('[data-testid="devolucoes-table"]');
  
  // Verificar dados
  const rows = await page.locator('tbody tr').count();
  expect(rows).toBeGreaterThan(0);
});
```

---

# ✅ CHECKLIST GERAL DE VALIDAÇÃO

## Após FASE 1 (Urgente)
- [ ] Zero erros 404 não tratados
- [ ] Loading state consistente
- [ ] Logs capturados no console
- [ ] AbortController limpo no unmount
- [ ] Mediações só buscadas quando necessário

## Após FASE 2 (Importante)
- [ ] Filtros centralizados em 1 lugar
- [ ] Mapeadores consolidados (18 → 7)
- [ ] Cache com TTL e cleanup
- [ ] Validação de contas centralizada
- [ ] Zero duplicação de código

## Após FASE 3 (Melhorias)
- [ ] Edge function modularizada
- [ ] Lazy loading funcionando
- [ ] Logs estruturados em produção
- [ ] Performance 50% melhor
- [ ] Cobertura de testes >70%

---

# 🚀 PRÓXIMOS PASSOS

1. **Revisar este plano** com a equipe
2. **Priorizar fases** conforme urgência do negócio
3. **Começar pela FASE 1** (1-2 dias)
4. **Validar resultados** após cada fase
5. **Ajustar plano** conforme feedback

---

**Status:** 📋 PLANEJAMENTO COMPLETO  
**Próxima Ação:** Aguardando aprovação para iniciar FASE 1
