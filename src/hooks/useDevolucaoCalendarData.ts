import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, subDays } from 'date-fns';
import { RealtimeChannel } from '@supabase/supabase-js';
import debounce from 'lodash.debounce';

interface ContributionDay {
  date: string;
  count: number;
  returns?: Array<{
    dateType: 'delivery' | 'review';
    order_id: string;
    status_devolucao?: string;
    produto_titulo?: string;
    [key: string]: any;
  }>;
}

// Cache compartilhado entre instâncias do hook
let cachedData: ContributionDay[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutos

/**
 * Hook para buscar dados de devoluções do calendário
 * ✅ COMBO 2.1: Lê de ml_claims (mesma fonte que /devolucoesdevenda)
 * ✅ OTIMIZADO: Cache local + debounce de realtime
 */
export const useDevolucaoCalendarData = () => {
  const [data, setData] = useState<ContributionDay[]>(cachedData || []);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async (skipCache = false) => {
    // Verificar cache válido
    if (!skipCache && cachedData && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
      setData(cachedData);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Buscar últimos 60 dias de ml_claims (devoluções/claims)
      const sixtyDaysAgo = subDays(new Date(), 60).toISOString();
      
      // ✅ OTIMIZADO: Busca apenas colunas leves que EXISTEM (sem claim_data JSONB pesado)
      const { data: claims, error: fetchError } = await supabase
        .from('ml_claims')
        .select('claim_id, order_id, status, stage, reason_id, date_created, date_closed')
        .gte('date_created', sixtyDaysAgo)
        .order('date_created', { ascending: false })
        .limit(500); // Limitar para performance

      if (fetchError) {
        throw fetchError;
      }

      if (!isMountedRef.current) return;

      if (!claims || claims.length === 0) {
        cachedData = [];
        cacheTimestamp = Date.now();
        setData([]);
        setLoading(false);
        return;
      }

      // Agrupar devoluções por data
      const groupedByDate = claims.reduce((acc: Record<string, ContributionDay>, claim: any) => {
        // Processar data de criação (delivery - quando foi criada a devolução)
        if (claim.date_created) {
          try {
            const dateStr = format(parseISO(claim.date_created), 'yyyy-MM-dd');
            
            if (!acc[dateStr]) {
              acc[dateStr] = {
                date: dateStr,
                count: 0,
                returns: []
              };
            }
            
            acc[dateStr].count += 1;
            acc[dateStr].returns!.push({
              dateType: 'delivery',
              order_id: claim.order_id || claim.claim_id,
              status_devolucao: claim.status,
              produto_titulo: 'Devolução',
              reason_id: claim.reason_id
            });
          } catch (e) {
            // Ignorar data inválida
          }
        }
        
        // Processar data de fechamento/resolução (review)
        if (claim.date_closed && claim.status === 'closed') {
          try {
            const dateStr = format(parseISO(claim.date_closed), 'yyyy-MM-dd');
            
            if (!acc[dateStr]) {
              acc[dateStr] = {
                date: dateStr,
                count: 0,
                returns: []
              };
            }
            
            acc[dateStr].count += 1;
            acc[dateStr].returns!.push({
              dateType: 'review',
              order_id: claim.order_id || claim.claim_id,
              status_devolucao: claim.status,
              produto_titulo: 'Devolução'
            });
          } catch (e) {
            // Ignorar data inválida
          }
        }
        
        return acc;
      }, {});

      const finalData = Object.values(groupedByDate) as ContributionDay[];
      
      // Atualizar cache
      cachedData = finalData;
      cacheTimestamp = Date.now();
      
      if (isMountedRef.current) {
        setData(finalData);
      }
    } catch (err: any) {
      console.error('❌ Erro ao processar dados do calendário de devoluções:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Erro ao carregar dados');
        setData([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Debounce para realtime - evita múltiplas requisições
  const debouncedFetch = useCallback(
    debounce(() => fetchData(true), 5000), // 5s debounce para realtime
    [fetchData]
  );

  useEffect(() => {
    isMountedRef.current = true;
    
    // Buscar dados iniciais
    fetchData();

    // Configurar Supabase Realtime para atualizações automáticas (com debounce)
    const channel = supabase
      .channel('ml-claims-calendar-devolucoes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ml_claims'
        },
        () => {
          debouncedFetch(); // Usar debounce para evitar floods
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Cleanup
    return () => {
      isMountedRef.current = false;
      debouncedFetch.cancel();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchData, debouncedFetch]);

  const refresh = useCallback(() => {
    fetchData(true); // Force skip cache
  }, [fetchData]);

  return { data, loading, error, refresh };
};
