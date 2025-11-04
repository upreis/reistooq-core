/**
 * 🚀 FASE 2: SISTEMA DE CACHE INTELIGENTE
 * Cache multicamadas para pedidos com invalidação automática
 */

import { QueryClient } from '@tanstack/react-query';

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

class PedidosCacheService {
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
    let oldestTime = Infinity;

    this.cache.forEach((entry, key) => {
      // Prioriza remover menos usado e mais antigo
      const score = entry.hits + (Date.now() - entry.timestamp) / 1000;
      if (score < minHits) {
        minHits = score;
        lruKey = key;
        oldestTime = entry.timestamp;
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
      if (now - entry.timestamp > entry.ttl) {
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
   * Pre-aquece o cache com dados frequentes
   */
  async warmup<T>(
    keys: Array<{ key: string; loader: () => Promise<T>; ttl?: number }>
  ): Promise<void> {
    await Promise.all(
      keys.map(async ({ key, loader, ttl }) => {
        try {
          const data = await loader();
          this.set(key, data, ttl);
        } catch (error) {
          console.error(`[CACHE] Falha ao carregar ${key}:`, error);
        }
      })
    );
  }

  /**
   * Configura tamanho máximo do cache
   */
  setMaxSize(size: number): void {
    this.maxSize = size;
    
    // Remove excess entries
    while (this.cache.size > this.maxSize) {
      this.evictLRU();
    }
  }

  /**
   * Configura TTL padrão
   */
  setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl;
  }

  /**
   * Reset das estatísticas
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0 };
  }
}

// Singleton instance
export const pedidosCache = new PedidosCacheService();

// Auto cleanup a cada 5 minutos
if (typeof window !== 'undefined') {
  setInterval(() => {
    pedidosCache.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Helper para gerar chaves de cache consistentes
 */
export const cacheKeys = {
  pedidos: (filters?: any) => 
    `pedidos:${JSON.stringify(filters || {})}`,
  
  pedido: (id: string) => 
    `pedido:${id}`,
  
  stats: (period?: string) => 
    `stats:${period || 'today'}`,
  
  mapeamentos: (accountId?: string) => 
    `mapeamentos:${accountId || 'all'}`,
    
  filtros: (userId: string) => 
    `filtros:${userId}`,
} as const;

/**
 * Invalidação inteligente baseada em eventos
 */
export const invalidateOnEvents = {
  pedidoCriado: () => {
    pedidosCache.invalidate('pedidos:');
    pedidosCache.invalidate('stats:');
  },
  
  pedidoAtualizado: (id: string) => {
    pedidosCache.delete(cacheKeys.pedido(id));
    pedidosCache.invalidate('pedidos:');
    pedidosCache.invalidate('stats:');
  },
  
  mapeamentoAtualizado: () => {
    pedidosCache.invalidate('mapeamentos:');
    pedidosCache.invalidate('pedidos:');
  },
  
  all: () => {
    pedidosCache.invalidate();
  }
} as const;
