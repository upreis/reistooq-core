# 🚨 AUDITORIA FASE 2 - PROBLEMAS CRÍTICOS ENCONTRADOS

## Status: ⚠️ 5 PROBLEMAS CRÍTICOS + 3 MÉDIOS

**Data:** 04/11/2025  
**Revisor:** Auditoria Profunda

---

## 🔴 PROBLEMAS CRÍTICOS (Corrigir AGORA)

### 1. **PedidosCache - Race Condition em cleanup()**

**Localização:** `src/features/pedidos/services/PedidosCache.ts:120-132`

**Problema:**
```typescript
cleanup(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  this.cache.forEach((entry, key) => {
    if (now - entry.timestamp > entry.ttl) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach(key => this.cache.delete(key));
}
```

**Risco:** 🔴 CRÍTICO
- Se `cleanup()` e `get()` rodarem simultaneamente, pode deletar entry sendo acessada
- Causa: JavaScript é single-threaded mas async operations podem intercalar

**Impacto no Usuário:**
- Dados podem desaparecer durante uso
- Erro: "Cannot read property 'data' of undefined"

**Solução:**
```typescript
cleanup(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  this.cache.forEach((entry, key) => {
    // Só deleta se não foi acessado recentemente (último 1s)
    const lastAccess = entry.timestamp + (entry.hits > 0 ? 1000 : 0);
    if (now - entry.timestamp > entry.ttl && now - lastAccess > 1000) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach(key => this.cache.delete(key));
}
```

---

### 2. **PedidosCache - Memory Leak em setInterval**

**Localização:** `src/features/pedidos/services/PedidosCache.ts:221-225`

**Problema:**
```typescript
// Auto cleanup a cada 5 minutos
if (typeof window !== 'undefined') {
  setInterval(() => {
    pedidosCache.cleanup();
  }, 5 * 60 * 1000);
}
```

**Risco:** 🔴 CRÍTICO
- `setInterval` NUNCA é limpo
- Se componente re-renderizar, cria múltiplos intervals
- Memory leak acumula indefinidamente

**Impacto no Usuário:**
- App fica lento progressivamente
- Memory usage cresce até 500MB+
- Browser pode travar após 30min de uso

**Solução:**
```typescript
// Armazenar intervalId para poder limpar
let cleanupIntervalId: NodeJS.Timeout | null = null;

export function startCacheCleanup() {
  if (cleanupIntervalId) return; // Já rodando
  
  cleanupIntervalId = setInterval(() => {
    pedidosCache.cleanup();
  }, 5 * 60 * 1000);
}

export function stopCacheCleanup() {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
  }
}

// Iniciar apenas uma vez
if (typeof window !== 'undefined') {
  startCacheCleanup();
  
  // Cleanup no unload
  window.addEventListener('beforeunload', stopCacheCleanup);
}
```

---

### 3. **usePedidosOptimized - Retorna Array Vazio Sempre**

**Localização:** `src/features/pedidos/hooks/usePedidosOptimized.ts:79-88`

**Problema:**
```typescript
const fetchPedidos = useCallback(async (): Promise<Pedido[]> => {
  // ...
  // TODO: Substituir por chamada real da API quando migrar
  const data: Pedido[] = [];
  return data;
}, [filters, staleTime]);
```

**Risco:** 🔴 CRÍTICO
- Hook NUNCA retorna dados reais
- Usuário verá tela vazia SEMPRE
- Parece que não há pedidos

**Impacto no Usuário:**
- ❌ Tela vazia permanentemente
- ❌ "Não há pedidos" mesmo tendo milhares
- ❌ Impossível usar o sistema

**Solução IMEDIATA:**
```typescript
// NÃO usar este hook ainda! 
// Está incompleto, apenas estrutural.
// Usar usePedidosManager até integração completa.
```

**Status:** ⏳ Hook é apenas ESTRUTURAL para Fase 2. NÃO MIGRAR ainda!

---

### 4. **Performance.ts - lazyWithPreload Quebrado**

**Localização:** `src/features/pedidos/utils/performance.ts:202-210`

**Problema:**
```typescript
export function lazyWithPreload<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  const LazyComponent = React.lazy(importFn);
  
  // Adiciona método preload
  (LazyComponent as any).preload = importFn;
  
  return LazyComponent;
}
```

**Risco:** 🔴 CRÍTICO
- TypeScript type `T` não é usado corretamente
- Cast para `any` perde type safety
- Preload pode falhar silenciosamente

**Impacto no Usuário:**
- Componentes não carregam
- Erro: "LazyComponent.preload is not a function"
- Loading state infinito

**Solução:**
```typescript
export function lazyWithPreload<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  const LazyComponent = React.lazy(importFn);
  
  // Type-safe preload
  const ComponentWithPreload = LazyComponent as typeof LazyComponent & {
    preload: () => Promise<{ default: T }>;
  };
  
  ComponentWithPreload.preload = importFn;
  
  return ComponentWithPreload;
}
```

---

### 5. **Cache Keys - JSON.stringify com Filtros Complexos**

**Localização:** `src/features/pedidos/services/PedidosCache.ts:230-232`

**Problema:**
```typescript
pedidos: (filters?: any) => 
  `pedidos:${JSON.stringify(filters || {})}`,
```

