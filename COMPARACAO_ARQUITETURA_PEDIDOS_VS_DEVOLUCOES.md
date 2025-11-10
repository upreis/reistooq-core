# 📊 COMPARAÇÃO ARQUITETURA: /pedidos vs /devolucoes-ml

## 🔍 ANÁLISE DETALHADA

### ✅ O QUE FUNCIONA EM /PEDIDOS

#### 1. **React Query (@tanstack/react-query)**
- ✅ Cache inteligente com `staleTime` e `gcTime`
- ✅ Deduplicação automática de requisições
- ✅ Estados de loading bem separados (`isLoading`, `isFetching`, `isRefetching`)
- ✅ Invalidação de cache controlada
- ✅ Prefetch para melhor UX

```typescript
// src/features/orders/hooks/queries/useOrdersQuery.ts
const {
  data: ordersData,
  isLoading,
  isFetching,
  isRefetching,
  isError,
  error,
  refetch: refetchOrders
} = useQuery({
  queryKey,
  queryFn: ({ queryKey: [, params] }) => orderService.list(params),
  staleTime: 60000, // 1 minuto
  gcTime: 300000, // 5 minutos
  refetchOnWindowFocus: false,
  enabled: options.enabled !== false,
  placeholderData: (prev) => prev, // Mantém dados anteriores
});
```

#### 2. **Separação Clara de Responsabilidades**
- **Queries**: `useOrdersQuery.ts` (buscar dados)
- **Mutations**: `useOrdersMutations.ts` (modificar dados)
- **Realtime**: `useOrdersRealtime.ts` (updates em tempo real)
- **UI State**: `useOrdersUI.ts` (estado da interface)

#### 3. **Provider Pattern**
```typescript
// OrdersProvider centraliza TUDO
<OrdersProvider>
  {children}
</OrdersProvider>

// Hooks especializados para acessar contexto
useOrdersData()   // Dados
useOrdersActions() // Ações
useOrdersState()  // Estados
```

#### 4. **Service Layer**
```typescript
// OrderService centraliza TODA comunicação com API
class OrderService {
  list(params: OrderListParams): Promise<OrderListResponse>
  details(id: string): Promise<Order>
  getStats(): Promise<OrderStats>
}
```

---

### ❌ O QUE ESTÁ ERRADO EM /DEVOLUCOES-ML

#### 1. **SWR Sem Controle**
- ❌ `useDevolucaoManager` usa SWR mas não controla duplicação
- ❌ `useDevolucaoData` TAMBÉM usa SWR (duplicação!)
- ❌ Múltiplos pontos de fetch = race conditions
- ❌ Cache key instável causa refetches desnecessários

```typescript
// PROBLEMA: useDevolucaoManager.ts linha 194
const { data, error: swrError, isLoading, mutate } = useSWR(
  swrKey || null,
  swrKey ? fetcher : null,
  {
    dedupingInterval: 2000, // Muito curto! Permite duplicação
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateOnMount: true, // ❌ Sempre busca ao montar
    // ...
  }
);
```

#### 2. **Estado Fragmentado**
- ❌ `useDevolucaoManager` tem estado local
- ❌ `useDevolucaoStore` (Zustand) tem outro estado
- ❌ `usePersistentDevolucaoState` tem cache
- ❌ SWR tem seu próprio cache
- ❌ 4 fontes de verdade diferentes!

#### 3. **Página Complexa Demais**
- ❌ 511 linhas em `DevolucoesMercadoLivre.tsx`
- ❌ Lógica de busca misturada com UI
- ❌ Múltiplos useEffects criando loops
- ❌ Estado de restauração manual

```typescript
// PROBLEMA: DevolucoesMercadoLivre.tsx linhas 257-361
const handleBuscar = async () => {
  // 105 linhas de lógica complexa
  // Mistura toasts, estados, filtros, SWR
  // Sem separação de responsabilidades
};
```

#### 4. **Edge Function sem Feedback**
- ❌ Edge function demora 60 segundos
- ❌ Nenhum feedback de progresso
- ❌ Frontend fica "travado" esperando
- ❌ Usuário clica múltiplas vezes = múltiplas requests

---

## 🎯 SOLUÇÃO PROPOSTA

### **OPÇÃO 1: Migrar para React Query (RECOMENDADO)**

#### Vantagens:
- ✅ Mesmo padrão de /pedidos
- ✅ Cache inteligente automático
- ✅ Deduplicação built-in
- ✅ Estados bem definidos
- ✅ Invalidação controlada

