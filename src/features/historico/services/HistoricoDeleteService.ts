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

      // 🔄 REVERTER ESTOQUE DOS COMPONENTES E INSUMOS NO LOCAL CORRETO
      const vendaDataAny = vendaData as any;
      
      // 🛡️ BUSCAR LOCAL DE ESTOQUE DO PEDIDO ORIGINAL
      const localEstoqueId = vendaDataAny.local_estoque_id;
      const localEstoqueNome = vendaDataAny.local_estoque_nome || vendaDataAny.local_estoque || 'desconhecido';
      
      if (!localEstoqueId) {
        console.warn('⚠️ Local de estoque não encontrado no histórico - reversão de estoque pode não funcionar corretamente');
        // Não bloquear a exclusão, mas avisar o usuário
      }

      // 🛡️ BUSCAR organization_id UMA VEZ para reutilizar
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ Usuário não autenticado');
        toast.error('Você precisa estar autenticado para excluir registros');
        return false;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('organizacao_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organizacao_id) {
        console.error('❌ Organization ID não encontrado');
        toast.error('Erro ao identificar organização');
        return false;
      }

      const organizationId = profile.organizacao_id;
      console.log(`🏢 Local de estoque identificado: ${localEstoqueNome} (${localEstoqueId || 'não informado'})`);
      
      // 📝 LISTA DE REVERSÕES para rollback em caso de erro
      const reversoesRealizadas: Array<{tipo: 'produto' | 'insumo', produtoId: string, localId: string, quantidadeRevertida: number}> = [];

      try {
        if (vendaDataAny.sku_estoque) {
          const skuMapeado = vendaDataAny.sku_estoque as string;
          const quantidadePedido = Number(vendaDataAny.quantidade_total || vendaDataAny.quantidade || 0);

          if (quantidadePedido <= 0) {
            console.warn('⚠️ Quantidade do pedido é zero ou inválida, pulando reversão de estoque');
          } else {
            console.log(`🔄 Revertendo estoque para SKU ${skuMapeado}, quantidade: ${quantidadePedido}`);

            // 🔍 VERIFICAR SE É COMPOSIÇÃO DE PRODUTOS OU INSUMOS
            if (localEstoqueId) {
              // Buscar composição do produto NO LOCAL ESPECÍFICO
              const { data: composicao, error: composicaoError } = await supabase
                .from('produto_componentes')
                .select('sku_componente, quantidade')
                .eq('sku_produto', skuMapeado)
                .eq('local_id', localEstoqueId);

              // Buscar composição de insumos NO LOCAL ESPECÍFICO
              const { data: composicaoInsumos, error: insumosError } = await supabase
                .from('composicoes_insumos')
                .select('sku_insumo, quantidade')
                .eq('sku_produto', skuMapeado)
                .eq('local_id', localEstoqueId);

              if (composicaoError) {
                console.error('Erro ao buscar composição de produtos:', composicaoError);
              }

              if (insumosError) {
                console.error('Erro ao buscar composição de insumos:', insumosError);
              }
              
              // 🔧 REVERTER COMPOSIÇÃO DE PRODUTOS
              if (composicao && composicao.length > 0) {
                console.log(`📋 Composição de produtos encontrada com ${composicao.length} componentes no local ${localEstoqueNome}`);

                for (const componente of composicao) {
                  const quantidadeReverter = componente.quantidade * quantidadePedido;
                  
                  console.log(`➕ Revertendo ${quantidadeReverter} unidades do componente ${componente.sku_componente} no local ${localEstoqueNome}`);

                  // Buscar produto_id do componente
                  const { data: produto } = await supabase
                    .from('produtos')
                    .select('id, sku_interno')
                    .eq('sku_interno', componente.sku_componente.toUpperCase())
                    .eq('organization_id', organizationId)
                    .maybeSingle();

                  if (produto) {
                    await this.reverterEstoqueLocal(
                      produto.id,
                      localEstoqueId,
                      organizationId,
                      quantidadeReverter,
                      componente.sku_componente,
                      localEstoqueNome,
                      vendaDataAny.numero_pedido || vendaDataAny.id_unico,
                      'produto'
                    );
                    
                    reversoesRealizadas.push({
                      tipo: 'produto',
                      produtoId: produto.id,
                      localId: localEstoqueId,
                      quantidadeRevertida: quantidadeReverter
                    });
                  } else {
                    console.error(`❌ Componente ${componente.sku_componente} não encontrado no estoque`);
                  }
                }
              }
              
              // 🔧 REVERTER COMPOSIÇÃO DE INSUMOS
              if (composicaoInsumos && composicaoInsumos.length > 0) {
                console.log(`📋 Composição de insumos encontrada com ${composicaoInsumos.length} insumos no local ${localEstoqueNome}`);

                for (const insumo of composicaoInsumos) {
                  const quantidadeReverter = insumo.quantidade * quantidadePedido;
                  
                  console.log(`➕ Revertendo ${quantidadeReverter} unidades do insumo ${insumo.sku_insumo} no local ${localEstoqueNome}`);

                  // Buscar produto_id do insumo
                  const { data: produto } = await supabase
                    .from('produtos')
                    .select('id, sku_interno')
                    .eq('sku_interno', insumo.sku_insumo.toUpperCase())
                    .eq('organization_id', organizationId)
                    .maybeSingle();

                  if (produto) {
                    await this.reverterEstoqueLocal(
                      produto.id,
                      localEstoqueId,
                      organizationId,
                      quantidadeReverter,
                      insumo.sku_insumo,
                      localEstoqueNome,
                      vendaDataAny.numero_pedido || vendaDataAny.id_unico,
                      'insumo'
                    );
                    
                    reversoesRealizadas.push({
                      tipo: 'insumo',
                      produtoId: produto.id,
                      localId: localEstoqueId,
                      quantidadeRevertida: quantidadeReverter
                    });
                  } else {
                    console.error(`❌ Insumo ${insumo.sku_insumo} não encontrado no estoque`);
                  }
                }
              }
              
              // 🔄 Se NÃO tem composição (nem produtos nem insumos), reverter o produto principal
              if ((!composicao || composicao.length === 0) && (!composicaoInsumos || composicaoInsumos.length === 0)) {
                console.log(`⚠️ Nenhuma composição encontrada para ${skuMapeado} no local ${localEstoqueNome} - Revertendo produto principal`);
                
                const { data: produtoPrincipal } = await supabase
                  .from('produtos')
                  .select('id, sku_interno')
                  .eq('sku_interno', skuMapeado.toUpperCase())
                  .eq('organization_id', organizationId)
                  .maybeSingle();

                if (produtoPrincipal) {
                  await this.reverterEstoqueLocal(
                    produtoPrincipal.id,
                    localEstoqueId,
                    organizationId,
                    quantidadePedido,
                    skuMapeado,
                    localEstoqueNome,
                    vendaDataAny.numero_pedido || vendaDataAny.id_unico,
                    'produto'
                  );
                  
                  reversoesRealizadas.push({
                    tipo: 'produto',
                    produtoId: produtoPrincipal.id,
                    localId: localEstoqueId,
                    quantidadeRevertida: quantidadePedido
                  });
                } else {
                  console.error(`❌ Produto principal ${skuMapeado} não encontrado no estoque`);
                }
              }
            } else {
              console.warn('⚠️ Local de estoque não identificado, não é possível reverter estoque corretamente');
            }
          }
        }
        
        // ❌ EXCLUIR registro do histórico APENAS SE reversão foi bem sucedida
        const { error } = await supabase.rpc('hv_delete', { _id: id });
        
        if (error) {
          console.error('Erro ao excluir item do histórico:', error);
          toast.error('Erro ao excluir item', {
            description: error.message || 'Erro desconhecido'
          });
          
          // 🔄 ROLLBACK: Reverter todas as reversões feitas
          console.log('🔄 Executando rollback das reversões de estoque...');
          await this.rollbackReversoes(reversoesRealizadas);
          
          return false;
        }

        const msgSucesso = localEstoqueId 
          ? `Item excluído e estoque revertido para o local ${localEstoqueNome}`
          : 'Item excluído (sem reversão de estoque - local não identificado)';
          
        toast.success(msgSucesso);
        return true;
        
      } catch (innerError) {
        console.error('Erro durante reversão de estoque:', innerError);
        
        // 🔄 ROLLBACK: Reverter todas as reversões feitas
        console.log('🔄 Executando rollback das reversões de estoque...');
        await this.rollbackReversoes(reversoesRealizadas);
        
        throw innerError;
      }
    } catch (error) {
      console.error('Erro inesperado ao excluir:', error);
      toast.error('Erro inesperado ao excluir item');
      return false;
    }
  }

  /**
   * Reverte estoque de um produto/insumo em um local específico
   */
  private static async reverterEstoqueLocal(
    produtoId: string,
    localId: string,
    organizationId: string,
    quantidade: number,
    sku: string,
    localNome: string,
    numeroPedido: string,
    tipo: 'produto' | 'insumo'
  ): Promise<void> {
    // 🛡️ BUSCAR estoque atual NO LOCAL ESPECÍFICO
    const { data: estoqueLocal, error: estoqueError } = await supabase
      .from('estoque_por_local')
      .select('quantidade, id')
      .eq('produto_id', produtoId)
      .eq('local_id', localId)
      .maybeSingle();

    if (estoqueError) {
      console.error(`Erro ao buscar estoque local do ${tipo} ${sku}:`, estoqueError);
      throw estoqueError;
    }

    const quantidadeAnterior = estoqueLocal?.quantidade || 0;
    const novaQuantidade = quantidadeAnterior + quantidade;

    if (!estoqueLocal) {
      console.warn(`⚠️ ${tipo} ${sku} não tem registro no local ${localNome}, criando...`);
      
      // Criar registro no local com a quantidade a reverter
      const { error: insertError } = await supabase
        .from('estoque_por_local')
        .insert({
          produto_id: produtoId,
          local_id: localId,
          organization_id: organizationId,
          quantidade: quantidade
        });

      if (insertError) {
        console.error(`Erro ao criar estoque local:`, insertError);
        throw insertError;
      }
      
      console.log(`✅ Estoque criado e revertido: ${sku} - ${quantidade} unidades no local ${localNome}`);
    } else {
      // Atualizar estoque existente no local
      const { error: updateError } = await supabase
        .from('estoque_por_local')
        .update({ 
          quantidade: novaQuantidade,
          updated_at: new Date().toISOString()
        })
        .eq('id', estoqueLocal.id);

      if (updateError) {
        console.error(`Erro ao reverter estoque do ${tipo} ${sku}:`, updateError);
        throw updateError;
      }
      
      console.log(`✅ Estoque revertido: ${sku} - De ${quantidadeAnterior} para ${novaQuantidade} no local ${localNome}`);
    }
    
    // 📝 Registrar movimentação
    await supabase.from('movimentacoes_estoque').insert({
      produto_id: produtoId,
      local_id: localId,
      tipo_movimentacao: 'entrada',
      quantidade_anterior: quantidadeAnterior,
      quantidade_nova: novaQuantidade,
      quantidade_movimentada: quantidade,
      motivo: 'exclusao_historico',
      observacoes: `Reversão de estoque (${tipo}) por exclusão do pedido ${numeroPedido} do local ${localNome}`
    });
  }

  /**
   * Faz rollback das reversões em caso de erro
   */
  private static async rollbackReversoes(
    reversoes: Array<{tipo: 'produto' | 'insumo', produtoId: string, localId: string, quantidadeRevertida: number}>
  ): Promise<void> {
    for (const reversao of reversoes) {
      try {
        // Subtrair a quantidade que foi adicionada
        const { data: estoqueLocal } = await supabase
          .from('estoque_por_local')
          .select('quantidade, id')
          .eq('produto_id', reversao.produtoId)
          .eq('local_id', reversao.localId)
          .maybeSingle();

        if (estoqueLocal) {
          const quantidadeOriginal = estoqueLocal.quantidade - reversao.quantidadeRevertida;
          
          await supabase
            .from('estoque_por_local')
            .update({ quantidade: quantidadeOriginal })
            .eq('id', estoqueLocal.id);
          
          console.log(`🔄 Rollback realizado: ${reversao.produtoId} - ${reversao.quantidadeRevertida} unidades`);
        }
      } catch (err) {
        console.error('Erro ao fazer rollback:', err);
      }
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