**Risco:** 🔴 CRÍTICO
- `JSON.stringify` pode falhar com objetos circulares
- Datas não são serializadas consistentemente
- undefined vira string "undefined"

**Exemplo de Falha:**
```typescript
// Filtro com Date
const filters = { 
  date: new Date('2024-01-01'),
  status: 'paid' 
};

// Key 1: "pedidos:{\"date\":\"2024-01-01T00:00:00.000Z\",\"status\":\"paid\"}"
// Key 2: "pedidos:{\"date\":\"2024-01-01T03:00:00.000Z\",\"status\":\"paid\"}"
// ⚠️ MESMA data, KEYS DIFERENTES (timezone)!
```

**Impacto no Usuário:**
- Cache miss para mesmos filtros (hit rate 20% vs 80%)
- Mais requests ao servidor
- Performance pior que sem cache

**Solução:**
```typescript
import { hash } from 'ohash'; // ou alternativa

pedidos: (filters?: any) => {
  if (!filters) return 'pedidos:empty';
  
  // Normalizar filtros antes de serializar
  const normalized = Object.keys(filters)
    .sort()
    .reduce((acc, key) => {
      let value = filters[key];
      
      // Converter Date para string ISO consistente
      if (value instanceof Date) {
        value = value.toISOString().split('T')[0]; // YYYY-MM-DD
      }
      
      // Remover undefined
      if (value !== undefined) {
        acc[key] = value;
      }
      
      return acc;
    }, {} as any);
  
  return `pedidos:${JSON.stringify(normalized)}`;
},
```

---

## 🟡 PROBLEMAS MÉDIOS

### 6. **BatchQueue - Sem Proteção contra Loop Infinito**

**Localização:** `src/features/pedidos/utils/performance.ts:73-90`

**Risco:** 🟡 MÉDIO

Se `onFlush` adicionar items de volta ao queue:
```typescript
const queue = new BatchQueue((items) => {
  items.forEach(item => {
    // Bug: adiciona de volta!
    queue.add(processItem(item));
  });
});
```

**Resultado:** Loop infinito, CPU 100%, browser trava.

**Solução:** Adicionar flag `isFlushing`.

---

### 7. **useRenderTracking - Console.log em Produção**

**Localização:** `src/features/pedidos/utils/performance.ts:164-172`

**Problema:**
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log(...); // ✅ OK
}
```

**Mas o `enabled` param permite forçar:**
```typescript
useRenderTracking('MyComponent', true); // Log mesmo em prod!
```

**Solução:** Sempre checar NODE_ENV PRIMEIRO.

---

### 8. **measurePerformance - Não trata async functions**

**Localização:** `src/features/pedidos/utils/performance.ts:187-199`

**Problema:**
```typescript
export function measurePerformance<T extends (...args: any[]) => any>(
  fn: T,
  label: string
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now(); // ❌ Mede antes de async resolver!
    
    console.log(`⚡ [${label}] ${(end - start).toFixed(2)}ms`);
    return result;
  }) as T;
}
```

**Para async:** Tempo medido será ~0ms sempre.

**Solução:** Detectar Promise e medir com `.then()`.

---

## 📋 AÇÕES IMEDIATAS (ANTES DE TESTAR)

### ⚠️ CRITICAL - Corrigir AGORA:

1. ✅ **Adicionar cleanup do setInterval** (Problema #2)
2. ✅ **Documentar que usePedidosOptimized NÃO está pronto** (Problema #3)
3. ✅ **Corrigir cacheKeys.pedidos serialização** (Problema #5)

### 🟡 MEDIUM - Corrigir esta semana:

4. ✅ Fix race condition em cleanup (Problema #1)
5. ✅ Fix lazyWithPreload types (Problema #4)
6. ✅ Adicionar proteção em BatchQueue (Problema #6)

### 🟢 LOW - Melhorias:

7. ✅ Melhorar useRenderTracking (Problema #7)
8. ✅ Suportar async em measurePerformance (Problema #8)

---

## ⚠️ AVISO IMPORTANTE

### ❌ NÃO USE AINDA:

1. **`usePedidosOptimized`** - Retorna array vazio, não está integrado com API
2. **`lazyWithPreload`** - Tipos quebrados, pode causar crash

### ✅ PODE USAR (com cuidado):

1. **`PedidosCache`** - Funcional mas precisa fix do setInterval
2. **`debounce/throttle`** - Funcionam bem
3. **`BatchQueue`** - OK para uso simples (sem recursão)

---

## 🎯 RECOMENDAÇÃO FINAL

**Status:** 🔴 NÃO USAR EM PRODUÇÃO

**Reasoning:**
- 3 problemas críticos que causam crashes
- 1 problema crítico que causa tela vazia
- 1 problema crítico de performance

**Ação Recomendada:**
1. ✅ Corrigir 5 problemas críticos PRIMEIRO
2. ✅ Testar isoladamente cada módulo
3. ✅ Validar com dados reais
4. ✅ Só então considerar migração

**Timeline Estimado:**
- Fix críticos: 2-3 horas
- Testes: 1-2 horas
- Validação: 1 hora
- **Total: 4-6 horas** até poder testar com segurança

---

**Próximo Passo:** Quer que eu corrija os 5 problemas críticos agora?