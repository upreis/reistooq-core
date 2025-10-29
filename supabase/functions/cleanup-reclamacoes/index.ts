/**
 * 🧹 EDGE FUNCTION: LIMPEZA AUTOMÁTICA DE RECLAMAÇÕES
 * Remove reclamações antigas conforme regras de ciclo de vida
 * 
 * Executado via CRON diariamente
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const DIAS_MAXIMO_ATIVAS = 60;     // 2 meses
const DIAS_MAXIMO_HISTORICO = 90;   // 3 meses
const VALOR_MINIMO_PROTECAO = 500;  // R$ 500

interface ReclamacaoParaExclusao {
  claim_id: string;
  order_id: string;
  diasDesdeAbertura: number;
  valor: number;
  status_analise: string;
  em_mediacao: boolean;
  motivo_exclusao: string;
}

Deno.serve(async (req) => {
  try {
    console.log('🧹 Iniciando limpeza automática de reclamações...');

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar todas as reclamações
    const { data: reclamacoes, error: fetchError } = await supabase
      .from('devolucoes_avancadas')
      .select('*');

    if (fetchError) {
      throw new Error(`Erro ao buscar reclamações: ${fetchError.message}`);
    }

    console.log(`📊 Total de reclamações: ${reclamacoes?.length || 0}`);

    const paraExcluir: ReclamacaoParaExclusao[] = [];
    const protegidas: ReclamacaoParaExclusao[] = [];
    const agora = new Date();

    // Analisar cada reclamação
    for (const rec of reclamacoes || []) {
      const dataAbertura = new Date(rec.date_created || rec.created_at);
      const diasDesdeAbertura = Math.floor(
        (agora.getTime() - dataAbertura.getTime()) / (1000 * 60 * 60 * 24)
      );

      const valor = Math.abs(rec.transaction_amount || 0);
      const emMediacao = rec.em_mediacao === true || rec.claim_stage === 'dispute';
      
      // Verificar se está no histórico (analisada)
      const statusHistorico = ['resolvida', 'fechada', 'cancelada'];
      const estaNoHistorico = statusHistorico.includes(rec.status_analise);

      const limiteMaximo = estaNoHistorico ? DIAS_MAXIMO_HISTORICO : DIAS_MAXIMO_ATIVAS;

      // Verificar se deve ser excluída
      if (diasDesdeAbertura > limiteMaximo) {
        const item: ReclamacaoParaExclusao = {
          claim_id: rec.claim_id,
          order_id: rec.order_id,
          diasDesdeAbertura,
          valor,
          status_analise: rec.status_analise || 'pendente',
          em_mediacao: emMediacao,
          motivo_exclusao: estaNoHistorico 
            ? `Histórico excedido (>${DIAS_MAXIMO_HISTORICO} dias)`
            : `Sem análise (>${DIAS_MAXIMO_ATIVAS} dias)`
        };

        // Verificar proteções
        if (valor >= VALOR_MINIMO_PROTECAO) {
          item.motivo_exclusao = 'PROTEGIDA - Valor alto';
          protegidas.push(item);
        } else if (emMediacao) {
          item.motivo_exclusao = 'PROTEGIDA - Em mediação';
          protegidas.push(item);
        } else {
          paraExcluir.push(item);
        }
      }
    }

    console.log(`🗑️  Reclamações a excluir: ${paraExcluir.length}`);
    console.log(`🛡️  Reclamações protegidas: ${protegidas.length}`);

    // Executar exclusão em lotes
    let excluidas = 0;
    if (paraExcluir.length > 0) {
      const claimIds = paraExcluir.map(r => r.claim_id);
      
      const { error: deleteError, count } = await supabase
        .from('devolucoes_avancadas')
        .delete()
        .in('claim_id', claimIds);

      if (deleteError) {
        console.error('❌ Erro ao excluir:', deleteError);
      } else {
        excluidas = count || 0;
        console.log(`✅ ${excluidas} reclamações excluídas com sucesso`);
      }
    }

    // Gerar relatório
    const relatorio = {
      executado_em: agora.toISOString(),
      total_analisadas: reclamacoes?.length || 0,
      total_excluidas: excluidas,
      total_protegidas: protegidas.length,
      reclamacoes_excluidas: paraExcluir.map(r => ({
        claim_id: r.claim_id,
        ordem_id: r.order_id,
        dias: r.diasDesdeAbertura,
        motivo: r.motivo_exclusao
      })),
      reclamacoes_protegidas: protegidas.map(r => ({
        claim_id: r.claim_id,
        ordem_id: r.order_id,
        dias: r.diasDesdeAbertura,
        valor: r.valor,
        motivo: r.motivo_exclusao
      }))
    };

    console.log('📋 Relatório:', JSON.stringify(relatorio, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        message: `Limpeza concluída: ${excluidas} reclamações excluídas`,
        relatorio
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Erro na limpeza automática:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
