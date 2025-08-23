import { createContext, useContext, ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { usePedidosStore } from '../../stores/usePedidosStore';
import { PedidosFilters } from '../../types/pedidos.types';

// Create QueryClient with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

interface PedidosContextType {
  // Store actions and state
  filters: PedidosFilters;
  setFilters: (filters: PedidosFilters) => void;
  applyFilters: () => void;
  clearFilters: () => void;
  
  // Selection
  selectedIds: Set<string>;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isSelectMode: boolean;
  setSelectMode: (enabled: boolean) => void;
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Utilities
  invalidateCache: () => void;
  refetch: () => void;
}

const PedidosContext = createContext<PedidosContextType | undefined>(undefined);

interface PedidosProviderProps {
  children: ReactNode;
  integrationAccountId: string;
}

export function PedidosProvider({ children, integrationAccountId }: PedidosProviderProps) {
  const store = usePedidosStore();

  // Auto-save filters to URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Update URL with current filters
    Object.entries(store.appliedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          params.set(key, value.join(','));
        } else if (value instanceof Date) {
          params.set(key, value.toISOString().split('T')[0]);
        } else if (typeof value === 'string' || typeof value === 'number') {
          params.set(key, value.toString());
        }
      } else {
        params.delete(key);
      }
    });

    // Update URL without reload
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [store.appliedFilters]);

  // Load filters from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlFilters: PedidosFilters = {};

    // Parse URL parameters
    if (params.get('search')) urlFilters.search = params.get('search')!;
    if (params.get('situacao')) urlFilters.situacao = params.get('situacao')!.split(',');
    if (params.get('empresas')) urlFilters.empresas = params.get('empresas')!.split(',');
    if (params.get('cidade')) urlFilters.cidade = params.get('cidade')!;
    if (params.get('uf')) urlFilters.uf = params.get('uf')!;
    if (params.get('valorMin')) urlFilters.valorMin = parseFloat(params.get('valorMin')!);
    if (params.get('valorMax')) urlFilters.valorMax = parseFloat(params.get('valorMax')!);
    if (params.get('dataInicio')) urlFilters.dataInicio = new Date(params.get('dataInicio')!);
    if (params.get('dataFim')) urlFilters.dataFim = new Date(params.get('dataFim')!);
    if (params.get('temMapeamento')) urlFilters.temMapeamento = params.get('temMapeamento') === 'true';
    if (params.get('statusEstoque')) urlFilters.statusEstoque = params.get('statusEstoque')!.split(',');

    if (Object.keys(urlFilters).length > 0) {
      store.setFilters(urlFilters);
      store.applyFilters();
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'a':
            e.preventDefault();
            if (e.shiftKey) {
              // Select all pages (future implementation)
              console.log('Select all pages');
            } else {
              store.selectAll();
            }
            break;
          case 'f':
            e.preventDefault();
            const searchInput = document.querySelector('[placeholder*="Buscar"]') as HTMLInputElement;
            searchInput?.focus();
            break;
          case 'r':
            e.preventDefault();
            store.invalidateCache();
            queryClient.invalidateQueries({ queryKey: ['pedidos'] });
            break;
          case 'e':
            e.preventDefault();
            // Toggle export mode (future implementation)
            console.log('Toggle export mode');
            break;
        }
      } else if (e.key === 'Escape') {
        store.clearSelection();
        store.setSelectMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const contextValue: PedidosContextType = {
    filters: store.filters,
    setFilters: store.setFilters,
    applyFilters: store.applyFilters,
    clearFilters: store.clearFilters,
    
    selectedIds: store.selectedIds,
    toggleSelection: store.toggleSelection,
    selectAll: store.selectAll,
    clearSelection: store.clearSelection,
    isSelectMode: store.isSelectMode,
    setSelectMode: store.setSelectMode,
    
    loading: store.loading,
    error: store.error,
    
    invalidateCache: () => {
      store.invalidateCache();
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    },
    refetch: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['pedidos', integrationAccountId] 
      });
    },
  };

  return (
    <QueryClientProvider client={queryClient}>
      <PedidosContext.Provider value={contextValue}>
        {children}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </PedidosContext.Provider>
    </QueryClientProvider>
  );
}

export function usePedidosContext() {
  const context = useContext(PedidosContext);
  if (context === undefined) {
    throw new Error('usePedidosContext must be used within a PedidosProvider');
  }
  return context;
}