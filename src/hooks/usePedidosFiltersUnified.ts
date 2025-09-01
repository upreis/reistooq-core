/**
 * 🚀 HOOK UNIFICADO DE FILTROS - EXPERIÊNCIA CONSISTENTE
 * Resolve problemas de UX e performance identificados na auditoria
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { DEBOUNCE } from '@/lib/constants';

export interface PedidosFiltersState {
  search?: string;
  situacao?: string[];
  dataInicio?: Date;
  dataFim?: Date;
  cidade?: string;
  uf?: string;
  valorMin?: number;
  valorMax?: number;
  contasML?: string[];
}

// ✅ ESTRATÉGIA UNIFICADA: APLICAÇÃO SEMPRE MANUAL
// Usuário controla quando aplicar filtros para melhor UX
export enum FilterStrategy {
  MANUAL = 'manual'         // Aplicação manual para todos os filtros
}

// ✅ CONFIGURAÇÃO CONSISTENTE: Todos os filtros são manuais
const FILTER_CONFIG = {
  search: { strategy: FilterStrategy.MANUAL },
  situacao: { strategy: FilterStrategy.MANUAL },
  contasML: { strategy: FilterStrategy.MANUAL },
  dataInicio: { strategy: FilterStrategy.MANUAL },
  dataFim: { strategy: FilterStrategy.MANUAL },
  cidade: { strategy: FilterStrategy.MANUAL },
  uf: { strategy: FilterStrategy.MANUAL },
  valorMin: { strategy: FilterStrategy.MANUAL },
  valorMax: { strategy: FilterStrategy.MANUAL },
} as const;

const STORAGE_KEY = 'pedidos_unified_filters';

interface UseUnifiedFiltersOptions {
  onFiltersApply?: (filters: PedidosFiltersState) => void;
  autoLoad?: boolean;
  loadSavedFilters?: boolean; // ✅ NOVO: Controle se deve carregar filtros salvos
}

export function usePedidosFiltersUnified(options: UseUnifiedFiltersOptions = {}) {
  const { onFiltersApply, autoLoad = false, loadSavedFilters = false } = options; // ✅ PADRÃO: não carregar automaticamente

  // Estados principais
  const [draftFilters, setDraftFilters] = useState<PedidosFiltersState>({});
  const [appliedFilters, setAppliedFilters] = useState<PedidosFiltersState>({});
  const [isApplying, setIsApplying] = useState(false);
  
  // ✅ REMOVIDO: Debounce automático - agora tudo é manual

  // ✅ NOVO: Carregar filtros salvos APENAS quando solicitado explicitamente
  useEffect(() => {
    if (loadSavedFilters) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          
          // Converter datas string para Date
          if (parsed.dataInicio && typeof parsed.dataInicio === 'string') {
            parsed.dataInicio = new Date(parsed.dataInicio);
          }
          if (parsed.dataFim && typeof parsed.dataFim === 'string') {
            parsed.dataFim = new Date(parsed.dataFim);
          }
          
          // ✅ IMPORTANTE: Apenas carregar no draft, NÃO aplicar automaticamente
          setDraftFilters(parsed);
          console.log('📥 Filtros salvos carregados (não aplicados):', parsed);
        }
      } catch (error) {
        console.warn('Erro ao carregar filtros salvos:', error);
      }
    }
  }, [loadSavedFilters]);

  // Salvar filtros aplicados
  useEffect(() => {
    if (Object.keys(appliedFilters).length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appliedFilters));
      } catch (error) {
        console.warn('Erro ao salvar filtros:', error);
      }
    }
  }, [appliedFilters]);

  // ✅ REMOVIDO: Auto-aplicação de busca - agora tudo é manual

  // Atualizar filtro draft
  const updateDraftFilter = useCallback(<K extends keyof PedidosFiltersState>(
    key: K,
    value: PedidosFiltersState[K]
  ) => {
    setDraftFilters(prev => {
      const newFilters = { ...prev };
      
      if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        delete newFilters[key];
      } else {
        newFilters[key] = value;
      }
      
      // ✅ REMOVIDO: Auto-aplicação - agora tudo é manual
      
      return newFilters;
    });
  }, [appliedFilters, onFiltersApply]);

  // Aplicar filtros manuais
  const applyFilters = useCallback(async () => {
    console.groupCollapsed('[apply/unified]');
    console.log('draftFilters', draftFilters);
    console.groupEnd();
    setIsApplying(true);
    
    try {
      // Simular delay para feedback visual
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setAppliedFilters({ ...draftFilters });
      onFiltersApply?.({ ...draftFilters });
    } finally {
      setIsApplying(false);
    }
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

    if (appliedFilters.situacao && appliedFilters.situacao.length > 0) {
      params.situacao = appliedFilters.situacao;
    }

    if (appliedFilters.dataInicio) {
      const d = appliedFilters.dataInicio;
      params.dataInicio = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    if (appliedFilters.dataFim) {
      const d = appliedFilters.dataFim;
      params.dataFim = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    if (appliedFilters.cidade) {
      params.cidade = appliedFilters.cidade;
    }

    if (appliedFilters.uf) {
      params.uf = appliedFilters.uf;
    }

    if (appliedFilters.valorMin) {
      params.valorMin = appliedFilters.valorMin;
    }

    if (appliedFilters.valorMax) {
      params.valorMax = appliedFilters.valorMax;
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