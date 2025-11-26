# 🎨 Patterns e Best Practices

Este documento descreve patterns, convenções e best practices utilizadas no projeto.

---

## 📋 Índice

1. [React Patterns](#react-patterns)
2. [TypeScript Patterns](#typescript-patterns)
3. [State Management](#state-management)
4. [Data Fetching](#data-fetching)
5. [Performance](#performance)
6. [Error Handling](#error-handling)
7. [Testing](#testing)

---

## ⚛️ React Patterns

### Component Composition

```typescript
// ✅ BOM - Composição flexível
<Dialog>
  <DialogTrigger>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    <DialogBody>Content</DialogBody>
  </DialogContent>
</Dialog>

// ❌ EVITAR - Props complexas
<Dialog
  trigger={<Button>Open</Button>}
  title="Title"
  content="Content"
  showHeader={true}
  showFooter={false}
/>
```

### Render Props vs Hooks

```typescript
// ✅ PREFERIR - Custom hooks (mais moderno)
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return size;
}

// Usage
function MyComponent() {
  const { width, height } = useWindowSize();
  return <div>{width} x {height}</div>;
}

// ⚠️ Render props - usar apenas quando hooks não são suficientes
<WindowSize>
  {({ width, height }) => <div>{width} x {height}</div>}
</WindowSize>
```

### Controlled vs Uncontrolled

```typescript
// ✅ Controlled - preferível para forms complexos
function ControlledInput() {
  const [value, setValue] = useState('');
  
  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

// ✅ Uncontrolled - OK para forms simples
function UncontrolledInput() {
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleSubmit = () => {
    const value = inputRef.current?.value;
  };
  
  return <input ref={inputRef} />;
}
```

### Error Boundaries

```typescript
// ✅ Envolver componentes que podem falhar
function UserProfile() {
  return (
    <BasicErrorBoundary>
      <UserData />
    </BasicErrorBoundary>
  );
}

// ✅ Páginas inteiras com PageErrorBoundary
function App() {
  return (
    <PageErrorBoundary>
      <Routes />
    </PageErrorBoundary>
  );
}
```

---

## 📘 TypeScript Patterns

### Type Guards

```typescript
// ✅ Type guards para runtime checks
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value
  );
}

// Usage
function processData(data: unknown) {
  if (isUser(data)) {
    // data é do tipo User aqui
    console.log(data.email);
  }
}
```

### Utility Types

```typescript
// ✅ Usar utility types do TypeScript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

// Partial - todas propriedades opcionais
type UpdateUser = Partial<User>;

// Pick - selecionar propriedades específicas
type UserSummary = Pick<User, 'id' | 'name'>;

// Omit - excluir propriedades
type UserWithoutRole = Omit<User, 'role'>;

// Required - todas propriedades obrigatórias
type CompleteUser = Required<User>;
```

### Discriminated Unions

```typescript
// ✅ Usar para estado com múltiplos tipos
type DataState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function Component() {
  const [state, setState] = useState<DataState<User>>({ status: 'idle' });
  
  // TypeScript garante type safety
  if (state.status === 'success') {
    console.log(state.data.name); // ✅ OK
  }
  
  if (state.status === 'loading') {
    console.log(state.data); // ❌ Error: data não existe em loading
  }
}
```

---

## 🗄️ State Management

### Local State (useState)

```typescript
// ✅ Estado local para UI state
function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div>
      <input 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {isOpen && <SearchResults query={query} />}
    </div>
  );
}
```

### Global State (Zustand)

```typescript
// ✅ Estado global para dados compartilhados
interface AppStore {
  user: User | null;
  organizationId: string | null;
  setUser: (user: User | null) => void;
  setOrganizationId: (id: string | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  organizationId: null,
  setUser: (user) => set({ user }),
  setOrganizationId: (organizationId) => set({ organizationId }),
}));

// Usage
function MyComponent() {
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  
  return <div>{user?.name}</div>;
}
```

### Server State (TanStack Query)

```typescript
// ✅ Server data com TanStack Query
function useUserData(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Usage
function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, error } = useUserData(userId);
  
  if (isLoading) return <Loading />;
  if (error) return <Error error={error} />;
  if (!data) return null;
  
  return <div>{data.name}</div>;
}
```

---

## 🔄 Data Fetching

### Query Keys

```typescript
// ✅ Query keys consistentes e específicos
const queryKeys = {
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: UserFilters) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
};

// Usage
useQuery({
  queryKey: queryKeys.users.detail(userId),
  queryFn: () => fetchUser(userId),
});
```

### Mutations

```typescript
// ✅ Mutations com optimistic updates
function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (user: UpdateUser) => updateUser(user),
    onMutate: async (newUser) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: ['user', newUser.id] });
      
      // Snapshot previous value
      const previous = queryClient.getQueryData(['user', newUser.id]);
      
      // Optimistically update
      queryClient.setQueryData(['user', newUser.id], newUser);
      
      return { previous };
    },
    onError: (err, newUser, context) => {
      // Rollback on error
      queryClient.setQueryData(['user', newUser.id], context?.previous);
    },
    onSettled: (data, error, variables) => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] });
    },
  });
}
```

### Infinite Queries

```typescript
// ✅ Pagination infinita
function useInfiniteUsers() {
  return useInfiniteQuery({
    queryKey: ['users', 'infinite'],
    queryFn: ({ pageParam = 0 }) => fetchUsers({ page: pageParam }),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length : undefined;
    },
  });
}

// Usage
function UserList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteUsers();
  
  return (
    <div>
      {data?.pages.map((page) =>
        page.users.map((user) => <UserCard key={user.id} user={user} />)
      )}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

---

## ⚡ Performance

### React.memo

```typescript
// ✅ Memo para componentes pesados que recebem mesmas props
export const ExpensiveList = memo(({ items }: { items: Item[] }) => {
  return (
    <div>
      {items.map(item => <ExpensiveItem key={item.id} item={item} />)}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.items.length === nextProps.items.length;
});
```

### useMemo & useCallback

```typescript
// ✅ useMemo para computações pesadas
function DataTable({ data }: { data: Data[] }) {
  const processedData = useMemo(() => {
    return data
      .filter(item => item.active)
      .map(item => expensiveTransform(item))
      .sort((a, b) => a.value - b.value);
  }, [data]);
  
  return <Table data={processedData} />;
}

// ✅ useCallback para funções passadas como props
function Parent() {
  const [count, setCount] = useState(0);
  
  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []); // Função estável
  
  return <MemoizedChild onClick={handleClick} />;
}
```

### Code Splitting

```typescript
// ✅ Lazy loading de rotas
const ReclamacoesPage = lazy(() => import('./pages/ReclamacoesPage'));
const PedidosPage = lazy(() => import('./pages/PedidosPage'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/reclamacoes" element={<ReclamacoesPage />} />
        <Route path="/pedidos" element={<PedidosPage />} />
      </Routes>
    </Suspense>
  );
}

// ✅ Lazy loading de componentes pesados
const HeavyChart = lazy(() => import('./components/HeavyChart'));

function Dashboard() {
  return (
    <div>
      <Summary />
      <Suspense fallback={<ChartSkeleton />}>
        <HeavyChart data={data} />
      </Suspense>
    </div>
  );
}
```

### Virtualization

```typescript
// ✅ Virtualização para listas grandes
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });
  
  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <ItemCard item={items[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🚨 Error Handling

### Try-Catch Pattern

```typescript
// ✅ Try-catch com logging apropriado
async function fetchUserData(userId: string): Promise<User> {
  try {
    const response = await fetch(`/api/users/${userId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[fetchUserData] Error:', error);
    
    if (error instanceof TypeError) {
      throw new Error('Network error - check your connection');
    }
    
    throw error;
  }
}
```

### Error Boundaries for Components

```typescript
// ✅ Error boundary para isolar falhas
function FeatureSection() {
  return (
    <BasicErrorBoundary
      onError={(error, errorInfo) => {
        // Log to service
        logError(error, errorInfo);
      }}
    >
      <ComplexFeature />
    </BasicErrorBoundary>
  );
}
```

### Toast Notifications

```typescript
// ✅ Notificar usuário sobre erros
import { toast } from 'sonner';

async function saveData(data: Data) {
  try {
    await api.post('/data', data);
    toast.success('Dados salvos com sucesso!');
  } catch (error) {
    toast.error('Erro ao salvar dados. Tente novamente.');
    console.error(error);
  }
}
```

---

## 🧪 Testing

### Unit Tests

```typescript
// ✅ Teste unitário de função pura
import { describe, it, expect } from 'vitest';
import { formatCurrency } from './utils';

describe('formatCurrency', () => {
  it('formata valor positivo', () => {
    expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
  });
  
  it('formata zero', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00');
  });
  
  it('lança erro para valor inválido', () => {
    expect(() => formatCurrency(NaN)).toThrow();
  });
});
```

### Component Tests

```typescript
// ✅ Teste de componente
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renderiza com label', () => {
    render(<Button label="Click me" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('chama onClick quando clicado', () => {
    const handleClick = vi.fn();
    render(<Button label="Click" onClick={handleClick} />);
    
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('está desabilitado quando disabled=true', () => {
    render(<Button label="Click" onClick={() => {}} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Hook Tests

```typescript
// ✅ Teste de custom hook
import { renderHook, waitFor } from '@testing-library/react';
import { useUserData } from './useUserData';

describe('useUserData', () => {
  it('retorna user data', async () => {
    const { result } = renderHook(() => useUserData('user-123'));
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.user).toEqual({
      id: 'user-123',
      name: 'John Doe',
    });
  });
  
  it('trata erro corretamente', async () => {
    // Mock API error
    vi.mocked(fetchUser).mockRejectedValue(new Error('API Error'));
    
    const { result } = renderHook(() => useUserData('invalid-id'));
    
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });
});
```

---

## 📚 Recursos

- [React Patterns](https://reactpatterns.com/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [TanStack Query Best Practices](https://tanstack.com/query/latest/docs/react/guides/best-practices)

---

**Última atualização:** 2024-01-01  
**Versão:** 1.0.0
