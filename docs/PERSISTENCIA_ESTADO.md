# 📚 Documentação: Sistema de Persistência de Estado

## 🎯 Objetivo
Manter dados, filtros e paginação em cache quando o usuário sai e volta para a página, exibindo instantaneamente os últimos resultados sem precisar fazer nova busca.

---

## 🏗️ Arquitetura Implementada

### 1️⃣ Hook de Persistência (`usePersistentDevolucaoState.ts`)

**Localização:** `src/features/devolucoes-online/hooks/usePersistentDevolucaoState.ts`

**Responsabilidades:**
- Gerenciar `localStorage` para salvar/carregar estado
- Validar cache (versão, expiração)
- Fornecer métodos para salvar dados, filtros, paginação

**Estrutura de Dados Salvos:**
```typescript
interface PersistedDevolucaoState {
  devolucoes: MLReturn[];           // Dados da última busca
  total: number;                     // Total de registros
  currentPage: number;               // Página atual
  integrationAccountId: string;      // Contas selecionadas (separadas por vírgula)
  filters: DevolucaoFilters;         // Filtros aplicados (datas, status, etc)
  quickFilter?: string;              // Filtro rápido
  appliedAt?: string;                // Timestamp da última aplicação
  cachedAt?: string;                 // Timestamp do cache
}
```

**Configurações:**
```typescript
const STORAGE_KEY = 'devolucoes_ml_state';
const STORAGE_VERSION = 1;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas
```

**Métodos Principais:**
```typescript
// Salvar dados da busca
saveOrdersData(devolucoes: MLReturn[], total: number, currentPage: number)

// Salvar conta(s) selecionada(s)
saveIntegrationAccountId(integrationAccountId: string)

// Salvar filtros aplicados
saveAppliedFilters(filters: DevolucaoFilters)

// Salvar filtro rápido
saveQuickFilter(quickFilter: string)

// Limpar tudo
clearPersistedState()

// Verificar se tem cache válido
hasValidPersistedState(): boolean
```

---

### 2️⃣ Manager com SWR (`useDevolucaoManager.ts`)

**Localização:** `src/features/devolucoes-online/hooks/useDevolucaoManager.ts`

**Responsabilidades:**
- Buscar dados via SWR (com cache automático)
- Gerenciar estado (loading, error, dados)
- **CRÍTICO:** Método `restorePersistedData()` que restaura dados SEM loading

**Método Chave:**
```typescript
const restorePersistedData = useCallback((
  restoredDevolucoes: MLReturn[], 
  restoredTotal: number, 
  page: number
) => {
  console.log('✅ Restaurando dados persistidos (exibindo instantaneamente)');
  setDevolucoes(restoredDevolucoes);
  setTotal(restoredTotal);
  setCurrentPage(page);
  setCachedAt(new Date());
  setLoading(false); // ⚡ CRÍTICO: Desligar loading para aparecer instantaneamente
}, []);
```

**Ações Exportadas:**
```typescript
interface DevolucaoManagerActions {
  setMultipleAccounts: (ids: string[]) => void;
  setIntegrationAccountId: (id: string) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  restorePersistedData: (devolucoes, total, page) => void; // ⚡ CRUCIAL
  refetch: () => void;
}
```

---

### 3️⃣ Página Principal (`DevolucoesMercadoLivre.tsx`)

**Localização:** `src/pages/DevolucoesMercadoLivre.tsx`

**Fluxo de Restauração (ORDEM CRÍTICA):**

#### 🔴 Etapa 1: Restaurar Cache SÍNCRONO (Sem Delay)
```typescript
// ✅ PRIMEIRO: Restaurar cache IMEDIATAMENTE (síncrono)
useEffect(() => {
  if (!persistentState.isStateLoaded || hasRestoredFromCache) return;
  
  if (persistentState.hasValidPersistedState()) {
    const cached = persistentState.persistedState;
    
    // ⚡ Restaurar dados PRIMEIRO (sem loading)
    if (cached.devolucoes && cached.devolucoes.length > 0) {
      actions.restorePersistedData(cached.devolucoes, cached.total, cached.currentPage);
    }
    
    // ✅ Restaurar contas
    const accountIds = cached.integrationAccountId.split(',');
    setSelectedAccountIds(accountIds);
    
    if (accountIds.length > 1) {
      actions.setMultipleAccounts(accountIds);
    } else {
      actions.setIntegrationAccountId(accountIds[0]);
    }
    
    // ✅ Restaurar período/filtros
    if (cached.filters?.dateFrom && cached.filters?.dateTo) {
      const diffDays = Math.round(
        (new Date(cached.filters.dateTo).getTime() - 
         new Date(cached.filters.dateFrom).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      setPeriodo(diffDays.toString());
    }
    
    setHasRestoredFromCache(true);
  }
}, [persistentState.isStateLoaded, hasRestoredFromCache]);
```

#### 🟢 Etapa 2: Buscar Contas ASSÍNCRONO (Depois)
```typescript
// ✅ SEGUNDO: Carregar contas do banco (assíncrono)
useEffect(() => {
  const fetchAccounts = async () => {
    const { data } = await supabase
      .from('integration_accounts')
      .select('id, name')
      .eq('provider', 'mercadolivre')
      .eq('is_active', true);
    
    setAccounts(data || []);
    
    // Se é primeira vez (sem cache), apenas selecionar contas
    if (!hasRestoredFromCache && !persistentState.hasValidPersistedState()) {
      setSelectedAccountIds(data.map(acc => acc.id));
      setHasRestoredFromCache(true);
    }
  };
  
  if (persistentState.isStateLoaded) {
    fetchAccounts();
  }
}, [persistentState.isStateLoaded]);
```

