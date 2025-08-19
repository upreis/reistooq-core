import { useEffect, useCallback, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderRealtimeUpdate } from '../../types/Orders.types';
import { toast } from '@/hooks/use-toast';

interface UseOrdersRealtimeOptions {
  enabled?: boolean;
  showNotifications?: boolean;
  onOrderUpdate?: (update: OrderRealtimeUpdate) => void;
}

interface UseOrdersRealtimeReturn {
  isConnected: boolean;
  isOnline: boolean;
  lastSync: Date | null;
  reconnect: () => void;
  disconnect: () => void;
}

export function useOrdersRealtime(
  options: UseOrdersRealtimeOptions = {}
): UseOrdersRealtimeReturn {
  const { enabled = true, showNotifications = true, onOrderUpdate } = options;
  
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const channelRef = useRef<any>(null);
  
  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Handle realtime updates
  const handleOrderUpdate = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    let updateType: OrderRealtimeUpdate['type'];
    let order: Order;
    
    switch (eventType) {
      case 'INSERT':
        updateType = 'insert';
        order = newRecord;
        break;
      case 'UPDATE':
        updateType = 'update';
        order = newRecord;
        break;
      case 'DELETE':
        updateType = 'delete';
        order = oldRecord;
        break;
      default:
        return;
    }
    
    const update: OrderRealtimeUpdate = {
      type: updateType,
      order,
      timestamp: new Date().toISOString()
    };
    
    // Update query cache
    queryClient.setQueriesData(
      { queryKey: ['orders'] },
      (old: any) => {
        if (!old?.data) return old;
        
        let updatedData = [...old.data];
        
        switch (updateType) {
          case 'insert':
            // Add new order to the beginning
            updatedData.unshift(order);
            break;
          case 'update':
            // Update existing order
            updatedData = updatedData.map(item => 
              item.id === order.id ? order : item
            );
            break;
          case 'delete':
            // Remove deleted order
            updatedData = updatedData.filter(item => item.id !== order.id);
            break;
        }
        
        return {
          ...old,
          data: updatedData,
          count: old.count + (updateType === 'insert' ? 1 : updateType === 'delete' ? -1 : 0)
        };
      }
    );
    
    // Update stats cache
    queryClient.invalidateQueries({ queryKey: ['orderStats'] });
    
    // Show notifications
    if (showNotifications) {
      switch (updateType) {
        case 'insert':
          toast({
            title: "Novo pedido recebido",
            description: `Pedido ${order.numero} - ${order.nome_cliente}`,
          });
          break;
        case 'update':
          toast({
            title: "Pedido atualizado",
            description: `Pedido ${order.numero} foi modificado`,
          });
          break;
        case 'delete':
          toast({
            title: "Pedido removido",
            description: `Pedido ${order.numero} foi removido`,
            variant: "destructive"
          });
          break;
      }
    }
    
    // Call custom callback
    onOrderUpdate?.(update);
    setLastSync(new Date());
  }, [queryClient, showNotifications, onOrderUpdate]);
  
  // Connect to realtime channel
  const connect = useCallback(() => {
    if (!enabled || !isOnline || channelRef.current) return;
    
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos'
        },
        handleOrderUpdate
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') {
          setLastSync(new Date());
        }
      });
    
    channelRef.current = channel;
  }, [enabled, isOnline, handleOrderUpdate]);
  
  // Disconnect from realtime channel
  const disconnect = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsConnected(false);
    }
  }, []);
  
  // Reconnect function
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 1000);
  }, [disconnect, connect]);
  
  // Setup realtime connection
  useEffect(() => {
    if (enabled && isOnline) {
      connect();
    } else {
      disconnect();
    }
    
    return disconnect;
  }, [enabled, isOnline, connect, disconnect]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);
  
  return {
    isConnected,
    isOnline,
    lastSync,
    reconnect,
    disconnect
  };
}

/**
 * Hook for smart polling as fallback to realtime
 */
export function useOrdersPolling(
  enabled: boolean = true,
  interval: number = 30000 // 30 seconds
) {
  const queryClient = useQueryClient();
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  
  const startPolling = useCallback(() => {
    if (!enabled || isPolling || intervalRef.current) return;
    
    setIsPolling(true);
    intervalRef.current = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderStats'] });
    }, interval);
  }, [enabled, isPolling, interval, queryClient]);
  
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
      setIsPolling(false);
    }
  }, []);
  
  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }
    
    return stopPolling;
  }, [enabled, startPolling, stopPolling]);
  
  return {
    isPolling,
    startPolling,
    stopPolling
  };
}