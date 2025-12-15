/**
 * 🎯 VENDAS COM ENVIO - Sistema Híbrido: URL + localStorage
 * Hook que gerencia filtros através de URL params COM fallback para localStorage
 */

import { useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { subDays, startOfDay, endOfDay, format, parseISO } from 'date-fns';
import type { VendasComEnvioFilters, ShippingStatus } from '../types';
import { DEFAULT_ITEMS_PER_PAGE } from '../config';

const isDev = process.env.NODE_ENV === 'development';
const STORAGE_KEY = 'vendas_com_envio_filters_backup_v2';

interface UseVendasComEnvioFiltersSyncOptions {
  enabled?: boolean;
}

const getDefaultFilters = (): VendasComEnvioFilters => ({
  startDate: startOfDay(subDays(new Date(), 6)),
  endDate: endOfDay(new Date()),
  selectedAccounts: [],
  shippingStatus: 'all',
  searchTerm: '',
  currentPage: 1,
  itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
  activeTab: 'ativas',
});

function filtersToURLParams(filters: VendasComEnvioFilters): URLSearchParams {
  const params = new URLSearchParams();
  
  if (filters.startDate) {
    params.set('from', format(filters.startDate, 'yyyy-MM-dd'));
  }
  if (filters.endDate) {
    params.set('to', format(filters.endDate, 'yyyy-MM-dd'));
  }
  if (filters.shippingStatus && filters.shippingStatus !== 'all') {
    params.set('status', filters.shippingStatus);
  }
  if (filters.searchTerm && filters.searchTerm.trim()) {
    params.set('q', filters.searchTerm.trim());
  }
  if (filters.selectedAccounts && filters.selectedAccounts.length > 0) {
    params.set('accounts', filters.selectedAccounts.join(','));
  }
  if (filters.currentPage && filters.currentPage > 1) {
    params.set('page', filters.currentPage.toString());
  }
  if (filters.activeTab && filters.activeTab !== 'ativas') {
    params.set('tab', filters.activeTab);
  }
  
  return params;
}

function urlParamsToFilters(params: URLSearchParams): Partial<VendasComEnvioFilters> {
  const filters: Partial<VendasComEnvioFilters> = {};
  
  const from = params.get('from');
  if (from) {
    try { filters.startDate = startOfDay(parseISO(from)); } catch {}
  }
  
  const to = params.get('to');
  if (to) {
    try { filters.endDate = endOfDay(parseISO(to)); } catch {}
  }
  
  const status = params.get('status');
  if (status) filters.shippingStatus = status as ShippingStatus | 'all';
  
  const search = params.get('q');
  if (search) filters.searchTerm = search;
  
  const accounts = params.get('accounts');
  if (accounts) filters.selectedAccounts = accounts.split(',').filter(Boolean);
  
  const page = params.get('page');
  if (page && /^\d+$/.test(page)) filters.currentPage = parseInt(page, 10);
  
  const tab = params.get('tab');
  if (tab === 'ativas' || tab === 'historico') filters.activeTab = tab;
  
  return filters;
}

export function useVendasComEnvioFiltersSync(options: UseVendasComEnvioFiltersSyncOptions = {}) {
  const { enabled = true } = options;
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitializedRef = useRef(false);
  const lastSyncedRef = useRef<string>('');
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const currentFilters = useMemo((): VendasComEnvioFilters => {
    if (!enabled) return getDefaultFilters();
    const urlFilters = urlParamsToFilters(searchParams);
    if (Object.keys(urlFilters).length > 0) {
      return { ...getDefaultFilters(), ...urlFilters };
    }
    return getDefaultFilters();
  }, [enabled, searchParams]);

  const writeFilters = useCallback((filters: VendasComEnvioFilters) => {
    if (!enabled || !isMountedRef.current) return;
    const serialized = JSON.stringify(filters);
    if (serialized === lastSyncedRef.current) return;
    lastSyncedRef.current = serialized;
    const params = filtersToURLParams(filters);
    setSearchParams(params, { replace: true });
  }, [enabled, setSearchParams]);

  const clearFilters = useCallback(() => {
    if (!enabled || !isMountedRef.current) return;
    lastSyncedRef.current = '';
    setSearchParams({}, { replace: true });
    localStorage.removeItem(STORAGE_KEY);
  }, [enabled, setSearchParams]);

  const hasActiveFilters = useMemo(() => {
    const defaults = getDefaultFilters();
    return currentFilters.searchTerm !== defaults.searchTerm ||
      currentFilters.shippingStatus !== defaults.shippingStatus ||
      currentFilters.selectedAccounts.length > 0;
  }, [currentFilters]);

  return {
    filters: currentFilters,
    hasActiveFilters,
    activeFiltersCount: hasActiveFilters ? 1 : 0,
    writeFilters,
    clearFilters,
    source: 'url' as const,
    isEnabled: enabled,
    defaultFilters: getDefaultFilters(),
  };
}
