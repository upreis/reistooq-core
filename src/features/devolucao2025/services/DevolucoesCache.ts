/**
 * 🚀 FASE 2: SISTEMA DE CACHE FRONTEND INTELIGENTE
 * Cache multicamadas para devoluções com invalidação automática
 * Inspirado no padrão /pedidos que funciona perfeitamente
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  avgAge: number;
}

class DevolucoesCache {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = { hits: 0, misses: 0 };
  private maxSize = 100;
  private defaultTTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Busca dados no cache com validação de TTL
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Verifica se expirou
    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Cache hit
    entry.hits++;
    this.stats.hits++;
    return entry.data as T;
  }

  /**
   * Armazena dados no cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Evict LRU se atingir limite
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      hits: 0
    });
  }

  /**
   * Remove entry específica
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Invalida cache com pattern matching
   */
  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Evict Least Recently Used (LRU)
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let minHits = Infinity;

    this.cache.forEach((entry, key) => {
      // Prioriza remover menos usado e mais antigo
      const score = entry.hits + (Date.now() - entry.timestamp) / 1000;
      if (score < minHits) {
        minHits = score;
        lruKey = key;
      }
    });

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Limpa entradas expiradas
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      // Só deleta se expirado E não foi acessado recentemente (último 1s)
      const isExpired = now - entry.timestamp > entry.ttl;
      const recentlyAccessed = entry.hits > 0 && (now - entry.timestamp) < 1000;
      
      if (isExpired && !recentlyAccessed) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    
    const totalAge = entries.reduce((sum, entry) => 
      sum + (now - entry.timestamp), 0
    );

    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 
      ? (this.stats.hits / totalRequests) * 100 
      : 0;

    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      avgAge: entries.length > 0 ? Math.round(totalAge / entries.length) : 0
    };
  }

  /**
   * Reset das estatísticas
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * 💾 PERSISTÊNCIA EM LOCALSTORAGE COM METADADOS
   * Salva dados completos + metadados de contas para validação
   */
  persistToLocalStorage<T>(key: string, data: T, metadata?: { accounts?: string[] }): void {
    try {
      const toSave = {
        data,
        timestamp: Date.now(),
        ttl: this.defaultTTL,
        metadata: metadata || {}
      };
      
      const jsonStr = JSON.stringify(toSave);
      const sizeKB = (jsonStr.length / 1024).toFixed(1);
      
      localStorage.setItem(`devolucoes:${key}`, jsonStr);
      
      console.log('💾 [PERSIST] Dados completos salvos no localStorage:', {
        key: `devolucoes:${key}`,
        size: `${sizeKB}KB`,
        recordCount: Array.isArray(data) ? data.length : 'N/A',
        accounts: metadata?.accounts?.length || 0
      });
    } catch (error: any) {
      console.warn('❌ [PERSIST] Falha ao salvar no localStorage:', error);
      
      // Se exceder quota, tentar limpar dados antigos e tentar novamente
      if (error.name === 'QuotaExceededError') {
        console.log('🧹 [PERSIST] Quota excedida, limpando dados antigos...');
        this.cleanOldLocalStorageData();
        
        // Tentar novamente (apenas uma vez)
        try {
          const toSave = {
            data,
            timestamp: Date.now(),
            ttl: this.defaultTTL
          };
          localStorage.setItem(`devolucoes:${key}`, JSON.stringify(toSave));
          console.log('✅ [PERSIST] Salvo após limpeza');
        } catch (retryError) {
          console.error('❌ [PERSIST] Falhou mesmo após limpeza:', retryError);
        }
      }
    }
  }

  /**
   * Limpa dados antigos do localStorage para liberar espaço
   */
  private cleanOldLocalStorageData(): void {
    try {
      const keysToCheck = ['devolucoes:lastSearch', 'devolucoes-cache:', 'pedidos:', 'vendas:'];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && keysToCheck.some(prefix => key.startsWith(prefix))) {
          const item = localStorage.getItem(key);
          if (item) {
            try {
              const parsed = JSON.parse(item);
              // Remover se mais de 1 hora
              if (parsed.timestamp && Date.now() - parsed.timestamp > 60 * 60 * 1000) {
                localStorage.removeItem(key);
                console.log('🧹 Removido cache antigo:', key);
              }
            } catch (e) {
              // Item corrompido, remover
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Erro ao limpar localStorage:', error);
    }
  }

  /**
   * Restaura dados do localStorage com validação de metadados
   */
  restoreFromLocalStorage<T>(key: string, validateMetadata?: { accounts?: string[] }): T | null {
    try {
      const stored = localStorage.getItem(`devolucoes:${key}`);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      
      // Verificar se expirou
      const isExpired = Date.now() - parsed.timestamp > parsed.ttl;
      if (isExpired) {
        localStorage.removeItem(`devolucoes:${key}`);
        console.log('⏰ [PERSIST] Dados expirados no localStorage:', key);
        return null;
      }

      // ✅ FASE 3: Validar se contas são as mesmas
      if (validateMetadata?.accounts) {
        const cachedAccounts = parsed.metadata?.accounts || [];
        const requestedAccountsSorted = validateMetadata.accounts.slice().sort().join('|');
        const cachedAccountsSorted = cachedAccounts.slice().sort().join('|');
        
        if (requestedAccountsSorted !== cachedAccountsSorted) {
          console.log('⚠️ [PERSIST] Cache invalidado - contas diferentes:', {
            cached: cachedAccounts,
            requested: validateMetadata.accounts
          });
          return null;
        }
        
        console.log('✅ [PERSIST] Validação de contas OK:', {
          accounts: cachedAccounts.length
        });
      }

      console.log('✅ [PERSIST] Dados restaurados do localStorage:', {
        key: `devolucoes:${key}`,
        age: Math.round((Date.now() - parsed.timestamp) / 1000) + 's',
        recordCount: Array.isArray(parsed.data) ? parsed.data.length : 'N/A',
        accountsValidated: !!validateMetadata?.accounts
      });

      return parsed.data as T;
    } catch (error) {
      console.warn('❌ [PERSIST] Falha ao restaurar do localStorage:', error);
      return null;
    }
  }

  /**
   * Remove dados do localStorage
   */
  removeFromLocalStorage(key: string): void {
    localStorage.removeItem(`devolucoes:${key}`);
  }
}

// Singleton instance
export const devolucoesCache = new DevolucoesCache();

// Gerenciamento do cleanup interval
let cleanupIntervalId: NodeJS.Timeout | null = null;

export function startCacheCleanup() {
  if (cleanupIntervalId) return;
  
  cleanupIntervalId = setInterval(() => {
    devolucoesCache.cleanup();
  }, 5 * 60 * 1000);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 [DEVOLUCOES CACHE] Auto cleanup iniciado (5min)');
  }
}

