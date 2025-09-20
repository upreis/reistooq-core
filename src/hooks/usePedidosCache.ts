// P3.3: Cache com TTL para otimização de performance
import { useState, useEffect, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number; // em milissegundos, padrão 5 minutos
  maxSize?: number; // máximo de entradas no cache
}

export function usePedidosCache<T>(options: CacheOptions = {}) {
  const { ttl = 5 * 60 * 1000, maxSize = 100 } = options;
  const [cache, setCache] = useState<Map<string, CacheEntry<T>>>(new Map());

  // P3.3: Limpar entradas expiradas automaticamente
  const cleanExpiredEntries = useCallback(() => {
    const now = Date.now();
    setCache(prev => {
      const newCache = new Map(prev);
      for (const [key, entry] of newCache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          newCache.delete(key);
        }
      }
      return newCache;
    });
  }, []);

  // Limpar cache expirado periodicamente
  useEffect(() => {
    const interval = setInterval(cleanExpiredEntries, 60000); // a cada minuto
    return () => clearInterval(interval);
  }, [cleanExpiredEntries]);

  const get = useCallback((key: string): T | null => {
    const entry = cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Entrada expirada, remover
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
      return null;
    }
    
    return entry.data;
  }, [cache]);

  const set = useCallback((key: string, data: T, customTtl?: number) => {
    setCache(prev => {
      const newCache = new Map(prev);
      
      // Limitar tamanho do cache
      if (newCache.size >= maxSize) {
        // Remover entrada mais antiga
        const firstKey = newCache.keys().next().value;
        if (firstKey) newCache.delete(firstKey);
      }
      
      newCache.set(key, {
        data,
        timestamp: Date.now(),
        ttl: customTtl || ttl
      });
      
      return newCache;
    });
  }, [ttl, maxSize]);

  const remove = useCallback((key: string) => {
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(key);
      return newCache;
    });
  }, []);

  const clear = useCallback(() => {
    setCache(new Map());
  }, []);

  const has = useCallback((key: string): boolean => {
    return get(key) !== null;
  }, [get]);

  return {
    get,
    set,
    remove,
    clear,
    has,
    size: cache.size,
    cleanExpiredEntries
  };
}