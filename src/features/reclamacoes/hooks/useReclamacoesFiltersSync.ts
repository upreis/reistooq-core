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
 * ✅ RADICAL: SEMPRE adiciona TODOS os filtros (sem omitir padrões)
 */
function encodeFiltersToUrl(filters: ReclamacoesFilters): URLSearchParams {
  const params = new URLSearchParams();

  // ✅ SEMPRE adicionar período (sem verificar se é padrão)
  params.set('periodo', filters.periodo);

  // ✅ SEMPRE adicionar status (mesmo vazio)
  if (filters.status !== undefined) {
    params.set('status', filters.status);
  }

  // ✅ SEMPRE adicionar type (mesmo vazio)
  if (filters.type !== undefined) {
    params.set('type', filters.type);
  }

  // ✅ SEMPRE adicionar stage (mesmo vazio)
  if (filters.stage !== undefined) {
    params.set('stage', filters.stage);
  }

  // ✅ SEMPRE adicionar contas (mesmo vazio)
  if (filters.selectedAccounts && filters.selectedAccounts.length > 0) {
    params.set('accounts', filters.selectedAccounts.join(','));
  }

  // ✅ SEMPRE adicionar página
  params.set('page', filters.currentPage.toString());

  // ✅ SEMPRE adicionar limite
  params.set('limit', filters.itemsPerPage.toString());

  return params;
}

/**
 * Hook de sincronização de filtros com URL
 */
export function useReclamacoesFiltersSync(
  filters: ReclamacoesFilters,
  onFiltersChange: (newFilters: Partial<ReclamacoesFilters>) => void
) {
  const [searchParams, setSearchParams] = useSearchParams();

  // 🔥 REMOVIDO: Carregar filtros da URL na montagem
  // Agora isso é feito no useReclamacoesFiltersUnified com merge correto Cache + URL

  // ✅ Atualizar URL IMEDIATAMENTE quando filtros mudarem (sem debounce)
  useEffect(() => {
    const newParams = encodeFiltersToUrl(filters);
    const currentParams = searchParams.toString();
    const newParamsString = newParams.toString();

    // Só atualizar se realmente mudou
    if (currentParams !== newParamsString) {
      console.log('🔗 Atualizando URL com filtros:', filters);
      setSearchParams(newParams, { replace: true });
    }
  }, [filters, searchParams, setSearchParams]);

  return {
    parseFiltersFromUrl,
    encodeFiltersToUrl
  };
}
