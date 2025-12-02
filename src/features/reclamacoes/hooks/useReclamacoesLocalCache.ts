/**
 * 🚀 COMBO 2.1 - HOOK DE CACHE LOCAL
 * Gerencia persistência de dados no localStorage para restauração instantânea
 * 
 * FLUXO:
 * 1. Ao montar página: restaura dados do cache (INSTANTÂNEO)
 * 2. Ao buscar: salva dados no cache
 * 3. Ao retornar: dados aparecem imediatamente
 */

import { useState, useCallback, useMemo } from 'react';

interface CacheFilters {
  accounts: string[];
  periodo: string;
  dateFrom: string;
  dateTo: string;
}

interface CacheEntry {
  data: any[];
  timestamp: number;
  filters: CacheFilters;
  totalCount: number;
}

const CACHE_KEY = 'RECLAMACOES_LOCAL_CACHE_V1';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos

/**
 * Restaura cache do localStorage de forma síncrona (para usar em useState initializer)
 */
function restoreCacheSync(): CacheEntry | null {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored) as CacheEntry;
    const isExpired = Date.now() - parsed.timestamp > CACHE_TTL;
    
    if (isExpired) {
      console.log('⏰ [CACHE] Cache expirado, removendo...');
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    console.log('✅ [CACHE] Cache restaurado:', {
      items: parsed.data?.length || 0,
      idade: Math.round((Date.now() - parsed.timestamp) / 1000 / 60) + ' min',
      filtros: parsed.filters
    });
    
    return parsed;
  } catch (e) {
    console.warn('⚠️ [CACHE] Erro ao restaurar cache:', e);
    return null;
  }
}

export function useReclamacoesLocalCache() {
  // ✅ Restaurar cache no mount (síncrono via lazy initializer)
  const [cachedEntry, setCachedEntry] = useState<CacheEntry | null>(() => restoreCacheSync());

  // Salvar dados no cache
  const saveToCache = useCallback((data: any[], filters: CacheFilters, totalCount: number) => {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      filters,
      totalCount
    };
    
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
      setCachedEntry(entry);
      console.log('💾 [CACHE] Dados salvos:', {
        items: data.length,
        total: totalCount,
        filtros: filters
      });
    } catch (e) {
      console.warn('⚠️ [CACHE] Erro ao salvar cache:', e);
    }
  }, []);

  // Limpar cache
  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    setCachedEntry(null);
    console.log('🗑️ [CACHE] Cache limpo');
  }, []);

  // 🚀 COMBO 2.1: Verificar se cache é válido para restauração
  // SIMPLIFICADO: Se tem dados no cache, é válido para exibição instantânea
  // O período do cache será usado para restaurar filtros
  const isCacheValidForFilters = useCallback((filters: CacheFilters): boolean => {
    if (!cachedEntry) return false;
    if (!cachedEntry.data || cachedEntry.data.length === 0) return false;
    
    // 🚀 COMBO 2.1: Verificar apenas se contas estão presentes no cache
    // (dados podem ter sido buscados com mais contas, isso é OK)
    const cachedAccountsSet = new Set(cachedEntry.filters.accounts);
    const requestedAccountsExist = filters.accounts.length === 0 || 
      filters.accounts.some(acc => cachedAccountsSet.has(acc));
    
    console.log('🔍 [CACHE] Validação:', {
      hasCachedData: cachedEntry.data.length,
      cachedPeriodo: cachedEntry.filters.periodo,
      requestedPeriodo: filters.periodo,
      requestedAccountsExist,
      isValid: requestedAccountsExist
    });
    
    return requestedAccountsExist;
  }, [cachedEntry]);

  // 🚀 COMBO 2.1: Retornar período do cache para restauração
  const cachedPeriodo = useMemo(() => {
    return cachedEntry?.filters?.periodo || null;
  }, [cachedEntry]);

  // Idade do cache em minutos
  const cacheAge = useMemo(() => {
    if (!cachedEntry) return null;
    return Math.round((Date.now() - cachedEntry.timestamp) / 1000 / 60);
  }, [cachedEntry]);

  // Verificar se cache está quase expirando (últimos 5 min)
  const isCacheStale = useMemo(() => {
    if (!cachedEntry) return false;
    const age = Date.now() - cachedEntry.timestamp;
    return age > (CACHE_TTL - 5 * 60 * 1000); // Últimos 5 minutos
  }, [cachedEntry]);

  return {
    // Dados do cache
    cachedData: cachedEntry?.data || null,
    cachedFilters: cachedEntry?.filters || null,
    cachedTotalCount: cachedEntry?.totalCount || 0,
    cacheTimestamp: cachedEntry?.timestamp || null,
    cacheAge,
    cachedPeriodo, // 🚀 COMBO 2.1: Período do cache para restauração
    
    // Estado
    hasCachedData: !!(cachedEntry?.data?.length),
    isCacheStale,
    
    // Ações
    saveToCache,
    clearCache,
    isCacheValidForFilters
  };
}
