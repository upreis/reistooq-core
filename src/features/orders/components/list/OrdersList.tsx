import React, { useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { OrderCard } from './OrderCard';
import { OrdersEmpty } from './OrdersEmpty';
import { OrdersLoadingSkeleton } from './OrdersLoadingSkeleton';
import { Order } from '../../types/Orders.types';
import { PERFORMANCE_CONFIG, ANIMATIONS } from '../../utils/OrdersConstants';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OrdersListProps {
  orders: Order[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onOrderSelect: (order: Order) => void;
  onOrderAction: (action: string, orderId: string) => void;
  selectedOrderIds: string[];
  viewMode: 'table' | 'cards' | 'compact';
  isCompactMode: boolean;
}

export function OrdersList({
  orders,
  isLoading,
  isError,
  error,
  hasMore = false,
  onLoadMore,
  onOrderSelect,
  onOrderAction,
  selectedOrderIds,
  viewMode,
  isCompactMode
}: OrdersListProps) {
  
  // Intersection observer for infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '200px'
  });
  
  // Trigger load more when in view
  React.useEffect(() => {
    if (inView && hasMore && onLoadMore && !isLoading) {
      onLoadMore();
    }
  }, [inView, hasMore, onLoadMore, isLoading]);
  
  // Virtual scrolling for large lists
  const parentRef = React.useRef<HTMLDivElement>(null);
  const shouldVirtualize = orders.length > PERFORMANCE_CONFIG.VIRTUAL_THRESHOLD;
  
  const virtualizer = useVirtualizer({
    count: orders.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => isCompactMode ? 60 : PERFORMANCE_CONFIG.ITEM_HEIGHT,
    overscan: PERFORMANCE_CONFIG.OVERSCAN,
    enabled: shouldVirtualize
  });
  
  // Memoized order cards
  const orderCards = useMemo(() => {
    return orders.map((order, index) => (
      <motion.div
        key={order.id}
        layout
        variants={ANIMATIONS.listItem}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ delay: index * 0.05 }}
        className={shouldVirtualize ? 'absolute top-0 left-0 w-full' : ''}
        style={shouldVirtualize ? {
          height: virtualizer.getVirtualItems()[index]?.size,
          transform: `translateY(${virtualizer.getVirtualItems()[index]?.start}px)`
        } : undefined}
      >
        <OrderCard
          order={order}
          isSelected={selectedOrderIds.includes(order.id)}
          isCompact={isCompactMode}
          viewMode={viewMode}
          onSelect={() => onOrderSelect(order)}
          onAction={(action) => onOrderAction(action, order.id)}
        />
      </motion.div>
    ));
  }, [orders, selectedOrderIds, isCompactMode, viewMode, onOrderSelect, onOrderAction, shouldVirtualize, virtualizer]);
  
  // Error state
  if (isError) {
    return (
      <Card className="p-8 text-center">
        <div className="text-destructive mb-2">❌</div>
        <h3 className="text-lg font-semibold mb-2">Erro ao carregar pedidos</h3>
        <p className="text-muted-foreground mb-4">
          {error?.message || 'Ocorreu um erro inesperado'}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="text-primary hover:underline"
        >
          Tentar novamente
        </button>
      </Card>
    );
  }
  
  // Empty state
  if (!isLoading && orders.length === 0) {
    return <OrdersEmpty />;
  }
  
  // Loading state
  if (isLoading && orders.length === 0) {
    return <OrdersLoadingSkeleton count={5} isCompact={isCompactMode} />;
  }
  
  // Render virtual list for large datasets
  if (shouldVirtualize) {
    return (
      <Card className="relative overflow-hidden">
        <ScrollArea 
          ref={parentRef}
          className="h-[600px] w-full"
        >
          <div
            style={{
              height: virtualizer.getTotalSize(),
              width: '100%',
              position: 'relative'
            }}
          >
            <AnimatePresence mode="sync">
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const order = orders[virtualRow.index];
                if (!order) return null;
                
                return (
                  <motion.div
                    key={order.id}
                    layout
                    variants={ANIMATIONS.listItem}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="absolute top-0 left-0 w-full px-4"
                    style={{
                      height: virtualRow.size,
                      transform: `translateY(${virtualRow.start}px)`
                    }}
                  >
                    <OrderCard
                      order={order}
                      isSelected={selectedOrderIds.includes(order.id)}
                      isCompact={isCompactMode}
                      viewMode={viewMode}
                      onSelect={() => onOrderSelect(order)}
                      onAction={(action) => onOrderAction(action, order.id)}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          
          {/* Load more trigger */}
          {hasMore && (
            <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
              {isLoading && <OrdersLoadingSkeleton count={2} isCompact={isCompactMode} />}
            </div>
          )}
        </ScrollArea>
      </Card>
    );
  }
  
  // Render normal list for smaller datasets
  return (
    <div className="space-y-3">
      <motion.div
        variants={ANIMATIONS.stagger}
        initial="initial"
        animate="animate"
        className="space-y-3"
      >
        <AnimatePresence mode="sync">
          {orderCards}
        </AnimatePresence>
      </motion.div>
      
      {/* Load more section */}
      {hasMore && (
        <div ref={loadMoreRef} className="pt-4">
          {isLoading ? (
            <OrdersLoadingSkeleton count={3} isCompact={isCompactMode} />
          ) : (
            <Card className="p-4 text-center text-muted-foreground">
              <p>Role para carregar mais pedidos...</p>
            </Card>
          )}
        </div>
      )}
      
      {/* End of list indicator */}
      {!hasMore && orders.length > 0 && (
        <Card className="p-4 text-center text-muted-foreground">
          <p>📦 Todos os pedidos foram carregados ({orders.length} pedidos)</p>
        </Card>
      )}
    </div>
  );
}