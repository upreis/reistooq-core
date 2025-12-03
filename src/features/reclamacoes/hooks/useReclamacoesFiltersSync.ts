/**
 * 🔗 HOOK DE SINCRONIZAÇÃO DE FILTROS COM URL
 * FASE 2: Sincronizar filtros com parâmetros de URL para URLs compartilháveis
 */

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface ReclamacoesFilters {
  periodo: string;
  status: string;
  type: string;
  stage: string;
  selectedAccounts: string[];
  currentPage: number;
  itemsPerPage: number;
}

/**
 * Parseia parâmetros de URL para objeto de filtros
 */
function parseFiltersFromUrl(searchParams: URLSearchParams): Partial<ReclamacoesFilters> {
  const filters: Partial<ReclamacoesFilters> = {};

  const periodo = searchParams.get('periodo');
  if (periodo) filters.periodo = periodo;

  const status = searchParams.get('status');
  if (status) filters.status = status;

  const type = searchParams.get('type');
  if (type) filters.type = type;

  const stage = searchParams.get('stage');
  if (stage) filters.stage = stage;

  const accounts = searchParams.get('accounts');
  if (accounts) filters.selectedAccounts = accounts.split(',');

  const page = searchParams.get('page');
  if (page) filters.currentPage = parseInt(page, 10);

  const limit = searchParams.get('limit');
  if (limit) filters.itemsPerPage = parseInt(limit, 10);

  return filters;
}

/**
 * Codifica filtros para parâmetros de URL
 */
function encodeFiltersToUrl(filters: ReclamacoesFilters): URLSearchParams {
  const params = new URLSearchParams();

  // 🚀 COMBO 2.1: SEMPRE incluir período na URL para persistência
  if (filters.periodo) {
    params.set('periodo', filters.periodo);
    console.log('🔗 [URL] Período incluído:', filters.periodo);
  }

  if (filters.status && filters.status !== '') {
    params.set('status', filters.status);
  }

  if (filters.type && filters.type !== '') {
    params.set('type', filters.type);
  }

  if (filters.stage && filters.stage !== '') {
    params.set('stage', filters.stage);
  }

  if (filters.selectedAccounts && filters.selectedAccounts.length > 0) {
    params.set('accounts', filters.selectedAccounts.join(','));
  }

  if (filters.currentPage && filters.currentPage !== 1) {
    params.set('page', filters.currentPage.toString());
  }

  if (filters.itemsPerPage && filters.itemsPerPage !== 50) {
    params.set('limit', filters.itemsPerPage.toString());
  }

  return params;
}

/**
 * Hook de sincronização de filtros com URL
 */
export function useReclamacoesFiltersSync(
  filters: ReclamacoesFilters,
  onFiltersChange: (newFilters: Partial<ReclamacoesFilters>) => void,
  isInitialized: boolean = false // 🔧 CORREÇÃO: Só sincronizar após inicialização
) {
  const [searchParams, setSearchParams] = useSearchParams();

  // 🔥 REMOVIDO: Carregar filtros da URL na montagem
  // Agora isso é feito no useReclamacoesFiltersUnified com merge correto Cache + URL

  // Atualizar URL quando filtros mudarem (debounced)
  // 🔧 CORREÇÃO CRÍTICA: Só sincronizar APÓS cache ser restaurado
  useEffect(() => {
    // 🔧 CORREÇÃO: Não atualizar URL até inicialização completa
    if (!isInitialized) {
      console.log('⏭️ [URL] Aguardando inicialização antes de sincronizar URL');
      return;
    }

    const timer = setTimeout(() => {
      const newParams = encodeFiltersToUrl(filters);
      const currentParams = searchParams.toString();
      const newParamsString = newParams.toString();

      // Só atualizar se realmente mudou
      if (currentParams !== newParamsString) {
        console.log('🔗 Atualizando URL com filtros:', filters);
        setSearchParams(newParams, { replace: true });
      }
    }, 300); // 🔧 CORREÇÃO: Aumentado para 300ms para garantir que cache restaure primeiro

    return () => clearTimeout(timer);
  }, [filters, setSearchParams, isInitialized]);

  return {
    parseFiltersFromUrl,
    encodeFiltersToUrl
  };
}
