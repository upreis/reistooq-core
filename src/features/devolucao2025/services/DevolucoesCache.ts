/**
 * 🚀 SISTEMA DE CACHE INTELIGENTE - DEVOLUÇÕES DE VENDA
 * Cache multicamadas frontend com invalidação automática
 * Baseado em /pedidos reference architecture
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
    console.log('🧹 [CACHE DEVOLUÇÕES] Auto cleanup iniciado (5min interval)');
  }
}

export function stopCacheCleanup() {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🛑 [CACHE DEVOLUÇÕES] Auto cleanup parado');
    }
  }
}

// Iniciar cleanup apenas uma vez
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
      console.warn('[CACHE] Falha ao serializar filtros:', error);
      return `devolucoes:${Date.now()}`;
    }
  },
  
  devolucao: (orderId: string) => 
    `devolucao:${orderId}`,
  
  stats: (period?: string) => 
    `stats:${period || 'today'}`,
} as const;

/**
 * Invalidação inteligente baseada em eventos
 */
export const invalidateOnEvents = {
  devolucaoCriada: () => {
    devolucoesCache.invalidate('devolucoes:');
    devolucoesCache.invalidate('stats:');
  },
  
  devolucaoAtualizada: (orderId: string) => {
    devolucoesCache.delete(cacheKeys.devolucao(orderId));
    devolucoesCache.invalidate('devolucoes:');
    devolucoesCache.invalidate('stats:');
  },
  
  all: () => {
    devolucoesCache.invalidate();
  }
} as const;
