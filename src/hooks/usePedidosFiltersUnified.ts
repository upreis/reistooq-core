/**
 * 🚀 HOOK UNIFICADO DE FILTROS - EXPERIÊNCIA CONSISTENTE
 * Resolve problemas de UX e performance identificados na auditoria
 * 
 * ✅ ETAPA 2: Sincronização URL + localStorage
 * - Prioriza URL como fonte de verdade
 * - Fallback para localStorage
 * - Sincronização bidirecional automática
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { DEBOUNCE } from '@/lib/constants';
import { StatusFilters } from '@/features/orders/types/orders-status.types';
import { usePedidosFiltersSync } from './usePedidosFiltersSync'; // ✅ ETAPA 2

export interface PedidosFiltersState {
  search?: string;
  statusPedido?: string[];  // ✅ CORRIGIDO: Status do pedido (order.status)
  dataInicio?: Date;
  dataFim?: Date;
  contasML?: string[];
  // Status Avançado
  useAdvancedStatus?: boolean;
  advancedStatusFilters?: StatusFilters;
}

// ✅ ESTRATÉGIA UNIFICADA: APLICAÇÃO SEMPRE MANUAL
// Usuário controla quando aplicar filtros para melhor UX
export enum FilterStrategy {
  MANUAL = 'manual'         // Aplicação manual para todos os filtros
}

// ✅ CONFIGURAÇÃO CONSISTENTE: Todos os filtros são manuais
const FILTER_CONFIG = {
  search: { strategy: FilterStrategy.MANUAL },
  statusPedido: { strategy: FilterStrategy.MANUAL },
  contasML: { strategy: FilterStrategy.MANUAL },
  dataInicio: { strategy: FilterStrategy.MANUAL },
  dataFim: { strategy: FilterStrategy.MANUAL },
} as const;

const STORAGE_KEY = 'pedidos_unified_filters';

interface UseUnifiedFiltersOptions {
  onFiltersApply?: (filters: PedidosFiltersState) => void;
  autoLoad?: boolean;
  loadSavedFilters?: boolean; // ✅ NOVO: Controle se deve carregar filtros salvos
  // ✅ ETAPA 2: Controle de sincronização URL
  enableURLSync?: boolean; // Ativar sincronização com URL
}

export function usePedidosFiltersUnified(options: UseUnifiedFiltersOptions = {}) {
  const { 
    onFiltersApply, 
    autoLoad = false, 
    loadSavedFilters = false,
    enableURLSync = true // ✅ ETAPA 2: Ativado por padrão (com fallback)
  } = options;
  
  // ✅ ETAPA 2: Hook de sincronização URL + localStorage
  const filterSync = usePedidosFiltersSync({
    enabled: enableURLSync,
    localStorageKey: STORAGE_KEY
  });

  // Estados principais
  const [draftFilters, setDraftFilters] = useState<PedidosFiltersState>({});
  const [appliedFilters, setAppliedFilters] = useState<PedidosFiltersState>({});
  const [isApplying, setIsApplying] = useState(false);
  
  // ✅ ETAPA 2: INICIALIZAÇÃO - Ler filtros do sistema híbrido (URL → localStorage)
  useEffect(() => {
    // Se sync está habilitado, usar filtros do sistema híbrido
    if (enableURLSync && filterSync.hasActiveFilters) {
      const syncedFilters = filterSync.filters;
      console.log('🔄 [ETAPA 2] Filtros carregados do sistema híbrido:', {
        source: filterSync.source,
        filters: syncedFilters
      });
      
      // Carregar tanto no draft quanto no applied
      setDraftFilters(syncedFilters);
      setAppliedFilters(syncedFilters);
      return;
    }
    
    // ✅ FALLBACK: Sistema antigo (apenas localStorage)
    if (loadSavedFilters && !enableURLSync) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          
          // Converter datas string para Date com melhor validação
          if (parsed.dataInicio) {
            const startDate = typeof parsed.dataInicio === 'string' 
              ? new Date(parsed.dataInicio) 
              : parsed.dataInicio;
            if (startDate && !isNaN(startDate.getTime())) {
              parsed.dataInicio = startDate;
            } else {
              delete parsed.dataInicio;
            }
          }
          
          if (parsed.dataFim) {
            const endDate = typeof parsed.dataFim === 'string' 
              ? new Date(parsed.dataFim) 
              : parsed.dataFim;
            if (endDate && !isNaN(endDate.getTime())) {
              parsed.dataFim = endDate;
            } else {
              delete parsed.dataFim;
            }
          }
          
          // ✅ IMPORTANTE: Apenas carregar no draft, NÃO aplicar automaticamente
          setDraftFilters(parsed);
          console.log('📥 [FALLBACK] Filtros salvos carregados do localStorage:', parsed);
        }
      } catch (error) {
        console.warn('Erro ao carregar filtros salvos:', error);
        // Limpar dados corrompidos
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [loadSavedFilters, enableURLSync, filterSync.hasActiveFilters, filterSync.source]);

  // ✅ ETAPA 2: Salvar filtros aplicados no sistema híbrido (URL + localStorage)
  useEffect(() => {
    if (Object.keys(appliedFilters).length > 0) {
      // Se sync está habilitado, usar sistema híbrido
      if (enableURLSync) {
        filterSync.writeFilters(appliedFilters, 'user');
        console.log('🔄 [ETAPA 2] Filtros sincronizados (URL + localStorage)');
        return;
      }
      
      // ✅ FALLBACK: Sistema antigo (apenas localStorage)
      try {
        // ✅ CORREÇÃO ROBUSTA: Serializar datas como ISO strings para localStorage
        const serializeValue = (value: any): any => {
          if (value instanceof Date) {
            return value.toISOString();
          }
          if (Array.isArray(value)) {
            return value.map(serializeValue);
          }
          if (value && typeof value === 'object') {
            const serialized: any = {};
            for (const [key, val] of Object.entries(value)) {
              serialized[key] = serializeValue(val);
            }
            return serialized;
          }
          return value;
        };
        
        const serializedFilters = serializeValue(appliedFilters);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serializedFilters));
        console.log('💾 [FALLBACK] Filtros salvos apenas no localStorage:', serializedFilters);
      } catch (error) {
        console.error('❌ Erro ao salvar filtros no localStorage:', error);
      }
    }
  }, [appliedFilters, enableURLSync]);

  // ✅ REMOVIDO: Auto-aplicação de busca - agora tudo é manual

  // Atualizar filtro draft - MELHORADO para log de debug
  const updateDraftFilter = useCallback(<K extends keyof PedidosFiltersState>(
    key: K,
    value: PedidosFiltersState[K]
  ) => {
    console.log('🔧 [FILTERS] Atualizando filtro:', key, '=', value);
    
    setDraftFilters(prev => {
      const newFilters = { ...prev };
      
      if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        delete newFilters[key];
        console.log('🗑️ [FILTERS] Removendo filtro vazio:', key);
      } else {
        newFilters[key] = value;
        console.log('✅ [FILTERS] Filtro definido:', key, '=', value);
      }
      
      console.log('📊 [FILTERS] Estado dos filtros draft atualizado:', newFilters);
      return newFilters;
    });
  }, []);

  // ✅ Aplicar filtros manualmente - PASSO 2: FORÇAR REFETCH
  const applyFilters = useCallback(() => {
    console.log('🔄 [Filtros] Aplicando filtros:', draftFilters);
    
    // ✅ CORREÇÃO: Garantir que o callback seja chamado com os filtros corretos
    const filtersToApply = { ...draftFilters };
    setAppliedFilters(filtersToApply);
    setIsApplying(true);
    
    // ✅ PASSO 2: FORÇAR REFETCH IMEDIATO para garantir que os dados sejam recarregados
    onFiltersApply?.(filtersToApply);
    
    // Finalizar estado após um breve delay para UX
    setTimeout(() => {
      setIsApplying(false);
      console.log('✅ [Filtros] Aplicação concluída:', filtersToApply);
    }, 500);
  }, [draftFilters, onFiltersApply]);

  // Cancelar mudanças pendentes
  const cancelChanges = useCallback(() => {
    setDraftFilters({ ...appliedFilters });
  }, [appliedFilters]);

  // Limpar todos os filtros
  const clearFilters = useCallback(() => {
    setDraftFilters({});
    setAppliedFilters({});
    onFiltersApply?.({});
    localStorage.removeItem(STORAGE_KEY);
  }, [onFiltersApply]);

  // Verificar se há mudanças pendentes
  const hasPendingChanges = useMemo(() => {
    const draftKeys = Object.keys(draftFilters);
    const appliedKeys = Object.keys(appliedFilters);
    
    if (draftKeys.length !== appliedKeys.length) return true;
    
    return draftKeys.some(key => {
      const draftValue = draftFilters[key as keyof PedidosFiltersState];
      const appliedValue = appliedFilters[key as keyof PedidosFiltersState];
      
      // ✅ REMOVIDO: Não há mais filtros automáticos
      
      if (Array.isArray(draftValue) && Array.isArray(appliedValue)) {
        return JSON.stringify(draftValue.sort()) !== JSON.stringify(appliedValue.sort());
      }
      
      if (draftValue instanceof Date && appliedValue instanceof Date) {
        return draftValue.getTime() !== appliedValue.getTime();
      }
      
      // Comparar datas que podem ser strings ou Date objects
      if ((draftValue instanceof Date || typeof draftValue === 'string') && 
          (appliedValue instanceof Date || typeof appliedValue === 'string')) {
        const draftTime = draftValue instanceof Date ? draftValue.getTime() : new Date(draftValue).getTime();
        const appliedTime = appliedValue instanceof Date ? appliedValue.getTime() : new Date(appliedValue).getTime();
        return draftTime !== appliedTime;
      }
      
      return draftValue !== appliedValue;
    });
  }, [draftFilters, appliedFilters]);

  // Contadores de filtros ativos
  const activeFiltersCount = useMemo(() => {
    return Object.keys(appliedFilters).filter(key => {
      const value = appliedFilters[key as keyof PedidosFiltersState];
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== '' && value !== null;
    }).length;
  }, [appliedFilters]);

  const hasActiveFilters = activeFiltersCount > 0;

  // ✅ SIMPLIFICADO: Agora todos filtros são manuais
  const needsManualApplication = hasPendingChanges;

  // Converter para parâmetros da API (mantém compatibilidade)
  const apiParams = useMemo(() => {
    const params: any = {};

    if (appliedFilters.search) {
      params.search = appliedFilters.search;
    }

    // ✅ NOVO: Status do pedido mapeado para API (EN)
    if (appliedFilters.statusPedido && appliedFilters.statusPedido.length > 0) {
      params.statusPedido = appliedFilters.statusPedido; // PT para EN será feito no manager
    }

    if (appliedFilters.dataInicio) {
      let d = appliedFilters.dataInicio instanceof Date 
        ? appliedFilters.dataInicio 
        : new Date(appliedFilters.dataInicio);
      
      // ✅ CORREÇÃO: Se data veio como string ISO, criar sem timezone
      const dataInicioStr = String(appliedFilters.dataInicio);
      if (typeof appliedFilters.dataInicio === 'string' && dataInicioStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dataInicioStr.split('-').map(Number);
        d = new Date(year, month - 1, day); // month é 0-indexed
      }
      
      if (!isNaN(d.getTime())) {
        params.dataInicio = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
    }

    if (appliedFilters.dataFim) {
      let d = appliedFilters.dataFim instanceof Date 
        ? appliedFilters.dataFim 
        : new Date(appliedFilters.dataFim);
      
      // ✅ CORREÇÃO: Se data veio como string ISO, criar sem timezone
      const dataFimStr = String(appliedFilters.dataFim);
      if (typeof appliedFilters.dataFim === 'string' && dataFimStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dataFimStr.split('-').map(Number);
        d = new Date(year, month - 1, day); // month é 0-indexed
      }
      
      if (!isNaN(d.getTime())) {
        params.dataFim = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
    }

    if (appliedFilters.contasML && appliedFilters.contasML.length > 0) {
      params.contasML = appliedFilters.contasML;
    }

    return params;
  }, [appliedFilters]);

  return {
    // Estados
    filters: draftFilters,
    appliedFilters,
    apiParams,
    
    // Flags
    hasPendingChanges,
    hasActiveFilters,
    activeFiltersCount,
    needsManualApplication,
    isApplying,
    
    // Ações
    updateFilter: updateDraftFilter,
    applyFilters,
    cancelChanges,
    clearFilters,
  };
}