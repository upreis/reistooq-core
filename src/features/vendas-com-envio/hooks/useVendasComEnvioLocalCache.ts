/**
 * 🚀 COMBO 2.1 - Hook de Cache Local
 * Gerencia persistência de dados no localStorage para restauração instantânea
 * Padrão idêntico a /reclamacoes
 */

import { useState, useCallback, useMemo } from 'react';
import type { VendaComEnvio, VendasComEnvioFilters } from '../types';

interface CacheFilters {
  accounts: string[];
  periodo: number;
  dateFrom: string;
  dateTo: string;
}

interface CacheEntry {
  data: VendaComEnvio[];
  timestamp: number;
  filters: CacheFilters;
  totalCount: number;
}

const CACHE_KEY = 'vendas_com_envio_local_cache_v1';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos

/**
 * Calcula datas baseado no período
 */
function calculateDates(periodo: number): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const dateFrom = new Date(now);
  dateFrom.setDate(dateFrom.getDate() - periodo);
  
  return {
    dateFrom: dateFrom.toISOString().split('T')[0],
    dateTo: now.toISOString().split('T')[0],
  };
}

/**
 * Lê cache do localStorage de forma segura
 */
function readCacheFromStorage(): CacheEntry | null {
  try {
    if (typeof window === 'undefined') return null;
    
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored) as CacheEntry;
    
    // Verificar se expirou
    const isExpired = Date.now() - parsed.timestamp > CACHE_TTL;
    if (isExpired) {
      localStorage.removeItem(CACHE_KEY);
      console.log('[LocalCache] Cache expirado, removido');
      return null;
    }
    
    // Validar estrutura básica
    if (!Array.isArray(parsed.data) || !parsed.filters) {
      localStorage.removeItem(CACHE_KEY);
      console.log('[LocalCache] Cache inválido, removido');
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.warn('[LocalCache] Erro ao ler cache:', error);
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch {}
    return null;
  }
}

/**
 * Hook de cache local para Vendas com Envio
 * Combo 2.1: restauração instantânea de dados
 */
export function useVendasComEnvioLocalCache() {
  // Estado inicial restaurado do localStorage
  const [cachedEntry, setCachedEntry] = useState<CacheEntry | null>(() => {
    return readCacheFromStorage();
  });

  /**
   * Salva dados no cache
   */
  const saveToCache = useCallback((
    data: VendaComEnvio[],
    filters: VendasComEnvioFilters,
    totalCount: number
  ) => {
    if (!data || data.length === 0) {
      console.log('[LocalCache] Ignorando salvamento - dados vazios');
      return;
    }

    const { dateFrom, dateTo } = calculateDates(filters.periodo);
    
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      filters: {
        accounts: filters.selectedAccounts.slice().sort(),
        periodo: filters.periodo,
        dateFrom,
        dateTo,
      },
      totalCount,
    };
    
    try {
      const serialized = JSON.stringify(entry);
      
      // Verificar tamanho (limite ~5MB, usar 4MB como safe)
      if (serialized.length > 4 * 1024 * 1024) {
        console.warn('[LocalCache] Cache muito grande, não salvando');
        return;
      }
      
      localStorage.setItem(CACHE_KEY, serialized);
      setCachedEntry(entry);
      console.log('[LocalCache] ✅ Cache salvo:', data.length, 'vendas');
    } catch (error) {
      console.warn('[LocalCache] Erro ao salvar cache:', error);
      // Tentar limpar caches antigos se quota excedida
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        cleanupOldCaches();
      }
    }
  }, []);

  /**
   * Limpa o cache
   */
  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEY);
      setCachedEntry(null);
      console.log('[LocalCache] Cache limpo');
    } catch (error) {
      console.warn('[LocalCache] Erro ao limpar cache:', error);
    }
  }, []);

  /**
   * Verifica se cache é válido para os filtros especificados
   */
  const isCacheValidForFilters = useCallback((filters: VendasComEnvioFilters): boolean => {
    if (!cachedEntry) return false;
    
    const { dateFrom, dateTo } = calculateDates(filters.periodo);
    
    // Comparar contas (ordenadas)
    const currentAccounts = filters.selectedAccounts.slice().sort().join(',');
    const cachedAccounts = cachedEntry.filters.accounts.join(',');
    
    const sameAccounts = currentAccounts === cachedAccounts;
    const samePeriodo = cachedEntry.filters.periodo === filters.periodo;
    const sameDates = cachedEntry.filters.dateFrom === dateFrom && 
                      cachedEntry.filters.dateTo === dateTo;
    
    const isValid = sameAccounts && (samePeriodo || sameDates);
    
    if (!isValid) {
      console.log('[LocalCache] Cache inválido para filtros atuais:', {
        sameAccounts,
        samePeriodo,
        sameDates,
      });
    }
    
    return isValid;
  }, [cachedEntry]);

  /**
   * Retorna dados do cache se válidos para os filtros
   */
  const getValidCacheData = useCallback((filters: VendasComEnvioFilters): {
    data: VendaComEnvio[];
    totalCount: number;
    timestamp: number;
  } | null => {
    if (!isCacheValidForFilters(filters)) {
      return null;
    }
    
    return {
      data: cachedEntry!.data,
      totalCount: cachedEntry!.totalCount,
      timestamp: cachedEntry!.timestamp,
    };
  }, [cachedEntry, isCacheValidForFilters]);

  /**
   * Calcula idade do cache em minutos
   */
  const cacheAgeMinutes = useMemo(() => {
    if (!cachedEntry) return null;
    return Math.round((Date.now() - cachedEntry.timestamp) / 60000);
  }, [cachedEntry]);

  return {
    // Dados do cache
    cachedData: cachedEntry?.data || null,
    cachedFilters: cachedEntry?.filters || null,
    cachedTotalCount: cachedEntry?.totalCount || 0,
    cacheTimestamp: cachedEntry?.timestamp || null,
    cacheAgeMinutes,
    
    // Verificações
    hasCachedData: !!cachedEntry?.data?.length,
    isCacheValidForFilters,
    getValidCacheData,
    
    // Ações
    saveToCache,
    clearCache,
  };
}

/**
 * Limpa caches antigos do localStorage
 */
function cleanupOldCaches() {
  try {
    const keysToCheck = [
      'vendas_com_envio_local_cache_v1',
      'vendas_canceladas_local_cache',
      'reclamacoes_local_cache',
    ];
    
    keysToCheck.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed.timestamp && Date.now() - parsed.timestamp > 60 * 60 * 1000) {
            localStorage.removeItem(key);
            console.log('[LocalCache] Removido cache antigo:', key);
          }
        }
      } catch {}
    });
  } catch (error) {
    console.warn('[LocalCache] Erro ao limpar caches antigos:', error);
  }
}

export default useVendasComEnvioLocalCache;
