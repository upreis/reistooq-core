/**
 * 🔧 SERVIÇO - INSUMOS
 * Validações e baixa de insumos (1x por pedido)
 * Suporta composições por local de venda (composicoes_local_venda) ou padrão (composicoes_insumos)
 */

import { supabase } from '@/integrations/supabase/client';
import type { ValidacaoInsumo, ResultadoBaixaInsumos } from '../types/insumos.types';

interface ComposicaoInsumo {
  sku_insumo: string;
  quantidade: number;
}

export class InsumosService {
  /**
   * 🔍 Buscar composições de insumos
   * Prioriza composicoes_local_venda se localVendaId for fornecido
   */
  private static async buscarComposicoes(
    skuProduto: string, 
    localVendaId?: string | null
  ): Promise<ComposicaoInsumo[]> {
    // Se temos um local de venda, buscar composições específicas
    if (localVendaId) {
      const { data: composicoesLV, error: erroLV } = await supabase
        .from('composicoes_local_venda')
        .select('sku_insumo, quantidade')
        .eq('local_venda_id', localVendaId)
        .eq('sku_produto', skuProduto)
        .eq('ativo', true);

      if (!erroLV && composicoesLV && composicoesLV.length > 0) {
        console.log(`📦 [Insumos] Usando composições do LOCAL DE VENDA para ${skuProduto}:`, composicoesLV.length);
        return composicoesLV;
      }
      
      console.log(`⚠️ [Insumos] Nenhuma composição específica para local de venda, usando padrão...`);
    }

    // Fallback: buscar composições padrão
    const { data: composicoes, error } = await supabase
      .from('composicoes_insumos')
      .select('sku_insumo, quantidade')
      .eq('sku_produto', skuProduto)
      .eq('ativo', true);

    if (error) throw error;
    return composicoes || [];
  }

  /**
   * 🔍 Validar insumos para um pedido
   * Verifica se há insumos cadastrados e se há estoque disponível
   * @param skuProduto - SKU do produto a validar
   * @param localVendaId - ID do local de venda (opcional, para usar composições específicas)
   */
  static async validarInsumosParaPedido(
    skuProduto: string,
    localVendaId?: string | null
  ): Promise<{
    tem_mapeamento: boolean;
    tem_estoque: boolean;
    insumos: ValidacaoInsumo[];
    fonte_composicao: 'local_venda' | 'padrao' | 'nenhuma';
  }> {
    try {
      // 1. Buscar insumos cadastrados (prioriza local de venda)
      const composicoes = await this.buscarComposicoes(skuProduto, localVendaId);
      const fonteComposicao = localVendaId && composicoes.length > 0 ? 'local_venda' : 
                              composicoes.length > 0 ? 'padrao' : 'nenhuma';

      // Se não há insumos cadastrados
      if (composicoes.length === 0) {
        return {
          tem_mapeamento: false,
          tem_estoque: true, // Não bloqueia se não há mapeamento
          insumos: [],
          fonte_composicao: 'nenhuma'
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
      const validacoes: ValidacaoInsumo[] = composicoes.map(comp => {
        const produto = produtos?.find(p => p.sku_interno === comp.sku_insumo);
        
        if (!produto) {
          return {
            sku: comp.sku_insumo,
            existe: false,
            estoque_disponivel: 0,
            estoque_suficiente: false,
            erro: `Insumo ${comp.sku_insumo} não cadastrado no estoque`
          };
        }

        const suficiente = produto.quantidade_atual >= comp.quantidade;
        return {
          sku: comp.sku_insumo,
          existe: true,
          estoque_disponivel: produto.quantidade_atual,
          estoque_suficiente: suficiente,
          erro: suficiente ? undefined : `Estoque insuficiente (disponível: ${produto.quantidade_atual}, necessário: ${comp.quantidade})`
        };
      });

      const todosExistem = validacoes.every(v => v.existe);
      const todosSuficientes = validacoes.every(v => v.estoque_suficiente);

      return {
        tem_mapeamento: true,
        tem_estoque: todosExistem && todosSuficientes,
        insumos: validacoes,
        fonte_composicao: fonteComposicao
      };
    } catch (error) {
      console.error('Erro ao validar insumos:', error);
      return {
        tem_mapeamento: false,
        tem_estoque: false,
        insumos: [],
        fonte_composicao: 'nenhuma'
      };
    }
  }

  /**
   * 📥 Baixar insumos de um pedido
   * Baixa a quantidade cadastrada de cada insumo
   * @param skuProduto - SKU do produto
   * @param localVendaId - ID do local de venda (opcional, para usar composições específicas)
   */
  static async baixarInsumosPedido(
    skuProduto: string,
    localVendaId?: string | null
  ): Promise<ResultadoBaixaInsumos> {
    try {
      // 1. Buscar insumos cadastrados (prioriza local de venda)
      const composicoes = await this.buscarComposicoes(skuProduto, localVendaId);

      if (composicoes.length === 0) {
        return {
          success: true,
          total_processados: 0,
          total_sucesso: 0,
          total_erros: 0,
          erros: []
        };
      }

      // 2. Preparar array de insumos para RPC com quantidade
      const insumosParaBaixar = composicoes.map(c => ({
        sku: c.sku_insumo,
        quantidade: c.quantidade
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
   * @param skuProduto - SKU do produto
   * @param localVendaId - ID do local de venda (opcional)
   */
  static async verificarEstoqueInsumos(
    skuProduto: string,
    localVendaId?: string | null
  ): Promise<Map<string, number>> {
    const composicoes = await this.buscarComposicoes(skuProduto, localVendaId);

    if (composicoes.length === 0) {
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
