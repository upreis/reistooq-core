import { supabase } from '@/integrations/supabase/client';

export interface InsumoParaBaixa {
  sku: string;
  quantidade: number;
}

/**
 * Processa baixa de insumos para múltiplos SKUs de produtos
 * @param skusProdutos - Array de SKUs de produtos únicos (sem repetição)
 * @param localEstoqueId - ID do local de estoque onde buscar as composições e dar baixa
 * @returns Resultado da operação de baixa
 */
export async function processarBaixaInsumos(
  skusProdutos: string[], 
  localEstoqueId: string
): Promise<{
  success: boolean;
  message: string;
  insumosBaixados?: InsumoParaBaixa[];
}> {
    if (!skusProdutos || skusProdutos.length === 0) {
      return {
        success: false,
        message: 'Nenhum SKU de produto fornecido para baixa de insumos'
      };
    }

    if (!localEstoqueId) {
      return {
        success: false,
        message: 'Local de estoque não especificado para baixa de insumos'
      };
    }

    try {
      console.log('🔧 Iniciando baixa de insumos para SKUs:', skusProdutos, 'no local:', localEstoqueId);

      // Buscar organization_id do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          message: 'Usuário não autenticado'
        };
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('organizacao_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organizacao_id) {
        return {
          success: false,
          message: 'Organização não encontrada'
        };
      }

      const organizationId = profile.organizacao_id;

      // 1. Buscar composições de todos os produtos FILTRADAS POR LOCAL E ORGANIZAÇÃO
      const { data: composicoes, error: composicoesError } = await supabase
        .from('composicoes_insumos')
        .select('sku_produto, sku_insumo, quantidade, local_id')
        .in('sku_produto', skusProdutos)
        .eq('local_id', localEstoqueId)
        .eq('organization_id', organizationId)
        .eq('ativo', true);

      console.log('📦 Composições encontradas no banco:', composicoes);

      if (composicoesError) {
        console.error('Erro ao buscar composições:', composicoesError);
        return {
          success: false,
          message: `Erro ao buscar composições: ${composicoesError.message}`
        };
      }

      if (!composicoes || composicoes.length === 0) {
        console.warn('Nenhuma composição de insumos encontrada para os SKUs:', skusProdutos, 'no local:', localEstoqueId);
        return {
          success: false,
          message: `Nenhuma composição de insumos encontrada para os produtos no local especificado (ID: ${localEstoqueId})`
        };
      }

      console.log(`📊 Total de composições encontradas: ${composicoes.length}`);

      // 2. Agrupar insumos por SKU e somar quantidades
      // IMPORTANTE: 1 unidade por SKU único, não multiplicado pela quantidade do produto
      const insumosMap = new Map<string, number>();
      
      composicoes.forEach((comp, index) => {
        console.log(`🔍 Processando composição ${index + 1}/${composicoes.length}:`, {
          sku_produto: comp.sku_produto,
          sku_insumo: comp.sku_insumo,
          quantidade: comp.quantidade
        });

        const quantidadeNecessaria = comp.quantidade || 1; // Quantidade de insumo por unidade do produto
        const quantidadeAtual = insumosMap.get(comp.sku_insumo) || 0;
        
        // Somar quantidade (1 produto = quantidade definida na composição)
        insumosMap.set(comp.sku_insumo, quantidadeAtual + quantidadeNecessaria);
        
        console.log(`✅ Insumo ${comp.sku_insumo}: ${quantidadeAtual} + ${quantidadeNecessaria} = ${quantidadeAtual + quantidadeNecessaria}`);
      });

      console.log('🗺️ Map de insumos agrupados:', Object.fromEntries(insumosMap));

      const insumosBaixar: InsumoParaBaixa[] = Array.from(insumosMap.entries()).map(([sku, quantidade]) => ({
        sku: sku.trim().toUpperCase(), // ✅ CRÍTICO: Normalizar para UPPERCASE para consistência
        quantidade
      }));

      console.log('📋 Array final de insumos para baixa:', insumosBaixar);
      console.log('📋 JSON stringified:', JSON.stringify(insumosBaixar, null, 2));

      // 3. Dar baixa no estoque do local específico
      console.log('🚀 Dando baixa de insumos diretamente no estoque do local:', localEstoqueId);
      
      for (const insumo of insumosBaixar) {
        // Buscar produto_id do insumo filtrando por organização
        const { data: produtoInsumo, error: prodError } = await supabase
          .from('produtos')
          .select('id, sku_interno')
          .eq('sku_interno', insumo.sku.toUpperCase()) // ✅ CRÍTICO: Normalizar para UPPERCASE
          .eq('organization_id', organizationId)
          .maybeSingle();
        
        if (prodError || !produtoInsumo) {
          console.error(`❌ Insumo ${insumo.sku} não encontrado no cadastro de produtos`);
          return {
            success: false,
            message: `Insumo ${insumo.sku} não encontrado no cadastro de produtos da sua organização`
          };
        }
        
        // Buscar estoque atual no local
        const { data: estoqueAtual, error: estoqueError } = await supabase
          .from('estoque_por_local')
          .select('quantidade')
          .eq('produto_id', produtoInsumo.id)
          .eq('local_id', localEstoqueId)
          .eq('organization_id', organizationId)
          .maybeSingle();
        
        if (estoqueError) {
          console.error(`❌ Erro ao buscar estoque do insumo ${insumo.sku}:`, estoqueError);
          return {
            success: false,
            message: `Erro ao buscar estoque do insumo ${insumo.sku}: ${estoqueError.message}`
          };
        }
        
        // ✅ CRÍTICO: Validar se o insumo existe no local
        if (!estoqueAtual) {
          console.error(`❌ Insumo ${insumo.sku} não está cadastrado no local especificado`);
          return {
            success: false,
            message: `Insumo ${insumo.sku} não está cadastrado no local. Adicione-o ao estoque deste local primeiro.`
          };
        }
        
        const quantidadeAtual = estoqueAtual.quantidade;
        
        if (quantidadeAtual < insumo.quantidade) {
          return {
            success: false,
            message: `Estoque insuficiente do insumo ${insumo.sku} no local (Disponível: ${quantidadeAtual}, Necessário: ${insumo.quantidade})`
          };
        }
        
        const novaQuantidade = quantidadeAtual - insumo.quantidade;
        
        // Atualizar estoque no local
        const { error: updateError } = await supabase
          .from('estoque_por_local')
          .update({ quantidade: novaQuantidade })
          .eq('produto_id', produtoInsumo.id)
          .eq('local_id', localEstoqueId)
          .eq('organization_id', organizationId);
        
        if (updateError) {
          console.error(`❌ Erro ao atualizar estoque do insumo ${insumo.sku}:`, updateError);
          return {
            success: false,
            message: `Erro ao atualizar estoque do insumo ${insumo.sku}: ${updateError.message}`
          };
        }
        
        console.log(`✅ Insumo ${insumo.sku}: ${insumo.quantidade} unidades baixadas (${quantidadeAtual} → ${novaQuantidade})`);
      }
      
      console.log('✅ Baixa de insumos concluída com sucesso');
      return {
        success: true,
        message: `Baixa de ${insumosBaixar.length} insumo(s) concluída com sucesso`,
        insumosBaixados: insumosBaixar
      };

    } catch (error) {
      console.error('❌ Erro inesperado na baixa de insumos:', error);
      return {
        success: false,
        message: `Erro inesperado: ${error instanceof Error ? error.message : 'Desconhecido'}`
      };
    }
  }


/**
 * Verifica se um produto possui insumos mapeados
 * @param skuProduto - SKU do produto
 * @returns true se possui insumos, false caso contrário
 */
export async function produtoPossuiInsumos(skuProduto: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('composicoes_insumos')
      .select('id')
      .eq('sku_produto', skuProduto)
      .eq('ativo', true)
      .limit(1);

    if (error) {
      console.error('Erro ao verificar insumos:', error);
      return false;
    }

    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Erro inesperado ao verificar insumos:', error);
    return false;
  }
}
