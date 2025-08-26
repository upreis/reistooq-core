import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SimpleBaixaService } from '@/services/SimpleBaixaService';
import { Pedido } from '@/types/pedido';
import { useToast } from '@/hooks/use-toast';

export function useProcessarBaixaEstoque() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (pedidos: Pedido[]): Promise<boolean> => {
      // Processar cada pedido de forma simples
      let sucessos = 0;
      for (const pedido of pedidos) {
        const sucesso = await SimpleBaixaService.processarBaixaPedido(pedido);
        if (sucesso) sucessos++;
      }
      return sucessos === pedidos.length;
    },
    onSuccess: (allSuccess) => {
      // Invalidar cache relacionado
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ["historico-simple"] });
      queryClient.invalidateQueries({ queryKey: ["historico-stats"] });

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