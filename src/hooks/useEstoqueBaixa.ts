import { useMutation, useQueryClient } from '@tanstack/react-query';
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
    mutationFn: async ({ pedidos }: ProcessarBaixaParams): Promise<boolean> => {
      let sucessos = 0;
      
      for (const pedido of pedidos) {
        try {
          // 1. Buscar itens do pedido
          const { data: orderItems, error: itemsError } = await supabase
            .from('itens_pedidos')
            .select('sku, quantidade')
            .eq('pedido_id', pedido.id);

          if (itemsError || !orderItems) {
            console.error(`Erro ao buscar itens do pedido ${pedido.id}:`, itemsError);
            continue;
          }

          // 2. Processar cada SKU único
          const skusUnicos = [...new Set(orderItems.map(item => item.sku))];
          let totalDebitadoGeral = 0;
          
          for (const skuPedido of skusUnicos) {
            // Quantidade total vendida deste SKU no pedido
            const quantidadeVendida = orderItems
              .filter(item => item.sku === skuPedido)
              .reduce((sum, item) => sum + (item.quantidade || 0), 0);
            
            // 3. Buscar mapeamento ativo
            const { data: mapeamento } = await supabase
              .from('mapeamentos_depara')
              .select('sku_correspondente, sku_simples, quantidade')
              .eq('sku_pedido', skuPedido)
              .eq('ativo', true)
              .maybeSingle();

            if (!mapeamento) {
              console.warn(`Mapeamento não encontrado para SKU ${skuPedido}`);
              continue;
            }

            // 4. Buscar produto no estoque
            const { data: produto } = await supabase
              .from('produtos')
              .select('id, sku_interno, quantidade_atual, nome')
              .eq('sku_interno', mapeamento.sku_correspondente)
              .maybeSingle();

            if (!produto) {
              console.warn(`Produto não encontrado para SKU ${mapeamento.sku_correspondente}`);
              continue;
            }

            // 5. Calcular baixa
            const qtdKit = mapeamento.quantidade || 1;
            const totalItens = quantidadeVendida * qtdKit;
            const novaQuantidade = Math.max(0, (produto.quantidade_atual || 0) - totalItens);
            
            // 6. Atualizar estoque
            const { error: updateError } = await supabase
              .from('produtos')
              .update({ 
                quantidade_atual: novaQuantidade,
                ultima_movimentacao: new Date().toISOString()
              })
              .eq('id', produto.id);

            if (updateError) {
              console.error(`Erro ao atualizar produto ${produto.id}:`, updateError);
            } else {
              totalDebitadoGeral += totalItens;
              console.log(`✅ Baixa: ${produto.nome} (${produto.quantidade_atual} → ${novaQuantidade})`);
            }
          }

          // 7. Registrar histórico
          const skusProcessados = skusUnicos.join(', ');
          await supabase.rpc('hv_insert', {
            p: {
              id_unico: String(pedido.id),
              numero_pedido: pedido.numero || String(pedido.id),
              sku_produto: skusProcessados,
              descricao: `Baixa automática: ${skusProcessados}`,
              quantidade: totalDebitadoGeral,
              valor_unitario: 0,
              valor_total: 0,
              status: 'baixado',
              data_pedido: pedido.data_pedido || new Date().toISOString().slice(0,10),
              observacoes: `Total de itens debitados: ${totalDebitadoGeral}`,
              integration_account_id: pedido.integration_account_id,
            }
          });

          sucessos++;
        } catch (error) {
          console.error(`Erro ao processar pedido ${pedido.id}:`, error);
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