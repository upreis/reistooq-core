import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { HistoricoVenda } from '../types/historicoTypes';

export class HistoricoDeleteService {
  static async deleteItem(id: string): Promise<boolean> {
    try {
      console.log('🗑️ Iniciando exclusão do item:', id);
      
      // 🔍 BUSCAR dados do pedido diretamente pelo ID antes de excluir para reverter estoque
      const { data: vendaData, error: fetchError } = await supabase
        .from('historico_vendas')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (fetchError) {
        console.error('❌ Erro ao buscar dados da venda:', fetchError);
        toast.error('Erro ao buscar dados do pedido para reversão de estoque');
        return false;
      }

      if (!vendaData) {
        console.error('❌ Venda não encontrada no histórico para o ID:', id);
        toast.error('Pedido não encontrado');
        return false;
      }

      console.log('📦 Dados da venda a reverter:', vendaData);

      // 🔄 REVERTER ESTOQUE DOS COMPONENTES
      const vendaDataAny = vendaData as any; // Cast para evitar erros de tipo
      
      if (vendaDataAny.sku_estoque) {
        const skuMapeado = vendaDataAny.sku_estoque as string;
        const quantidadePedido = Number(vendaDataAny.quantidade_total || vendaDataAny.quantidade || 0);

        console.log(`🔄 Revertendo estoque para SKU ${skuMapeado}, quantidade: ${quantidadePedido}`);

        // Buscar composição do produto
        const { data: composicao, error: composicaoError } = await supabase
          .from('produto_componentes')
          .select('sku_componente, quantidade')
          .eq('sku_produto', skuMapeado);

        if (composicaoError) {
          console.error('Erro ao buscar composição:', composicaoError);
        }
        
        // Se tem composição, reverter componentes
        if (composicao && composicao.length > 0) {
          console.log(`📋 Composição encontrada com ${composicao.length} componentes`);

          // Reverter cada componente
          for (const componente of composicao) {
            const quantidadeReverter = componente.quantidade * quantidadePedido;
            
            console.log(`➕ Revertendo ${quantidadeReverter} unidades do componente ${componente.sku_componente}`);

            // Atualizar estoque do componente
            const { data: produto, error: produtoError } = await supabase
              .from('produtos')
              .select('id, quantidade_atual, sku_interno')
              .eq('sku_interno', componente.sku_componente)
              .maybeSingle();

            if (!produtoError && produto) {
              const novaQuantidade = (produto.quantidade_atual || 0) + quantidadeReverter;

              const { error: updateError } = await supabase
                .from('produtos')
                .update({ 
                  quantidade_atual: novaQuantidade,
                  updated_at: new Date().toISOString()
                })
                .eq('id', produto.id);

              if (updateError) {
                console.error(`Erro ao reverter estoque do componente ${componente.sku_componente}:`, updateError);
              } else {
                console.log(`✅ Estoque revertido: ${componente.sku_componente} - De ${produto.quantidade_atual} para ${novaQuantidade}`);
                
                // Registrar movimentação
                await supabase.from('movimentacoes_estoque').insert({
                  produto_id: produto.id,
                  tipo_movimentacao: 'entrada',
                  quantidade_anterior: produto.quantidade_atual,
                  quantidade_nova: novaQuantidade,
                  quantidade_movimentada: quantidadeReverter,
                  motivo: 'exclusao_historico',
                  observacoes: `Reversão de estoque por exclusão do pedido ${vendaDataAny.numero_pedido || vendaDataAny.id_unico}`
                });
              }
            }
          }
        } else {
          // 🔄 Se NÃO tem composição, reverter o produto principal diretamente
          console.log(`⚠️ Nenhuma composição encontrada para ${skuMapeado} - Revertendo produto principal`);
          
          const { data: produtoPrincipal, error: produtoError } = await supabase
            .from('produtos')
            .select('id, quantidade_atual, sku_interno')
            .eq('sku_interno', skuMapeado)
            .maybeSingle();

          if (!produtoError && produtoPrincipal) {
            const novaQuantidade = (produtoPrincipal.quantidade_atual || 0) + quantidadePedido;

            const { error: updateError } = await supabase
              .from('produtos')
              .update({ 
                quantidade_atual: novaQuantidade,
                updated_at: new Date().toISOString()
              })
              .eq('id', produtoPrincipal.id);

            if (updateError) {
              console.error(`Erro ao reverter estoque do produto principal ${skuMapeado}:`, updateError);
            } else {
              console.log(`✅ Estoque revertido (produto principal): ${skuMapeado} - De ${produtoPrincipal.quantidade_atual} para ${novaQuantidade}`);
              
              // Registrar movimentação
              await supabase.from('movimentacoes_estoque').insert({
                produto_id: produtoPrincipal.id,
                tipo_movimentacao: 'entrada',
                quantidade_anterior: produtoPrincipal.quantidade_atual,
                quantidade_nova: novaQuantidade,
                quantidade_movimentada: quantidadePedido,
                motivo: 'exclusao_historico',
                observacoes: `Reversão de estoque (produto principal) por exclusão do pedido ${vendaDataAny.numero_pedido || vendaDataAny.id_unico}`
              });
            }
          } else {
            console.error(`❌ Produto principal ${skuMapeado} não encontrado no estoque`);
          }
        }
      }
      
      // ❌ EXCLUIR registro do histórico
      const { error } = await supabase.rpc('hv_delete', { _id: id });
      
      if (error) {
        console.error('Erro ao excluir item do histórico:', error);
        toast.error('Erro ao excluir item', {
          description: error.message || 'Erro desconhecido'
        });
        return false;
      }

      toast.success('Item excluído e estoque revertido com sucesso');
      return true;
    } catch (error) {
      console.error('Erro inesperado ao excluir:', error);
      toast.error('Erro inesperado ao excluir item');
      return false;
    }
  }

  static async deleteMultiple(ids: string[]): Promise<boolean> {
    try {
      // 🔄 REVERTER ESTOQUE de todos os itens antes de excluir
      for (const id of ids) {
        // Buscar dados e reverter estoque individualmente
        const deleted = await this.deleteItem(id);
        if (!deleted) {
          toast.error(`Erro ao excluir item ${id}`);
          return false;
        }
      }

      toast.success(`${ids.length} itens excluídos e estoque revertido com sucesso`);
      return true;
    } catch (error) {
      console.error('Erro inesperado ao excluir itens:', error);
      toast.error('Erro inesperado ao excluir itens');
      return false;
    }
  }
}