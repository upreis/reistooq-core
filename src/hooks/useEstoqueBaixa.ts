import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EstoqueBaixaService, BaixaEstoqueResult } from '@/services/EstoqueBaixaService';
import { Pedido } from '@/types/pedido';
import { useToast } from '@/hooks/use-toast';

export function useProcessarBaixaEstoque() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (pedidos: Pedido[]): Promise<BaixaEstoqueResult> => {
      return EstoqueBaixaService.processarBaixaPedidos(pedidos);
    },
    onSuccess: (result) => {
      // Invalidar cache relacionado
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ["historico-simple"] });
      queryClient.invalidateQueries({ queryKey: ["historico-stats"] });
      queryClient.invalidateQueries({ queryKey: ['sku-mappings'] });

      // Toast de feedback
      if (result.success) {
        toast({
          title: "Baixa de estoque concluída",
          description: result.message,
          variant: "default",
        });
      } else {
        toast({
          title: "Baixa parcialmente concluída",
          description: `${result.message}. Verifique os detalhes.`,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      console.error('Erro na baixa de estoque:', error);
      toast({
        title: "Erro na baixa de estoque",
        description: error.message || "Erro inesperado ao processar baixa",
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