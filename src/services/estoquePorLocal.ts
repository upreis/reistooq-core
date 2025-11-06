// Funções de estoque por local - Supabase client deve ser passado como parâmetro

type SupabaseClient = any;

/**
 * Verifica se há estoque suficiente em um local específico
 */
export async function verificarEstoqueNoLocal(
  supabaseClient: SupabaseClient,
  skuProduto: string,
  quantidadeNecessaria: number,
  localEstoqueId: string
): Promise<{ 
  disponivel: boolean; 
  quantidadeAtual: number;
  nomeLocal?: string;
}> {
  console.log(`🔍 [EstoqueLocal] Verificando estoque:`, {
    sku: skuProduto,
    quantidade_necessaria: quantidadeNecessaria,
    local_id: localEstoqueId
  });

  // Buscar quantidade no estoque_por_local
  const result: any = await supabaseClient
    .from('estoque_por_local')
    .select('quantidade')
    .eq('produto_sku', skuProduto)
    .eq('local_id', localEstoqueId)
    .maybeSingle();

  if (result.error) {
    console.error('❌ [EstoqueLocal] Erro ao verificar estoque:', result.error);
    throw result.error;
  }

  if (!result.data) {
    console.warn(`⚠️ [EstoqueLocal] Produto ${skuProduto} não encontrado no local ${localEstoqueId}`);
    return { 
      disponivel: false, 
      quantidadeAtual: 0 
    };
  }

  // Buscar nome do local
  const nomeLocal = await buscarNomeLocal(supabaseClient, localEstoqueId);

  const quantidadeAtual = result.data.quantidade || 0;
  const disponivel = quantidadeAtual >= quantidadeNecessaria;

  console.log(`📊 [EstoqueLocal] Resultado:`, {
    sku: skuProduto,
    local: nomeLocal,
    quantidade_atual: quantidadeAtual,
    quantidade_necessaria: quantidadeNecessaria,
    disponivel
  });

  return { 
    disponivel, 
    quantidadeAtual,
    nomeLocal
  };
}

/**
 * Dá baixa de estoque em um local específico
 */
export async function baixarEstoqueNoLocal(
  supabaseClient: SupabaseClient,
  skuProduto: string,
  quantidade: number,
  localEstoqueId: string
): Promise<boolean> {
  console.log(`🔽 [EstoqueLocal] Iniciando baixa:`, {
    sku: skuProduto,
    quantidade,
    local_id: localEstoqueId
  });

  // Primeiro, verificar se há estoque suficiente
  const verificacao = await verificarEstoqueNoLocal(
    supabaseClient,
    skuProduto,
    quantidade,
    localEstoqueId
  );

  if (!verificacao.disponivel) {
    throw new Error(
      `Estoque insuficiente no local ${verificacao.nomeLocal || localEstoqueId}. ` +
      `Disponível: ${verificacao.quantidadeAtual}, Necessário: ${quantidade}`
    );
  }

  // Dar baixa
  const novaQuantidade = verificacao.quantidadeAtual - quantidade;

  const result: any = await supabaseClient
    .from('estoque_por_local')
    .update({ quantidade: novaQuantidade })
    .eq('produto_sku', skuProduto)
    .eq('local_id', localEstoqueId);

  if (result.error) {
    console.error('❌ [EstoqueLocal] Erro ao dar baixa:', result.error);
    throw result.error;
  }

  console.log(`✅ [EstoqueLocal] Baixa concluída:`, {
    sku: skuProduto,
    local: verificacao.nomeLocal,
    quantidade_anterior: verificacao.quantidadeAtual,
    quantidade_baixada: quantidade,
    quantidade_nova: novaQuantidade
  });

  return true;
}

/**
 * Busca o nome do local de estoque por ID
 */
export async function buscarNomeLocal(
  supabaseClient: SupabaseClient,
  localEstoqueId: string
): Promise<string> {
  const result: any = await supabaseClient
    .from('locais_estoque')
    .select('nome')
    .eq('id', localEstoqueId)
    .maybeSingle();

  if (result.error || !result.data) {
    return localEstoqueId; // Fallback para o ID
  }

  return result.data.nome;
}
