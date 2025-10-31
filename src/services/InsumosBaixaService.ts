import { supabase } from '@/integrations/supabase/client';

export interface InsumoParaBaixa {
  sku: string;
  quantidade: number;
}

/**
 * Serviço para baixa de insumos no estoque
 * Responsável por deduzir insumos baseado nos produtos vendidos
 */
export class InsumosBaixaService {
  
  /**
   * Processa baixa de insumos para múltiplos SKUs de produtos
   * @param skusProdutos - Array de SKUs de produtos únicos (sem repetição)
   * @returns Resultado da operação de baixa
   */
  static async processarBaixaInsumos(skusProdutos: string[]): Promise<{
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

    try {
      console.log('🔧 Iniciando baixa de insumos para SKUs:', skusProdutos);

      // 1. Buscar composições de todos os produtos
      const { data: composicoes, error: composicoesError } = await supabase
        .from('composicoes_insumos')
        .select('sku_produto, sku_insumo, quantidade')
        .in('sku_produto', skusProdutos)
        .eq('ativo', true);

      if (composicoesError) {
        console.error('Erro ao buscar composições:', composicoesError);
        return {
          success: false,
          message: `Erro ao buscar composições: ${composicoesError.message}`
        };
      }

      if (!composicoes || composicoes.length === 0) {
        console.warn('Nenhuma composição encontrada para os SKUs:', skusProdutos);
        return {
          success: false,
          message: 'Nenhuma composição de insumos encontrada para os produtos'
        };
      }

      // 2. Agrupar insumos por SKU e somar quantidades
      // IMPORTANTE: 1 unidade por SKU único, não multiplicado pela quantidade do produto
      const insumosMap = new Map<string, number>();
      
      composicoes.forEach(comp => {
        const quantidadeNecessaria = comp.quantidade || 1; // Quantidade de insumo por unidade do produto
        const quantidadeAtual = insumosMap.get(comp.sku_insumo) || 0;
        
        // Somar quantidade (1 produto = quantidade definida na composição)
        insumosMap.set(comp.sku_insumo, quantidadeAtual + quantidadeNecessaria);
      });

      const insumosBaixar: InsumoParaBaixa[] = Array.from(insumosMap.entries()).map(([sku, quantidade]) => ({
        sku: sku.trim().toUpperCase(),
        quantidade
      }));

      console.log('📋 Insumos para baixa:', insumosBaixar);

      // 3. Executar baixa via RPC function
      const { data: resultado, error: baixaError } = await supabase.rpc('baixar_estoque_direto', {
        p_baixas: insumosBaixar as any
      });

      if (baixaError) {
        console.error('❌ Erro na baixa de insumos:', baixaError);
        return {
          success: false,
          message: `Erro na baixa de insumos: ${baixaError.message}`
        };
      }

      const result = resultado as any;

      if (!result.success) {
        console.error('❌ Baixa de insumos falhou:', result);
        return {
          success: false,
          message: result.erros?.[0]?.erro || 'Falha na baixa de insumos'
        };
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
  static async produtoPossuiInsumos(skuProduto: string): Promise<boolean> {
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
}
