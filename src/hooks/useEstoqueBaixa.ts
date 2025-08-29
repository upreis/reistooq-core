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
        // Extrair SKU KIT + Total de Itens dos pedidos
        const baixas = pedidos.map(pedido => {
          // Pegar sku_kit e total_itens do pedido
          const sku = pedido.sku_kit || '';
          const quantidade = Number(pedido.total_itens || 0);
          
          return {
            sku: sku.trim(),
            quantidade: quantidade
          };
        }).filter(baixa => baixa.sku && baixa.quantidade > 0);

        if (baixas.length === 0) {
          throw new Error('Nenhum pedido válido para baixa (SKU KIT e Total de Itens são obrigatórios)');
        }

        // Chamar função SQL direta para baixa de estoque
        const { data, error } = await supabase.rpc('baixar_estoque_direto', {
          p_baixas: baixas
        });

        if (error) throw error;

        const result = data as any;
        
        // Registrar histórico para pedidos com baixa bem-sucedida (mantém fluxo original)
        if (result.success && contextoDaUI) {
          // Salvar snapshots apenas para histórico (não afeta estoque)
          for (const pedido of pedidos) {
            try {
              await salvarSnapshotBaixa(pedido, contextoDaUI);
            } catch (e) {
              console.warn('Erro ao salvar histórico:', e);
            }
          }
        }

        return result.success;
      } catch (err) {
        console.error('Erro na baixa de estoque:', err);
        throw err;
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