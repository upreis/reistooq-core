// Serviço de cache inteligente para histórico
import { HISTORICO_CONSTANTS } from "../utils/historicoConstants";

interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccess: number;
}

export class HistoricoCacheService {
  private cache = new Map<string, CacheItem>();
  private maxItems = HISTORICO_CONSTANTS.CACHE.MAX_ITEMS;
  private defaultTTL = HISTORICO_CONSTANTS.CACHE.TTL_DATA;

  // Armazenar no cache
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    // Limpar cache se estiver cheio
    if (this.cache.size >= this.maxItems) {
      this.evictLRU();
    }

    // Limpar itens expirados
    this.cleanExpired();

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      lastAccess: Date.now()
    };

    this.cache.set(key, item);
  }

  // Recuperar do cache
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Verificar se expirou
    if (this.isExpired(item)) {
      this.cache.delete(key);
      return null;
    }

    // Atualizar estatísticas de acesso
    item.hits++;
    item.lastAccess = Date.now();

    return item.data;
  }

  // Verificar se existe no cache
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (this.isExpired(item)) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // Remover do cache
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Limpar cache por padrão
  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Estatísticas do cache
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    items: Array<{
      key: string;
      size: number;
      hits: number;
      age: number;
      ttl: number;
    }>;
  } {
    const items = Array.from(this.cache.entries()).map(([key, item]) => ({
      key,
      size: this.estimateSize(item.data),
      hits: item.hits,
      age: Date.now() - item.timestamp,
      ttl: item.ttl
    }));

    const totalHits = items.reduce((sum, item) => sum + item.hits, 0);
    const totalRequests = totalHits + items.length; // Aproximação

    return {
      size: this.cache.size,
      maxSize: this.maxItems,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      items: items.sort((a, b) => b.hits - a.hits)
    };
  }

  // Limpar itens expirados
  private cleanExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Remover item menos usado (LRU)
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccess < oldestAccess) {
        oldestAccess = item.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // Verificar se item expirou
  private isExpired(item: CacheItem): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  // Estimar tamanho do objeto (aproximado)
  private estimateSize(obj: any): number {
    const str = JSON.stringify(obj);
    return new Blob([str]).size;
  }

  // Configurar TTL por tipo de dados
  setTTLForType(type: 'data' | 'filters' | 'analytics' | 'export'): number {
    switch (type) {
      case 'data':
        return HISTORICO_CONSTANTS.CACHE.TTL_DATA;
      case 'filters':
        return HISTORICO_CONSTANTS.CACHE.TTL_FILTERS;
      case 'analytics':
        return HISTORICO_CONSTANTS.CACHE.TTL_ANALYTICS;
      case 'export':
        return HISTORICO_CONSTANTS.CACHE.TTL_EXPORT;
      default:
        return this.defaultTTL;
    }
  }

  // Pré-carregamento inteligente
  async preload(keys: string[], loader: (key: string) => Promise<any>): Promise<void> {
    const promises = keys
      .filter(key => !this.has(key))
      .map(async key => {
        try {
          const data = await loader(key);
          this.set(key, data);
        } catch (error) {
          console.warn(`Failed to preload cache key: ${key}`, error);
        }
      });

    await Promise.all(promises);
  }

  // Warmup do cache com dados frequentes
  async warmup(commonQueries: Array<{
    key: string;
    loader: () => Promise<any>;
    priority: number;
  }>): Promise<void> {
    // Ordenar por prioridade
    const sortedQueries = commonQueries.sort((a, b) => b.priority - a.priority);
    
    // Carregar em lotes para não sobrecarregar
    const batchSize = 3;
    for (let i = 0; i < sortedQueries.length; i += batchSize) {
      const batch = sortedQueries.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async query => {
          try {
            if (!this.has(query.key)) {
              const data = await query.loader();
              this.set(query.key, data);
            }
          } catch (error) {
            console.warn(`Failed to warmup cache: ${query.key}`, error);
          }
        })
      );
    }
  }

  // Persistir cache no localStorage (para dados importantes)
  persistToStorage(keys?: string[]): void {
    try {
      const dataToPersist: Record<string, any> = {};
      
      const targetKeys = keys || Array.from(this.cache.keys());
      
      for (const key of targetKeys) {
        const item = this.cache.get(key);
        if (item && !this.isExpired(item)) {
          dataToPersist[key] = {
            data: item.data,
            timestamp: item.timestamp,
            ttl: item.ttl
          };
        }
      }
      
      localStorage.setItem(
        HISTORICO_CONSTANTS.CACHE.STORAGE_KEY,
        JSON.stringify(dataToPersist)
      );
    } catch (error) {
      console.warn('Failed to persist cache to storage:', error);
    }
  }

  // Carregar cache do localStorage
  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(HISTORICO_CONSTANTS.CACHE.STORAGE_KEY);
      if (!stored) return;
      
      const data = JSON.parse(stored);
      const now = Date.now();
      
      for (const [key, item] of Object.entries(data)) {
        const cacheItem = item as any;
        
        // Verificar se ainda é válido
        if (now - cacheItem.timestamp < cacheItem.ttl) {
          this.cache.set(key, {
            data: cacheItem.data,
            timestamp: cacheItem.timestamp,
            ttl: cacheItem.ttl,
            hits: 0,
            lastAccess: now
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  // Limpar storage
  clearStorage(): void {
    try {
      localStorage.removeItem(HISTORICO_CONSTANTS.CACHE.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear cache storage:', error);
    }
  }
}