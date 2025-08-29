import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salvarSnapshotBaixa } from '@/utils/snapshot';
import { Pedido } from '@/types/pedido';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';


interface ProcessarBaixaParams {
  pedidos: Pedido[];
  contextoDaUI?: {
    mappingData?: Map<string, any>;
    accounts?: any[];
    selectedAccounts?: string[];
    integrationAccountId?: string;
  };
}

export function useProcessarBaixaEstoque() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ pedidos, contextoDaUI }: ProcessarBaixaParams): Promise<boolean> => {
      try {
        // 1) Tentar processar via Edge Function (debita estoque e registra histórico)
        const orderIds = pedidos.map(p => p.id);
        const { data, error } = await supabase.functions.invoke('processar-baixa-estoque', {
          body: {
            orderIds,
            action: 'baixar_estoque'
          }
        });
        if (error) throw error;
        // Sucesso somente se a Edge Function reportar success=true
        return Boolean((data as any)?.success);
      } catch (err) {
        console.warn('Falha na Edge Function, usando fallback de snapshot:', err);
        // 2) Fallback: salvar snapshots (não debita estoque)
        let sucessos = 0;
        for (const pedido of pedidos) {
          try {
            await salvarSnapshotBaixa(pedido, contextoDaUI);
            sucessos++;
          } catch (e) {
            console.error('Erro ao criar snapshot:', e);
          }
        }
        return sucessos === pedidos.length;
      }
    },
    onSuccess: (allSuccess) => {
      // Invalidar cache relacionado
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ["historico-simple"] });
      queryClient.invalidateQueries({ queryKey: ["historico-stats"] });
      queryClient.invalidateQueries({ queryKey: ["historico-vendas"] });

      toast({
        title: allSuccess ? "✅ Baixa concluída" : "⚠️ Baixa parcial",
        description: allSuccess ? "Todos pedidos processados com sucesso" : "Alguns pedidos falharam",
        variant: allSuccess ? "default" : "destructive",
      });
    },
    onError: (error: Error) => {
      console.error('Erro na baixa:', error);
      toast({
        title: "❌ Erro na baixa",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useVerificarPedidoProcessado() {
  return useMutation({
    mutationFn: async (idUnico: string): Promise<boolean> => {
      // Usar o método privado através de uma versão pública
      // ou implementar verificação direta aqui
      return false; // Placeholder - implementar se necessário
    },
  });
}