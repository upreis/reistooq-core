/**
 * 🛡️ SERVIÇO DE VALIDAÇÃO DE INSUMOS
 * Valida se há insumos mapeados e disponíveis em estoque antes da baixa
 */

import { supabase } from '@/integrations/supabase/client';

export type StatusBaixaInsumo = 
  | 'pronto' 
  | 'pendente_insumo' 
  | 'sem_mapeamento_insumo' 
  | 'sem_cadastro_insumo';

export interface ValidacaoInsumoResult {
  statusBaixa: StatusBaixaInsumo;
  insumosEncontrados: number;
  insumosFaltando: string[];
  detalhes: string;
}

export class InsumosValidationService {
  /**
   * Valida insumos para um produto específico
   * @param skuProduto - SKU do produto a validar
   * @returns Resultado da validação com status
   */
  static async validarInsumosProduto(skuProduto: string): Promise<ValidacaoInsumoResult> {
    try {
      // 1. Buscar mapeamentos de insumos para o produto
      const { data: composicoes, error: erroComposicoes } = await supabase
        .from('composicoes_insumos')
        .select('sku_insumo, quantidade')
        .eq('sku_produto', skuProduto)
        .eq('ativo', true);

      if (erroComposicoes) {
        console.error('❌ Erro ao buscar composições de insumos:', erroComposicoes);
        throw erroComposicoes;
      }

      // Se não há mapeamento de insumos, retorna status específico
      if (!composicoes || composicoes.length === 0) {
        return {
          statusBaixa: 'sem_mapeamento_insumo',
          insumosEncontrados: 0,
          insumosFaltando: [],
          detalhes: 'Produto sem insumos mapeados'
        };
      }

      // 2. Verificar se os insumos existem no estoque
      const skusInsumos = composicoes.map(c => c.sku_insumo);
      const { data: produtosEstoque, error: erroEstoque } = await supabase
        .from('produtos')
        .select('sku_interno, quantidade_atual')
        .in('sku_interno', skusInsumos)
        .eq('ativo', true);

      if (erroEstoque) {
        console.error('❌ Erro ao verificar estoque de insumos:', erroEstoque);
        throw erroEstoque;
      }

      const estoqueMap = new Map(
        produtosEstoque?.map(p => [p.sku_interno, p.quantidade_atual || 0]) || []
      );

      // 3. Verificar quais insumos não estão cadastrados
      const insumosSemCadastro = skusInsumos.filter(sku => !estoqueMap.has(sku));
      
      if (insumosSemCadastro.length > 0) {
        return {
          statusBaixa: 'sem_cadastro_insumo',
          insumosEncontrados: estoqueMap.size,
          insumosFaltando: insumosSemCadastro,
          detalhes: `Insumos não cadastrados: ${insumosSemCadastro.join(', ')}`
        };
      }

      // 4. Verificar se todos os insumos têm quantidade suficiente (≥ 1)
      const insumosSemEstoque = composicoes.filter(comp => {
        const qtdDisponivel = estoqueMap.get(comp.sku_insumo) || 0;
        // Para insumos, sempre precisa de pelo menos 1 unidade
        return qtdDisponivel < 1;
      });

      if (insumosSemEstoque.length > 0) {
        return {
          statusBaixa: 'pendente_insumo',
          insumosEncontrados: composicoes.length,
          insumosFaltando: insumosSemEstoque.map(i => i.sku_insumo),
          detalhes: `Insumos sem estoque: ${insumosSemEstoque.map(i => i.sku_insumo).join(', ')}`
        };
      }

      // ✅ Tudo OK!
      return {
        statusBaixa: 'pronto',
        insumosEncontrados: composicoes.length,
        insumosFaltando: [],
        detalhes: 'Todos os insumos disponíveis'
      };

    } catch (error) {
      console.error('❌ Erro na validação de insumos:', error);
      throw error;
    }
  }

  /**
   * Valida insumos para múltiplos produtos (pedidos)
   * Retorna um mapa com SKU do produto -> resultado da validação
   */
  static async validarInsumosPedidos(skusProdutos: string[]): Promise<Map<string, ValidacaoInsumoResult>> {
    const resultados = new Map<string, ValidacaoInsumoResult>();

    // Processar em paralelo para performance
    await Promise.all(
      skusProdutos.map(async (sku) => {
        const resultado = await this.validarInsumosProduto(sku);
        resultados.set(sku, resultado);
      })
    );

    return resultados;
  }

  /**
   * Combina o status de baixa de produto com o status de insumos
   * Retorna o status mais crítico
   */
  static combinarStatus(
    statusProduto: string,
    statusInsumo: StatusBaixaInsumo
  ): string {
    // Se produto já tem problema, mantém o problema do produto
    if (statusProduto === 'sku_nao_cadastrado' || statusProduto === 'sem_estoque') {
      return statusProduto;
    }

    // Se insumo tem problema, retorna o problema do insumo
    if (statusInsumo !== 'pronto') {
      return statusInsumo;
    }

    // Se ambos estão OK, retorna status do produto
    return statusProduto;
  }
}
