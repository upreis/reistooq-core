# 🗄️ Sistema de Storage Unificado - FASE 1.2

Sistema centralizado e type-safe para gerenciamento de localStorage/sessionStorage com validação, TTL, versionamento e migrações automáticas.

---

## 📚 Características

✅ **Type Safety**: Tipagem completa TypeScript  
✅ **Validação**: Verificação automática de integridade  
✅ **TTL**: Expiração automática de dados  
✅ **Versionamento**: Migração automática entre versões  
✅ **Namespacing**: Evita colisões entre features  
✅ **Compressão**: Opcional para grandes objetos  
✅ **Error Handling**: Integrado com ErrorHandler  
✅ **Estatísticas**: Monitoramento de uso  

---

## 🚀 Uso Básico

### 1. Salvar Dados

```typescript
import { storage } from '@/core/storage';

// Simples
storage.set('user-preferences', {
  theme: 'dark',
  language: 'pt-BR'
});

// Com TTL (expira em 1 hora)
storage.set('temp-data', { value: 123 }, {
  ttl: 60 * 60 * 1000
});

// Com namespace
storage.set('filters', { status: 'active' }, {
  namespace: 'orders'
});
```

### 2. Recuperar Dados

```typescript
// Básico
const { data, error, expired } = storage.get('user-preferences');

if (error) {
  console.error('Erro ao carregar:', error);
}

if (expired) {
  console.log('Dados expiraram');
}

if (data) {
  console.log('Preferências:', data);
}

// Com tipagem
interface UserPrefs {
  theme: 'light' | 'dark';
  language: string;
}

const { data } = storage.get<UserPrefs>('user-preferences');
```

### 3. Remover e Limpar

```typescript
// Remover item específico
storage.remove('temp-data');

// Limpar namespace inteiro
storage.clear('orders'); // Remove tudo de 'orders:*'

// Limpar tudo
storage.clear(); // Remove todo namespace padrão
```

### 4. Verificar Existência

```typescript
if (storage.has('user-preferences')) {
  console.log('Preferências salvas');
}
```

---

## 🎯 Recursos Avançados

### Versionamento e Migrações

```typescript
import { storage } from '@/core/storage';

// Versão 1 dos dados
storage.set('user-profile', {
  name: 'João',
  email: 'joao@example.com'
}, { version: 1 });

// Registrar migração v1 → v2
storage.registerMigration('user-profile', {
  fromVersion: 1,
  toVersion: 2,
  migrate: (oldData) => ({
    ...oldData,
    avatar: null, // Novo campo
    createdAt: Date.now()
  })
});

// Ao recuperar, migra automaticamente se necessário
const { data } = storage.get('user-profile', { version: 2 });
```

### Limpeza Automática de Expirados

```typescript
// Remove todos itens expirados
const removed = storage.cleanExpired();
console.log(`Removidos ${removed} itens expirados`);

// Pode ser executado periodicamente
setInterval(() => {
  storage.cleanExpired();
}, 60 * 60 * 1000); // A cada hora
```

### Estatísticas de Uso

```typescript
const stats = storage.getStats();

console.log(`Total de keys: ${stats.totalKeys}`);
console.log(`Tamanho total: ${(stats.totalSize / 1024).toFixed(2)} KB`);
console.log(`Keys expiradas: ${stats.expiredKeys}`);
console.log(`Keys válidas: ${stats.validKeys}`);
```

### SessionStorage

```typescript
import { storage, StorageType } from '@/core/storage';

// Usar sessionStorage ao invés de localStorage
storage.set('temp-session', { data: 'value' }, {
  type: StorageType.SESSION
});

const { data } = storage.get('temp-session', {
  type: StorageType.SESSION
});
```

---

## 🔄 Migração de Código Existente

### Antes ❌

```typescript
// Código antigo direto no localStorage
const saveFilters = (filters: Filters) => {
  localStorage.setItem('pedidos-filters', JSON.stringify(filters));
};

const loadFilters = (): Filters | null => {
  const stored = localStorage.getItem('pedidos-filters');
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};
```

### Depois ✅

```typescript
import { storage } from '@/core/storage';

const saveFilters = (filters: Filters) => {
  storage.set('filters', filters, {
    namespace: 'pedidos',
    ttl: 24 * 60 * 60 * 1000, // 24h
    version: 1
  });
};

const loadFilters = (): Filters | null => {
  const { data, error } = storage.get<Filters>('filters', {
    namespace: 'pedidos',
    version: 1
  });
  
  if (error) {
    console.error('Erro ao carregar filtros:', error);
  }
  
  return data;
};
```

---

## 🎨 Padrões Recomendados

### Hook Customizado

```typescript
import { storage } from '@/core/storage';
import { useState, useEffect } from 'react';

function usePersistedState<T>(
  key: string,
  defaultValue: T,
  options?: { namespace?: string; ttl?: number }
): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    const { data } = storage.get<T>(key, options);
    return data ?? defaultValue;
  });

  useEffect(() => {
    storage.set(key, state, options);
  }, [state, key]);

  return [state, setState];
}

// Uso
function MyComponent() {
  const [filters, setFilters] = usePersistedState('filters', {
    status: 'all'
  }, {
    namespace: 'orders',
    ttl: 24 * 60 * 60 * 1000
  });

  return <div>{/* ... */}</div>;
}
```

### Configuração Global

```typescript
import { UnifiedStorage } from '@/core/storage';

// Criar instância customizada para feature específica
export const ordersStorage = new UnifiedStorage({
  defaultNamespace: 'orders',
  defaultTTL: 24 * 60 * 60 * 1000, // 24h
  defaultVersion: 2,
  enableCompression: true,
  maxSize: 10 * 1024 * 1024 // 10MB
});
```

---

## ⚠️ Boas Práticas

### ✅ Fazer

- Sempre usar namespaces para features diferentes
- Definir TTL para dados temporários
- Usar versionamento quando schema mudar
- Validar dados recuperados
- Tratar erros adequadamente

### ❌ Evitar

- Salvar dados sensíveis (senhas, tokens)
- Objetos muito grandes (>1MB) sem compressão
- Acessar localStorage diretamente (use UnifiedStorage)
- Ignorar retorno de `error`
- Criar namespaces muito longos

---

## 📊 Monitoramento

```typescript
// Dashboard de storage (exemplo)
const stats = storage.getStats();

console.table({
  'Total Keys': stats.totalKeys,
  'Size (KB)': (stats.totalSize / 1024).toFixed(2),
  'Expired': stats.expiredKeys,
  'Valid': stats.validKeys,
  'Usage (%)': ((stats.totalSize / (5 * 1024 * 1024)) * 100).toFixed(1)
});

// Limpeza proativa
if (stats.expiredKeys > 10) {
  storage.cleanExpired();
}
```

---

## 🎯 Próximos Passos (FASE 1.2)

1. ✅ UnifiedStorage criado
2. ✅ StorageValidator criado
3. ✅ Tipos TypeScript definidos
4. ✅ Documentação completa
5. ⏳ Migrar localStorage críticos (próxima etapa)
6. ⏳ Criar hooks de conveniência (opcional)

---

## 📝 Notas Técnicas

- **Compressão**: Usa `btoa/atob` (Base64). Para melhor compressão, considere `lz-string`
- **Tamanho limite**: 5MB padrão (configurável)
- **Validação**: Pode ser desabilitada para performance (não recomendado)
- **Migrações**: Executam sincronamente durante `get()`
- **Thread-safe**: Operações são síncronas (storage nativo)
