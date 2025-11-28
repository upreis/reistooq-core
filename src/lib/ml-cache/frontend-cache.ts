/**
 * 🔄 ML ORDERS - FRONTEND CACHE
 * Cache em memória + localStorage para pedidos do Mercado Livre
 */

interface CacheEntry {
  data: any[];
  timestamp: number;
  accountIds: string[];
  dateFrom?: string;
  dateTo?: string;
}

class MlOrdersFrontendCache {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutos
  private readonly MAX_ENTRIES = 50;
  private readonly STORAGE_KEY = 'ml_orders_cache_v1';

  /**
   * Gera chave única para cache
   */
  private generateKey(accountIds: string[], dateFrom?: string, dateTo?: string): string {
    const sortedAccounts = [...accountIds].sort().join(',');
    return `${sortedAccounts}|${dateFrom || ''}|${dateTo || ''}`;
  }

  /**
   * Verifica se entrada de cache é válida
   */
  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.TTL_MS;
  }

  /**
   * Busca dados do cache em memória
   */
  getFromMemory(accountIds: string[], dateFrom?: string, dateTo?: string): any[] | null {
    const key = this.generateKey(accountIds, dateFrom, dateTo);
    const entry = this.memoryCache.get(key);
    
    if (entry && this.isValid(entry)) {
      console.log('✅ Memory cache HIT:', key);
      return entry.data;
    }
    
    console.log('❌ Memory cache MISS:', key);
    return null;
  }

  /**
   * Busca dados do localStorage
   */
  getFromLocalStorage(accountIds: string[], dateFrom?: string, dateTo?: string): any[] | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const cache: Record<string, CacheEntry> = JSON.parse(stored);
      const key = this.generateKey(accountIds, dateFrom, dateTo);
      const entry = cache[key];

      if (entry && this.isValid(entry)) {
        console.log('✅ LocalStorage cache HIT:', key);
        // Restaurar para memória também
        this.memoryCache.set(key, entry);
        return entry.data;
      }

      console.log('❌ LocalStorage cache MISS or expired:', key);
      return null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  /**
   * Salva dados em ambos caches (memória + localStorage)
   */
  set(accountIds: string[], data: any[], dateFrom?: string, dateTo?: string): void {
    const key = this.generateKey(accountIds, dateFrom, dateTo);
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      accountIds,
      dateFrom,
      dateTo
    };

    // Salvar em memória
    this.memoryCache.set(key, entry);

    // LRU eviction se exceder limite
    if (this.memoryCache.size > this.MAX_ENTRIES) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    // Salvar em localStorage
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const cache: Record<string, CacheEntry> = stored ? JSON.parse(stored) : {};
      
      cache[key] = entry;

      // Limpar entradas expiradas antes de salvar
      const cleanedCache: Record<string, CacheEntry> = {};
      let count = 0;
      for (const [k, v] of Object.entries(cache)) {
        if (this.isValid(v) && count < this.MAX_ENTRIES) {
          cleanedCache[k] = v;
          count++;
        }
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cleanedCache));
      console.log('💾 Saved to cache:', key);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  /**
   * Limpa cache completamente
   */
  clear(): void {
    this.memoryCache.clear();
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🗑️ Cache cleared');
  }

  /**
   * Invalida cache para contas específicas
   */
  invalidate(accountIds: string[]): void {
    // Limpar memória
    for (const [key, entry] of this.memoryCache.entries()) {
      if (accountIds.some(id => entry.accountIds.includes(id))) {
        this.memoryCache.delete(key);
      }
    }

    // Limpar localStorage
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;

      const cache: Record<string, CacheEntry> = JSON.parse(stored);
      const cleanedCache: Record<string, CacheEntry> = {};

      for (const [key, entry] of Object.entries(cache)) {
        if (!accountIds.some(id => entry.accountIds.includes(id))) {
          cleanedCache[key] = entry;
        }
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cleanedCache));
      console.log('🔄 Cache invalidated for accounts:', accountIds);
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  }
}

// Singleton instance
export const mlOrdersCache = new MlOrdersFrontendCache();
