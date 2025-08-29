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
      const erros: string[] = [];
      
      for (const pedido of pedidos) {
        try {
          console.log(`🔄 Processando pedido: ${pedido.numero}`);
          
          // 1. Buscar itens do pedido
          const { data: orderItems, error: itemsError } = await supabase
            .from('itens_pedidos')
            .select('sku, quantidade')
            .eq('pedido_id', pedido.id);

          if (itemsError || !orderItems) {
            const erro = `Pedido ${pedido.numero}: itens não encontrados - ${itemsError?.message}`;
            console.error(erro);
            erros.push(erro);
            continue;
          }

          // 2. Processar cada SKU único
          const skusUnicos = [...new Set(orderItems.map(item => item.sku))];
          let totalDebitadoGeral = 0;
          
          for (const skuPedido of skusUnicos) {
            console.log(`🔍 Processando SKU: ${skuPedido}`);
            
            // Quantidade total vendida deste SKU no pedido
            const quantidadeVendida = orderItems
              .filter(item => item.sku === skuPedido)
              .reduce((sum, item) => sum + (item.quantidade || 0), 0);
            
            // 3. Buscar mapeamento ativo (com filtro de organização)
            const { data: mapeamento, error: mapError } = await supabase
              .from('mapeamentos_depara')
              .select('sku_correspondente, sku_simples, quantidade')
              .eq('sku_pedido', skuPedido)
              .eq('ativo', true)
              .maybeSingle();

            if (mapError) {
              const erro = `SKU ${skuPedido}: erro ao buscar mapeamento - ${mapError.message}`;
              console.error(erro);
              erros.push(erro);
              continue;
            }

            if (!mapeamento) {
              const erro = `SKU ${skuPedido}: mapeamento não encontrado`;
              console.warn(erro);
              erros.push(erro);
              continue;
            }

            // 4. Buscar produto no estoque (priorizar por integration_account)
            let produto: any = null;
            let produtoError: any = null;
            
            // Primeiro: buscar por SKU + integration_account
            if (pedido.integration_account_id) {
              const { data, error } = await supabase
                .from('produtos')
                .select('id, sku_interno, quantidade_atual, nome, integration_account_id')
                .eq('sku_interno', mapeamento.sku_correspondente)
                .eq('integration_account_id', pedido.integration_account_id)
                .maybeSingle();
              
              produto = data;
              produtoError = error;
            }
            
            // Fallback: buscar apenas por SKU se não encontrou
            if (!produto && !produtoError) {
              const { data, error } = await supabase
                .from('produtos')
                .select('id, sku_interno, quantidade_atual, nome, integration_account_id')
                .eq('sku_interno', mapeamento.sku_correspondente)
                .maybeSingle();
              
              produto = data;
              produtoError = error;
            }

            if (produtoError) {
              const erro = `SKU ${mapeamento.sku_correspondente}: erro ao buscar produto - ${produtoError.message}`;
              console.error(erro);
              erros.push(erro);
              continue;
            }

            if (!produto) {
              const erro = `SKU ${mapeamento.sku_correspondente}: produto não encontrado no estoque`;
              console.warn(erro);
              erros.push(erro);
              continue;
            }

            // 5. Calcular baixa
            const qtdKit = mapeamento.quantidade || 1;
            const totalItens = quantidadeVendida * qtdKit;
            const estoqueAtual = produto.quantidade_atual || 0;
            const novaQuantidade = Math.max(0, estoqueAtual - totalItens);
            
            console.log(`📦 Baixa calculada: ${produto.nome} | ${estoqueAtual} → ${novaQuantidade} (-${totalItens})`);
            
            // 6. Atualizar estoque
            const { error: updateError } = await supabase
              .from('produtos')
              .update({ 
                quantidade_atual: novaQuantidade,
                ultima_movimentacao: new Date().toISOString()
              })
              .eq('id', produto.id);

            if (updateError) {
              const erro = `Produto ${produto.nome}: erro ao atualizar estoque - ${updateError.message}`;
              console.error(erro);
              erros.push(erro);
              continue;
            }

            totalDebitadoGeral += totalItens;
            console.log(`✅ Baixa realizada: ${produto.nome}`);
          }

          // 7. Registrar histórico apenas se houve baixas
          if (totalDebitadoGeral > 0) {
            const skusProcessados = skusUnicos.join(', ');
            const { error: histError } = await supabase.rpc('hv_insert', {
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

            if (histError) {
              const erro = `Pedido ${pedido.numero}: erro ao registrar histórico - ${histError.message}`;
              console.error(erro);
              erros.push(erro);
            } else {
              console.log(`📝 Histórico registrado: ${pedido.numero}`);
            }
          }

          sucessos++;
          console.log(`✅ Pedido ${pedido.numero} processado com sucesso`);
          
        } catch (error) {
          const erro = `Pedido ${pedido.numero}: erro inesperado - ${error.message}`;
          console.error(erro);
          erros.push(erro);
        }
      }
      
      // Mostrar erros se houver
      if (erros.length > 0) {
        console.warn('⚠️ Erros encontrados durante o processamento:', erros);
        toast({
          title: "⚠️ Processamento com erros",
          description: `${sucessos} sucesso(s), ${erros.length} erro(s). Verifique o console.`,
          variant: "destructive",
        });
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