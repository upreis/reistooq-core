import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { HistoricoVenda } from '../types/historicoTypes';

export class HistoricoDeleteService {
  static async deleteItem(id: string): Promise<boolean> {
    try {
      console.log('🗑️ Iniciando exclusão do item:', id);
      
      // 🔍 BUSCAR dados do pedido usando RPC segura antes de excluir para reverter estoque
      const { data: vendaDataArray, error: fetchError } = await supabase
        .rpc('get_historico_venda_by_id', { p_id: id });
      
      const vendaData = vendaDataArray?.[0];
      
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

      // 🔄 REVERTER ESTOQUE DOS COMPONENTES NO LOCAL CORRETO
      const vendaDataAny = vendaData as any;
      
      // 🛡️ BUSCAR LOCAL DE ESTOQUE DO PEDIDO ORIGINAL
      const localEstoqueId = vendaDataAny.local_estoque_id;
      const localEstoqueNome = vendaDataAny.local_estoque_nome || vendaDataAny.local_estoque || 'desconhecido';
      
      if (!localEstoqueId) {
        console.error('❌ Local de estoque não encontrado no histórico');
        toast.error('Não foi possível identificar o local de estoque para reverter');
        return false;
      }

      console.log(`🏢 Local de estoque identificado: ${localEstoqueNome} (${localEstoqueId})`);
      
      if (vendaDataAny.sku_estoque) {
        const skuMapeado = vendaDataAny.sku_estoque as string;
        const quantidadePedido = Number(vendaDataAny.quantidade_total || vendaDataAny.quantidade || 0);

        console.log(`🔄 Revertendo estoque para SKU ${skuMapeado}, quantidade: ${quantidadePedido}`);

        // Buscar composição do produto NO LOCAL ESPECÍFICO
        const { data: composicao, error: composicaoError } = await supabase
          .from('produto_componentes')
          .select('sku_componente, quantidade')
          .eq('sku_produto', skuMapeado)
          .eq('local_id', localEstoqueId);

        if (composicaoError) {
          console.error('Erro ao buscar composição:', composicaoError);
        }
        
        // Se tem composição no local, reverter componentes
        if (composicao && composicao.length > 0) {
          console.log(`📋 Composição encontrada com ${composicao.length} componentes no local ${localEstoqueNome}`);

          // Reverter cada componente NO LOCAL ESPECÍFICO
          for (const componente of composicao) {
            const quantidadeReverter = componente.quantidade * quantidadePedido;
            
            console.log(`➕ Revertendo ${quantidadeReverter} unidades do componente ${componente.sku_componente} no local ${localEstoqueNome}`);

            // Buscar produto_id do componente
            const { data: produto, error: produtoError } = await supabase
              .from('produtos')
              .select('id, sku_interno')
              .eq('sku_interno', componente.sku_componente)
              .maybeSingle();

            if (!produtoError && produto) {
              // 🛡️ BUSCAR estoque atual NO LOCAL ESPECÍFICO
              const { data: estoqueLocal, error: estoqueError } = await supabase
                .from('estoque_por_local')
                .select('quantidade, id')
                .eq('produto_id', produto.id)
                .eq('local_id', localEstoqueId)
                .maybeSingle();

              if (estoqueError) {
                console.error(`Erro ao buscar estoque local do componente ${componente.sku_componente}:`, estoqueError);
                continue;
              }

              if (!estoqueLocal) {
                console.warn(`⚠️ Componente ${componente.sku_componente} não tem registro no local ${localEstoqueNome}, criando...`);
                
                // Obter organization_id do supabase auth
                const { data: { user } } = await supabase.auth.getUser();
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('organizacao_id')
                  .eq('id', user?.id)
                  .single();
                
                // Criar registro no local com a quantidade a reverter
                const { error: insertError } = await supabase
                  .from('estoque_por_local')
                  .insert({
                    produto_id: produto.id,
                    local_id: localEstoqueId,
                    organization_id: profile?.organizacao_id || '',
                    quantidade: quantidadeReverter
                  });

                if (insertError) {
                  console.error(`Erro ao criar estoque local:`, insertError);
                } else {
                  console.log(`✅ Estoque criado e revertido: ${componente.sku_componente} - ${quantidadeReverter} unidades no local ${localEstoqueNome}`);
                }
              } else {
                // Atualizar estoque existente no local
                const novaQuantidade = (estoqueLocal.quantidade || 0) + quantidadeReverter;

                const { error: updateError } = await supabase
                  .from('estoque_por_local')
                  .update({ 
                    quantidade: novaQuantidade,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', estoqueLocal.id);

                if (updateError) {
                  console.error(`Erro ao reverter estoque do componente ${componente.sku_componente}:`, updateError);
                } else {
                  console.log(`✅ Estoque revertido: ${componente.sku_componente} - De ${estoqueLocal.quantidade} para ${novaQuantidade} no local ${localEstoqueNome}`);
                }
              }
              
              // 📝 Registrar movimentação (corrigir campos obrigatórios)
              const quantidadeAtual = estoqueLocal?.quantidade || 0;
              await supabase.from('movimentacoes_estoque').insert({
                produto_id: produto.id,
                local_id: localEstoqueId,
                tipo_movimentacao: 'entrada',
                quantidade_anterior: quantidadeAtual,
                quantidade_nova: quantidadeAtual + quantidadeReverter,
                quantidade_movimentada: quantidadeReverter,
                motivo: 'exclusao_historico',
                observacoes: `Reversão de estoque por exclusão do pedido ${vendaDataAny.numero_pedido || vendaDataAny.id_unico} do local ${localEstoqueNome}`
              });
            }
          }
        } else {
          // 🔄 Se NÃO tem composição no local, reverter o produto principal diretamente NO LOCAL
          console.log(`⚠️ Nenhuma composição encontrada para ${skuMapeado} no local ${localEstoqueNome} - Revertendo produto principal`);
          
          const { data: produtoPrincipal, error: produtoError } = await supabase
            .from('produtos')
            .select('id, sku_interno')
            .eq('sku_interno', skuMapeado)
            .maybeSingle();

          if (!produtoError && produtoPrincipal) {
            // 🛡️ BUSCAR estoque atual NO LOCAL ESPECÍFICO
            const { data: estoqueLocal, error: estoqueError } = await supabase
              .from('estoque_por_local')
              .select('quantidade, id')
              .eq('produto_id', produtoPrincipal.id)
              .eq('local_id', localEstoqueId)
              .maybeSingle();

            if (estoqueError) {
              console.error(`Erro ao buscar estoque local do produto ${skuMapeado}:`, estoqueError);
            } else if (!estoqueLocal) {
              console.warn(`⚠️ Produto ${skuMapeado} não tem registro no local ${localEstoqueNome}, criando...`);
              
              // Obter organization_id do supabase auth
              const { data: { user } } = await supabase.auth.getUser();
              const { data: profile } = await supabase
                .from('profiles')
                .select('organizacao_id')
                .eq('id', user?.id)
                .single();
              
              // Criar registro no local com a quantidade a reverter
              const { error: insertError } = await supabase
                .from('estoque_por_local')
                .insert({
                  produto_id: produtoPrincipal.id,
                  local_id: localEstoqueId,
                  organization_id: profile?.organizacao_id || '',
                  quantidade: quantidadePedido
                });

              if (insertError) {
                console.error(`Erro ao criar estoque local:`, insertError);
              } else {
                console.log(`✅ Estoque criado e revertido: ${skuMapeado} - ${quantidadePedido} unidades no local ${localEstoqueNome}`);
              }
            } else {
              // Atualizar estoque existente no local
              const novaQuantidade = (estoqueLocal.quantidade || 0) + quantidadePedido;

              const { error: updateError } = await supabase
                .from('estoque_por_local')
                .update({ 
                  quantidade: novaQuantidade,
                  updated_at: new Date().toISOString()
                })
                .eq('id', estoqueLocal.id);

              if (updateError) {
                console.error(`Erro ao reverter estoque do produto principal ${skuMapeado}:`, updateError);
              } else {
                console.log(`✅ Estoque revertido (produto principal): ${skuMapeado} - De ${estoqueLocal.quantidade} para ${novaQuantidade} no local ${localEstoqueNome}`);
              }
            }
            
            // 📝 Registrar movimentação (corrigir campos obrigatórios)
            const quantidadeAtual = estoqueLocal?.quantidade || 0;
            await supabase.from('movimentacoes_estoque').insert({
              produto_id: produtoPrincipal.id,
              local_id: localEstoqueId,
              tipo_movimentacao: 'entrada',
              quantidade_anterior: quantidadeAtual,
              quantidade_nova: quantidadeAtual + quantidadePedido,
              quantidade_movimentada: quantidadePedido,
              motivo: 'exclusao_historico',
              observacoes: `Reversão de estoque (produto principal) por exclusão do pedido ${vendaDataAny.numero_pedido || vendaDataAny.id_unico} do local ${localEstoqueNome}`
            });
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

      toast.success(`Item excluído e estoque revertido para o local ${localEstoqueNome}`);
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