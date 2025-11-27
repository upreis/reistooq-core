/**
 * 💾 ENRICHMENT CACHE - Sistema de Cache em Memória
 * Cache inteligente para enriquecimentos da API ML
 * TTL: 5 minutos | Max: 1000 entradas
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

export class EnrichmentCache {
  private cache: Map<string, CacheEntry>;
  private stats: CacheStats;
  private readonly MAX_ENTRIES = 1000;
  private readonly DEFAULT_TTL = 300000; // 5 minutos

  constructor() {
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0, size: 0 };
  }

  /**
   * 🔍 Buscar dado no cache
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Verificar se expirou
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.size = this.cache.size;
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  /**
   * 💾 Salvar dado no cache
   */
  set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    // Limpar cache se atingir limite
    if (this.cache.size >= this.MAX_ENTRIES) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    this.stats.size = this.cache.size;
  }

  /**
   * 🗑️ Remover entrada mais antiga (LRU)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * 🧹 Limpar cache expirado
   */
  cleanExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    this.stats.size = this.cache.size;
  }

  /**
   * 📊 Obter estatísticas do cache
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * 🔄 Resetar estatísticas
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0, size: this.cache.size };
  }

  /**
   * 🗑️ Limpar todo o cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, size: 0 };
  }

  /**
   * 📈 Calcular taxa de hit
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    if (total === 0) return 0;
    return (this.stats.hits / total) * 100;
  }
}

// 🌐 Cache global da Edge Function (persiste entre requests)
export const globalCache = new EnrichmentCache();

/**
 * 🔑 Funções helper para criar chaves de cache
 */
export const CacheKeys = {
  orderData: (orderId: string) => `order_${orderId}`,
  productInfo: (itemId: string) => `product_${itemId}`,
  returnDetails: (claimId: string) => `return_${claimId}`,
  claimMessages: (claimId: string) => `messages_${claimId}`,
  shipmentData: (shipmentId: string) => `shipment_${shipmentId}`,
};
