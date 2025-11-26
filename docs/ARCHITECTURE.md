# 🏗️ Arquitetura do Sistema

## 📋 Visão Geral

Este documento descreve a arquitetura geral do sistema, patterns utilizados e decisões arquiteturais principais.

---

## 🎯 Stack Tecnológica

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **TailwindCSS** - Utility-first CSS
- **shadcn/ui** - Component library
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching & caching
- **TanStack Table** - Table management
- **Zustand** - State management
- **Zod** - Schema validation

### Backend (Lovable Cloud)
- **Supabase** - Database & Auth
- **Edge Functions** - Serverless backend
- **Row Level Security (RLS)** - Data security
- **Storage** - File management

---

## 📁 Estrutura de Diretórios

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # shadcn components
│   └── ...             # App-specific components
├── features/           # Features por domínio
│   ├── reclamacoes/    # Feature de reclamações
│   ├── pedidos/        # Feature de pedidos
│   ├── vendas-online/  # Feature de vendas
│   └── ...
├── hooks/              # Custom React hooks
├── lib/                # Bibliotecas e utilitários
│   ├── api/           # API client
│   ├── performance/   # Performance monitoring
│   └── quality/       # Code quality tools
├── integrations/       # Integrações externas
│   └── supabase/      # Supabase client & types
├── pages/              # Page components
├── utils/              # Utility functions
└── stores/             # Zustand stores

supabase/
├── functions/          # Edge Functions
└── migrations/         # Database migrations

docs/
├── ARCHITECTURE.md     # Este arquivo
├── CONTRIBUTING.md     # Guia de contribuição
├── PATTERNS.md         # Patterns e best practices
└── API.md             # API documentation
```

---

## 🎨 Arquitetura por Camadas

### 1. **Camada de Apresentação (UI)**
- **Componentes React** - Presentational & Container components
- **Pages** - Page-level components com roteamento
- **Layouts** - Layout wrappers (FullLayout, AuthLayout)

### 2. **Camada de Lógica de Negócio**
- **Custom Hooks** - Encapsulam lógica de features
- **Stores (Zustand)** - Estado global quando necessário
- **Utils** - Funções utilitárias puras

### 3. **Camada de Dados**
- **TanStack Query** - Cache & fetching
- **Supabase Client** - Database queries
- **Edge Functions** - Backend logic

### 4. **Camada de Integração**
- **API Client** - Unified HTTP client
- **Supabase Integration** - Auth, DB, Storage
- **External APIs** - Mercado Livre, Shopee, etc.

---

## 🏛️ Padrões Arquiteturais

### Feature-Based Architecture

Cada feature possui sua própria pasta com estrutura completa:

```
features/reclamacoes/
├── components/         # Componentes específicos
│   ├── ReclamacoesTable.tsx
│   ├── ReclamacoesFilterBar.tsx
│   └── cells/         # Table cell components
├── hooks/             # Hooks da feature
│   ├── useReclamacoesData.ts
│   ├── useReclamacoesFilters.ts
│   └── useReclamacoesColumnManager.ts
├── utils/             # Utils da feature
│   ├── filterUtils.ts
│   └── columnStorageUtils.ts
├── types/             # TypeScript types
│   └── index.ts
└── constants/         # Constantes
    └── index.ts
```

**Vantagens:**
- ✅ Coesão alta - código relacionado junto
- ✅ Isolamento - mudanças não afetam outras features
- ✅ Escalabilidade - fácil adicionar novas features
- ✅ Manutenibilidade - fácil encontrar e modificar código

### Composition over Inheritance

Preferimos composição de componentes ao invés de herança:

```typescript
// ✅ BOM - Composição
<ErrorBoundary>
  <Suspense fallback={<Loading />}>
    <PageContent />
  </Suspense>
</ErrorBoundary>

// ❌ EVITAR - Herança forçada
class MyPage extends BasePage { ... }
```

### Single Responsibility Principle (SRP)

Cada módulo/componente tem uma única responsabilidade:

```typescript
// ✅ BOM - Responsabilidades separadas
function useReclamacoesData() { /* fetch data */ }
function useReclamacoesFilters() { /* manage filters */ }
function useReclamacoesColumnManager() { /* manage columns */ }

// ❌ EVITAR - Tudo em um hook gigante
function useReclamacoes() { 
  /* fetch + filters + columns + state + effects */
}
```

---

## 🔄 Fluxo de Dados

### Client → Server (Request)

```
User Action
  ↓
Component/Page
  ↓
Custom Hook (useXData)
  ↓
TanStack Query
  ↓
API Client (fetch/supabase)
  ↓
Edge Function / Database
```

### Server → Client (Response)

```
Edge Function / Database
  ↓
Response Data
  ↓
TanStack Query Cache
  ↓
Custom Hook
  ↓
