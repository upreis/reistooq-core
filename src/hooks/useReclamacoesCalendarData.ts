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
 * ✅ COMBO 2.1: Lê de ml_claims (mesma fonte que /reclamacoes)
 */
export const useReclamacoesCalendarData = () => {
  const [data, setData] = useState<ReclamacaoCalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Buscar últimos 60 dias de ml_claims (reclamações)
      const sixtyDaysAgo = subDays(new Date(), 60).toISOString();
      
      // ✅ COMBO 2.1: Busca de ml_claims (fonte única de dados do CRON)
      const { data: claims, error: fetchError } = await supabase
        .from('ml_claims')
        .select('claim_id, order_id, claim_type, status, date_created, claim_data, last_synced_at')
        .gte('date_created', sixtyDaysAgo)
        .order('date_created', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (!claims || claims.length === 0) {
        console.log('📊 Sem reclamações encontradas em ml_claims (últimos 60 dias)');
        setData([]);
        setLoading(false);
        return;
      }

      console.log('📊 🔄 Carregando dados de reclamações do ml_claims para calendário (COMBO 2.1):', {
        totalClaims: claims.length,
        periodo: '60 dias'
      });

      // Agrupar reclamações por data (criação e prazo de análise)
      const groupedByDate = claims.reduce((acc: Record<string, ReclamacaoCalendarDay>, claim: any) => {
        const claimData = claim.claim_data || {};
        
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
              type: claim.claim_type || claimData.type,
              status: claim.status || claimData.status,
              resource_id: claim.order_id || claimData.resource_id,
              buyer_nickname: claimData.players?.complainant?.nickname || ''
            });
          } catch (e) {
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
                type: claim.claim_type || claimData.type,
                status: claim.status || claimData.status,
                resource_id: claim.order_id || claimData.resource_id,
                buyer_nickname: claimData.players?.complainant?.nickname || ''
              });
            } catch (e) {
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
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'ml_claims'
        },
        (payload) => {
          console.log('🔄 Mudança detectada em ml_claims (reclamações):', payload.eventType);
          fetchData(); // Recarregar dados automaticamente
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
    };
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh };
};
