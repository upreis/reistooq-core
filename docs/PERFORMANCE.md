# ⚡ Performance Guidelines

Guia de otimização de performance para o sistema.

---

## 📋 Índice

1. [Métricas Alvo](#métricas-alvo)
2. [React Performance](#react-performance)
3. [Bundle Size](#bundle-size)
4. [Data Fetching](#data-fetching)
5. [Rendering](#rendering)
6. [Memory](#memory)
7. [Tools](#tools)

---

## 🎯 Métricas Alvo

### Core Web Vitals

| Métrica | Alvo | Descrição |
|---------|------|-----------|
| **LCP** (Largest Contentful Paint) | < 2.5s | Tempo até maior elemento visível |
| **FID** (First Input Delay) | < 100ms | Tempo até primeira interação |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Estabilidade visual |
| **TTFB** (Time to First Byte) | < 600ms | Tempo até primeiro byte |
| **FCP** (First Contentful Paint) | < 1.8s | Tempo até primeiro conteúdo |

### Custom Metrics

| Métrica | Alvo | Descrição |
|---------|------|-----------|
| **TTI** (Time to Interactive) | < 3.5s | Tempo até página interativa |
| **Bundle Size** | < 250KB | Tamanho do bundle gzip |
| **API Response Time** | < 500ms | Tempo de resposta médio |
| **Re-renders** | < 10/min | Re-renders por minuto |

---

## ⚛️ React Performance

### 1. Evitar Re-renders Desnecessários

```typescript
// ❌ PROBLEMA - Re-render a cada mudança do pai
function Parent() {
  const [count, setCount] = useState(0);
  return <Child data={data} />;
}

// ✅ SOLUÇÃO - Memo + props estáveis
const Child = memo(({ data }: { data: Data }) => {
  return <div>{data.value}</div>;
});

function Parent() {
  const [count, setCount] = useState(0);
  const stableData = useMemo(() => data, [data]);
  return <Child data={stableData} />;
}
```

### 2. useCallback para Funções

```typescript
// ❌ PROBLEMA - Nova função a cada render
function Parent() {
  const handleClick = () => console.log('click');
  return <MemoizedChild onClick={handleClick} />;
}

// ✅ SOLUÇÃO - useCallback
function Parent() {
  const handleClick = useCallback(() => {
    console.log('click');
  }, []);
  return <MemoizedChild onClick={handleClick} />;
}
```

### 3. useMemo para Computações Pesadas

```typescript
// ❌ PROBLEMA - Processamento a cada render
function Component({ items }: { items: Item[] }) {
  const filtered = items.filter(item => item.active);
  const sorted = filtered.sort((a, b) => a.value - b.value);
  return <List items={sorted} />;
}

// ✅ SOLUÇÃO - useMemo
function Component({ items }: { items: Item[] }) {
  const sortedItems = useMemo(() => {
    return items
      .filter(item => item.active)
      .sort((a, b) => a.value - b.value);
  }, [items]);
  
  return <List items={sortedItems} />;
}
```

### 4. Code Splitting

```typescript
// ❌ PROBLEMA - Bundle único gigante
import HeavyComponent from './HeavyComponent';

function App() {
  return <HeavyComponent />;
}

// ✅ SOLUÇÃO - Lazy loading
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

---

## 📦 Bundle Size

### 1. Analyze Bundle

```bash
# Analisar bundle size
npm run build
npm run preview

# Visualizar bundle
npx vite-bundle-visualizer
```

### 2. Tree Shaking

```typescript
// ❌ PROBLEMA - Import de biblioteca inteira
import _ from 'lodash';
const result = _.debounce(fn, 500);

// ✅ SOLUÇÃO - Import específico
import debounce from 'lodash/debounce';
const result = debounce(fn, 500);
```

### 3. Dynamic Imports

```typescript
// ❌ PROBLEMA - Import estático de lib pesada
import { HeavyChart } from 'heavy-chart-lib';

function Dashboard() {
  return <HeavyChart data={data} />;
}

// ✅ SOLUÇÃO - Dynamic import
function Dashboard() {
  const [ChartComponent, setChart] = useState(null);
  
  useEffect(() => {
    import('heavy-chart-lib').then((mod) => {
      setChart(() => mod.HeavyChart);
    });
  }, []);
  
  if (!ChartComponent) return <Loading />;
  return <ChartComponent data={data} />;
}
```

### 4. External Dependencies

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        manualChunks: {
          vendor: ['zustand', '@tanstack/react-query'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
});
```

---

## 🔄 Data Fetching

### 1. Cache com TanStack Query

```typescript
// ✅ Cache automático
const { data } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  staleTime: 5 * 60 * 1000,  // 5 minutos
  cacheTime: 10 * 60 * 1000, // 10 minutos
});
```

### 2. Prefetching

```typescript
// ✅ Prefetch ao hover
function UserList() {
  const queryClient = useQueryClient();
  
  const handleMouseEnter = (userId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['user', userId],
      queryFn: () => fetchUser(userId),
    });
  };
  
  return (
    <div>
      {users.map(user => (
        <Link
          key={user.id}
          to={`/users/${user.id}`}
          onMouseEnter={() => handleMouseEnter(user.id)}
        >
          {user.name}
        </Link>
      ))}
    </div>
  );
}
```

### 3. Parallel Fetching

```typescript
// ❌ PROBLEMA - Fetches sequenciais
async function fetchData() {
  const users = await fetchUsers();
  const orders = await fetchOrders();
  const products = await fetchProducts();
  return { users, orders, products };
}

// ✅ SOLUÇÃO - Fetches paralelos
async function fetchData() {
  const [users, orders, products] = await Promise.all([
    fetchUsers(),
    fetchOrders(),
    fetchProducts(),
  ]);
  return { users, orders, products };
}
```

### 4. Request Deduplication

```typescript
// ✅ TanStack Query dedupe automático
// Múltiplas chamadas simultâneas = 1 request
function ComponentA() {
  const { data } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
}

function ComponentB() {
  const { data } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
}
// Apenas 1 request para /users é feito
```

---

## 🖼️ Rendering

### 1. Virtualization

```typescript
// ✅ Virtualizar listas grandes (>100 items)
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  });
  
  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
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

### 2. Lazy Image Loading

```typescript
// ✅ Lazy loading de imagens
function ProductImage({ src, alt }: { src: string; alt: string }) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    if (!imgRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );
    
    observer.observe(imgRef.current);
    
    return () => observer.disconnect();
  }, [src]);
  
  return (
    <img
      ref={imgRef}
      src={imageSrc || '/placeholder.png'}
      alt={alt}
      loading="lazy"
    />
  );
}
```

### 3. Debounce Inputs

```typescript
// ✅ Debounce para search inputs
import { debounce } from '@/utils/performanceUtils';

function SearchBar() {
  const [query, setQuery] = useState('');
  
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      // API call aqui
      searchAPI(value);
    }, 500),
    []
  );
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    debouncedSearch(e.target.value);
  };
  
  return <input value={query} onChange={handleChange} />;
}
```

---

## 💾 Memory

### 1. Cleanup em useEffect

```typescript
// ❌ PROBLEMA - Memory leak (sem cleanup)
useEffect(() => {
  const subscription = subscribeToData();
}, []);

