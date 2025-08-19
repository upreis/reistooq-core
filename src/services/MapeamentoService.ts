import { supabase } from '@/integrations/supabase/client';
import { Pedido } from '@/types/pedido';

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

  /**
   * Enriquece pedidos com dados de mapeamento
   */
  static async enriquecerPedidosComMapeamento(pedidos: Pedido[]): Promise<Pedido[]> {
    if (pedidos.length === 0) return pedidos;
    
    // Extrair todos os SKUs dos pedidos
    const skusPedido = pedidos.flatMap(pedido => {
      if (pedido.itens && pedido.itens.length > 0) {
        return pedido.itens.map(item => item.sku);
      }
      // Fallback para extrair da obs se não tiver itens
      if (pedido.obs) {
        return pedido.obs.split(',').map(sku => sku.trim());
      }
      return [pedido.numero];
    });

    try {
      const { data: mapeamentos, error } = await supabase
        .from('mapeamentos_depara')
        .select('sku_pedido, sku_correspondente, sku_simples, quantidade, ativo')
        .in('sku_pedido', skusPedido)
        .eq('ativo', true);

      if (error) {
        console.error('Erro ao buscar mapeamentos:', error);
        return pedidos;
      }

      // Criar um mapa de mapeamentos por SKU
      const mapeamentosMap = new Map(
        mapeamentos?.map(m => [m.sku_pedido, m]) || []
      );

      // Enriquecer cada pedido com dados de mapeamento
      return pedidos.map(pedido => {
        let skuEstoque = null;
        let skuKit = null;
        let qtdKit = null;
        let statusEstoque: 'pronto_baixar' | 'sem_estoque' | 'pedido_baixado' = 'pronto_baixar';

        // Procurar mapeamento pelos itens ou pela obs
        if (pedido.itens && pedido.itens.length > 0) {
          const itemComMapeamento = pedido.itens.find(item => 
            mapeamentosMap.has(item.sku)
          );
          
          if (itemComMapeamento) {
            const mapeamento = mapeamentosMap.get(itemComMapeamento.sku);
            skuEstoque = mapeamento?.sku_correspondente || mapeamento?.sku_simples;
            skuKit = mapeamento?.sku_pedido;
            qtdKit = mapeamento?.quantidade;
          } else {
            statusEstoque = 'sem_estoque';
          }
        } else if (pedido.obs) {
          // Fallback para buscar na obs
          const skusDaObs = pedido.obs.split(',').map(s => s.trim());
          const skuComMapeamento = skusDaObs.find(sku => mapeamentosMap.has(sku));
          
          if (skuComMapeamento) {
            const mapeamento = mapeamentosMap.get(skuComMapeamento);
            skuEstoque = mapeamento?.sku_correspondente || mapeamento?.sku_simples;
            skuKit = mapeamento?.sku_pedido;
            qtdKit = mapeamento?.quantidade;
          } else {
            statusEstoque = 'sem_estoque';
          }
        }

        return {
          ...pedido,
          sku_estoque: skuEstoque,
          sku_kit: skuKit,
          qtd_kit: qtdKit,
          status_estoque: statusEstoque
        };
      });

    } catch (error) {
      console.error('Erro ao enriquecer pedidos com mapeamento:', error);
      return pedidos;
    }
  }
}