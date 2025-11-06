import { supabase } from "@/integrations/supabase/client";

/**
 * Função para fazer backfill de composições em locais de estoque
 * Cria registros zerados para composições que ainda não existem nos locais
 */
export async function backfillComposicoesEstoque() {
  try {
    // 1. Buscar todos os locais ativos
    const { data: locais, error: locaisError } = await supabase
      .from('locais_estoque')
      .select('id, organization_id, nome')
      .eq('ativo', true);

    if (locaisError) throw locaisError;
    if (!locais || locais.length === 0) return { success: true, criados: 0 };

    // 2. Buscar todas as composições ativas
    const { data: composicoes, error: composicoesError } = await supabase
      .from('produtos_composicoes')
      .select('id, organization_id, sku_interno')
      .eq('ativo', true);

    if (composicoesError) throw composicoesError;
    if (!composicoes || composicoes.length === 0) return { success: true, criados: 0 };

    // 3. Buscar estoque existente
    const { data: estoqueExistente, error: estoqueError } = await supabase
      .from('estoque_por_local')
      .select('local_id, produto_id');

    if (estoqueError) throw estoqueError;

    // Criar set para verificação rápida
    const estoqueSet = new Set(
      (estoqueExistente || []).map(e => `${e.local_id}:${e.produto_id}`)
    );

    // 4. Criar registros que não existem
    const registrosParaCriar = [];
    
    for (const local of locais) {
      for (const composicao of composicoes) {
        if (local.organization_id === composicao.organization_id) {
          const chave = `${local.id}:${composicao.id}`;
          
          if (!estoqueSet.has(chave)) {
            registrosParaCriar.push({
              produto_id: composicao.id,
              local_id: local.id,
              quantidade: 0,
              organization_id: local.organization_id
            });
          }
        }
      }
    }

    // 5. Inserir em lote
    if (registrosParaCriar.length > 0) {
      const { error: insertError } = await supabase
        .from('estoque_por_local')
        .insert(registrosParaCriar);

      if (insertError) throw insertError;

      console.log(`✅ Backfill concluído: ${registrosParaCriar.length} registros criados`);
      return { success: true, criados: registrosParaCriar.length };
    }

    return { success: true, criados: 0 };

  } catch (error) {
    console.error('❌ Erro no backfill:', error);
    return { success: false, error };
  }
}
