/**
 * 🔧 SERVIÇO DE BAIXA DE INSUMOS
 * Executa a baixa de insumos no estoque (1 unidade por pedido)
 */

import { supabase } from '@/integrations/supabase/client';

export interface BaixaInsumoItem {
  sku_insumo: string;
  quantidade: number; // Sempre 1 para insumos
}

export interface ResultadoBaixaInsumos {
  success: boolean;
  total_processados: number;
  total_sucesso: number;
  total_erros: number;
  erros: Array<{
    sku: string;
    erro: string;
  }>;
}

export class InsumosBaixaService {
  /**
   * Busca os insumos que devem ser baixados para produtos únicos de um pedido
   * @param skusProdutosUnicos - Array de SKUs únicos dos produtos no pedido
   * @returns Array de insumos a serem baixados (1x por produto único)
   */
  static async buscarInsumosPorProdutos(
    skusProdutosUnicos: string[]
  ): Promise<BaixaInsumoItem[]> {
    const insumosBaixa: BaixaInsumoItem[] = [];

    for (const skuProduto of skusProdutosUnicos) {
      const { data: composicoes, error } = await supabase
        .from('composicoes_insumos')
        .select('sku_insumo, quantidade')
        .eq('sku_produto', skuProduto)
        .eq('ativo', true);

      if (error) {
        console.error(`❌ Erro ao buscar insumos para ${skuProduto}:`, error);
        continue;
      }

      if (!composicoes || composicoes.length === 0) {
        console.log(`⚠️ Produto ${skuProduto} não tem insumos mapeados`);
        continue;
      }

      // Para cada insumo, adicionar 1 unidade (não multiplica pela quantidade do produto)
      composicoes.forEach(comp => {
        insumosBaixa.push({
          sku_insumo: comp.sku_insumo,
          quantidade: 1 // SEMPRE 1 por pedido
        });
      });
    }

    return insumosBaixa;
  }

  /**
   * Executa a baixa de insumos no estoque usando RPC
   * @param insumos - Array de insumos a serem baixados
   * @returns Resultado da operação
   */
  static async executarBaixaInsumos(
    insumos: BaixaInsumoItem[]
  ): Promise<ResultadoBaixaInsumos> {
    try {
      console.log('🔧 Executando baixa de insumos:', insumos);

      // Agrupar insumos repetidos e somar quantidades
      const insumosAgrupados = new Map<string, number>();
      insumos.forEach(item => {
        const qtdAtual = insumosAgrupados.get(item.sku_insumo) || 0;
        insumosAgrupados.set(item.sku_insumo, qtdAtual + item.quantidade);
      });

      // Preparar baixas para RPC
      const baixas = Array.from(insumosAgrupados.entries()).map(([sku, qtd]) => ({
        sku: sku,
        quantidade: qtd
      }));

      console.log('📦 Baixas agrupadas:', baixas);

      // Executar baixa usando a função RPC existente
      const { data, error } = await supabase.rpc('baixar_estoque_direto', {
        p_baixas: baixas
      });

      if (error) {
        console.error('❌ Erro na função RPC baixar_estoque_direto:', error);
        return {
          success: false,
          total_processados: baixas.length,
          total_sucesso: 0,
          total_erros: baixas.length,
          erros: [{
            sku: 'TODOS',
            erro: error.message
          }]
        };
      }

      const resultado = data as any;
      console.log('✅ Resultado da baixa de insumos:', resultado);

      return {
        success: resultado.success || false,
        total_processados: baixas.length,
        total_sucesso: resultado.sucesso || 0,
        total_erros: resultado.erros?.length || 0,
        erros: resultado.erros || []
      };

    } catch (error) {
      console.error('❌ Erro ao executar baixa de insumos:', error);
      return {
        success: false,
        total_processados: insumos.length,
        total_sucesso: 0,
        total_erros: insumos.length,
        erros: [{
          sku: 'ERRO_GERAL',
          erro: error instanceof Error ? error.message : 'Erro desconhecido'
        }]
      };
    }
  }

  /**
   * Executa baixa de insumos para um array de pedidos
   * @param pedidos - Array com pedidos contendo SKUs únicos
   * @returns Resultado da baixa
   */
  static async baixarInsumosPedidos(pedidos: Array<{
    sku_kit?: string;
    skus_produtos_unicos?: string[];
  }>): Promise<ResultadoBaixaInsumos> {
    try {
      // Extrair SKUs únicos de todos os pedidos
      const skusUnicos = new Set<string>();
      
      pedidos.forEach(pedido => {
        if (pedido.sku_kit) {
          skusUnicos.add(pedido.sku_kit);
        }
        if (pedido.skus_produtos_unicos) {
          pedido.skus_produtos_unicos.forEach(sku => skusUnicos.add(sku));
        }
      });

      const skusArray = Array.from(skusUnicos);
      console.log(`🔍 Processando insumos para ${skusArray.length} produtos únicos`);

      // Buscar insumos para esses produtos
      const insumos = await this.buscarInsumosPorProdutos(skusArray);

      if (insumos.length === 0) {
        console.log('⚠️ Nenhum insumo encontrado para baixa');
        return {
          success: true,
          total_processados: 0,
          total_sucesso: 0,
          total_erros: 0,
          erros: []
        };
      }

      // Executar baixa
      return await this.executarBaixaInsumos(insumos);

    } catch (error) {
      console.error('❌ Erro ao baixar insumos de pedidos:', error);
      throw error;
    }
  }
}
