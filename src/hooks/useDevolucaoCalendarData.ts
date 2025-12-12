import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, subDays } from 'date-fns';
import { RealtimeChannel } from '@supabase/supabase-js';

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

/**
 * Hook para buscar dados de devoluções do calendário
 * ✅ COMBO 2.1: Lê de ml_claims (mesma fonte que /devolucoesdevenda)
 */
export const useDevolucaoCalendarData = () => {
  const [data, setData] = useState<ContributionDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Buscar últimos 60 dias de ml_claims (devoluções/claims)
      const sixtyDaysAgo = subDays(new Date(), 60).toISOString();
      
      // ✅ OTIMIZADO: Busca apenas colunas leves (sem claim_data JSONB pesado)
      const { data: claims, error: fetchError } = await supabase
        .from('ml_claims')
        .select('claim_id, order_id, status, stage, reason_id, date_created, date_closed, product_title, seller_sku')
        .gte('date_created', sixtyDaysAgo)
        .order('date_created', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (!claims || claims.length === 0) {
        console.log('📊 Sem devoluções encontradas em ml_claims (últimos 60 dias)');
        setData([]);
        setLoading(false);
        return;
      }

      console.log('📊 🔄 Carregando dados de devoluções do ml_claims para calendário (COMBO 2.1):', {
        totalClaims: claims.length,
        periodo: '60 dias'
      });

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
              produto_titulo: claim.product_title || 'Produto',
              sku: claim.seller_sku || '',
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
              produto_titulo: claim.product_title || 'Produto',
              sku: claim.seller_sku || ''
            });
          } catch (e) {
            // Ignorar data inválida
          }
        }
        
        return acc;
      }, {});

      const finalData = Object.values(groupedByDate) as ContributionDay[];
      console.log('✅ Dados do calendário de devoluções processados (ml_claims):', {
        total: finalData.length,
        entregas: finalData.filter((d: ContributionDay) => d.returns?.some(r => r.dateType === 'delivery')).length,
        revisoes: finalData.filter((d: ContributionDay) => d.returns?.some(r => r.dateType === 'review')).length
      });
      setData(finalData);
    } catch (err: any) {
      console.error('❌ Erro ao processar dados do calendário de devoluções:', err);
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
    console.log('🔄 Ativando Realtime para calendário de devoluções (ml_claims)...');
    
    const channel = supabase
      .channel('ml-claims-calendar-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'ml_claims'
        },
        (payload) => {
          console.log('🔄 Mudança detectada em ml_claims:', payload.eventType);
          fetchData(); // Recarregar dados automaticamente
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime conectado para calendário de devoluções (ml_claims)');
        }
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        console.log('🔴 Realtime desconectado para calendário de devoluções');
      }
    };
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh };
};
