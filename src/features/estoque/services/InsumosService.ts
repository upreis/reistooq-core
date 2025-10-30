/**
 * 🔧 SERVIÇO - INSUMOS
 * Validações e baixa de insumos (1x por pedido)
 */

import { supabase } from '@/integrations/supabase/client';
import type { ValidacaoInsumo, ResultadoBaixaInsumos } from '../types/insumos.types';

export class InsumosService {
  /**
   * 🔍 Validar insumos para um pedido
   * Verifica se há insumos cadastrados e se há estoque disponível
   */
  static async validarInsumosParaPedido(skuProduto: string): Promise<{
    tem_mapeamento: boolean;
    tem_estoque: boolean;
    insumos: ValidacaoInsumo[];
  }> {
    try {
      // 1. Buscar insumos cadastrados para o produto
      const { data: composicoes, error: erroComposicoes } = await supabase
        .from('composicoes_insumos')
        .select('sku_insumo')
        .eq('sku_produto', skuProduto)
        .eq('ativo', true);

      if (erroComposicoes) throw erroComposicoes;

      // Se não há insumos cadastrados
      if (!composicoes || composicoes.length === 0) {
        return {
          tem_mapeamento: false,
          tem_estoque: true, // Não bloqueia se não há mapeamento
          insumos: []
        };
      }

      // 2. Verificar estoque de cada insumo
      const skusInsumos = composicoes.map(c => c.sku_insumo);
      const { data: produtos, error: erroProdutos } = await supabase
        .from('produtos')
        .select('sku_interno, nome, quantidade_atual, ativo')
        .in('sku_interno', skusInsumos)
        .eq('ativo', true);

      if (erroProdutos) throw erroProdutos;

      // 3. Validar cada insumo
      const validacoes: ValidacaoInsumo[] = skusInsumos.map(sku => {
        const produto = produtos?.find(p => p.sku_interno === sku);
        
        if (!produto) {
          return {
            sku,
            existe: false,
            estoque_disponivel: 0,
            estoque_suficiente: false,
            erro: `Insumo ${sku} não cadastrado no estoque`
          };
        }

        const suficiente = produto.quantidade_atual >= 1;
        return {
          sku,
          existe: true,
          estoque_disponivel: produto.quantidade_atual,
          estoque_suficiente: suficiente,
          erro: suficiente ? undefined : `Estoque insuficiente (disponível: ${produto.quantidade_atual})`
        };
      });

      const todosExistem = validacoes.every(v => v.existe);
      const todosSuficientes = validacoes.every(v => v.estoque_suficiente);

      return {
        tem_mapeamento: true,
        tem_estoque: todosExistem && todosSuficientes,
        insumos: validacoes
      };
    } catch (error) {
      console.error('Erro ao validar insumos:', error);
      return {
        tem_mapeamento: false,
        tem_estoque: false,
        insumos: []
      };
    }
  }

  /**
   * 📥 Baixar insumos de um pedido
   * SEMPRE baixa 1 unidade de cada insumo, independente da quantidade do produto
   */
  static async baixarInsumosPedido(skuProduto: string): Promise<ResultadoBaixaInsumos> {
    try {
      // 1. Buscar insumos cadastrados
      const { data: composicoes, error: erroComposicoes } = await supabase
        .from('composicoes_insumos')
        .select('sku_insumo')
        .eq('sku_produto', skuProduto)
        .eq('ativo', true);

      if (erroComposicoes) throw erroComposicoes;

      if (!composicoes || composicoes.length === 0) {
        return {
          success: true,
          total_processados: 0,
          total_sucesso: 0,
          total_erros: 0,
          erros: []
        };
      }

      // 2. Preparar array de insumos para RPC
      const insumosParaBaixar = composicoes.map(c => ({
        sku: c.sku_insumo
      }));

      // 3. Chamar RPC para baixar insumos
      const { data, error } = await supabase.rpc('baixar_insumos_pedido', {
        p_insumos: insumosParaBaixar as any
      }) as { data: ResultadoBaixaInsumos | null; error: any };

      if (error) throw error;
      if (!data) throw new Error('Nenhum dado retornado');

      return data;
    } catch (error) {
      console.error('Erro ao baixar insumos:', error);
      return {
        success: false,
        total_processados: 0,
        total_sucesso: 0,
        total_erros: 1,
        erros: [{
          sku: skuProduto,
          erro: error instanceof Error ? error.message : 'Erro desconhecido'
        }]
      };
    }
  }

  /**
   * 📊 Verificar estoque disponível de insumos
   */
  static async verificarEstoqueInsumos(skuProduto: string): Promise<Map<string, number>> {
    const { data: composicoes } = await supabase
      .from('composicoes_insumos')
      .select('sku_insumo')
      .eq('sku_produto', skuProduto)
      .eq('ativo', true);

    if (!composicoes || composicoes.length === 0) {
      return new Map();
    }

    const skusInsumos = composicoes.map(c => c.sku_insumo);
    const { data: produtos } = await supabase
      .from('produtos')
      .select('sku_interno, quantidade_atual')
      .in('sku_interno', skusInsumos)
      .eq('ativo', true);

    const estoqueMap = new Map<string, number>();
    produtos?.forEach(p => {
      estoqueMap.set(p.sku_interno, p.quantidade_atual);
    });

    return estoqueMap;
  }
}