Component Re-render
  ↓
UI Update
```

### Estado Local vs Global

**Estado Local (useState, useReducer):**
- UI state (modals, dropdowns)
- Form state
- Component-specific state

**Estado Global (Zustand):**
- User authentication
- Organization data
- Theme preferences
- Cross-feature shared state

**Cache Global (TanStack Query):**
- Server data
- API responses
- Invalidation automática

---

## 🔐 Segurança

### Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado com policies:

```sql
-- Users podem ver apenas dados de sua organização
CREATE POLICY "Users can view org data"
ON public.pedidos
FOR SELECT
USING (organization_id = (
  SELECT organization_id 
  FROM public.profiles 
  WHERE user_id = auth.uid()
));
```

### Authentication Flow

```
1. User login (email/password ou OAuth)
   ↓
2. Supabase Auth valida credenciais
   ↓
3. JWT token gerado e armazenado
   ↓
4. Refresh token para renovação automática
   ↓
5. RLS policies aplicadas em queries
```

### API Security

- ✅ Todas Edge Functions requerem autenticação
- ✅ Validação de input com Zod schemas
- ✅ Rate limiting em endpoints sensíveis
- ✅ CORS configurado para domínios permitidos

---

## 📊 Performance

### Code Splitting

```typescript
// Lazy loading de páginas
const ReclamacoesPage = lazy(() => import('@/pages/ReclamacoesPage'));

// Suspense para loading state
<Suspense fallback={<Loading />}>
  <ReclamacoesPage />
</Suspense>
```

### Data Caching

```typescript
// TanStack Query cache automático
const { data } = useQuery({
  queryKey: ['reclamacoes', filters],
  queryFn: fetchReclamacoes,
  staleTime: 5 * 60 * 1000, // 5 minutos
});
```

### Memoization

```typescript
// React.memo para components
export const ExpensiveComponent = memo(({ data }) => {
  return <div>{/* render */}</div>;
});

// useMemo para computações pesadas
const processedData = useMemo(() => 
  expensiveProcessing(rawData),
  [rawData]
);

// useCallback para funções estáveis
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

---

## 🧪 Testing Strategy

### Unit Tests
- Utils functions
- Custom hooks (com React Testing Library)
- Type guards

### Integration Tests
- Feature flows completos
- API integration
- Component interaction

### E2E Tests (Playwright)
- Critical user flows
- Login/logout
- Data CRUD operations

---

## 📦 Build & Deploy

### Development
```bash
npm run dev          # Local dev server
npm run type-check   # TypeScript validation
npm run lint         # ESLint
```

### Production
```bash
npm run build        # Production build
npm run preview      # Preview build locally
```

### Deployment
- **Frontend**: Automático via Lovable (Publish button)
- **Edge Functions**: Deploy automático em mudanças
- **Database**: Migrations via Supabase CLI

---

## 🔄 Data Flow Patterns

### Optimistic Updates

```typescript
const mutation = useMutation({
  mutationFn: updatePedido,
  onMutate: async (newData) => {
    // Cancel queries
    await queryClient.cancelQueries(['pedidos']);
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['pedidos']);
    
    // Optimistically update
    queryClient.setQueryData(['pedidos'], (old) => 
      updateOptimistically(old, newData)
    );
    
    return { previous };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['pedidos'], context.previous);
  },
  onSettled: () => {
    // Refetch after mutation
    queryClient.invalidateQueries(['pedidos']);
  },
});
```

### Polling & Real-time

```typescript
// Polling automático
const { data } = useQuery({
  queryKey: ['pedidos'],
  queryFn: fetchPedidos,
  refetchInterval: 60000, // 1 minuto
});

// Real-time via Supabase subscriptions
useEffect(() => {
  const subscription = supabase
    .channel('pedidos')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'pedidos' },
      (payload) => {
        queryClient.invalidateQueries(['pedidos']);
      }
    )
    .subscribe();
    
  return () => subscription.unsubscribe();
}, []);
```

---

## 🎯 Decisões Arquiteturais

### Por que TanStack Query?
- ✅ Cache automático com invalidação inteligente
- ✅ Loading/error states simplificados
- ✅ Retry automático
- ✅ Dedupe de requests
- ✅ Optimistic updates built-in

### Por que Zustand?
- ✅ Simples e minimalista
- ✅ Sem boilerplate
- ✅ TypeScript first-class
- ✅ DevTools integrado
- ✅ Melhor que Context API para estado global

### Por que shadcn/ui?
- ✅ Componentes acessíveis (a11y)
- ✅ Customizáveis via Tailwind
- ✅ Copy-paste ao invés de npm install
- ✅ Design system consistente
- ✅ TypeScript support nativo

---

## 📚 Referências

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

---

**Última atualização:** 2024-01-01  
**Versão:** 1.0.0
