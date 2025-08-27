import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salvarSnapshotBaixa } from '@/utils/snapshot';
import { Pedido } from '@/types/pedido';
import { useToast } from '@/hooks/use-toast';

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
      // 📸 Processar cada pedido com fotografia completa
      let sucessos = 0;
      for (const pedido of pedidos) {
        try {
          console.log('📸 [linha-pedido]', pedido);
          await salvarSnapshotBaixa(pedido, contextoDaUI);
          sucessos++;
        } catch (error) {
          console.error('❌ Erro ao criar snapshot:', error);
        }
      }
      return sucessos === pedidos.length;
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