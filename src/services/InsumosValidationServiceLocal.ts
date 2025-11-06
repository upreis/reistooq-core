/**
 * 🎯 SERVIÇO DE VALIDAÇÃO DE INSUMOS POR LOCAL
 * Valida insumos considerando o estoque em locais específicos
 */

import { supabase } from '@/integrations/supabase/client';
import { verificarEstoqueLocal } from './EstoquePorLocalService';
import type { StatusBaixaInsumo } from './MapeamentoService';

export interface ValidacaoInsumoLocalResult {
  sku: string;
  status: StatusBaixaInsumo;
  detalhes?: string;
  localId?: string;
  localNome?: string;
  skusFaltando?: string[];
  insumosNecessarios?: Array<{
    sku: string;
    quantidade: number;
    quantidadeDisponivel: number;
    localNome: string;
  }>;
}

/**
 * Valida insumos de um produto verificando estoque no local específico
 */
export async function validarInsumosProdutoLocal(
  skuProduto: string,
  localId: string
): Promise<ValidacaoInsumoLocalResult> {
  if (!skuProduto) {
    return {
      sku: skuProduto,
      status: 'sem_mapeamento_insumo',
      detalhes: 'SKU do produto não fornecido'
    };
  }

  if (!localId) {
    return {
      sku: skuProduto,
      status: 'sem_mapeamento_insumo',
      detalhes: 'Local de estoque não especificado'
    };
  }

  try {
    console.log(`🔍 [ValidaçãoLocal] Validando insumos para ${skuProduto} no local ${localId}`);

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
        detalhes: `Erro ao buscar composição: ${composicaoError.message}`,
        localId
      };
    }

    if (!composicao || composicao.length === 0) {
      return {
        sku: skuProduto,
        status: 'sem_mapeamento_insumo',
        detalhes: 'Produto não possui insumos mapeados',
        localId
      };
    }

    console.log(`📦 [ValidaçãoLocal] Composição encontrada:`, composicao);

    // 2. Buscar nome do local
    const { data: local } = await supabase
      .from('locais_estoque')
      .select('nome')
      .eq('id', localId)
      .single();

    const localNome = local?.nome || 'Local desconhecido';

    // 3. Verificar cada insumo no local específico
    const verificacoes = await Promise.all(
      composicao.map(async (comp) => {
        const verificacao = await verificarEstoqueLocal(
          comp.sku_insumo,
          localId,
          comp.quantidade || 1
        );

        return {
          sku: comp.sku_insumo,
          quantidade: comp.quantidade || 1,
          quantidadeDisponivel: verificacao.quantidade_disponivel || 0,
          localNome: verificacao.local_nome || localNome,
          disponivel: verificacao.sucesso
        };
      })
    );

    // 4. Identificar insumos sem estoque suficiente
    const insumosSemEstoque = verificacoes.filter(v => !v.disponivel);

    if (insumosSemEstoque.length > 0) {
      const detalhes = insumosSemEstoque
        .map(i => `${i.sku} (Necessário: ${i.quantidade}, Disponível: ${i.quantidadeDisponivel})`)
        .join(', ');

      return {
        sku: skuProduto,
        status: 'pendente_insumo',
        detalhes: `Estoque insuficiente no local "${localNome}": ${detalhes}`,
        localId,
        localNome,
        insumosNecessarios: verificacoes.map(v => ({
          sku: v.sku,
          quantidade: v.quantidade,
          quantidadeDisponivel: v.quantidadeDisponivel,
          localNome: v.localNome
        }))
      };
    }

    // 5. Todos insumos disponíveis
    console.log(`✅ [ValidaçãoLocal] Todos os insumos disponíveis no local ${localNome}`);
    
    return {
      sku: skuProduto,
      status: 'pronto',
      detalhes: `Todos os insumos disponíveis no local "${localNome}"`,
      localId,
      localNome,
      insumosNecessarios: verificacoes.map(v => ({
        sku: v.sku,
        quantidade: v.quantidade,
        quantidadeDisponivel: v.quantidadeDisponivel,
        localNome: v.localNome
      }))
    };

  } catch (error) {
    console.error('❌ [ValidaçãoLocal] Erro:', error);
    return {
      sku: skuProduto,
      status: 'sem_cadastro_insumo',
      detalhes: `Erro ao validar insumos: ${error instanceof Error ? error.message : 'Desconhecido'}`,
      localId
    };
  }
}

/**
 * Valida insumos de múltiplos produtos em um local específico
 */
export async function validarInsumosPedidosLocal(
  skusProdutos: string[],
  localId: string
): Promise<Map<string, ValidacaoInsumoLocalResult>> {
  const resultados = new Map<string, ValidacaoInsumoLocalResult>();

  for (const sku of skusProdutos) {
    const validacao = await validarInsumosProdutoLocal(sku, localId);
    resultados.set(sku, validacao);
  }

  return resultados;
}
