import { supabase } from '@/integrations/supabase/client';

export interface ItemRecebimento {
  produto_id: string;
  quantidade: number;
  valor_unitario: number;
  lote?: string;
  data_validade?: string;
  observacoes?: string;
}

export class ComprasEstoqueIntegration {
  
  /**
   * Processa o recebimento de um pedido de compra e atualiza o estoque
   */
  static async processarRecebimentoPedido(
    pedidoId: string, 
    itens: ItemRecebimento[]
  ): Promise<{ success: boolean; message: string; detalhes?: any }> {
    try {
      console.log('🏭 [ComprasEstoqueIntegration] Iniciando processamento:', { pedidoId, itens });
      // Validar se o pedido existe e está no status correto
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos_compra' as any)
        .select('*')
        .eq('id', pedidoId)
        .maybeSingle();

      if (pedidoError) {
        console.error('Erro ao buscar pedido:', pedidoError);
        return {
          success: false,
          message: 'Erro ao verificar pedido'
        };
      }

      if (!pedido) {
        return {
          success: false,
          message: 'Pedido não encontrado'
        };
      }

      const pedidoStatus = (pedido as any).status;
      console.log('📋 [ComprasEstoqueIntegration] Status do pedido:', pedidoStatus);
      
      if (!['aprovado', 'em_andamento', 'concluido', 'concluido_recebido'].includes(pedidoStatus)) {
        console.log('❌ [ComprasEstoqueIntegration] Status inválido para recebimento:', pedidoStatus);
        return {
          success: false,
          message: `Pedido não está em status válido para recebimento. Status atual: ${pedidoStatus}`
        };
      }

      // Processar cada item
      const resultados = [];
      
      for (const item of itens) {
        try {
          // Buscar produto atual
          const { data: produto, error: produtoError } = await supabase
            .from('produtos')
            .select('*')
            .eq('id', item.produto_id)
            .maybeSingle();

          if (produtoError) {
            console.error('Erro ao buscar produto:', produtoError);
            resultados.push({
              produto_id: item.produto_id,
              success: false,
              erro: 'Erro ao buscar produto'
            });
            continue;
          }

          if (!produto) {
            resultados.push({
              produto_id: item.produto_id,
              success: false,
              erro: 'Produto não encontrado'
            });
            continue;
          }

          // Registrar movimentação de compra
          const { error: movimentacaoError } = await supabase
            .from('compras_movimentacoes_estoque' as any)
            .insert({
              pedido_compra_id: pedidoId,
              produto_id: item.produto_id,
              quantidade: item.quantidade,
              valor_unitario: item.valor_unitario,
              lote: item.lote,
              data_validade: item.data_validade,
              observacoes: item.observacoes
            });

          if (movimentacaoError) {
            console.error('Erro ao registrar movimentação:', movimentacaoError);
            resultados.push({
              produto_id: item.produto_id,
              success: false,
              erro: 'Erro ao registrar movimentação'
            });
            continue;
          }

          // Calcular novo valor de custo médio
          const quantidadeAtual = produto.quantidade_atual || 0;
          const valorCustoAtual = produto.preco_custo || 0;
          const novaQuantidade = quantidadeAtual + item.quantidade;
          
          console.log(`📊 [ComprasEstoqueIntegration] Produto ${produto.sku_interno}:`, {
            quantidadeAtual,
            quantidadeEntrada: item.quantidade,
            novaQuantidade
          });
          
          let novoValorCustoMedio = item.valor_unitario;
          if (quantidadeAtual > 0) {
            novoValorCustoMedio = (
              (quantidadeAtual * valorCustoAtual) + 
              (item.quantidade * item.valor_unitario)
            ) / novaQuantidade;
          }

          // Atualizar estoque do produto
          const { error: updateError } = await supabase
            .from('produtos')
            .update({
              quantidade_atual: novaQuantidade,
              preco_custo: novoValorCustoMedio,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.produto_id);
            
          console.log(`💾 [ComprasEstoqueIntegration] Atualização do produto ${produto.sku_interno}:`, 
            updateError ? 'ERRO' : 'SUCESSO', updateError);

          if (updateError) {
            console.error('Erro ao atualizar estoque:', updateError);
            resultados.push({
              produto_id: item.produto_id,
              success: false,
              erro: 'Erro ao atualizar estoque'
            });
            continue;
          }

          // Registrar no histórico de movimentações do estoque
          const { error: historicoError } = await supabase
            .from('movimentacoes_estoque')
            .insert({
              produto_id: item.produto_id,
              tipo_movimentacao: 'entrada',
              quantidade_anterior: quantidadeAtual,
              quantidade_nova: novaQuantidade,
              quantidade_movimentada: item.quantidade,
              motivo: `Recebimento de pedido de compra: ${(pedido as any).numero_pedido || 'N/A'}`,
              observacoes: 'Integração automática do sistema de compras'
            });

          if (historicoError) {
            console.warn('Erro ao registrar histórico:', historicoError);
          }

          resultados.push({
            produto_id: item.produto_id,
            success: true,
            quantidade_anterior: quantidadeAtual,
            quantidade_nova: novaQuantidade
          });

        } catch (error: any) {
          console.error('Erro ao processar item:', error);
          resultados.push({
            produto_id: item.produto_id,
            success: false,
            erro: error.message || 'Erro desconhecido'
          });
        }
      }

      // Verificar se todos os itens foram processados com sucesso
      const sucessos = resultados.filter(r => r.success).length;
      const erros = resultados.filter(r => !r.success);

      // Atualizar status do pedido se todos os itens foram processados
      if (erros.length === 0) {
        await supabase
          .from('pedidos_compra' as any)
          .update({
            status: 'concluido',
            updated_at: new Date().toISOString()
          })
          .eq('id', pedidoId);
      }

      return {
        success: erros.length === 0,
        message: `${sucessos} produtos processados com sucesso${erros.length > 0 ? `, ${erros.length} com erro` : ''}`,
        detalhes: {
          sucessos,
          erros: erros.length,
          resultados
        }
      };

    } catch (error: any) {
      console.error('Erro no processamento do recebimento:', error);
      return {
        success: false,
        message: 'Erro interno no processamento'
      };
    }
  }

  /**
   * Busca produtos que precisam de reposição para sugerir compras
   */
  static async buscarProdutosParaReposicao(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .filter('quantidade_atual', 'lte', 'estoque_minimo')
        .eq('ativo', true)
        .order('quantidade_atual', { ascending: true });

      if (error) {
        console.error('Erro ao buscar produtos para reposição:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar produtos para reposição:', error);
      return [];
    }
  }

  /**
   * Gera sugestão de pedido de compra baseado no estoque mínimo
   */
  static async gerarSugestaoPedidoCompra(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .filter('quantidade_atual', 'lte', 'estoque_minimo')
        .eq('ativo', true)
        .order('quantidade_atual', { ascending: true });

      if (error) {
        console.error('Erro ao gerar sugestão de pedido:', error);
        return [];
      }

      // Processar dados para sugestão
      const sugestoes = (data || []).map(produto => {
        const quantidadeParaComprar = Math.max(
          (produto.estoque_maximo || produto.quantidade_atual * 3) - produto.quantidade_atual,
          (produto.estoque_minimo || 10) * 2 // Pelo menos o dobro do estoque mínimo
        );

        const valorUnitarioSugerido = produto.preco_custo || 0;

        return {
          produto_id: produto.id,
          produto_nome: produto.nome,
          quantidade_atual: produto.quantidade_atual,
          estoque_minimo: produto.estoque_minimo,
          estoque_maximo: produto.estoque_maximo,
          quantidade_sugerida: quantidadeParaComprar,
          valor_unitario_sugerido: valorUnitarioSugerido,
          valor_total_sugerido: quantidadeParaComprar * valorUnitarioSugerido
        };
      });

      return sugestoes;
    } catch (error) {
      console.error('Erro ao gerar sugestão de pedido:', error);
      return [];
    }
  }