export function stopCacheCleanup() {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
  }
}

// Iniciar cleanup
if (typeof window !== 'undefined') {
  startCacheCleanup();
  window.addEventListener('beforeunload', stopCacheCleanup);
}

/**
 * Normaliza valor para serialização consistente
 */
function normalizeValue(value: any): any {
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  
  if (Array.isArray(value)) {
    return value.map(normalizeValue).sort();
  }
  
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        const normalized = normalizeValue(value[key]);
        if (normalized !== undefined) {
          acc[key] = normalized;
        }
        return acc;
      }, {} as any);
  }
  
  return value;
}

/**
 * Helper para gerar chaves de cache consistentes
 */
export const cacheKeys = {
  devolucoes: (filters?: any) => {
    if (!filters || Object.keys(filters).length === 0) {
      return 'devolucoes:empty';
    }
    
    try {
      const normalized = normalizeValue(filters);
      return `devolucoes:${JSON.stringify(normalized)}`;
    } catch (error) {
      console.warn('[DEVOLUCOES CACHE] Falha ao serializar:', error);
      return `devolucoes:${Date.now()}`;
    }
  },
  
  devolucao: (id: string) => `devolucao:${id}`,
  stats: (period?: string) => `devolucoes-stats:${period || 'today'}`,
  filtros: (userId: string) => `devolucoes-filtros:${userId}`,
} as const;

/**
 * Invalidação baseada em eventos
 */
export const invalidateOnEvents = {
  devolucaoCriada: () => {
    devolucoesCache.invalidate('devolucoes:');
    devolucoesCache.invalidate('devolucoes-stats:');
  },
  
  devolucaoAtualizada: (id: string) => {
    devolucoesCache.delete(cacheKeys.devolucao(id));
    devolucoesCache.invalidate('devolucoes:');
  },
  
  all: () => devolucoesCache.invalidate()
} as const;

/**
 * 🌐 HELPER PÚBLICO PARA OUTRAS PÁGINAS
 * Permite que páginas como /dashboardinicial leiam os dados persistidos
 */
export function getPersistedDevolucoes(): any[] | null {
  return devolucoesCache.restoreFromLocalStorage('lastSearch');
}

export function clearPersistedDevolucoes(): void {
  devolucoesCache.removeFromLocalStorage('lastSearch');
}
