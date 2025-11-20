/**
 * 🔗 HOOK DE SINCRONIZAÇÃO DE FILTROS COM URL
 * FASE 2: Sincronizar filtros com parâmetros de URL para URLs compartilháveis
 */

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface DevolucoesFilters {
  periodo: string;
  selectedAccounts: string[];
  searchTerm: string;
  currentPage: number;
  itemsPerPage: number;
  activeTab: 'ativas' | 'historico';
}

/**
 * Parseia parâmetros de URL para objeto de filtros
 */
function parseFiltersFromUrl(searchParams: URLSearchParams): Partial<DevolucoesFilters> {
  const filters: Partial<DevolucoesFilters> = {};

  const periodo = searchParams.get('periodo');
  if (periodo) filters.periodo = periodo;

  const accounts = searchParams.get('accounts');
  if (accounts) filters.selectedAccounts = accounts.split(',');

  const search = searchParams.get('search');
  if (search) filters.searchTerm = search;

  const page = searchParams.get('page');
  if (page) filters.currentPage = parseInt(page, 10);

  const limit = searchParams.get('limit');
  if (limit) filters.itemsPerPage = parseInt(limit, 10);

  const tab = searchParams.get('tab');
  if (tab && (tab === 'ativas' || tab === 'historico')) {
    filters.activeTab = tab;
  }

  return filters;
}

/**
 * Codifica filtros para parâmetros de URL
 */
function encodeFiltersToUrl(filters: DevolucoesFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.periodo && filters.periodo !== '60') {
    params.set('periodo', filters.periodo);
  }

  if (filters.selectedAccounts && filters.selectedAccounts.length > 0) {
    params.set('accounts', filters.selectedAccounts.join(','));
  }

  if (filters.searchTerm && filters.searchTerm !== '') {
    params.set('search', filters.searchTerm);
  }

  if (filters.currentPage && filters.currentPage !== 1) {
    params.set('page', filters.currentPage.toString());
  }

  if (filters.itemsPerPage && filters.itemsPerPage !== 50) {
    params.set('limit', filters.itemsPerPage.toString());
  }

  if (filters.activeTab && filters.activeTab !== 'ativas') {
    params.set('tab', filters.activeTab);
  }

  return params;
}

/**
 * Hook de sincronização de filtros com URL
 */
export function useDevolucoesFiltersSync(
  filters: DevolucoesFilters,
  onFiltersChange: (newFilters: Partial<DevolucoesFilters>) => void
) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Carregar filtros da URL na montagem do componente
  useEffect(() => {
    const urlFilters = parseFiltersFromUrl(searchParams);
    
    if (Object.keys(urlFilters).length > 0) {
      console.log('🔗 Carregando filtros da URL:', urlFilters);
      onFiltersChange(urlFilters);
    }
  }, []); // Executar apenas uma vez na montagem

  // Atualizar URL quando filtros mudarem (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const newParams = encodeFiltersToUrl(filters);
      const currentParams = searchParams.toString();
      const newParamsString = newParams.toString();

      // Só atualizar se realmente mudou
      if (currentParams !== newParamsString) {
        console.log('🔗 Atualizando URL com filtros:', filters);
        setSearchParams(newParams, { replace: true });
      }
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timer);
  }, [filters, setSearchParams]);

  return {
    parseFiltersFromUrl,
    encodeFiltersToUrl
  };
}