#### Estrutura:
```
src/features/devolucoes-online/
├── hooks/
│   ├── queries/
│   │   └── useDevolucaoQuery.ts       // React Query
│   ├── mutations/
│   │   └── useDevolucaoMutations.ts   // Ações
│   └── ui/
│       └── useDevolucaoUI.ts           // Estado UI
├── services/
│   └── devolucaoService.ts             // API calls
├── components/
│   └── layout/
│       └── DevolucaoProvider.tsx       // Context
└── types/
    └── devolucao.types.ts
```

#### Implementação:
```typescript
// 1. Service Layer
class DevolucaoService {
  async list(params: DevolucaoListParams) {
    const { data, error } = await supabase.functions.invoke('ml-returns', {
      body: params
    });
    
    if (error) throw error;
    return data;
  }
}

// 2. Query Hook
export function useDevolucaoQuery(
  filters: DevolucaoFilters,
  options = {}
) {
  return useQuery({
    queryKey: ['devolucoes', filters],
    queryFn: () => devolucaoService.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos (dados mudam devagar)
    gcTime: 10 * 60 * 1000,   // 10 minutos
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });
}

// 3. Provider
export function DevolucaoProvider({ children }) {
  const ui = useDevolucaoUI();
  const query = useDevolucaoQuery(ui.state.filters);
  
  return (
    <DevolucaoContext.Provider value={{ ui, query }}>
      {children}
    </DevolucaoContext.Provider>
  );
}

// 4. Página Simplificada
export default function DevolucoesMercadoLivre() {
  const { query } = useDevolucaoContext();
  
  return (
    <DevolucaoProvider>
      {/* UI components */}
    </DevolucaoProvider>
  );
}
```

---

### **OPÇÃO 2: Corrigir SWR Atual (RÁPIDO MAS LIMITADO)**

Se não quiser migrar para React Query agora:

#### Mudanças Críticas:

1. **REMOVER `useDevolucaoData`** - Está duplicado
2. **Centralizar em `useDevolucaoManager`** apenas
3. **Aumentar `dedupingInterval`** para 30 segundos
4. **Adicionar debounce** ao handleBuscar
5. **Controlar estado de loading** globalmente

```typescript
// Fix no useDevolucaoManager
const { data, error, isLoading, mutate } = useSWR(
  swrKey,
  fetcher,
  {
    dedupingInterval: 30000, // ✅ 30 segundos (evita duplicação)
    revalidateOnMount: false, // ✅ Não buscar ao montar
    revalidateIfStale: false, // ✅ Respeitar cache
    keepPreviousData: true,   // ✅ Manter dados ao mudar filtro
  }
);
```

---

## 📊 COMPARAÇÃO

| Aspecto | /pedidos (✅ Funciona) | /devolucoes-ml (❌ Atual) |
|---------|----------------------|--------------------------|
| **Cache** | React Query auto | SWR + Zustand + localStorage fragmentado |
| **Deduplicação** | Automática | Manual (falha) |
| **Estados** | `isLoading`, `isFetching`, `isRefetching` | `loading`, `isLoading`, `isSearching` |
| **Fetch** | Service layer | Inline no hook |
| **Página** | Simples, delegada | 511 linhas complexas |
| **Feedback** | Loading states claros | Toast manual |

---

## 🚀 PRÓXIMOS PASSOS

### Curto Prazo (Fix Imediato):
1. ✅ Adicionar `dedupingInterval: 30000` no SWR
2. ✅ Debounce de 2s no botão "Buscar"
3. ✅ Remover `revalidateOnMount: true`
4. ✅ Toast de progresso fake (Edge Function não reporta)

### Médio Prazo (Refactor):
1. 🔄 Migrar para React Query
2. 🔄 Criar DevolucaoService
3. 🔄 Criar DevolucaoProvider
4. 🔄 Simplificar página para <150 linhas

### Longo Prazo (Ideal):
1. 🎯 Streaming da Edge Function (Server-Sent Events)
2. 🎯 Progresso real do backend
3. 🎯 Websockets para updates em tempo real

---

## 💡 CONCLUSÃO

**O problema NÃO é a Edge Function, é a arquitetura do frontend!**

- ✅ /pedidos funciona porque usa React Query corretamente
- ❌ /devolucoes-ml falha porque usa SWR + Zustand + localStorage sem coordenação
- 🎯 **Solução**: Migrar para React Query OU corrigir SWR drasticamente

**Recomendação**: Migrar para React Query = consistência + manutenibilidade
