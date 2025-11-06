/**
 * 🎯 SERVIÇO DE ESTOQUE POR LOCAL
 * Gerencia verificação e baixa de estoque em locais específicos
 */

import { supabase } from '@/integrations/supabase/client';

export interface EstoquePorLocal {
  local_id: string;
  local_nome: string;
  quantidade: number;
  produto_id: string;
  sku_interno: string;
}

export interface VerificacaoEstoqueLocal {
  sucesso: boolean;
  local_id?: string;
  local_nome?: string;
  quantidade_disponivel?: number;
  mensagem?: string;
}

export interface ResultadoBaixaLocal {
  sucesso: boolean;
  local_nome: string;
  sku: string;
  quantidade_baixada: number;
  quantidade_restante: number;
  mensagem?: string;
}

/**
 * Verifica se há estoque disponível em um local específico para um SKU
 */
export async function verificarEstoqueLocal(
  sku: string,
  localId: string,
  quantidadeNecessaria: number
): Promise<VerificacaoEstoqueLocal> {
  try {
    console.log(`🔍 [EstoqueLocal] Verificando estoque:`, {
      sku,
      localId,
      quantidadeNecessaria
    });

    // Buscar o produto pelo SKU
    const { data: produto, error: produtoError } = await supabase
      .from('produtos')
      .select('id, sku_interno, nome')
      .eq('sku_interno', sku)
      .single();

    if (produtoError || !produto) {
      return {
        sucesso: false,
        mensagem: `SKU ${sku} não encontrado no catálogo de produtos`
      };
    }

    // Buscar estoque no local específico
    const { data: estoqueLocal, error: estoqueError } = await supabase
      .from('estoque_por_local')
      .select(`
        quantidade,
        local_id,
        locais_estoque!inner (
          id,
          nome
        )
      `)
      .eq('produto_id', produto.id)
      .eq('local_id', localId)
      .single();

    if (estoqueError || !estoqueLocal) {
      // Buscar nome do local para mensagem mais clara
      const { data: local } = await supabase
        .from('locais_estoque')
        .select('nome')
        .eq('id', localId)
        .single();

      return {
        sucesso: false,
        local_id: localId,
        local_nome: local?.nome || 'Local desconhecido',
        quantidade_disponivel: 0,
        mensagem: `Produto ${sku} não possui estoque cadastrado no local ${local?.nome || localId}`
      };
    }

    const localNome = (estoqueLocal.locais_estoque as any)?.nome || 'Local desconhecido';
    const quantidadeDisponivel = estoqueLocal.quantidade || 0;

    if (quantidadeDisponivel < quantidadeNecessaria) {
      return {
        sucesso: false,
        local_id: localId,
        local_nome: localNome,
        quantidade_disponivel: quantidadeDisponivel,
        mensagem: `Estoque insuficiente no local "${localNome}". Disponível: ${quantidadeDisponivel}, Necessário: ${quantidadeNecessaria}`
      };
    }

    return {
      sucesso: true,
      local_id: localId,
      local_nome: localNome,
      quantidade_disponivel: quantidadeDisponivel,
      mensagem: `Estoque disponível: ${quantidadeDisponivel} unidades`
    };

  } catch (error) {
    console.error('❌ [EstoqueLocal] Erro ao verificar estoque:', error);
    return {
      sucesso: false,
      mensagem: `Erro ao verificar estoque: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}

/**
 * Baixa estoque de um produto em um local específico
 */
export async function baixarEstoqueLocal(
  sku: string,
  localId: string,
  quantidade: number
): Promise<ResultadoBaixaLocal> {
  try {
    console.log(`📦 [EstoqueLocal] Baixando estoque:`, {
      sku,
      localId,
      quantidade
    });

    // 1. Buscar produto
    const { data: produto, error: produtoError } = await supabase
      .from('produtos')
      .select('id, sku_interno, nome')
      .eq('sku_interno', sku)
      .single();

    if (produtoError || !produto) {
      throw new Error(`SKU ${sku} não encontrado`);
    }

    // 2. Buscar estoque atual no local
    const { data: estoqueLocal, error: estoqueError } = await supabase
      .from('estoque_por_local')
      .select(`
        id,
        quantidade,
        locais_estoque!inner (
          nome
        )
      `)
      .eq('produto_id', produto.id)
      .eq('local_id', localId)
      .single();

    if (estoqueError || !estoqueLocal) {
      throw new Error(`Produto não possui estoque no local especificado`);
    }

    const localNome = (estoqueLocal.locais_estoque as any)?.nome || 'Local desconhecido';
    const quantidadeAtual = estoqueLocal.quantidade || 0;

    if (quantidadeAtual < quantidade) {
      throw new Error(
        `Estoque insuficiente no local "${localNome}". Disponível: ${quantidadeAtual}, Necessário: ${quantidade}`
      );
    }

    // 3. Atualizar estoque no local
    const novaQuantidade = quantidadeAtual - quantidade;
    const { error: updateError } = await supabase
      .from('estoque_por_local')
      .update({ quantidade: novaQuantidade })
      .eq('id', estoqueLocal.id);

    if (updateError) {
      throw new Error(`Erro ao atualizar estoque: ${updateError.message}`);
    }

    // 4. Atualizar quantidade_atual na tabela produtos (somar todos os locais)
    const { data: todosLocais } = await supabase
      .from('estoque_por_local')
      .select('quantidade')
      .eq('produto_id', produto.id);

    const quantidadeTotal = todosLocais?.reduce((sum, local) => sum + (local.quantidade || 0), 0) || 0;

    await supabase
      .from('produtos')
      .update({ quantidade_atual: quantidadeTotal })
      .eq('id', produto.id);

    console.log(`✅ [EstoqueLocal] Estoque baixado com sucesso:`, {
      sku,
      local: localNome,
      quantidade_baixada: quantidade,
      quantidade_restante: novaQuantidade
    });

    return {
      sucesso: true,
      local_nome: localNome,
      sku,
      quantidade_baixada: quantidade,
      quantidade_restante: novaQuantidade,
      mensagem: `Baixa realizada com sucesso no local "${localNome}"`
    };

  } catch (error) {
    console.error('❌ [EstoqueLocal] Erro ao baixar estoque:', error);
    throw error;
  }
}

/**
 * Verifica estoque de múltiplos SKUs em um local específico
 */
export async function verificarEstoqueMultiplosSkus(
  skus: Array<{ sku: string; quantidade: number }>,
  localId: string
): Promise<{
  todosDisponiveis: boolean;
  detalhes: Array<VerificacaoEstoqueLocal & { sku: string }>;
  mensagemErro?: string;
}> {
  const detalhes: Array<VerificacaoEstoqueLocal & { sku: string }> = [];
  
  for (const item of skus) {
    const verificacao = await verificarEstoqueLocal(item.sku, localId, item.quantidade);
    detalhes.push({
      ...verificacao,
      sku: item.sku
    });
  }

  const todosDisponiveis = detalhes.every(d => d.sucesso);
  
  if (!todosDisponiveis) {
    const erros = detalhes
      .filter(d => !d.sucesso)
      .map(d => `${d.sku}: ${d.mensagem}`)
      .join('\n');
    
    return {
      todosDisponiveis: false,
      detalhes,
      mensagemErro: `Problemas de estoque encontrados:\n${erros}`
    };
  }

  return {
    todosDisponiveis: true,
    detalhes
  };
}

/**
 * Busca todos os estoques de um produto em diferentes locais
 */
export async function buscarEstoquesTodosLocais(sku: string): Promise<EstoquePorLocal[]> {
  try {
    const { data: produto, error: produtoError } = await supabase
      .from('produtos')
      .select('id, sku_interno')
      .eq('sku_interno', sku)
      .single();

    if (produtoError || !produto) {
      return [];
    }

    const { data: estoques, error } = await supabase
      .from('estoque_por_local')
      .select(`
        local_id,
        quantidade,
        produto_id,
        locais_estoque!inner (
          nome
        )
      `)
      .eq('produto_id', produto.id);

    if (error || !estoques) {
      return [];
    }

    return estoques.map(e => ({
      local_id: e.local_id,
      local_nome: (e.locais_estoque as any)?.nome || 'Desconhecido',
      quantidade: e.quantidade || 0,
      produto_id: e.produto_id,
      sku_interno: sku
    }));

  } catch (error) {
    console.error('Erro ao buscar estoques:', error);
    return [];
  }
}
