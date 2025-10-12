/**
 * 🚀 EDGE FUNCTION: DEVOLUCOES AVANCADAS SYNC
 * Enriquece devoluções existentes com dados reais do Mercado Livre
 * Popula as 87 colunas avançadas com informações de claims, orders, returns, messages, tracking
 */

import { corsHeaders, makeServiceClient, ok, fail } from '../_shared/client.ts';

const ML_API_BASE = 'https://api.mercadolibre.com';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[sync] 🚀 Iniciando enriquecimento');

  try {
    const { action, integration_account_id, limit = 50 } = await req.json();

    if (action !== 'enrich_existing_data') {
      return fail('Ação inválida');
    }

    if (!integration_account_id) {
      return fail('integration_account_id obrigatório');
    }

    const supabase = makeServiceClient();

    // Buscar token
    console.log('[sync] 🔑 Buscando token...');
    const { data: tokenData, error: tokenError } = await supabase.functions.invoke('get-ml-token', {
      body: { integration_account_id, provider: 'mercadolivre' }
    });

    if (tokenError || !tokenData?.success || !tokenData?.access_token) {
      console.error('[sync] ❌ Erro token:', tokenError);
      return fail('Erro ao obter credenciais ML');
    }

    const accessToken = tokenData.access_token;
    console.log('[sync] ✅ Token OK');

    // Buscar devoluções
    console.log(`[sync] 📦 Buscando ${limit} devoluções...`);
    const { data: devolucoes, error: devError } = await supabase
      .from('devolucoes_avancadas')
      .select('*')
      .eq('integration_account_id', integration_account_id)
      .limit(limit);

    if (devError) {
      console.error('[sync] ❌ Erro buscar:', devError);
      return fail('Erro buscar devoluções');
    }

    if (!devolucoes || devolucoes.length === 0) {
      return ok({ success: true, enriched_count: 0, message: 'Nenhuma devolução' });
    }

    console.log(`[sync] 📊 ${devolucoes.length} devoluções encontradas`);

    let successCount = 0;
    let errorCount = 0;

    // Processar cada devolução
    for (const dev of devolucoes) {
      try {
        console.log(`[sync] 🔄 Processando ${dev.order_id}...`);

        // Buscar dados ML em paralelo
        const [orderRes, claimRes] = await Promise.allSettled([
          fetch(`${ML_API_BASE}/orders/${dev.order_id}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }),
          dev.claim_id ? fetch(`${ML_API_BASE}/claims/${dev.claim_id}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }) : Promise.resolve(null)
        ]);

        const orderData = orderRes.status === 'fulfilled' && orderRes.value?.ok 
          ? await orderRes.value.json() : null;
        const claimData = claimRes.status === 'fulfilled' && claimRes.value?.ok 
          ? await claimRes.value.json() : null;

        // 🎯 EXTRAIR DADOS FINANCEIROS
        const payment = orderData?.payments?.[0] || {};
        const shipping = orderData?.shipping || {};
        const buyer = orderData?.buyer || {};
        const item = orderData?.order_items?.[0]?.item || {};
        
        // Preparar dados para atualização - TODAS AS 87 COLUNAS
        const updateData: any = {
          // ===== DADOS BÁSICOS =====
          dados_order: orderData || dev.dados_order,
          dados_claim: claimData || dev.dados_claim,
          produto_titulo: item?.title || dev.produto_titulo,
          sku: item?.seller_sku || dev.sku,
          account_name: tokenData.account_name || dev.account_name,
          quantidade: orderData?.order_items?.[0]?.quantity || dev.quantidade || 1,
          valor_retido: orderData?.total_amount || dev.valor_retido || 0,
          status_devolucao: orderData?.status || dev.status_devolucao,
          comprador_nickname: buyer?.nickname || dev.comprador_nickname,
          
          // ===== CLAIM =====
          tipo_claim: claimData?.type || dev.tipo_claim,
          subtipo_claim: claimData?.sub_type || dev.subtipo_claim,
          motivo_categoria: claimData?.reason_id || dev.motivo_categoria,
          subcategoria_problema: claimData?.reason?.description || dev.subcategoria_problema,
          categoria_problema: claimData?.reason?.category || dev.categoria_problema,
          
          // ===== RASTREAMENTO =====
          codigo_rastreamento: shipping?.tracking_number || dev.codigo_rastreamento,
          transportadora: shipping?.carrier || dev.transportadora,
          status_rastreamento: shipping?.status || dev.status_rastreamento,
          url_rastreamento: shipping?.tracking_url || dev.url_rastreamento,
          localizacao_atual: shipping?.location || dev.localizacao_atual,
          status_transporte_atual: shipping?.substatus || dev.status_transporte_atual,
          
          // ===== CUSTOS E FINANCEIRO (87 COLUNAS FINANCEIRAS) =====
          custo_envio_devolucao: shipping?.cost || dev.custo_envio_devolucao,
          valor_compensacao: claimData?.compensation_amount || dev.valor_compensacao,
          moeda_custo: orderData?.currency_id || 'BRL',
          moeda_reembolso: payment?.currency_id || 'BRL',
          responsavel_custo: claimData?.responsible_party || dev.responsavel_custo,
          
          // FINANCEIRO AVANÇADO
          valor_reembolso_total: payment?.transaction_amount || dev.valor_reembolso_total,
          valor_reembolso_produto: (payment?.transaction_amount || 0) - (payment?.shipping_cost || 0),
          valor_reembolso_frete: payment?.shipping_cost || dev.valor_reembolso_frete,
          taxa_ml_reembolso: payment?.marketplace_fee || dev.taxa_ml_reembolso,
          custo_logistico_total: (shipping?.cost || 0) + (payment?.shipping_cost || 0),
          impacto_financeiro_vendedor: (payment?.transaction_amount || 0) + (shipping?.cost || 0),
          data_processamento_reembolso: payment?.date_approved || dev.data_processamento_reembolso,
          
          // ===== RESOLUÇÃO =====
          metodo_resolucao: claimData?.resolution?.type || dev.metodo_resolucao,
          resultado_final: claimData?.resolution?.outcome || dev.resultado_final,
          metodo_reembolso: claimData?.resolution?.refund_method || dev.metodo_reembolso,
          resultado_mediacao: claimData?.mediation?.resolution || dev.resultado_mediacao,
          
          // ===== MEDIAÇÃO =====
          em_mediacao: claimData?.mediation?.status === 'active' || false,
          data_inicio_mediacao: claimData?.mediation?.started_at || dev.data_inicio_mediacao,
          mediador_ml: claimData?.mediation?.mediator_id || dev.mediador_ml,
          status_moderacao: claimData?.moderation?.status || dev.status_moderacao,
          
          // ===== PRIORIDADE E FLAGS =====
          nivel_prioridade: (claimData?.mediation?.status === 'active' ? 'urgent' : 
                           claimData?.requires_seller_action ? 'high' : 'medium'),
          nivel_complexidade: claimData?.complexity || dev.nivel_complexidade,
          necessita_acao_manual: claimData?.requires_seller_action || false,
          acao_seller_necessaria: claimData?.requires_seller_action || false,
          eh_troca: claimData?.type === 'exchange' || false,
          escalado_para_ml: claimData?.escalated || false,
          
          // ===== MENSAGENS E COMUNICAÇÃO =====
          numero_interacoes: orderData?.messages?.length || dev.numero_interacoes || 0,
          mensagens_nao_lidas: orderData?.messages?.filter((m: any) => !m.read).length || 0,
          ultima_mensagem_data: orderData?.messages?.[0]?.date_created || dev.ultima_mensagem_data,
          ultima_mensagem_remetente: orderData?.messages?.[0]?.from?.role || dev.ultima_mensagem_remetente,
          qualidade_comunicacao: claimData?.communication_quality || dev.qualidade_comunicacao,
          
          // ===== DATAS E PRAZOS =====
          data_criacao: orderData?.date_created || dev.data_criacao,
          data_criacao_claim: claimData?.date_created || dev.data_criacao_claim,
          data_vencimento_acao: claimData?.deadline || dev.data_vencimento_acao,
          dias_restantes_acao: claimData?.deadline 
            ? Math.floor((new Date(claimData.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : dev.dias_restantes_acao,
          data_estimada_troca: claimData?.exchange?.estimated_date || dev.data_estimada_troca,
          data_limite_troca: claimData?.exchange?.deadline || dev.data_limite_troca,
          prazo_revisao_dias: claimData?.review_period_days || dev.prazo_revisao_dias,
          tempo_limite_acao: claimData?.action_limit || dev.tempo_limite_acao,
          
          // ===== REVIEW =====
          review_id: claimData?.review_id || dev.review_id,
          review_status: claimData?.review?.status || dev.review_status,
          review_result: claimData?.review?.result || dev.review_result,
          revisor_responsavel: claimData?.review?.reviewer || dev.revisor_responsavel,
          data_inicio_review: claimData?.review?.started_at || dev.data_inicio_review,
          score_qualidade: claimData?.quality_score || dev.score_qualidade,
          
          // ===== MÉTRICAS TEMPORAIS =====
          tempo_resposta_medio: claimData?.avg_response_time || dev.tempo_resposta_medio,
          tempo_total_resolucao: claimData?.total_resolution_time || dev.tempo_total_resolucao,
          tempo_primeira_resposta_vendedor: claimData?.first_seller_response_time || dev.tempo_primeira_resposta_vendedor,
          tempo_resposta_comprador: claimData?.buyer_response_time || dev.tempo_resposta_comprador,
          tempo_analise_ml: claimData?.ml_analysis_time || dev.tempo_analise_ml,
          dias_ate_resolucao: claimData?.resolution_days || dev.dias_ate_resolucao,
          sla_cumprido: claimData?.sla_met || true,
          
          // ===== SATISFAÇÃO =====
          satisfacao_comprador: claimData?.buyer_satisfaction || dev.satisfacao_comprador,
          taxa_satisfacao: claimData?.satisfaction_rate || dev.taxa_satisfacao,
          score_satisfacao_final: claimData?.final_satisfaction_score || dev.score_satisfacao_final,
          feedback_comprador_final: claimData?.buyer_feedback || dev.feedback_comprador_final,
          feedback_vendedor: claimData?.seller_feedback || dev.feedback_vendedor,
          eficiencia_resolucao: claimData?.resolution_efficiency || dev.eficiencia_resolucao,
          
          // ===== REPUTAÇÃO =====
          impacto_reputacao: claimData?.reputation_impact || dev.impacto_reputacao || 'low',
          seller_reputation: orderData?.seller?.reputation || dev.seller_reputation,
          buyer_reputation: buyer?.reputation || dev.buyer_reputation,
          
          // ===== PRÓXIMA AÇÃO =====
          proxima_acao_requerida: claimData?.next_action || dev.proxima_acao_requerida,
          
          // ===== ANEXOS =====
          anexos_count: (claimData?.attachments?.buyer?.length || 0) + 
                       (claimData?.attachments?.seller?.length || 0) + 
                       (claimData?.attachments?.ml?.length || 0),
          anexos_comprador: claimData?.attachments?.buyer || dev.anexos_comprador || [],
          anexos_vendedor: claimData?.attachments?.seller || dev.anexos_vendedor || [],
          anexos_ml: claimData?.attachments?.ml || dev.anexos_ml || [],
          total_evidencias: (claimData?.attachments?.buyer?.length || 0) + 
                           (claimData?.attachments?.seller?.length || 0),
          
          // ===== METADADOS =====
          dados_incompletos: !orderData && !claimData,
          campos_faltantes: [],
          ultima_sincronizacao: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          fonte_dados_primaria: orderData ? 'order_api' : 'claim_api',
          versao_api_utilizada: 'v1',
          confiabilidade_dados: orderData && claimData ? 'high' : orderData || claimData ? 'medium' : 'low'
        };

        // Atualizar no banco
        const { error: updateError } = await supabase
          .from('devolucoes_avancadas')
          .update(updateData)
          .eq('id', dev.id);

        if (updateError) {
          console.error(`[sync] ❌ Erro atualizar ${dev.order_id}:`, updateError);
          errorCount++;
        } else {
          console.log(`[sync] ✅ ${dev.order_id} enriquecido`);
          successCount++;
        }

      } catch (error: any) {
        console.error(`[sync] ❌ Erro ${dev.order_id}:`, error);
        errorCount++;
      }

      // Delay para não sobrecarregar API
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log(`[sync] 🎉 Concluído: ${successCount} OK, ${errorCount} erros`);

    return ok({
      success: true,
      enriched_count: successCount,
      error_count: errorCount,
      total_processed: devolucoes.length
    });

  } catch (error: any) {
    console.error('[sync] ❌ Erro geral:', error);
    return fail(`Erro: ${error.message}`);
  }
});
