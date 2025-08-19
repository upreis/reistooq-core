import { Order, OrderFilters, OrderSortOption, OrderViewMode } from './Orders.types';

export interface OrdersUIState {
  // View state
  viewMode: OrderViewMode;
  isCompactMode: boolean;
  selectedOrderIds: string[];
  expandedOrderId: string | null;
  
  // Filter state
  filters: OrderFilters;
  savedFilters: SavedFilter[];
  activeFilterPreset: string | null;
  
  // Sort state
  sortBy: OrderSortOption;
  
  // Selection state
  isSelectMode: boolean;
  selectAll: boolean;
  
  // Loading states
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  
  // Error state
  error: string | null;
  
  // Pagination
  currentPage: number;
  hasNextPage: boolean;
  totalCount: number;
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: OrderFilters;
  isDefault: boolean;
  color: string;
  icon: string;
  createdAt: string;
}

export interface OrdersUIActions {
  // View actions
  setViewMode: (mode: OrderViewMode) => void;
  toggleCompactMode: () => void;
  setExpandedOrder: (orderId: string | null) => void;
  
  // Filter actions
  setFilters: (filters: Partial<OrderFilters>) => void;
  clearFilters: () => void;
  saveFilter: (name: string, filters: OrderFilters) => void;
  loadFilterPreset: (presetId: string) => void;
  
  // Sort actions
  setSortBy: (sort: OrderSortOption) => void;
  
  // Selection actions
  toggleSelectMode: () => void;
  selectOrder: (orderId: string) => void;
  unselectOrder: (orderId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // Loading actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Pagination actions
  loadMore: () => void;
  refresh: () => void;
}

export interface OrderListProps {
  orders: Order[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
  onOrderSelect: (order: Order) => void;
  onBulkAction: (action: string, orderIds: string[]) => void;
}

export interface OrderCardProps {
  order: Order;
  isSelected: boolean;
  isCompact: boolean;
  onSelect: (orderId: string) => void;
  onView: (order: Order) => void;
  onQuickAction: (action: string, orderId: string) => void;
}

export interface BulkActionsProps {
  selectedCount: number;
  totalCount: number;
  onAction: (action: string) => void;
  onClearSelection: () => void;
  isProcessing: boolean;
}