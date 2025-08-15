import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { HistoricoVenda } from '../types/historicoTypes';

interface RealtimeUpdate {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: HistoricoVenda;
  old?: HistoricoVenda;
  timestamp: string;
}

interface UseHistoricoRealtimeOptions {
  enabled?: boolean;
  debounceMs?: number;
  batchUpdates?: boolean;
  onUpdate?: (updates: RealtimeUpdate[]) => void;
  onError?: (error: Error) => void;
}

export const useHistoricoRealtime = (options: UseHistoricoRealtimeOptions = {}) => {
  const {
    enabled = true,
    debounceMs = 1000,
    batchUpdates = true,
    onUpdate,
    onError
  } = options;

  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [pendingUpdates, setPendingUpdates] = useState<RealtimeUpdate[]>([]);

  const { toast } = useToast();
  const channelRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  // Process batched updates
  const processPendingUpdates = useCallback(() => {
    if (pendingUpdates.length === 0) return;

    const updates = [...pendingUpdates];
    setPendingUpdates([]);
    
    onUpdate?.(updates);
    setUpdateCount(prev => prev + updates.length);
    setLastUpdate(new Date());

    // Show toast notification for significant updates
    if (updates.length > 0) {
      const insertCount = updates.filter(u => u.eventType === 'INSERT').length;
      const updateCount = updates.filter(u => u.eventType === 'UPDATE').length;
      const deleteCount = updates.filter(u => u.eventType === 'DELETE').length;

      let message = '';
      if (insertCount > 0) message += `${insertCount} novos registros`;
      if (updateCount > 0) message += `${message ? ', ' : ''}${updateCount} atualizados`;
      if (deleteCount > 0) message += `${message ? ', ' : ''}${deleteCount} removidos`;

      if (message) {
        toast({
          title: "Dados atualizados",
          description: message,
          duration: 3000
        });
      }
    }
  }, [pendingUpdates, onUpdate, toast]);

  // Debounced update processing
  const scheduleUpdateProcessing = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(processPendingUpdates, debounceMs);
  }, [processPendingUpdates, debounceMs]);

  // Add update to pending queue
  const addPendingUpdate = useCallback((update: RealtimeUpdate) => {
    setPendingUpdates(prev => [...prev, update]);
    
    if (batchUpdates) {
      scheduleUpdateProcessing();
    } else {
      processPendingUpdates();
    }
  }, [batchUpdates, scheduleUpdateProcessing, processPendingUpdates]);

  // Connection retry logic with exponential backoff
  const attemptReconnection = useCallback(() => {
    const maxRetries = 5;
    const baseDelay = 1000;
    
    if (retryCountRef.current >= maxRetries) {
      setConnectionStatus('disconnected');
      onError?.(new Error('Max reconnection attempts reached'));
      return;
    }

    const delay = baseDelay * Math.pow(2, retryCountRef.current);
    retryCountRef.current++;

    retryTimeoutRef.current = setTimeout(() => {
      console.log(`🔄 Attempting reconnection ${retryCountRef.current}/${maxRetries}`);
      setupRealtimeConnection();
    }, delay);
  }, [onError]);

  // Setup realtime connection
  const setupRealtimeConnection = useCallback(() => {
    if (!enabled) return;

    try {
      setConnectionStatus('connecting');
      
      // Clean up existing connection
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      // Create new channel
      const channel = supabase
        .channel('historico_vendas_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'historico_vendas'
          },
          (payload) => {
            console.log('📡 Realtime update received:', payload);
            
            const update: RealtimeUpdate = {
              eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              new: payload.new as HistoricoVenda,
              old: payload.old as HistoricoVenda,
              timestamp: new Date().toISOString()
            };

            addPendingUpdate(update);
          }
        )
        .subscribe((status) => {
          console.log('📡 Realtime status:', status);
          
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected');
            retryCountRef.current = 0; // Reset retry count on successful connection
            toast({
              title: "Conexão estabelecida",
              description: "Atualizações em tempo real ativadas",
              duration: 2000
            });
          } else if (status === 'CHANNEL_ERROR') {
            setConnectionStatus('disconnected');
            onError?.(new Error('Channel subscription error'));
            attemptReconnection();
          } else if (status === 'TIMED_OUT') {
            setConnectionStatus('disconnected');
            onError?.(new Error('Connection timed out'));
            attemptReconnection();
          }
        });

      channelRef.current = channel;

    } catch (error) {
      console.error('❌ Failed to setup realtime connection:', error);
      setConnectionStatus('disconnected');
      onError?.(error as Error);
      attemptReconnection();
    }
  }, [enabled, addPendingUpdate, onError, attemptReconnection, toast]);

  // Setup connection on mount and when enabled changes
  useEffect(() => {
    if (enabled) {
      setupRealtimeConnection();
    } else {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setConnectionStatus('disconnected');
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [enabled, setupRealtimeConnection]);

  // Manual reconnection
  const reconnect = useCallback(() => {
    retryCountRef.current = 0;
    setupRealtimeConnection();
  }, [setupRealtimeConnection]);

  // Force process pending updates
  const flush = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    processPendingUpdates();
  }, [processPendingUpdates]);

  return {
    connectionStatus,
    lastUpdate,
    updateCount,
    pendingUpdatesCount: pendingUpdates.length,
    reconnect,
    flush,
    
    // Helper methods
    isConnected: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting',
    isDisconnected: connectionStatus === 'disconnected'
  };
};