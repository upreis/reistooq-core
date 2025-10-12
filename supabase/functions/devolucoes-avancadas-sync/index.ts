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

        // Preparar dados para atualização
        const updateData: any = {
          // Dados Order
          dados_order: orderData || dev.dados_order,
          produto_titulo: orderData?.order_items?.[0]?.item?.title || dev.produto_titulo,
          sku: orderData?.order_items?.[0]?.item?.seller_sku || dev.sku,
          account_name: tokenData.account_name || dev.account_name,
          quantidade: orderData?.order_items?.[0]?.quantity || dev.quantidade || 1,
          valor_retido: orderData?.total_amount || dev.valor_retido || 0,
          status_devolucao: orderData?.status || dev.status_devolucao,
          
          // Dados Claim
          dados_claim: claimData || dev.dados_claim,
          tipo_claim: claimData?.type || dev.tipo_claim,
          subtipo_claim: claimData?.sub_type || dev.subtipo_claim,
          motivo_categoria: claimData?.reason_id || dev.motivo_categoria,
          
          // Rastreamento
          codigo_rastreamento: orderData?.shipping?.tracking_number || dev.codigo_rastreamento,
          transportadora: orderData?.shipping?.carrier || dev.transportadora,
          status_rastreamento: orderData?.shipping?.status || dev.status_rastreamento,
          
          // Custos
          custo_envio_devolucao: orderData?.shipping?.cost || dev.custo_envio_devolucao,
          valor_compensacao: claimData?.compensation_amount || dev.valor_compensacao,
          moeda_custo: orderData?.currency_id || 'BRL',
          
          // Resolução
          metodo_resolucao: claimData?.resolution?.type || dev.metodo_resolucao,
          resultado_final: claimData?.resolution?.outcome || dev.resultado_final,
          em_mediacao: claimData?.mediation?.status === 'active' || false,
          
          // Prioridade
          nivel_prioridade: (claimData?.mediation?.status === 'active' ? 'urgent' : 
                           claimData?.requires_seller_action ? 'high' : 'medium'),
          
          // Flags
          necessita_acao_manual: claimData?.requires_seller_action || false,
          eh_troca: claimData?.type === 'exchange' || false,
          
          // Metadados
          dados_incompletos: !orderData && !claimData,
          ultima_sincronizacao: new Date().toISOString(),
          updated_at: new Date().toISOString()
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