// ✅ SOLUÇÃO - Cleanup
useEffect(() => {
  const subscription = subscribeToData();
  
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

### 2. AbortController

```typescript
// ✅ Cancel fetch ao unmount
useEffect(() => {
  const controller = new AbortController();
  
  fetch('/api/data', { signal: controller.signal })
    .then(res => res.json())
    .then(data => setData(data))
    .catch(err => {
      if (err.name !== 'AbortError') {
        console.error(err);
      }
    });
  
  return () => controller.abort();
}, []);
```

### 3. Monitor Memory

```typescript
// ✅ Usar memoryMonitor para detectar leaks
import { memoryMonitor } from '@/lib/performance';

useEffect(() => {
  // Iniciar monitoramento
  memoryMonitor.startMonitoring(5000);
  
  // Verificar periodicamente
  const interval = setInterval(() => {
    if (memoryMonitor.detectLeak(20)) {
      console.error('Memory leak detectado!');
    }
  }, 30000);
  
  return () => {
    clearInterval(interval);
    memoryMonitor.stopMonitoring();
  };
}, []);
```

---

## 🛠️ Tools

### 1. Performance Monitoring

```typescript
// ✅ Usar performanceMonitor
import { performanceMonitor } from '@/lib/performance';

const data = await performanceMonitor.measure(
  'fetch-orders',
  () => fetchOrders(),
  { organization_id: orgId }
);

// Relatório
console.log(performanceMonitor.getReport());
```

### 2. Render Tracking

```typescript
// ✅ Usar renderTracker
import { useRenderTracker } from '@/lib/performance';

function ExpensiveComponent() {
  useRenderTracker('ExpensiveComponent');
  
  // Component logic
}

// Ver top re-renders
console.log(renderTracker.getTopReRenderers(10));
```

### 3. React DevTools Profiler

```bash
# Instalar React DevTools
# Chrome: https://chrome.google.com/webstore/detail/react-developer-tools
# Firefox: https://addons.mozilla.org/en-US/firefox/addon/react-devtools/

# Usar Profiler tab para:
# - Identificar re-renders desnecessários
# - Medir tempo de render
# - Ver flamegraph de components
```

### 4. Lighthouse

```bash
# Rodar Lighthouse audit
npx lighthouse https://your-app.com --view

# Focar em:
# - Performance score
# - First Contentful Paint
# - Largest Contentful Paint
# - Total Blocking Time
# - Cumulative Layout Shift
```

---

## 📊 Checklist de Performance

### Antes de Deploy

- [ ] Bundle size < 250KB (gzip)
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] Lighthouse score > 90
- [ ] Sem memory leaks detectados
- [ ] Componentes pesados com lazy loading
- [ ] Imagens otimizadas (webp, lazy loading)
- [ ] Code splitting implementado
- [ ] Cache configurado corretamente

### Code Review

- [ ] useMemo para computações pesadas
- [ ] useCallback para funções passadas como props
- [ ] React.memo para componentes puros
- [ ] Cleanup em todos useEffect
- [ ] AbortController em fetch requests
- [ ] Virtualization para listas grandes
- [ ] Debounce em inputs de busca

---

## 📚 Resources

- [Web.dev Performance](https://web.dev/performance/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [TanStack Query Performance](https://tanstack.com/query/latest/docs/react/guides/performance)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

**Última atualização:** 2024-01-01  
**Versão:** 1.0.0
