/**
 * 🚀 HOOK UNIFICADO DE FILTROS - EXPERIÊNCIA CONSISTENTE
 * Resolve problemas de UX e performance identificados na auditoria
 * 
 * ✅ ETAPA 3: Sistema 100% baseado em URL params
 * - URL é a única fonte de verdade para filtros
 * - LocalStorage usado apenas para cache de dados (via usePersistentPedidosState)
 * - URLs compartilháveis e bookmarks funcionam perfeitamente
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'; // ✅ FIX: Adicionar useRef
import { useDebounce } from '@/hooks/useDebounce';
import { DEBOUNCE } from '@/lib/constants';
import { StatusFilters } from '@/features/orders/types/orders-status.types';
import { usePedidosFiltersSync } from './usePedidosFiltersSync'; // ✅ ETAPA 2

const isDev = process.env.NODE_ENV === 'development'; // ✅ FIX P6: Logs condicionais

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
  
  // ✅ ETAPA 3: Hook de sincronização 100% URL
  const filterSync = usePedidosFiltersSync({
    enabled: enableURLSync
  });

  // Estados principais
  const [draftFilters, setDraftFilters] = useState<PedidosFiltersState>({});
  const [appliedFilters, setAppliedFilters] = useState<PedidosFiltersState>({});
  const [isApplying, setIsApplying] = useState(false);
  
  // ✅ FIX P1: Flag para controlar inicialização (evita loop infinito)
  const isInitializingRef = useRef(true);
  const hasInitializedRef = useRef(false);
  
  // ✅ INICIALIZAÇÃO SIMPLES - Sempre carregar do localStorage na montagem
  useEffect(() => {
    // ✅ Executar apenas UMA VEZ
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    
    // ✅ SEMPRE carregar do localStorage primeiro (como faz /reclamacoes)
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Converter datas string para Date
        if (parsed.dataInicio && typeof parsed.dataInicio === 'string') {
          const [year, month, day] = parsed.dataInicio.split('-').map(Number);
          parsed.dataInicio = new Date(year, month - 1, day);
        }
        
        if (parsed.dataFim && typeof parsed.dataFim === 'string') {
          const [year, month, day] = parsed.dataFim.split('-').map(Number);
          parsed.dataFim = new Date(year, month - 1, day);
        }
        
        // Carregar tanto no draft quanto no applied
        setDraftFilters(parsed);
        setAppliedFilters(parsed);
        
        if (isDev) console.log('📦 [FILTROS] Carregados do localStorage:', parsed);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar filtros:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
    
    // Marcar como NÃO inicializando após carregar
    setTimeout(() => {
      isInitializingRef.current = false;
    }, 100);
  }, []); // ✅ Array vazio - executar APENAS UMA VEZ

  // ✅ SALVAR AUTOMATICAMENTE no localStorage (como faz /reclamacoes)
  useEffect(() => {
    // NÃO salvar durante inicialização
    if (isInitializingRef.current) {
      if (isDev) console.log('⏭️ [SYNC] Pulando salvamento - ainda inicializando');
      return;
    }
    
    if (Object.keys(appliedFilters).length === 0) {
      // Se não há filtros aplicados, limpar o localStorage
      localStorage.removeItem(STORAGE_KEY);
      if (isDev) console.log('🗑️ [FILTROS] localStorage limpo (sem filtros)');
      return;
    }
    
    try {
      // Serializar datas como strings ISO
      const serializeValue = (value: any): any => {
        if (value instanceof Date) {
          return value.toISOString().split('T')[0]; // YYYY-MM-DD
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
      if (isDev) console.log('💾 [FILTROS] Salvos no localStorage:', serializedFilters);
    } catch (error) {
      console.error('❌ Erro ao salvar filtros:', error);
    }
  }, [appliedFilters]); // ✅ Salvar sempre que appliedFilters mudar

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