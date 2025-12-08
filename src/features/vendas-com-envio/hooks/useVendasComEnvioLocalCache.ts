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

const CACHE_KEY = 'vendas_com_envio_local_cache_v3'; // v3: inclui receiver_name para nome completo
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

    // 🚀 OTIMIZAÇÃO: Limpar caches antigos ANTES de tentar salvar
    cleanupOldCaches();

    const { dateFrom, dateTo } = calculateDates(filters.periodo);
    
    // 🚀 OTIMIZAÇÃO: Salvar colunas essenciais + dados shipping necessários
    const optimizedData = data.map(venda => {
      const orderData = venda.order_data as any;
      
      // Extrair apenas dados de shipping necessários para colunas
      const shippingData = orderData?.shipping ? {
        id: orderData.shipping.id,
        status: orderData.shipping.status,
        substatus: orderData.shipping.substatus,
        tracking_number: orderData.shipping.tracking_number,
        logistic: orderData.shipping.logistic ? {
          type: orderData.shipping.logistic.type,
        } : null,
        receiver_address: orderData.shipping.receiver_address ? {
          receiver_name: orderData.shipping.receiver_address.receiver_name, // Nome completo
          name: orderData.shipping.receiver_address.name,
          city: orderData.shipping.receiver_address.city,
          state: orderData.shipping.receiver_address.state,
          zip_code: orderData.shipping.receiver_address.zip_code,
          street_name: orderData.shipping.receiver_address.street_name,
          street_number: orderData.shipping.receiver_address.street_number,
        } : null,
        // Fallback: destination para nome completo
        destination: orderData.shipping.destination ? {
          receiver_name: orderData.shipping.destination.receiver_name,
        } : null,
      } : null;
      
      return {
        id: venda.id,
        order_id: venda.order_id,
        integration_account_id: venda.integration_account_id,
        account_name: venda.account_name,
        order_status: venda.order_status,
        shipping_status: venda.shipping_status,
        payment_status: venda.payment_status,
        date_created: venda.date_created,
        date_closed: venda.date_closed,
        shipping_deadline: venda.shipping_deadline,
        buyer_id: venda.buyer_id,
        buyer_nickname: venda.buyer_nickname,
        buyer_name: venda.buyer_name,
        total_amount: venda.total_amount,
        currency_id: venda.currency_id,
        shipment_id: venda.shipment_id,
        logistic_type: venda.logistic_type,
        tracking_number: venda.tracking_number,
        carrier: venda.carrier,
        items: venda.items?.slice(0, 3),
        items_count: venda.items_count,
        items_quantity: venda.items_quantity,
        // Incluir order_data otimizado apenas com shipping essencial
        order_data: shippingData ? { shipping: shippingData } : null,
      };
    });
    
    const entry: CacheEntry = {
      data: optimizedData as unknown as VendaComEnvio[],
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
      
      // Verificar tamanho (limite ~5MB, usar 2MB como safe)
      if (serialized.length > 2 * 1024 * 1024) {
        console.warn('[LocalCache] Cache muito grande (' + Math.round(serialized.length/1024) + 'KB), tentando limpar mais espaço');
        emergencyCleanup();
        
        // Tentar novamente com menos dados
        const reducedEntry = {
          ...entry,
          data: optimizedData.slice(0, 200) as unknown as VendaComEnvio[],
        };
        const reducedSerialized = JSON.stringify(reducedEntry);
        
        if (reducedSerialized.length > 2 * 1024 * 1024) {
          console.warn('[LocalCache] Cache ainda muito grande, não salvando');
          return;
        }
        
        localStorage.setItem(CACHE_KEY, reducedSerialized);
        setCachedEntry(reducedEntry);
        console.log('[LocalCache] ✅ Cache salvo (reduzido):', reducedEntry.data.length, 'vendas');
        return;
      }
      
      localStorage.setItem(CACHE_KEY, serialized);
      setCachedEntry(entry);
      console.log('[LocalCache] ✅ Cache salvo:', optimizedData.length, 'vendas');
    } catch (error) {
      console.warn('[LocalCache] Erro ao salvar cache:', error);
      // Tentar limpar e salvar novamente
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        emergencyCleanup();
        try {
          // Última tentativa com dados mínimos
          const minimalEntry = {
            ...entry,
            data: optimizedData.slice(0, 100) as unknown as VendaComEnvio[],
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify(minimalEntry));
          setCachedEntry(minimalEntry);
          console.log('[LocalCache] ✅ Cache salvo (mínimo):', minimalEntry.data.length, 'vendas');
        } catch (retryError) {
          console.warn('[LocalCache] Falha ao salvar mesmo após cleanup');
        }
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
 * Limpa caches antigos do localStorage (>30 min)
 */
function cleanupOldCaches() {
  try {
    const keysToCheck = [
      'vendas_com_envio_local_cache_v3',
      'vendas_com_envio_local_cache_v2', // Versão antiga - limpar
      'vendas_com_envio_local_cache_v1', // Versão antiga - limpar
      'vendas_canceladas_local_cache',
      'reclamacoes_local_cache',
      'devolucoesdevenda_local_cache',
      'ml_claims_local_cache',
    ];
    
    keysToCheck.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          // Remover caches com mais de 30 minutos
          if (parsed.timestamp && Date.now() - parsed.timestamp > 30 * 60 * 1000) {
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

/**
 * Limpeza emergencial - remove caches maiores para liberar espaço
 */
function emergencyCleanup() {
  try {
    console.log('[LocalCache] ⚠️ Executando cleanup emergencial');
    
    // Coletar todos os caches do sistema
    const cacheKeys = [
      'vendas_com_envio_local_cache_v3',
      'vendas_com_envio_local_cache_v2', // Versão antiga - limpar
      'vendas_com_envio_local_cache_v1', // Versão antiga - limpar
      'vendas_canceladas_local_cache',
      'reclamacoes_local_cache',
      'devolucoesdevenda_local_cache',
      'ml_claims_local_cache',
      'pedidos_local_cache',
    ];
    
    // Ordenar por tamanho e remover os maiores primeiro
    const cachesSized: Array<{key: string; size: number}> = [];
    
    cacheKeys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          cachesSized.push({ key, size: item.length });
        }
      } catch {}
    });
    
    // Ordenar por tamanho decrescente
    cachesSized.sort((a, b) => b.size - a.size);
    
    // Remover os 3 maiores (exceto o atual se estiver na lista)
    let removed = 0;
    for (const cache of cachesSized) {
      if (cache.key !== CACHE_KEY && removed < 3) {
        localStorage.removeItem(cache.key);
        console.log('[LocalCache] Removido cache grande:', cache.key, '(' + Math.round(cache.size/1024) + 'KB)');
        removed++;
      }
    }
    
    // Se ainda não removeu nada, remover qualquer coisa
    if (removed === 0 && cachesSized.length > 0) {
      localStorage.removeItem(cachesSized[0].key);
      console.log('[LocalCache] Removido cache mais antigo:', cachesSized[0].key);
    }
  } catch (error) {
    console.warn('[LocalCache] Erro no cleanup emergencial:', error);
  }
}

export default useVendasComEnvioLocalCache;
