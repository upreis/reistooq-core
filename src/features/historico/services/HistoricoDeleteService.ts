import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export class HistoricoDeleteService {
  static async deleteItem(id: string): Promise<boolean> {
    try {
      // 🔍 BUSCAR dados do pedido antes de excluir para reverter estoque
      const { data: vendaData, error: fetchError } = await supabase
        .from('historico_vendas')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError || !vendaData) {
        console.error('Erro ao buscar dados da venda:', fetchError);
        toast.error('Erro ao buscar dados do pedido');
        return false;
      }

      console.log('📦 Dados da venda a reverter:', vendaData);

      // 🔄 REVERTER ESTOQUE DOS COMPONENTES
      if (vendaData.sku_estoque) {
        const skuMapeado = vendaData.sku_estoque;
        const quantidadePedido = Number(vendaData.quantidade_total || vendaData.quantidade || 0);

        console.log(`🔄 Revertendo estoque para SKU ${skuMapeado}, quantidade: ${quantidadePedido}`);

        // Buscar composição do produto
        const { data: composicao, error: composicaoError } = await supabase
          .from('produto_componentes')
          .select('sku_componente, quantidade')
          .eq('sku_produto', skuMapeado);

        if (composicaoError) {
          console.error('Erro ao buscar composição:', composicaoError);
        } else if (composicao && composicao.length > 0) {
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
              .single();

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
                  observacoes: `Reversão de estoque por exclusão do pedido ${vendaData.numero_pedido || vendaData.id_unico}`
                });
              }
            }
          }
        } else {
          console.warn(`⚠️ Nenhuma composição encontrada para ${skuMapeado}`);
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
      // Usar a função RPC segura para excluir múltiplos
      const { error } = await supabase.rpc('hv_delete_many', { _ids: ids });
      
      if (error) {
        console.error('Erro ao excluir itens do histórico:', error);
        toast.error('Erro ao excluir itens', {
          description: error.message || 'Erro desconhecido'
        });
        return false;
      }

      toast.success(`${ids.length} itens excluídos com sucesso`);
      return true;
    } catch (error) {
      console.error('Erro inesperado ao excluir itens:', error);
      toast.error('Erro inesperado ao excluir itens');
      return false;
    }
  }
}