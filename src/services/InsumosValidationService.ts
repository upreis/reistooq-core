import { supabase } from '@/integrations/supabase/client';
import type { StatusBaixaInsumo } from './MapeamentoService';

export interface ValidacaoInsumoResult {
  sku: string;
  status: StatusBaixaInsumo;
  detalhes?: string;
  skusFaltando?: string[]; // 🆕 Lista de SKUs que estão faltando
  insumosNecessarios?: Array<{
    sku: string;
    quantidade: number;
    quantidadeDisponivel: number;
  }>;
}

/**
 * Serviço para validar insumos de produtos
 * Verifica mapeamento, existência e quantidade em estoque
 */
export class InsumosValidationService {
  
  /**
   * Valida insumos para um SKU de produto
   * @param skuProduto - SKU do produto a validar
   * @returns ValidacaoInsumoResult com status e detalhes
   */
  static async validarInsumosProduto(skuProduto: string): Promise<ValidacaoInsumoResult> {
    if (!skuProduto) {
      return {
        sku: skuProduto,
        status: 'sem_mapeamento_insumo',
        detalhes: 'SKU do produto não fornecido'
      };
    }

    try {
      // 1. Buscar composição do produto (insumos necessários)
      const { data: composicao, error: composicaoError } = await supabase
        .from('composicoes_insumos')
        .select('sku_insumo, quantidade')
        .eq('sku_produto', skuProduto)
        .eq('ativo', true);

      if (composicaoError) {
        console.error('Erro ao buscar composição:', composicaoError);
        return {
          sku: skuProduto,
          status: 'sem_mapeamento_insumo',
          detalhes: `Erro ao buscar composição: ${composicaoError.message}`
        };
      }

      if (!composicao || composicao.length === 0) {
        return {
          sku: skuProduto,
          status: 'sem_mapeamento_insumo',
          detalhes: 'Produto não possui insumos mapeados'
        };
      }

      // 2. Verificar se todos os insumos estão cadastrados no estoque
      const skusInsumos = composicao.map(c => c.sku_insumo);
      
      const { data: insumos, error: insumosError } = await supabase
        .from('produtos')
        .select('sku_interno, quantidade_atual')
        .in('sku_interno', skusInsumos)
        .eq('ativo', true);

      if (insumosError) {
        console.error('Erro ao buscar insumos:', insumosError);
        return {
          sku: skuProduto,
          status: 'sem_cadastro_insumo',
          detalhes: `Erro ao buscar insumos: ${insumosError.message}`
        };
      }

      // Criar mapa de insumos cadastrados
      const insumosMap = new Map(
        (insumos || []).map(i => [i.sku_interno, i.quantidade_atual || 0])
      );

      // 3. Verificar se todos os insumos estão cadastrados
      const insumosNaoCadastrados = skusInsumos.filter(sku => !insumosMap.has(sku));
      
      if (insumosNaoCadastrados.length > 0) {
        return {
          sku: skuProduto,
          status: 'sem_cadastro_insumo',
          detalhes: `Insumos não cadastrados: ${insumosNaoCadastrados.join(', ')}`,
          skusFaltando: insumosNaoCadastrados // 🆕 Retorna lista de SKUs faltando
        };
      }

      // 4. Verificar se todos os insumos têm quantidade suficiente (pelo menos 1 unidade)
      const insumosDetalhados = composicao.map(c => ({
        sku: c.sku_insumo,
        quantidade: c.quantidade || 1,
        quantidadeDisponivel: insumosMap.get(c.sku_insumo) || 0
      }));

      const insumosSemEstoque = insumosDetalhados.filter(i => i.quantidadeDisponivel <= 0);
      
      if (insumosSemEstoque.length > 0) {
        return {
          sku: skuProduto,
          status: 'pendente_insumo',
          detalhes: `Insumos sem estoque: ${insumosSemEstoque.map(i => i.sku).join(', ')}`,
          insumosNecessarios: insumosDetalhados
        };
      }

      // 5. Todos os insumos estão prontos!
      return {
        sku: skuProduto,
        status: 'pronto',
        detalhes: 'Todos os insumos disponíveis',
        insumosNecessarios: insumosDetalhados
      };

    } catch (error) {
      console.error('Erro inesperado ao validar insumos:', error);
      return {
        sku: skuProduto,
        status: 'sem_mapeamento_insumo',
        detalhes: `Erro inesperado: ${error instanceof Error ? error.message : 'Desconhecido'}`
      };
    }
  }

  /**
   * Valida insumos para múltiplos SKUs de produtos
   * @param skusProdutos - Array de SKUs de produtos
   * @returns Map com resultados de validação por SKU
   */
  static async validarInsumosPedidos(skusProdutos: string[]): Promise<Map<string, ValidacaoInsumoResult>> {
    const resultados = new Map<string, ValidacaoInsumoResult>();

    // Processar validações em paralelo para melhor performance
    const validacoes = await Promise.all(
      skusProdutos.map(sku => this.validarInsumosProduto(sku))
    );

    validacoes.forEach(resultado => {
      resultados.set(resultado.sku, resultado);
    });

    return resultados;
  }

  /**
   * Combina status de produto com status de insumos
   * Retorna o status mais crítico
   */
  static combinarStatus(
    statusProduto: 'pronto_baixar' | 'sem_estoque' | 'sem_mapear' | 'sku_nao_cadastrado',
    statusInsumo: StatusBaixaInsumo
  ): 'pronto_baixar' | 'sem_estoque' | 'sem_mapear' | 'sku_nao_cadastrado' {
    // Ordem de prioridade (do mais crítico para o menos crítico):
    // 1. sku_nao_cadastrado
    // 2. sem_estoque
    // 3. sem_mapear
    // 4. pronto_baixar

    if (statusProduto === 'sku_nao_cadastrado' || statusInsumo === 'sem_cadastro_insumo') {
      return 'sku_nao_cadastrado';
    }

    if (statusProduto === 'sem_estoque' || statusInsumo === 'pendente_insumo') {
      return 'sem_estoque';
    }

    if (statusProduto === 'sem_mapear' || statusInsumo === 'sem_mapeamento_insumo') {
      return 'sem_mapear';
    }

    // Ambos estão prontos
    return 'pronto_baixar';
  }
}
