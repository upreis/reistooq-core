/**
 * 🔗 SINCRONIZAÇÃO DE FILTROS COM URL - VENDAS CANCELADAS
 * 🎯 FASE 2: Tornar filtros compartilháveis via URL params
 */

import { useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface VendasFilters {
  periodo: string;
  selectedAccounts: string[];
  searchTerm: string;
  currentPage: number;
  itemsPerPage: number;
}

/**
 * Parse URL search params para objeto de filtros
 */
export const parseFiltersFromUrl = (searchParams: URLSearchParams): Partial<VendasFilters> => {
  const filters: Partial<VendasFilters> = {};

  // Período
  const periodo = searchParams.get('periodo');
  if (periodo) {
    filters.periodo = periodo;
  }

  // Contas selecionadas
  const accounts = searchParams.get('contas');
  if (accounts) {
    filters.selectedAccounts = accounts.split(',').filter(Boolean);
  }

  // Termo de busca
  const search = searchParams.get('busca');
  if (search) {
    filters.searchTerm = search;
  }

  // Página atual
  const page = searchParams.get('pagina');
  if (page) {
    const parsed = parseInt(page, 10);
    if (!isNaN(parsed) && parsed > 0) {
      filters.currentPage = parsed;
    }
  }

  // Items por página
  const items = searchParams.get('itens');
  if (items) {
    const parsed = parseInt(items, 10);
    if (!isNaN(parsed) && [25, 50, 100].includes(parsed)) {
      filters.itemsPerPage = parsed;
    }
  }

  return filters;
};

/**
 * Codifica filtros para URL search params
 */
export const encodeFiltersToUrl = (filters: VendasFilters): URLSearchParams => {
  const params = new URLSearchParams();

  // Período (sempre incluir na URL)
  if (filters.periodo) { // 🔥 CORREÇÃO: Sempre incluir periodo (removido !== '60')
    params.set('periodo', filters.periodo);
  }

  // Contas (sempre incluir se houver)
  if (filters.selectedAccounts && filters.selectedAccounts.length > 0) {
    params.set('contas', filters.selectedAccounts.join(','));
  }

  // Busca (apenas se não vazio)
  if (filters.searchTerm && filters.searchTerm.trim()) {
    params.set('busca', filters.searchTerm.trim());
  }

  // Página (omitir página 1)
  if (filters.currentPage && filters.currentPage > 1) {
    params.set('pagina', filters.currentPage.toString());
  }

  // Items por página (omitir padrão de 50)
  if (filters.itemsPerPage && filters.itemsPerPage !== 50) {
    params.set('itens', filters.itemsPerPage.toString());
  }

  return params;
};

/**
 * Hook para sincronizar filtros com URL
 * 🔧 CORREÇÃO: Adicionar isInitialized igual /reclamacoes para evitar sync prematuro
 */
export function useVendasFiltersSync(
  filters: VendasFilters,
  onFiltersChange: (newFilters: Partial<VendasFilters>) => void,
  isInitialized: boolean = false // 🔧 CORREÇÃO: Só sincronizar após inicialização
) {
  const [searchParams, setSearchParams] = useSearchParams();

  // 🔥 REMOVIDO: Carregar filtros da URL na montagem
  // Agora isso é feito no useVendasFiltersUnified com merge correto Cache + URL

  // Atualizar URL quando filtros mudarem (debounced)
  // 🔧 CORREÇÃO CRÍTICA: Só sincronizar APÓS cache ser restaurado
  useEffect(() => {
    // 🔧 CORREÇÃO: Não atualizar URL até inicialização completa
    if (!isInitialized) {
      return;
    }

    const timer = setTimeout(() => {
      const newParams = encodeFiltersToUrl(filters);
      const currentParams = searchParams.toString();
      const newParamsStr = newParams.toString();

      // Só atualizar se mudou
      if (currentParams !== newParamsStr) {
        setSearchParams(newParams, { replace: true });
      }
    }, 300); // 🔧 CORREÇÃO: Aumentado para 300ms igual /reclamacoes

    return () => clearTimeout(timer);
  }, [filters, setSearchParams, isInitialized]);

  return {
    parseFiltersFromUrl: useCallback(() => parseFiltersFromUrl(searchParams), [searchParams]),
    encodeFiltersToUrl: useCallback(() => encodeFiltersToUrl(filters), [filters])
  };
}