  /**
   * Extorna o recebimento de um pedido de compra e reverte o estoque
   */
  static async extornarRecebimentoPedido(
    pedidoId: string
  ): Promise<{ success: boolean; message: string; detalhes?: any }> {
    try {
      console.log('🔄 [ComprasEstoqueIntegration] Iniciando extorno do pedido:', pedidoId);

      // Buscar as movimentações de compra deste pedido
      const { data: movimentacoes, error: movError } = await supabase
        .from('compras_movimentacoes_estoque' as any)
        .select('*')
        .eq('pedido_compra_id', pedidoId);

      if (movError) {
        console.error('Erro ao buscar movimentações:', movError);
        return {
          success: false,
          message: 'Erro ao buscar movimentações do pedido'
        };
      }

      if (!movimentacoes || movimentacoes.length === 0) {
        return {
          success: false,
          message: 'Nenhuma movimentação encontrada para extornar'
        };
      }

      console.log('📋 [ComprasEstoqueIntegration] Movimentações encontradas:', movimentacoes.length);

      const resultados = [];

      for (const movimentacao of (movimentacoes as any[])) {
        try {
          // Buscar produto atual
          const { data: produto, error: produtoError } = await supabase
            .from('produtos')
            .select('*')
            .eq('id', movimentacao.produto_id)
            .maybeSingle();

          if (produtoError || !produto) {
            console.error('Erro ao buscar produto para extorno:', produtoError);
            resultados.push({
              produto_id: movimentacao.produto_id,
              success: false,
              erro: 'Produto não encontrado'
            });
            continue;
          }

          const quantidadeAtual = produto.quantidade_atual || 0;
          const quantidadeExtorno = movimentacao.quantidade || 0;
          const novaQuantidade = quantidadeAtual - quantidadeExtorno;

          // Verificar se há estoque suficiente para extornar
          if (novaQuantidade < 0) {
            resultados.push({
              produto_id: movimentacao.produto_id,
              sku: produto.sku_interno,
              success: false,
              erro: `Estoque insuficiente para extorno. Atual: ${quantidadeAtual}, Tentativa extorno: ${quantidadeExtorno}`
            });
            continue;
          }

          console.log(`📊 [ComprasEstoqueIntegration] Extornando produto ${produto.sku_interno}:`, {
            quantidadeAtual,
            quantidadeExtorno,
            novaQuantidade
          });

          // Atualizar estoque do produto
          const { error: updateError } = await supabase
            .from('produtos')
            .update({
              quantidade_atual: novaQuantidade,
              updated_at: new Date().toISOString()
            })
            .eq('id', movimentacao.produto_id);

          if (updateError) {
            console.error('Erro ao extornar estoque:', updateError);
            resultados.push({
              produto_id: movimentacao.produto_id,
              sku: produto.sku_interno,
              success: false,
              erro: 'Erro ao atualizar estoque'
            });
            continue;
          }

          // Registrar movimentação de extorno
          const { error: historicoError } = await supabase
            .from('movimentacoes_estoque')
            .insert({
              produto_id: movimentacao.produto_id,
              tipo_movimentacao: 'saida',
              quantidade_anterior: quantidadeAtual,
              quantidade_nova: novaQuantidade,
              quantidade_movimentada: quantidadeExtorno,
              motivo: 'extorno_pedido_compra',
              observacoes: `Extorno do pedido de compra - Referência: ${pedidoId}`
            });

          if (historicoError) {
            console.error('Erro ao registrar histórico de extorno:', historicoError);
          }

          resultados.push({
            produto_id: movimentacao.produto_id,
            sku: produto.sku_interno,
            success: true,
            quantidade_extornada: quantidadeExtorno
          });

        } catch (error) {
          console.error('Erro ao processar extorno do produto:', error);
          resultados.push({
            produto_id: movimentacao.produto_id,
            success: false,
            erro: 'Erro interno no processamento'
          });
        }
      }

      // Remover registros de movimentação de compra após extorno bem-sucedido
      const sucessos = resultados.filter(r => r.success);
      if (sucessos.length > 0) {
        const { error: deleteError } = await supabase
          .from('compras_movimentacoes_estoque' as any)
          .delete()
          .eq('pedido_compra_id', pedidoId);

        if (deleteError) {
          console.error('Erro ao remover movimentações de compra:', deleteError);
        }
      }

      const totalProcessados = resultados.length;
      const totalSucesso = sucessos.length;
      const totalErros = totalProcessados - totalSucesso;

      if (totalSucesso === 0) {
        return {
          success: false,
          message: 'Nenhum item pôde ser extornado do estoque',
          detalhes: resultados
        };
      }

      return {
        success: true,
        message: `Extorno concluído: ${totalSucesso} item(s) extornado(s)${totalErros > 0 ? `, ${totalErros} erro(s)` : ''}`,
        detalhes: resultados
      };

    } catch (error) {
      console.error('Erro geral no extorno:', error);
      return {
        success: false,
        message: 'Erro interno no processo de extorno'
      };
    }
  }

  /**
   * Obter histórico de compras de um produto
   */
  static async obterHistoricoComprasProduto(produtoId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('compras_movimentacoes_estoque' as any)
        .select('*')
        .eq('produto_id', produtoId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao obter histórico de compras:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Erro ao obter histórico de compras:', error);
      return [];
    }
  }
}