#### 🔵 Etapa 3: Salvar Automaticamente Quando Dados Mudam
```typescript
// ✅ Salvar dados quando mudar (mas só se não estiver restaurando)
useEffect(() => {
  if (state.devolucoes.length > 0 && !state.loading && hasRestoredFromCache) {
    const accountKey = selectedAccountIds.sort().join(',');
    
    persistentState.saveOrdersData(
      state.devolucoes, 
      state.total, 
      state.currentPage
    );
    persistentState.saveIntegrationAccountId(accountKey);
    
    console.log('💾 Estado persistido salvo');
  }
}, [state.devolucoes, state.total, state.currentPage, state.loading]);
```

---

## 📋 Checklist de Implementação para Outras Páginas

### 1. Criar Hook de Persistência
```typescript
// src/features/[feature]/hooks/usePersistent[Feature]State.ts

interface Persisted[Feature]State {
  items: Item[];
  total: number;
  currentPage: number;
  integrationAccountId: string;
  filters: Filters;
  appliedAt?: string;
  cachedAt?: string;
}

const STORAGE_KEY = '[feature]_state';
const CACHE_DURATION = 24 * 60 * 60 * 1000;
```

### 2. Adicionar Método no Manager
```typescript
// ⚡ CRÍTICO: Restaurar SEM loading
const restorePersistedData = useCallback((items, total, page) => {
  setItems(items);
  setTotal(total);
  setCurrentPage(page);
  setLoading(false); // ⚡ Crucial para aparecer instantaneamente
}, []);
```

### 3. Implementar Restauração na Página
```typescript
// ✅ Ordem CRÍTICA:
// 1. useEffect SÍNCRONO para restaurar cache
// 2. useEffect ASSÍNCRONO para buscar metadados
// 3. useEffect para salvar automaticamente
```

---

## ⚡ Pontos CRÍTICOS para Performance

### 1. **Separar Restauração (Síncrono) de Fetch (Assíncrono)**
❌ **ERRADO** (causa delay):
```typescript
useEffect(() => {
  const fetchAccounts = async () => {
    await loadAccounts(); // Assíncrono
    restoreCache(); // Espera fetch terminar
  };
}, []);
```

✅ **CORRETO** (sem delay):
```typescript
// Primeiro useEffect: Restaurar cache (síncrono)
useEffect(() => {
  restoreCache(); // Imediato
}, []);

// Segundo useEffect: Buscar contas (assíncrono)
useEffect(() => {
  fetchAccounts(); // Não bloqueia
}, []);
```

### 2. **Desligar Loading ao Restaurar**
```typescript
// ⚡ Sem isso, dados aparecem mas com skeleton loader
setLoading(false); // Crucial no restorePersistedData
```

### 3. **Sincronizar Manager com Filtros Restaurados**
```typescript
// ✅ Importante para SWR key funcionar corretamente
if (accountIds.length > 1) {
  actions.setMultipleAccounts(accountIds);
} else {
  actions.setIntegrationAccountId(accountIds[0]);
}
```

---

## 📦 Template Rápido para Copiar

### Para aplicar em `/vendas-online`:

1. **Criar:** `src/features/vendas-online/hooks/usePersistentVendasState.ts`
   - Copiar de `usePersistentDevolucaoState.ts`
   - Trocar tipos: `MLReturn` → `Venda`
   - Trocar `STORAGE_KEY`: `'vendas_online_state'`

2. **Modificar Manager:** `src/features/vendas-online/hooks/useVendasManager.ts`
   - Adicionar método `restorePersistedData` com `setLoading(false)`

3. **Página:** `src/pages/VendasOnline.tsx`
   - Implementar 2 `useEffect` separados (síncrono + assíncrono)
   - Usar `persistentState.saveOrdersData()` quando dados mudarem

---

## 🎯 Resumo do Que Pedir ao AI

Para aplicar em **qualquer página**, envie:

```
Aplique o padrão de persistência de estado da página /devolucoes-ml 
na página /[nome-da-pagina]:

1. Criar hook usePersistent[Feature]State.ts para salvar/carregar do localStorage
2. Adicionar método restorePersistedData() no manager (COM setLoading(false))
3. Implementar 2 useEffect na página:
   - Primeiro (síncrono): restaurar cache instantaneamente
   - Segundo (assíncrono): buscar metadados sem bloquear
4. Salvar automaticamente quando dados mudarem

CRÍTICO: Restauração deve ser SÍNCRONA e ANTES de qualquer fetch assíncrono.
```

---

## 🔍 Arquivos de Referência

- Hook de Persistência: `src/features/devolucoes-online/hooks/usePersistentDevolucaoState.ts`
- Manager: `src/features/devolucoes-online/hooks/useDevolucaoManager.ts`
- Página: `src/pages/DevolucoesMercadoLivre.tsx`

**Copie esses arquivos como template e adapte para sua feature!** 🚀
