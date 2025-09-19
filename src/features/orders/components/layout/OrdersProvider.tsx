import { createContext, useContext, ReactNode } from 'react';
import { Order, OrderFilters } from '../../types/Orders.types';
import { useOrdersQuery } from '../../hooks/queries/useOrdersQuery';
import { useOrdersMutations } from '../../hooks/mutations/useOrdersMutations';
import { useOrdersRealtime } from '../../hooks/realtime/useOrdersRealtime';
import { useOrdersUI } from '../../hooks/ui/useOrdersUI';

interface OrdersContextValue {
  // Data
  orders: Order[];
  stats: any;
  total: number;
  
  // Query states
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  
  // UI state and actions
  ui: ReturnType<typeof useOrdersUI>;
  
  // Mutations
  mutations: ReturnType<typeof useOrdersMutations>;
  
  // Realtime
  realtime: ReturnType<typeof useOrdersRealtime>;
  
  // Methods
  refetch: () => void;
  invalidate: () => void;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

interface OrdersProviderProps {
  children: ReactNode;
  initialFilters?: Partial<OrderFilters>;
  enableRealtime?: boolean;
  enableNotifications?: boolean;
}

function OrdersProviderInner({ 
  children, 
  initialFilters = {},
  enableRealtime = true,
  enableNotifications = true
}: OrdersProviderProps) {
  // UI state management
  const ui = useOrdersUI({ 
    initialFilters,
    autoSave: true 
  });
  
  // Data fetching
  const query = useOrdersQuery(ui.state.filters, {
    keepPreviousData: true,
    refetchInterval: enableRealtime ? undefined : 60000 // Poll every minute if realtime disabled
  });
  
  // Mutations
  const mutations = useOrdersMutations();
  
  // Realtime updates
  const realtime = useOrdersRealtime({
    enabled: enableRealtime,
    showNotifications: enableNotifications
  });
  
  const contextValue: OrdersContextValue = {
    // Data
    orders: query.data,
    stats: query.stats,
    total: query.total,
    
    // Query states
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    
    // UI
    ui,
    
    // Mutations
    mutations,
    
    // Realtime
    realtime,
    
    // Methods
    refetch: query.refetch,
    invalidate: query.invalidate
  };
  
  return (
    <OrdersContext.Provider value={contextValue}>
      {children}
    </OrdersContext.Provider>
  );
}

export function OrdersProvider(props: OrdersProviderProps) {
  return <OrdersProviderInner {...props} />;
}

export function useOrdersContext(): OrdersContextValue {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrdersContext must be used within OrdersProvider');
  }
  return context;
}

// Convenience hooks for specific parts of the context
export function useOrdersData() {
  const context = useOrdersContext();
  return {
    orders: context.orders,
    stats: context.stats,
    total: context.total,
    isLoading: context.isLoading,
    isError: context.isError,
    error: context.error,
    refetch: context.refetch,
    invalidate: context.invalidate
  };
}

export function useOrdersActions() {
  const context = useOrdersContext();
  return {
    ...context.ui.actions,
    ...context.mutations,
    refetch: context.refetch,
    invalidate: context.invalidate
  };
}

export function useOrdersState() {
  const context = useOrdersContext();
  return context.ui.state;
}

export function useOrdersRealTimeStatus() {
  const context = useOrdersContext();
  return context.realtime;
}