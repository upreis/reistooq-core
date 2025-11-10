/**
 * 🚨 EDGE FUNCTION: Monitor Devoluções Críticas
 * 
 * Monitora devoluções com prazos críticos e cria notificações automáticas
 * 
 * Triggers:
 * - Prazo de envio crítico (< 24h)
 * - Prazo de envio urgente (< 48h)
 * - Prazo de review crítico (< 24h)
 * - Prazo de review urgente (< 48h)
 * - Recebimento previsto hoje
 * - Ações do vendedor necessárias
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Devolucao {
  order_id: string;
  return_id: number;
  claim_id: number;
  integration_account_id: string;
  organization_id: string;
  status_devolucao: string;
  dados_deadlines: {
    shipment_deadline?: string;
    shipment_deadline_hours_left?: number;
    is_shipment_deadline_critical?: boolean;
    seller_review_deadline?: string;
    seller_review_deadline_hours_left?: number;
    is_review_deadline_critical?: boolean;
    seller_receive_deadline?: string;
  } | null;
  dados_acoes_disponiveis: {
    can_review_ok?: boolean;
    can_review_fail?: boolean;
    can_ship?: boolean;
    can_print_label?: boolean;
  } | null;
  dados_review?: {
    product_condition?: string;
    review_status?: string;
  } | null;
}

interface Notificacao {
  organization_id: string;
  integration_account_id: string;
  order_id: string;
  return_id: number;
  claim_id: number;
  tipo_notificacao: string;
  prioridade: 'critica' | 'alta' | 'media' | 'baixa';
  titulo: string;
  mensagem: string;
  dados_contexto: any;
  deadline_date?: string;
  horas_restantes?: number;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚨 Iniciando monitoramento de devoluções críticas...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 📊 Buscar devoluções ativas com deadlines
    const { data: devolucoes, error: fetchError } = await supabase
      .from('devolucoes_avancadas')
      .select('*')
      .in('status_devolucao', ['pending', 'shipped', 'label_generated'])
      .not('dados_deadlines', 'is', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Erro ao buscar devoluções:', fetchError);
      throw fetchError;
    }

    console.log(`📦 ${devolucoes?.length || 0} devoluções ativas encontradas`);

    if (!devolucoes || devolucoes.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Nenhuma devolução ativa', notificacoes_criadas: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const notificacoes: Notificacao[] = [];
    const now = new Date();

    // 🔍 Processar cada devolução
    for (const dev of devolucoes as Devolucao[]) {
      const deadlines = dev.dados_deadlines;
      const actions = dev.dados_acoes_disponiveis;

      if (!deadlines) continue;

      // ⚠️ PRAZO DE ENVIO CRÍTICO (< 24h)
      if (
        deadlines.shipment_deadline_hours_left !== null &&
        deadlines.shipment_deadline_hours_left >= 0 &&
        deadlines.shipment_deadline_hours_left < 24 &&
        dev.status_devolucao === 'pending'
      ) {
        notificacoes.push({
          organization_id: dev.organization_id,
          integration_account_id: dev.integration_account_id,
          order_id: dev.order_id,
          return_id: dev.return_id,
          claim_id: dev.claim_id,
          tipo_notificacao: 'prazo_envio_critico',
          prioridade: 'critica',
          titulo: '🚨 CRÍTICO: Prazo de envio expirando',
          mensagem: `Faltam apenas ${Math.floor(deadlines.shipment_deadline_hours_left)}h para o comprador enviar a devolução #${dev.return_id}. Acompanhe de perto!`,
          dados_contexto: {
            status: dev.status_devolucao,
            horas_restantes: deadlines.shipment_deadline_hours_left,
          },
          deadline_date: deadlines.shipment_deadline,
          horas_restantes: Math.floor(deadlines.shipment_deadline_hours_left),
        });
      }

      // ⚠️ PRAZO DE ENVIO URGENTE (24h - 48h)
      if (
        deadlines.shipment_deadline_hours_left !== null &&
        deadlines.shipment_deadline_hours_left >= 24 &&
        deadlines.shipment_deadline_hours_left < 48 &&
        dev.status_devolucao === 'pending'
      ) {
        notificacoes.push({
          organization_id: dev.organization_id,
          integration_account_id: dev.integration_account_id,
          order_id: dev.order_id,
          return_id: dev.return_id,
          claim_id: dev.claim_id,
          tipo_notificacao: 'prazo_envio_urgente',
          prioridade: 'alta',
          titulo: '⚠️ URGENTE: Prazo de envio se aproximando',
          mensagem: `Atenção! Faltam ${Math.floor(deadlines.shipment_deadline_hours_left)}h para o prazo de envio da devolução #${dev.return_id}.`,
          dados_contexto: {
            status: dev.status_devolucao,
            horas_restantes: deadlines.shipment_deadline_hours_left,
          },
          deadline_date: deadlines.shipment_deadline,
          horas_restantes: Math.floor(deadlines.shipment_deadline_hours_left),
        });
      }

      // ⚠️ PRAZO DE REVIEW CRÍTICO (< 24h)
      if (
        deadlines.seller_review_deadline_hours_left !== null &&
        deadlines.seller_review_deadline_hours_left >= 0 &&
        deadlines.seller_review_deadline_hours_left < 24 &&
        (actions?.can_review_ok || actions?.can_review_fail)
      ) {
        notificacoes.push({
          organization_id: dev.organization_id,
          integration_account_id: dev.integration_account_id,
          order_id: dev.order_id,
          return_id: dev.return_id,
          claim_id: dev.claim_id,
          tipo_notificacao: 'prazo_review_critico',
          prioridade: 'critica',
          titulo: '🚨 CRÍTICO: Prazo de revisão expirando',
          mensagem: `URGENTE! Faltam apenas ${Math.floor(deadlines.seller_review_deadline_hours_left)}h para revisar a devolução #${dev.return_id}. Aprove ou reprove agora!`,
          dados_contexto: {
            status: dev.status_devolucao,
            horas_restantes: deadlines.seller_review_deadline_hours_left,
            pode_aprovar: actions.can_review_ok,
            pode_reprovar: actions.can_review_fail,
          },
          deadline_date: deadlines.seller_review_deadline,
          horas_restantes: Math.floor(deadlines.seller_review_deadline_hours_left),
        });
      }

      // ⚠️ PRAZO DE REVIEW URGENTE (24h - 48h)
      if (
        deadlines.seller_review_deadline_hours_left !== null &&
        deadlines.seller_review_deadline_hours_left >= 24 &&
        deadlines.seller_review_deadline_hours_left < 48 &&
        (actions?.can_review_ok || actions?.can_review_fail)
      ) {
        notificacoes.push({
          organization_id: dev.organization_id,
          integration_account_id: dev.integration_account_id,
          order_id: dev.order_id,
          return_id: dev.return_id,
          claim_id: dev.claim_id,
          tipo_notificacao: 'prazo_review_urgente',
          prioridade: 'alta',
          titulo: '⚠️ URGENTE: Revisar devolução',
          mensagem: `Atenção! Faltam ${Math.floor(deadlines.seller_review_deadline_hours_left)}h para revisar a devolução #${dev.return_id}. Não perca o prazo!`,
          dados_contexto: {
            status: dev.status_devolucao,
            horas_restantes: deadlines.seller_review_deadline_hours_left,
            pode_aprovar: actions?.can_review_ok,
            pode_reprovar: actions?.can_review_fail,
          },
          deadline_date: deadlines.seller_review_deadline,
          horas_restantes: Math.floor(deadlines.seller_review_deadline_hours_left),
        });
      }

      // 📅 RECEBIMENTO PREVISTO HOJE
      if (deadlines.seller_receive_deadline && dev.status_devolucao === 'shipped') {
        const receiveDate = new Date(deadlines.seller_receive_deadline);
        const isToday =
          receiveDate.getDate() === now.getDate() &&
          receiveDate.getMonth() === now.getMonth() &&
          receiveDate.getFullYear() === now.getFullYear();

        if (isToday) {
          notificacoes.push({
            organization_id: dev.organization_id,
            integration_account_id: dev.integration_account_id,
            order_id: dev.order_id,
            return_id: dev.return_id,
            claim_id: dev.claim_id,
            tipo_notificacao: 'prazo_recebimento',
            prioridade: 'media',
            titulo: '📦 Recebimento previsto hoje',
            mensagem: `A devolução #${dev.return_id} está prevista para ser recebida hoje. Prepare-se para revisar!`,
            dados_contexto: {
              status: dev.status_devolucao,
              data_prevista: deadlines.seller_receive_deadline,
            },
            deadline_date: deadlines.seller_receive_deadline,
          });
        }
      }

      // 🎬 AÇÕES DISPONÍVEIS NECESSÁRIAS
      if (actions && (actions.can_review_ok || actions.can_review_fail || actions.can_ship)) {
        const acoes = [];
        if (actions.can_review_ok) acoes.push('aprovar revisão');
        if (actions.can_review_fail) acoes.push('reprovar revisão');
        if (actions.can_ship) acoes.push('enviar produto');

        notificacoes.push({
          organization_id: dev.organization_id,
          integration_account_id: dev.integration_account_id,
          order_id: dev.order_id,
          return_id: dev.return_id,
          claim_id: dev.claim_id,
          tipo_notificacao: 'acao_necessaria',
          prioridade: 'media',
          titulo: '🎬 Ação necessária',
          mensagem: `A devolução #${dev.return_id} requer sua ação: ${acoes.join(' ou ')}.`,
          dados_contexto: {
            status: dev.status_devolucao,
            acoes_disponiveis: acoes,
            pode_aprovar: actions.can_review_ok,
            pode_reprovar: actions.can_review_fail,
            pode_enviar: actions.can_ship,
          },
        });
      }
    }

    console.log(`📊 ${notificacoes.length} notificações identificadas`);

    // 💾 Inserir notificações no banco (usando UPSERT para evitar duplicatas)
    if (notificacoes.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('devolucoes_notificacoes')
        .upsert(notificacoes, {
          onConflict: 'order_id,tipo_notificacao,organization_id',
          ignoreDuplicates: false, // Atualizar se já existir
        })
        .select();

      if (insertError) {
        console.error('❌ Erro ao inserir notificações:', insertError);
        throw insertError;
      }

      console.log(`✅ ${inserted?.length || 0} notificações criadas/atualizadas`);
    }

    // 🧹 Limpar notificações expiradas
    const { data: cleanupResult } = await supabase.rpc('limpar_notificacoes_expiradas');
    console.log(`🧹 Limpeza: ${cleanupResult?.deleted || 0} notificações expiradas removidas`);

    return new Response(
      JSON.stringify({
        success: true,
        devolucoes_analisadas: devolucoes.length,
        notificacoes_identificadas: notificacoes.length,
        notificacoes_criadas: notificacoes.length,
        notificacoes_limpas: cleanupResult?.deleted || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Erro no monitoramento:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
