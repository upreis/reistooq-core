// =============================================================================
// SCANNER SEARCH HOOK - Busca e cache de produtos
// =============================================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { ScannedProduct, ScannerCache, CachedProduct, UseScannerSearchOptions } from '../types/scanner.types';
import { ProductLookupService } from '../services/ProductLookup';

export const useScannerSearch = (options: UseScannerSearchOptions = {}) => {
  const {
    enableCache = true,
    enableFuzzySearch = true,
    cacheStrategy = 'cache-first',
    onCacheHit,
    onCacheMiss
  } = options;

  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ScannedProduct[]>([]);
  const [lastSearchTerm, setLastSearchTerm] = useState('');

  const productLookupRef = useRef<ProductLookupService | null>(null);
  const cacheRef = useRef<ScannerCache>({
    products: new Map(),
    barcodes: new Map(),
    lastCleanup: new Date(),
    hitCount: 0,
    missCount: 0
  });

  // Initialize service
  useEffect(() => {
    if (!productLookupRef.current) {
      productLookupRef.current = new ProductLookupService();
    }
  }, []);

  // Cache cleanup
  useEffect(() => {
    const cleanup = () => {
      const now = new Date();
      const cache = cacheRef.current;
      
      for (const [key, cachedProduct] of cache.products.entries()) {
        if (now > cachedProduct.expires_at) {
          cache.products.delete(key);
        }
      }
      
      cache.lastCleanup = now;
      console.log('🧹 [Scanner Search] Cache cleaned up');
    };

    const interval = setInterval(cleanup, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Get from cache
  const getCachedProduct = useCallback((productId: string): CachedProduct | null => {
    if (!enableCache) return null;
    
    const cached = cacheRef.current.products.get(productId);
    if (cached && new Date() < cached.expires_at) {
      cached.access_count++;
      cached.last_accessed = new Date();
      cacheRef.current.hitCount++;
      return cached;
    }
    
    if (cached) {
      cacheRef.current.products.delete(productId);
    }
    
    cacheRef.current.missCount++;
    return null;
  }, [enableCache]);

  // Set cache
  const setCachedProduct = useCallback((product: ScannedProduct): void => {
    if (!enableCache) return;
    
    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes
    
    const cachedProduct: CachedProduct = {
      product,
      cached_at: now,
      expires_at: expires,
      access_count: 1,
      last_accessed: now
    };
    
    cacheRef.current.products.set(product.id, cachedProduct);
    
    if (product.codigo_barras) {
      cacheRef.current.barcodes.set(product.codigo_barras, product.id);
    }
  }, [enableCache]);

  // Search by barcode
  const searchByBarcode = useCallback(async (barcode: string): Promise<ScannedProduct | null> => {
    try {
      setIsSearching(true);
      
      // Check cache first
      if (cacheStrategy === 'cache-first') {
        const productId = cacheRef.current.barcodes.get(barcode);
        if (productId) {
          const cached = getCachedProduct(productId);
          if (cached) {
            onCacheHit?.(cached.product);
            return cached.product;
          }
        }
      }

      onCacheMiss?.(barcode);

      // Search in database
      const product = await productLookupRef.current?.findByBarcode(barcode);
      
      if (product) {
        setCachedProduct(product);
        return product;
      }

      return null;
    } catch (error) {
      console.error('❌ [Scanner Search] Barcode search failed:', error);
      throw error;
    } finally {
      setIsSearching(false);
    }
  }, [cacheStrategy, getCachedProduct, setCachedProduct, onCacheHit, onCacheMiss]);

  // Search by SKU
  const searchBySku = useCallback(async (sku: string): Promise<ScannedProduct | null> => {
    try {
      setIsSearching(true);
      
      // Check cache (by scanning all products)
      if (enableCache) {
        for (const cachedProduct of cacheRef.current.products.values()) {
          if (cachedProduct.product.sku_interno === sku && 
              new Date() < cachedProduct.expires_at) {
            cachedProduct.access_count++;
            cachedProduct.last_accessed = new Date();
            onCacheHit?.(cachedProduct.product);
            return cachedProduct.product;
          }
        }
      }

      onCacheMiss?.(sku);

      const product = await productLookupRef.current?.findBySku(sku);
      
      if (product) {
        setCachedProduct(product);
        return product;
      }

      return null;
    } catch (error) {
      console.error('❌ [Scanner Search] SKU search failed:', error);
      throw error;
    } finally {
      setIsSearching(false);
    }
  }, [enableCache, setCachedProduct, onCacheHit, onCacheMiss]);

  // Search by name/description
  const searchByName = useCallback(async (
    query: string, 
    limit: number = 10
  ): Promise<ScannedProduct[]> => {
    try {
      setIsSearching(true);
      setLastSearchTerm(query);

      const results = await productLookupRef.current?.findByName(query) || [];
      
      // Cache results
      results.forEach(product => setCachedProduct(product));
      
      setSearchResults(results.slice(0, limit));
      return results.slice(0, limit);
    } catch (error) {
      console.error('❌ [Scanner Search] Name search failed:', error);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, [setCachedProduct]);

  // Generic search
  const search = useCallback(async (
    query: string,
    filters?: any
  ): Promise<ScannedProduct[]> => {
    try {
      setIsSearching(true);
      setLastSearchTerm(query);

      const results = await productLookupRef.current?.search(query, filters) || [];
      
      // Cache results
      results.forEach(product => setCachedProduct(product));
      
      setSearchResults(results);
      return results;
    } catch (error) {
      console.error('❌ [Scanner Search] Search failed:', error);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, [setCachedProduct]);

  // Clear cache
  const clearCache = useCallback((): void => {
    cacheRef.current.products.clear();
    cacheRef.current.barcodes.clear();
    cacheRef.current.hitCount = 0;
    cacheRef.current.missCount = 0;
    cacheRef.current.lastCleanup = new Date();
    console.log('🧹 [Scanner Search] Cache cleared');
  }, []);

  // Get cache stats
  const getCacheStats = useCallback(() => {
    const cache = cacheRef.current;
    const total = cache.hitCount + cache.missCount;
    const hitRate = total > 0 ? (cache.hitCount / total) * 100 : 0;
    
    return {
      size: cache.products.size,
      hitCount: cache.hitCount,
      missCount: cache.missCount,
      hitRate: Math.round(hitRate * 100) / 100,
      lastCleanup: cache.lastCleanup
    };
  }, []);

  return {
    // State
    isSearching,
    searchResults,
    lastSearchTerm,
    cache: cacheRef.current,
    
    // Actions
    searchByBarcode,
    searchBySku,
    searchByName,
    search,
    clearCache,
    getCacheStats
  };
};