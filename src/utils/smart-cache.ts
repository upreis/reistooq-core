import React from 'react';
import { logger } from './logger';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items
  strategy?: 'lru' | 'lfu' | 'ttl'; // Eviction strategy
}

export class SmartCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private readonly maxSize: number;
  private readonly defaultTTL: number;
  private readonly strategy: 'lru' | 'lfu' | 'ttl';
  private hits = 0;
  private misses = 0;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes
    this.strategy = options.strategy || 'lru';
  }

  set(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const itemTTL = ttl || this.defaultTTL;

    // Remove expired items before adding new one
    this.cleanup();

    // If cache is full, evict based on strategy
    if (this.cache.size >= this.maxSize) {
      this.evict();
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      ttl: itemTTL,
      accessCount: 0,
      lastAccessed: now
    });

    logger.debug('Cache set', { key, ttl: itemTTL });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      this.misses++;
      logger.debug('Cache miss', { key });
      return null;
    }

    const now = Date.now();
    
    // Check if item has expired
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.misses++;
      logger.debug('Cache expired', { key });
      return null;
    }

    // Update access statistics
    item.accessCount++;
    item.lastAccessed = now;
    this.hits++;

    logger.debug('Cache hit', { key, accessCount: item.accessCount });
    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug('Cache delete', { key });
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    logger.debug('Cache cleared');
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      logger.debug('Cache cleanup', { expired: keysToDelete.length });
    }
  }

  private evict(): void {
    if (this.cache.size === 0) return;

    let keyToEvict: string;

    switch (this.strategy) {
      case 'lru': // Least Recently Used
        keyToEvict = this.findLRU();
        break;
      case 'lfu': // Least Frequently Used
        keyToEvict = this.findLFU();
        break;
      case 'ttl': // Oldest by timestamp
        keyToEvict = this.findOldest();
        break;
      default:
        keyToEvict = this.cache.keys().next().value;
    }

    this.cache.delete(keyToEvict);
    logger.debug('Cache eviction', { key: keyToEvict, strategy: this.strategy });
  }

  private findLRU(): string {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  private findLFU(): string {
    let leastUsedKey = '';
    let leastCount = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.accessCount < leastCount) {
        leastCount = item.accessCount;
        leastUsedKey = key;
      }
    }

    return leastUsedKey;
  }

  private findOldest(): string {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  // Cache statistics
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      strategy: this.strategy,
      items: Array.from(this.cache.entries()).map(([key, item]) => ({
        key,
        size: JSON.stringify(item.data).length,
        age: Date.now() - item.timestamp,
        ttl: item.ttl,
        accessCount: item.accessCount,
        lastAccessed: new Date(item.lastAccessed).toISOString()
      }))
    };
  }

  // Preload data with cache warming
  async preload<K extends string>(
    keys: K[],
    fetcher: (key: K) => Promise<T>,
    ttl?: number
  ): Promise<void> {
    const promises = keys.map(async (key) => {
      if (!this.has(key)) {
        try {
          const data = await fetcher(key);
          this.set(key, data, ttl);
        } catch (error) {
          logger.error(`Cache preload failed for key: ${key}`, error);
        }
      }
    });

    await Promise.allSettled(promises);
    logger.debug('Cache preload completed', { keys: keys.length });
  }
}

// Global cache instances for different data types
export const queryCache = new SmartCache({
  maxSize: 200,
  ttl: 5 * 60 * 1000, // 5 minutes
  strategy: 'lru'
});

export const userCache = new SmartCache({
  maxSize: 50,
  ttl: 10 * 60 * 1000, // 10 minutes
  strategy: 'lfu'
});

export const staticCache = new SmartCache({
  maxSize: 100,
  ttl: 30 * 60 * 1000, // 30 minutes
  strategy: 'ttl'
});

// Cache wrapper for async functions
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  cache: SmartCache<Awaited<ReturnType<T>>>,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl?: number
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    
    // Try to get from cache first
    const cached = cache.get(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    try {
      const result = await fn(...args);
      cache.set(key, result, ttl);
      return result;
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  }) as T;
}

// React hook for cache management
export const useSmartCache = <T>(cacheInstance: SmartCache<T>) => {
  const [stats, setStats] = React.useState(cacheInstance.getStats());

  const refreshStats = React.useCallback(() => {
    setStats(cacheInstance.getStats());
  }, [cacheInstance]);

  React.useEffect(() => {
    const interval = setInterval(refreshStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [refreshStats]);

  return {
    stats,
    refreshStats,
    clear: () => {
      cacheInstance.clear();
      refreshStats();
    },
    delete: (key: string) => {
      cacheInstance.delete(key);
      refreshStats();
    }
  };
};