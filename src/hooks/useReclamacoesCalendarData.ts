import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, subDays } from 'date-fns';
import { calculateAnalysisDeadline } from '@/features/devolucao2025/utils/businessDays';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ReclamacaoCalendarDay {
  date: string;
  count: number;
  claims?: Array<{
    dateType: 'created' | 'deadline';
    claim_id: string;
    type?: string;
    status?: string;
    resource_id?: string;
    buyer_nickname?: string;
    [key: string]: any;
  }>;
}

/**
 * Hook para buscar dados de reclamações do calendário
 * ✅ OTIMIZADO: Seleciona apenas colunas necessárias, sem claim_data pesado
 */
export const useReclamacoesCalendarData = () => {
  const [data, setData] = useState<ReclamacaoCalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<number>(0);

  const fetchData = useCallback(async () => {
    // 🔧 Debounce: evitar múltiplos fetches em sequência
    const now = Date.now();
    if (now - lastFetchRef.current < 5000) {
      console.log('⏳ [Calendário Reclamações] Debounce - aguardando 5s entre fetches');
      return;
    }
    lastFetchRef.current = now;
    
    setLoading(true);
    setError(null);
    
    try {
      // Buscar últimos 60 dias de ml_claims
      const sixtyDaysAgo = subDays(new Date(), 60).toISOString();
      
      // ✅ OTIMIZAÇÃO: Selecionar APENAS colunas necessárias (sem claim_data pesado)
      const { data: claims, error: fetchError } = await supabase
        .from('ml_claims')
        .select('claim_id, order_id, status, stage, reason_id, date_created, buyer_nickname')
        .gte('date_created', sixtyDaysAgo)
        .order('date_created', { ascending: false })
        .limit(500); // ✅ LIMITE para evitar sobrecarga

      if (fetchError) {
        throw fetchError;
      }

      if (!claims || claims.length === 0) {
        console.log('📊 Sem reclamações encontradas em ml_claims (últimos 60 dias)');
        setData([]);
        setLoading(false);
        return;
      }

      console.log('📊 Carregando dados de reclamações do ml_claims para calendário (COMBO 2.1):', {
        totalClaims: claims.length,
        periodo: '60 dias'
      });

      // Agrupar reclamações por data (processamento simplificado)
      const groupedByDate = claims.reduce((acc: Record<string, ReclamacaoCalendarDay>, claim) => {
        // Processar data de criação
        if (claim.date_created) {
          try {
            const dateStr = format(parseISO(claim.date_created), 'yyyy-MM-dd');
            
            if (!acc[dateStr]) {
              acc[dateStr] = {
                date: dateStr,
                count: 0,
                claims: []
              };
            }
            
            acc[dateStr].count += 1;
            acc[dateStr].claims!.push({
              dateType: 'created',
              claim_id: claim.claim_id,
              type: claim.stage,
              status: claim.status,
              resource_id: claim.order_id,
              buyer_nickname: claim.buyer_nickname || '',
              reason_id: claim.reason_id
            });
          } catch {
            // Ignorar data inválida
          }
        }
        
        // Processar data de prazo de análise (3 dias úteis) - apenas para claims abertas
        if (claim.date_created && claim.status !== 'closed') {
          const deadlineDate = calculateAnalysisDeadline(claim.date_created);
          
          if (deadlineDate) {
            try {
              const dateStr = format(deadlineDate, 'yyyy-MM-dd');
              
              if (!acc[dateStr]) {
                acc[dateStr] = {
                  date: dateStr,
                  count: 0,
                  claims: []
                };
              }
              
              acc[dateStr].count += 1;
              acc[dateStr].claims!.push({
                dateType: 'deadline',
                claim_id: claim.claim_id,
                type: claim.stage,
                status: claim.status,
                resource_id: claim.order_id,
                buyer_nickname: claim.buyer_nickname || '',
                reason_id: claim.reason_id
              });
            } catch {
              // Ignorar data inválida
            }
          }
        }
        
        return acc;
      }, {});

      const finalData = Object.values(groupedByDate) as ReclamacaoCalendarDay[];
      console.log('✅ Dados do calendário de reclamações processados (ml_claims):', {
        total: finalData.length,
        criadas: finalData.filter((d: ReclamacaoCalendarDay) => d.claims?.some(r => r.dateType === 'created')).length,
        prazos: finalData.filter((d: ReclamacaoCalendarDay) => d.claims?.some(r => r.dateType === 'deadline')).length
      });
      setData(finalData);
    } catch (err: any) {
      console.error('❌ Erro ao processar dados do calendário de reclamações:', err);
      setError(err.message || 'Erro ao carregar dados');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔧 Fetch com debounce para realtime
  const debouncedFetch = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchData();
    }, 3000); // 3s debounce para realtime
  }, [fetchData]);

  useEffect(() => {
    // Buscar dados iniciais
    fetchData();

    // Configurar Supabase Realtime para atualizações automáticas
    console.log('🔄 Ativando Realtime para calendário de reclamações (ml_claims)...');
    
    const channel = supabase
      .channel('ml-claims-reclamacoes-calendar-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ml_claims'
        },
        (payload) => {
          console.log('🔄 Mudança detectada em ml_claims (reclamações):', payload.eventType);
          debouncedFetch(); // ✅ Com debounce
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime conectado para calendário de reclamações (ml_claims)');
        }
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        console.log('🔴 Realtime desconectado para calendário de reclamações');
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [fetchData, debouncedFetch]);

  const refresh = useCallback(() => {
    lastFetchRef.current = 0; // Reset debounce para refresh manual
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh };
};
