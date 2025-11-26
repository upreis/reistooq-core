/**
 * 📚 EXEMPLOS DE USO - UnifiedStorage
 * Casos de uso comuns para referência
 */

import { storage, StorageType } from './index';

// ============================================
// EXEMPLO 1: User Preferences
// ============================================
export const userPreferencesExample = () => {
  interface UserPrefs {
    theme: 'light' | 'dark';
    language: string;
    notifications: boolean;
  }

  // Salvar preferências
  storage.set<UserPrefs>('preferences', {
    theme: 'dark',
    language: 'pt-BR',
    notifications: true
  }, {
    namespace: 'user',
    version: 1
  });

  // Carregar preferências
  const { data } = storage.get<UserPrefs>('preferences', {
    namespace: 'user',
    version: 1
  });

  return data;
};

// ============================================
// EXEMPLO 2: Filters com TTL
// ============================================
export const filtersExample = () => {
  interface OrderFilters {
    status: string[];
    dateFrom: string | null;
    dateTo: string | null;
  }

  // Salvar filtros temporários (expira em 24h)
  storage.set<OrderFilters>('filters', {
    status: ['pending', 'confirmed'],
    dateFrom: '2025-01-01',
    dateTo: '2025-01-31'
  }, {
    namespace: 'orders',
    ttl: 24 * 60 * 60 * 1000, // 24 horas
    version: 1
  });

  // Carregar filtros
  const { data, expired } = storage.get<OrderFilters>('filters', {
    namespace: 'orders',
    version: 1
  });

  if (expired) {
    console.log('Filtros expiraram, usando defaults');
    return null;
  }

  return data;
};

// ============================================
// EXEMPLO 3: Cache de API com Refresh
// ============================================
export const apiCacheExample = async () => {
  interface CachedResponse {
    data: any[];
    fetchedAt: number;
  }

  const CACHE_KEY = 'api-response';
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  // Tentar carregar do cache
  const { data: cached } = storage.get<CachedResponse>(CACHE_KEY, {
    namespace: 'api-cache',
    ttl: CACHE_TTL
  });

  if (cached) {
    console.log('Usando dados do cache');
    return cached.data;
  }

  // Cache miss - buscar dados frescos
  const response = await fetch('/api/data');
  const freshData = await response.json();

  // Salvar no cache
  storage.set<CachedResponse>(CACHE_KEY, {
    data: freshData,
    fetchedAt: Date.now()
  }, {
    namespace: 'api-cache',
    ttl: CACHE_TTL
  });

  return freshData;
};

// ============================================
// EXEMPLO 4: Versionamento e Migração
// ============================================
export const migrationExample = () => {
  interface UserProfileV1 {
    name: string;
    email: string;
  }

  interface UserProfileV2 {
    name: string;
    email: string;
    avatar: string | null;
    createdAt: number;
  }

  // Registrar migração v1 → v2
  storage.registerMigration('profile', {
    fromVersion: 1,
    toVersion: 2,
    migrate: (oldData: UserProfileV1): UserProfileV2 => ({
      ...oldData,
      avatar: null,
      createdAt: Date.now()
    })
  });

  // Salvar v1 (simulando dados antigos)
  storage.set<UserProfileV1>('profile', {
    name: 'João',
    email: 'joao@example.com'
  }, {
    namespace: 'user',
    version: 1
  });

  // Ao carregar com v2, migra automaticamente
  const { data } = storage.get<UserProfileV2>('profile', {
    namespace: 'user',
    version: 2
  });

  console.log('Perfil migrado:', data);
  // { name: 'João', email: 'joao@example.com', avatar: null, createdAt: 1234567890 }
};

// ============================================
// EXEMPLO 5: SessionStorage Temporário
// ============================================
export const sessionStorageExample = () => {
  // Dados que expiram ao fechar tab
  storage.set('wizard-progress', {
    step: 3,
    data: { /* ... */ }
  }, {
    type: StorageType.SESSION,
    namespace: 'wizard'
  });

  // Recuperar
  const { data } = storage.get('wizard-progress', {
    type: StorageType.SESSION,
    namespace: 'wizard'
  });

  return data;
};

// ============================================
// EXEMPLO 6: Limpeza Periódica
// ============================================
export const cleanupExample = () => {
  // Limpar items expirados a cada hora
  setInterval(() => {
    const removed = storage.cleanExpired();
    if (removed > 0) {
      console.log(`🗑️ Removidos ${removed} itens expirados`);
    }
  }, 60 * 60 * 1000);
};

// ============================================
// EXEMPLO 7: Estatísticas e Monitoramento
// ============================================
export const statsExample = () => {
  const stats = storage.getStats('orders');

  console.table({
    'Total Keys': stats.totalKeys,
    'Size (KB)': (stats.totalSize / 1024).toFixed(2),
    'Expired': stats.expiredKeys,
    'Valid': stats.validKeys,
    'Usage': `${((stats.totalSize / (5 * 1024 * 1024)) * 100).toFixed(1)}%`
  });

  // Alertar se muito espaço usado
  if (stats.totalSize > 4 * 1024 * 1024) { // >4MB
    console.warn('⚠️ Storage próximo do limite!');
  }
};

// ============================================
// EXEMPLO 8: Bulk Operations
// ============================================
export const bulkOperationsExample = () => {
  // Salvar múltiplos items
  const items = [
    { key: 'item1', data: { value: 1 } },
    { key: 'item2', data: { value: 2 } },
    { key: 'item3', data: { value: 3 } }
  ];

  items.forEach(({ key, data }) => {
    storage.set(key, data, { namespace: 'bulk' });
  });

  // Limpar namespace inteiro
  const removed = storage.clear('bulk');
  console.log(`Removidos ${removed} items do namespace 'bulk'`);
};
