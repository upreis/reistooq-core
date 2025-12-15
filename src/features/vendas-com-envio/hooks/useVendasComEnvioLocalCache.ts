/**
 * 🚀 COMBO 2.1 - Hook de Cache Local
 * Gerencia persistência de dados no localStorage para restauração instantânea
 */

import { useState, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import type { VendaComEnvio, VendasComEnvioFilters } from '../types';

interface CacheFilters {
  accounts: string[];
  dateFrom: string;
  dateTo: string;
}

interface CacheEntry {
  data: VendaComEnvio[];
  timestamp: number;
  filters: CacheFilters;
  totalCount: number;
}

const CACHE_KEY = 'vendas_com_envio_local_cache_v4';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos

function readCacheFromStorage(): CacheEntry | null {
  try {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as CacheEntry;
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    if (!Array.isArray(parsed.data) || !parsed.filters) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    try { localStorage.removeItem(CACHE_KEY); } catch {}
    return null;
  }
}

export function useVendasComEnvioLocalCache() {
  const [cachedEntry, setCachedEntry] = useState<CacheEntry | null>(() => readCacheFromStorage());

  const saveToCache = useCallback((
    data: VendaComEnvio[],
    filters: VendasComEnvioFilters,
    totalCount: number
  ) => {
    if (!data || data.length === 0) return;

    const dateFrom = filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : '';
    const dateTo = filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : '';

    const optimizedData = data.map(venda => ({
      ...venda,
      order_data: {} // Remove heavy data
    }));

    const entry: CacheEntry = {
      data: optimizedData,
      timestamp: Date.now(),
      filters: {
        accounts: filters.selectedAccounts,
        dateFrom,
        dateTo,
      },
      totalCount,
    };

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
      setCachedEntry(entry);
    } catch (e) {
      console.warn('[LocalCache] Erro ao salvar:', e);
      try { localStorage.removeItem(CACHE_KEY); } catch {}
    }
  }, []);

  const getValidCacheData = useCallback((filters: VendasComEnvioFilters): CacheEntry | null => {
    const cached = readCacheFromStorage();
    if (!cached) return null;
    
    const dateFrom = filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : '';
    const dateTo = filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : '';
    
    const accountsMatch = cached.filters.accounts.sort().join(',') === filters.selectedAccounts.sort().join(',');
    const datesMatch = cached.filters.dateFrom === dateFrom && cached.filters.dateTo === dateTo;
    
    if (accountsMatch && datesMatch) return cached;
    return null;
  }, []);

  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEY);
      setCachedEntry(null);
    } catch {}
  }, []);

  const cacheAgeMinutes = useMemo(() => {
    if (!cachedEntry) return null;
    return Math.floor((Date.now() - cachedEntry.timestamp) / 60000);
  }, [cachedEntry]);

  return {
    saveToCache,
    getValidCacheData,
    clearCache,
    hasCachedData: !!cachedEntry,
    cacheAgeMinutes,
  };
}
