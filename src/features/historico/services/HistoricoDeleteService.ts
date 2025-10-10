import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { HistoricoVenda } from '../types/historicoTypes';

export class HistoricoDeleteService {
  static async deleteItem(id: string): Promise<boolean> {
    try {
      // 🔍 BUSCAR dados do pedido antes de excluir para reverter estoque
      // 🛡️ Usar get_historico_vendas_masked para buscar dados com RLS
      const hoje = new Date();
      const umAnoAtras = new Date(hoje.getTime() - 365 * 24 * 60 * 60 * 1000);
      
      // @ts-ignore - RPC função não está nos tipos gerados ainda
      const { data: historicoData, error: fetchError } = await supabase.rpc('get_historico_vendas_masked', {
        p_start: umAnoAtras.toISOString().split('T')[0],
        p_end: hoje.toISOString().split('T')[0],
        p_search: null,
        p_limit: 9999,
        p_offset: 0
      });
      
      if (fetchError || !historicoData || !Array.isArray(historicoData)) {
        console.error('Erro ao buscar dados da venda:', fetchError);
        toast.error('Erro ao buscar dados do pedido para reversão de estoque');
        return false;
      }

      // Encontrar o registro específico
      const vendaData = historicoData.find((item: any) => item.id === id);
      
      if (!vendaData) {
        console.error('Venda não encontrada no histórico');
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