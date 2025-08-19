import { supabase } from '@/integrations/supabase/client';

export interface MapeamentoVerificacao {
  skuPedido: string;
  temMapeamento: boolean;
  skuEstoque?: string;
  quantidadeKit?: number;
}

export class MapeamentoService {
  /**
   * Verifica se existe mapeamento para uma lista de SKUs de pedido
   */
  static async verificarMapeamentos(skusPedido: string[]): Promise<MapeamentoVerificacao[]> {
    if (skusPedido.length === 0) return [];

    try {
      const { data, error } = await supabase
        .from('mapeamentos_depara')
        .select('sku_pedido, sku_correspondente, sku_simples, quantidade')
        .in('sku_pedido', skusPedido)
        .eq('ativo', true);

      if (error) {
        console.error('Erro ao verificar mapeamentos:', error);
        return skusPedido.map(sku => ({
          skuPedido: sku,
          temMapeamento: false
        }));
      }

      // Cria um mapa dos mapeamentos encontrados
      const mapeamentosMap = new Map(
        (data || []).map(item => [
          item.sku_pedido,
          {
            skuEstoque: item.sku_correspondente || item.sku_simples,
            quantidadeKit: item.quantidade || 1
          }
        ])
      );

      // Retorna resultado para todos os SKUs
      return skusPedido.map(sku => ({
        skuPedido: sku,
        temMapeamento: mapeamentosMap.has(sku),
        skuEstoque: mapeamentosMap.get(sku)?.skuEstoque,
        quantidadeKit: mapeamentosMap.get(sku)?.quantidadeKit
      }));

    } catch (error) {
      console.error('Erro inesperado ao verificar mapeamentos:', error);
      return skusPedido.map(sku => ({
        skuPedido: sku,
        temMapeamento: false
      }));
    }
  }

  /**
   * Verifica se existe mapeamento para um único SKU
   */
  static async verificarMapeamento(skuPedido: string): Promise<MapeamentoVerificacao> {
    const resultados = await this.verificarMapeamentos([skuPedido]);
    return resultados[0] || {
      skuPedido,
      temMapeamento: false
    };
  }

  /**
   * Busca estatísticas de mapeamentos ativos
   */
  static async getEstatisticasMapeamentos() {
    try {
      const { data, error } = await supabase
        .from('mapeamentos_depara')
        .select('id, ativo, sku_correspondente, sku_simples')
        .eq('ativo', true);

      if (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return {
          total: 0,
          comEstoque: 0,
          semEstoque: 0
        };
      }

      const total = data?.length || 0;
      const comEstoque = data?.filter(item => item.sku_correspondente || item.sku_simples).length || 0;
      const semEstoque = total - comEstoque;

      return {
        total,
        comEstoque,
        semEstoque
      };

    } catch (error) {
      console.error('Erro inesperado ao buscar estatísticas:', error);
      return {
        total: 0,
        comEstoque: 0,
        semEstoque: 0
      };
    }
  }
}