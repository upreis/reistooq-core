/**
 * 📋 ML CLAIMS FETCH - Busca Claims do Mercado Livre
 * FASE 1: Busca básica de claims com enriquecimento de reasons
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { fetchWithRetry } from '../_shared/retryUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClaimFilters {
  status?: string;
  type?: string;
  stage?: string;
  date_from?: string;
  date_to?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // ✅ Usar SERVICE ROLE para operações internas (não precisa validar usuário)
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { accountId, sellerId, filters, limit, offset } = await req.json() as {
      accountId: string;
      sellerId: string;
      filters?: ClaimFilters;
      limit?: number;
      offset?: number;
    };

    console.log('[ml-claims-fetch] Buscando claims', { accountId, sellerId, filters });

    // ✅ Buscar token ML diretamente da tabela integration_secrets
    const { data: secretData, error: secretError } = await supabase
      .from('integration_secrets')
      .select('access_token, refresh_token')
      .eq('integration_account_id', accountId)
      .eq('provider', 'mercadolivre')
      .single();

    if (secretError || !secretData) {
      console.error('[ml-claims-fetch] Erro ao buscar token:', secretError);
      throw new Error('Token ML não encontrado');
    }

    const accessToken = secretData.access_token;

    if (!accessToken) {
      throw new Error('Access token não encontrado');
    }

    // Construir URL da busca usando os mesmos parâmetros que ml-api-direct
    const params = new URLSearchParams({
      player_role: 'respondent',
      player_user_id: sellerId.toString(),
      limit: (limit || 50).toString(),
      offset: (offset || 0).toString(),
      sort: 'date_created:desc'
    });

    // Adicionar filtros apenas se tiverem valor (igual ao ml-api-direct)
    if (filters?.type && filters.type.trim().length > 0) {
      params.append('type', filters.type);
    }
    if (filters?.stage && filters.stage.trim().length > 0) {
      params.append('stage', filters.stage);
    }
    if (filters?.status && filters.status.trim().length > 0) {
      params.append('status', filters.status);
    }

    // OBS: A API do ML não aceita date_from/date_to para claims
    // O filtro de data será aplicado client-side após buscar os dados

    const claimsUrl = `https://api.mercadolibre.com/post-purchase/v1/claims/search?${params}`;
    
    console.log('[ml-claims-fetch] Buscando claims da API ML', { url: claimsUrl });

    // ✅ Buscar claims COM RETRY (ML API pode ter rate limiting)
    const claimsRes = await fetchWithRetry(claimsUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    }, { maxRetries: 3, retryDelay: 1000 });

    if (!claimsRes.ok) {
      const errorText = await claimsRes.text();
      console.error('[ml-claims-fetch] Erro ML API', { status: claimsRes.status, error: errorText });
      throw new Error(`ML API error: ${claimsRes.status}`);
    }

    const claimsData = await claimsRes.json();
    let claims = claimsData.data || [];

    // 🔍 LOG TEMPORÁRIO - RESPOSTA RAW DA API ML
    console.log('🔍 RESPOSTA COMPLETA DA API ML:', JSON.stringify(claimsData, null, 2));
    console.log('🔍 PRIMEIRO CLAIM RAW:', JSON.stringify(claims[0], null, 2));
    
    console.log(`[ml-claims-fetch] ${claims.length} claims encontrados`);

    // Aplicar filtro de data client-side (API ML não aceita date_from/date_to)
    if (filters?.date_from || filters?.date_to) {
      const dateFrom = filters.date_from ? new Date(filters.date_from) : null;
      const dateTo = filters.date_to ? new Date(filters.date_to) : null;

      claims = claims.filter((claim: any) => {
        if (!claim.date_created) return false;
        const claimDate = new Date(claim.date_created);
        
        if (dateFrom && claimDate < dateFrom) return false;
        if (dateTo && claimDate > dateTo) return false;
        
        return true;
      });

      console.log(`[ml-claims-fetch] Após filtro de data: ${claims.length} claims`);
    }

    // 1️⃣ Coletar IDs únicos de reasons
    const uniqueReasonIds = [...new Set(claims.map((c: any) => c.reason_id).filter(Boolean))];
    console.log('🎯 Reasons a buscar:', {
      total: uniqueReasonIds.length,
      ids: uniqueReasonIds
    });

    // 2️⃣ Buscar todos os reasons de uma vez (batch)
    const reasonsMap = new Map<string, any>();
    
    await Promise.all(uniqueReasonIds.map(async (reasonId) => {
      try {
        const reasonUrl = `https://api.mercadolibre.com/post-purchase/v1/claims/reasons/${reasonId}`;
        const reasonRes = await fetch(reasonUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (reasonRes.ok) {
          const reasonData = await reasonRes.json();
          reasonsMap.set(reasonId, reasonData);
          console.log(`✅ Reason ${reasonId}:`, {
            id: reasonData.id,
            name: reasonData.name,
            detail: reasonData.detail,
            flow: reasonData.flow
          });
        } else {
          console.warn(`⚠️ Reason ${reasonId} não encontrado (${reasonRes.status})`);
        }
      } catch (error) {
        console.error(`❌ Erro ao buscar reason ${reasonId}:`, error);
      }
    }));

    console.log('✅ Reasons buscados:', {
      total: reasonsMap.size,
      ids: Array.from(reasonsMap.keys())
    });

    // ============================================
    // FUNÇÃO AUXILIAR: CALCULAR IMPACTO FINANCEIRO
    // ============================================
    
    function calcularImpactoFinanceiro(claim: any, resolution: any, amount: number) {
      let impacto_financeiro = 'neutro';
      let valor_impacto = 0;
      
      // Só calcular se claim estiver fechado e tiver resolução
      if (claim.status === 'closed' && resolution && resolution.benefited) {
        const beneficiado = Array.isArray(resolution.benefited)
          ? resolution.benefited[0]
          : resolution.benefited;
        
        if (beneficiado === 'complainant') {
          // Comprador ganhou - verificar se ML cobriu
          if (resolution.applied_coverage === true) {
            impacto_financeiro = 'coberto_ml';
            valor_impacto = 0; // ML pagou, você não perde
          } else {
            impacto_financeiro = 'perda';
            valor_impacto = -amount; // Você perde o valor
          }
        } else if (beneficiado === 'respondent') {
          // Vendedor ganhou
          impacto_financeiro = 'ganho';
          valor_impacto = amount; // Você mantém o valor
        }
      }
      
      return { impacto_financeiro, valor_impacto };
    }

    // 3️⃣ Enriquecer claims com os reasons
    const enrichedClaims = claims.map((claim: any) => {
      const reasonData = claim.reason_id ? reasonsMap.get(claim.reason_id) : null;

      // Extrair dados importantes
      const complainant = claim.players?.find((p: any) => p.role === 'complainant');
      const respondent = claim.players?.find((p: any) => p.role === 'respondent');
      const resolution = claim.resolution || {};
      const relatedEntities = claim.related_entities || [];
      
      // Pegar o valor do pedido
      const amount_value = claim.amount?.value || 0;
      
      // Calcular impacto financeiro
      const { impacto_financeiro, valor_impacto } = calcularImpactoFinanceiro(
        claim,
        resolution,
        amount_value
      );

      return {
        claim_id: String(claim.id),  // ✅ Converter NUMBER para STRING
        type: claim.type,
        status: claim.status,
        stage: claim.stage,
        resource_id: String(claim.resource_id),  // ✅ Converter NUMBER para STRING
        resource: claim.resource,
        reason_id: claim.reason_id,
        date_created: claim.date_created,
        last_updated: claim.last_updated,
        site_id: claim.site_id,
        
        // Reason (usando dados da API - priorizar "name" depois "id")
        reason_name: reasonData?.name || reasonData?.id || null,
        reason_detail: reasonData?.detail || null,
        reason_category: reasonData?.filter?.group?.[0] || null,
        
        // Players (extraídos corretamente do array)
        buyer_id: complainant?.user_id || null,
        buyer_nickname: null, // ✅ Será preenchido pelo enriquecimento de orders
        seller_id: respondent?.user_id || null,
        seller_nickname: null, // ✅ Será preenchido pelo enriquecimento de orders
        mediator_id: claim.players?.find((p: any) => p.role === 'mediator')?.user_id || null,
        
        // Valores (✅ CORRIGIDO: claim.amount, não claim.claim_details.amount)
        amount_value: amount_value,
        amount_currency: claim.amount?.currency_id || 'BRL',
        
        // Resolution (✅ CORRIGIDO: usando campos reais da API ML)
        resolution_type: null,  // ⚠️ API ML não fornece este campo
        resolution_subtype: null,  // ⚠️ API ML não fornece este campo
        resolution_benefited: resolution.benefited?.[0] || null,  // ✅ CORRIGIDO: Pegar primeiro elemento do array
        resolution_date: resolution.date_created || null,  // ✅ CORRIGIDO: date_created (não "date")
        resolution_amount: null,  // ⚠️ API ML não retorna este campo
        resolution_reason: resolution.reason || null,  // ✅ OK
        resolution_closed_by: resolution.closed_by || null,  // ✅ NOVO: "mediator", "complainant", "respondent"
        resolution_applied_coverage: resolution.applied_coverage || false,  // ✅ NOVO: boolean
        
        // 💰 IMPACTO FINANCEIRO (NOVO)
        impacto_financeiro: impacto_financeiro,
        valor_impacto: valor_impacto,
        
        // ✅ Data de vencimento: pegar de available_actions (para claims abertos) ou resolution.deadline (para resolvidos)
        data_vencimento_acao: respondent?.available_actions?.[0]?.due_date || resolution.deadline || null,
        
        // Related Entities (flags)
        tem_mensagens: relatedEntities.includes('messages'),
        tem_evidencias: relatedEntities.includes('evidences'),
        tem_trocas: relatedEntities.includes('changes'),
        tem_mediacao: claim.type === 'mediations',
        
        // Contadores (serão atualizados depois quando buscar detalhes)
        total_mensagens: 0,
        total_evidencias: 0,
        mensagens_nao_lidas: 0,
        
        // Order (será enriquecido depois)
        order_id: claim.resource === 'order' ? String(claim.resource_id) : null,  // ✅ Converter para STRING
        order_status: null,
        order_total: null,
        
        // ✅ TRACKING (será preenchido na fase 3)
        tracking_number: null,
        codigo_rastreamento: null, // ✅ Mesmo que tracking_number (compatibilidade)
        
        // Metadata
        integration_account_id: accountId,
        raw_data: claim,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    console.log('📊 Total de claims mapeados:', enrichedClaims.length);
    
    const claimsComReasons = enrichedClaims.filter(c => c.reason_name !== null);
    console.log(`✅ Claims com reason_name: ${claimsComReasons.length}/${enrichedClaims.length}`);
    
    // Log de estatísticas de impacto financeiro
    const stats = {
      total: enrichedClaims.length,
      ganho: enrichedClaims.filter(c => c.impacto_financeiro === 'ganho').length,
      perda: enrichedClaims.filter(c => c.impacto_financeiro === 'perda').length,
      coberto_ml: enrichedClaims.filter(c => c.impacto_financeiro === 'coberto_ml').length,
      neutro: enrichedClaims.filter(c => c.impacto_financeiro === 'neutro').length,
      soma_impacto: enrichedClaims.reduce((sum, c) => sum + (c.valor_impacto || 0), 0),
    };
    
    console.log('[ml-claims] 💰 Estatísticas de Impacto Financeiro:', stats);

    // ============================================
    // 🎯 FASE 2: BUSCAR DADOS DOS PEDIDOS (ORDERS) EM LOTES
    // ============================================
    
    // 1️⃣ Extrair order_ids únicos (apenas de claims do tipo "order")
    const orderIds = [
      ...new Set(
        claims
          .filter((claim: any) => claim.resource === 'order' && claim.resource_id)
          .map((claim: any) => String(claim.resource_id))
      )
    ];

    console.log(`📦 Encontrados ${orderIds.length} pedidos únicos para buscar.`);

    // 2️⃣ Criar Map para cachear dados dos pedidos
    const ordersMap = new Map<string, any>();

    // 3️⃣ Buscar pedidos em LOTES para evitar timeout
    const BATCH_SIZE = 10;   // Buscar 10 pedidos por vez
    const DELAY_MS = 200;    // Delay de 200ms entre lotes

    for (let i = 0; i < orderIds.length; i += BATCH_SIZE) {
      const batch = orderIds.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(orderIds.length / BATCH_SIZE);

      console.log(`🔄 Processando lote ${batchNumber}/${totalBatches} (${batch.length} pedidos)...`);

      // Buscar pedidos do lote em paralelo
      const batchPromises = batch.map(async (orderId) => {
        try {
          const orderUrl = `https://api.mercadolibre.com/orders/${orderId}`;
          const orderRes = await fetch(orderUrl, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });

          if (orderRes.ok) {
            const orderData = await orderRes.json();
            ordersMap.set(orderId, orderData);
            console.log(`✅ Pedido [${orderId}] buscado: ${orderData.buyer?.nickname || 'N/A'} → ${orderData.seller?.nickname || 'N/A'}`);
            return { success: true, orderId };
          } else {
            console.warn(`⚠️ Falha ao buscar pedido [${orderId}]. Status: ${orderRes.status}`);
            return { success: false, orderId };
          }
        } catch (error) {
          console.error(`❌ Erro ao buscar pedido [${orderId}]:`, error.message);
          return { success: false, orderId };
        }
      });

      // Aguardar conclusão do lote
      await Promise.all(batchPromises);

      // Delay entre lotes (exceto no último)
      if (i + BATCH_SIZE < orderIds.length) {
        console.log(`⏸️ Aguardando ${DELAY_MS}ms antes do próximo lote...`);
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    }

    console.log(`🎉 Busca de pedidos finalizada. ${ordersMap.size}/${orderIds.length} pedidos obtidos com sucesso.`);

    // ============================================
    // 📦 FASE 3: BUSCAR TRACKING NUMBERS DOS SHIPMENTS
    // ============================================
    
    console.log(`📦 Buscando tracking numbers de ${ordersMap.size} pedidos...`);
    
    const trackingMap = new Map<string, any>();
    
    for (const [orderId, orderData] of ordersMap) {
      const shipmentId = orderData?.shipping?.id;
      if (!shipmentId) continue;
      
      try {
        const trackingUrl = `https://api.mercadolibre.com/shipments/${shipmentId}`;
        const trackingRes = await fetch(trackingUrl, {
          headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'x-format-new': 'true' // ✅ CRÍTICO: Header para novo formato
          }
        });
        
        if (trackingRes.ok) {
          const trackingData = await trackingRes.json();
          trackingMap.set(orderId, {
            tracking_number: trackingData.tracking_number,
            tracking_method: trackingData.tracking_method,
            status: trackingData.status,
            substatus: trackingData.substatus
          });
          console.log(`✅ Tracking ${orderId}: ${trackingData.tracking_number || 'N/A'}`);
        } else {
          console.warn(`⚠️ Falha ao buscar tracking do pedido ${orderId}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao buscar tracking do pedido ${orderId}:`, error.message);
      }
    }
    
    console.log(`✅ ${trackingMap.size} tracking numbers obtidos`);

    // ============================================
    // 4️⃣ MAPEAMENTO FINAL COM DADOS ENRIQUECIDOS
    // ============================================

    const fullyEnrichedClaims = enrichedClaims.map((claim) => {
      const orderData = ordersMap.get(claim.order_id || '');
      const trackingData = trackingMap.get(claim.order_id || '');

      // Se temos dados do pedido, enriquecer
      if (orderData) {
        return {
          ...claim,
          buyer_nickname: orderData.buyer?.nickname || claim.buyer_nickname,
          seller_nickname: orderData.seller?.nickname || claim.seller_nickname,
          amount_value: orderData.total_amount || claim.amount_value,
          amount_currency: orderData.currency_id || claim.amount_currency,
          order_status: orderData.status || null,
          order_status_detail: orderData.status_detail || null,
          order_total: orderData.total_amount || null,
          order_date_created: orderData.date_created || null,
          order_item_title: orderData.order_items?.[0]?.item?.title || null,
          order_item_quantity: orderData.order_items?.[0]?.quantity || null,
          order_item_unit_price: orderData.order_items?.[0]?.unit_price || null,
          order_item_seller_sku: orderData.order_items?.[0]?.item?.seller_sku || null,
          // ✅ ADICIONAR TRACKING NUMBER
          tracking_number: trackingData?.tracking_number || null,
          tracking_method: trackingData?.tracking_method || null,
          tracking_status: trackingData?.status || null,
          tracking_substatus: trackingData?.substatus || null,
          // ✅ COMPATIBILIDADE: Preencher codigo_rastreamento também
          codigo_rastreamento: trackingData?.tracking_number || null,
        };
      }

      // Caso contrário, manter o claim original
      return claim;
    });

    console.log('✅ Enriquecimento com orders concluído');
    
    const claimsComBuyerNickname = fullyEnrichedClaims.filter(c => c.buyer_nickname !== null);
    const claimsComSellerNickname = fullyEnrichedClaims.filter(c => c.seller_nickname !== null);
    const claimsComReasonName = fullyEnrichedClaims.filter(c => c.reason_name !== null);
    
    console.log('📊 AUDITORIA FINAL:', {
      total: fullyEnrichedClaims.length,
      comBuyerNickname: claimsComBuyerNickname.length,
      comSellerNickname: claimsComSellerNickname.length,
      comReasonName: claimsComReasonName.length
    });
    
    console.log('🔍 PRIMEIRO CLAIM FINAL:', JSON.stringify(fullyEnrichedClaims[0], null, 2));

    // Buscar organization_id da conta
    const { data: accountData } = await supabase
      .from('integration_accounts')
      .select('organization_id')
      .eq('id', accountId)
      .single();

    const organizationId = accountData?.organization_id;

    // Salvar ou atualizar claims no banco
    const claimsToUpsert = fullyEnrichedClaims.map(claim => ({
      ...claim,
      organization_id: organizationId
    }));

    if (claimsToUpsert.length > 0) {
      const { error: upsertError } = await supabase
        .from('reclamacoes')
        .upsert(claimsToUpsert, {
          onConflict: 'claim_id',
          ignoreDuplicates: false
        });

      if (upsertError) {
        console.error('[ml-claims-fetch] Erro ao salvar claims', upsertError);
        throw upsertError;
      }

      console.log(`[ml-claims-fetch] ${claimsToUpsert.length} claims salvos no banco`);

      // ============================================
      // 🔢 BUSCAR CONTADORES REAIS (mensagens, evidências, não lidas)
      // ============================================
      
      const contadoresMap = new Map<string, { total_mensagens: number; total_evidencias: number; mensagens_nao_lidas: number }>();

      // 1️⃣ Buscar MENSAGENS para claims que têm mensagens
      const claimsComMensagens = fullyEnrichedClaims.filter(c => c.tem_mensagens);
      console.log(`📨 Buscando mensagens para ${claimsComMensagens.length} claims...`);

      for (const claim of claimsComMensagens) {
        try {
          const messagesUrl = `https://api.mercadolibre.com/post-purchase/v1/claims/${claim.claim_id}/messages`;
          const messagesRes = await fetch(messagesUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });

          if (messagesRes.ok) {
            const messagesData = await messagesRes.json();
            const messages = messagesData.messages || [];
            const unreadCount = messagesData.unread_messages || 0;

            // Atualizar map de contadores
            const existingCounters = contadoresMap.get(claim.claim_id) || { total_mensagens: 0, total_evidencias: 0, mensagens_nao_lidas: 0 };
            contadoresMap.set(claim.claim_id, {
              ...existingCounters,
              total_mensagens: messages.length,
              mensagens_nao_lidas: unreadCount
            });

            console.log(`✅ Claim ${claim.claim_id}: ${messages.length} mensagens (${unreadCount} não lidas)`);
          }
        } catch (error) {
          console.error(`[ml-claims-fetch] Erro ao buscar mensagens do claim ${claim.claim_id}`, error);
        }
      }

      // 2️⃣ Buscar EVIDÊNCIAS para claims que têm evidências
      const claimsComEvidencias = fullyEnrichedClaims.filter(c => c.tem_evidencias);
      console.log(`📎 Buscando evidências para ${claimsComEvidencias.length} claims...`);
      
      for (const claim of claimsComEvidencias) {
        try {
          const evidenciasUrl = `https://api.mercadolibre.com/post-purchase/v1/claims/${claim.claim_id}/evidences`;
          const evidenciasRes = await fetch(evidenciasUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });

          if (evidenciasRes.ok) {
            const evidenciasData = await evidenciasRes.json();
            const evidencias = evidenciasData.data || [];

            // Atualizar map de contadores
            const existingCounters = contadoresMap.get(claim.claim_id) || { total_mensagens: 0, total_evidencias: 0, mensagens_nao_lidas: 0 };
            contadoresMap.set(claim.claim_id, {
              ...existingCounters,
              total_evidencias: evidencias.length
            });

            if (evidencias.length > 0) {
              const evidenciasToUpsert = evidencias.map((ev: any) => ({
                id: ev.id,
                claim_id: claim.claim_id,
                type: ev.type,
                url: ev.url,
                uploader_id: ev.uploader_id,
                uploader_role: ev.uploader_role,
                date_created: ev.date_created,
                status: ev.status,
                description: ev.description
              }));

              await supabase
                .from('reclamacoes_evidencias')
                .upsert(evidenciasToUpsert, { onConflict: 'id' });

              console.log(`✅ Claim ${claim.claim_id}: ${evidencias.length} evidências salvas`);
            }
          }
        } catch (error) {
          console.error(`[ml-claims-fetch] Erro ao buscar evidências do claim ${claim.claim_id}`, error);
        }
      }

      // 3️⃣ ATUALIZAR CONTADORES NO BANCO
      console.log(`🔄 Atualizando contadores de ${contadoresMap.size} claims...`);
      
      for (const [claimId, contadores] of contadoresMap.entries()) {
        await supabase
          .from('reclamacoes')
          .update({
            total_mensagens: contadores.total_mensagens,
            total_evidencias: contadores.total_evidencias,
            mensagens_nao_lidas: contadores.mensagens_nao_lidas,
            updated_at: new Date().toISOString()
          })
          .eq('claim_id', claimId);
      }

      console.log(`✅ Contadores atualizados com sucesso!`);

      // ============================================
      // 🔄 BUSCAR DADOS DE TROCAS (CHANGES)
      // ============================================
      
      // ⚠️ ATENÇÃO: A API /claims/search NÃO retorna related_entities
      // Solução: Tentar buscar /changes para todos os claims e tratar 404
      console.log(`🔄 Verificando trocas para ${fullyEnrichedClaims.length} claims...`);
      
      let trocasEncontradas = 0;
      
      for (const claim of fullyEnrichedClaims) {
        try {
          const changesUrl = `https://api.mercadolibre.com/post-purchase/v1/claims/${claim.claim_id}/changes`;
          const changesRes = await fetch(changesUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });

          if (changesRes.ok) {
            const changesData = await changesRes.json();
            
            // ✅ Encontrou troca! Marcar flag
            trocasEncontradas++;
            
            // Extrair dados da troca
            const changeStatus = changesData.status || null;
            const changeStatusDetail = changesData.status_detail || null;
            const changeType = changesData.type || null;
            const changeReturnId = changesData.return?.id ? String(changesData.return.id) : null;
            const changeDateCreated = changesData.date_created || null;
            
            // Processar estimated_exchange_date
            const estimatedExchange = changesData.estimated_exchange_date || {};
            const changeEstimatedStart = estimatedExchange.from || null;
            const changeEstimatedEnd = estimatedExchange.to || null;
            
            // Processar itens da troca
            const changeItems = (changesData.items || []).map((item: any) => ({
              id: item.id,
              quantity: item.quantity,
              price: item.price,
              price_at_creation: item.price_at_creation,
              variation_id: item.variation_id,
              currency_id: item.currency_id
            }));
            
            // Processar novos pedidos
            const newOrders = {
              ids: changesData.new_orders_ids || [],
              shipments: changesData.new_orders_shipments || []
            };

            // Atualizar claim com dados de troca
            await supabase
              .from('reclamacoes')
              .update({
                tem_trocas: true, // ✅ Marcar como tendo troca
                total_trocas: 1,
                troca_status: changeStatus,
                troca_status_detail: changeStatusDetail,
                troca_type: changeType,
                troca_data_criacao: changeDateCreated,
                troca_data_estimada_inicio: changeEstimatedStart,
                troca_data_estimada_fim: changeEstimatedEnd,
                troca_return_id: changeReturnId,
                troca_new_orders: newOrders,
                troca_items: changeItems,
                troca_raw_data: changesData,
                updated_at: new Date().toISOString()
              })
              .eq('claim_id', claim.claim_id);

            console.log(`✅ Claim ${claim.claim_id}: Troca [${changeType}] status=${changeStatus} (${changeItems.length} itens)`);
          } else if (changesRes.status === 404) {
            // 404 = Não tem troca, é esperado para a maioria dos claims
            // Não fazer nada, apenas continuar
          } else {
            console.warn(`⚠️ Erro ao buscar troca do claim ${claim.claim_id}. Status: ${changesRes.status}`);
          }
        } catch (error) {
          console.error(`❌ Erro ao buscar troca do claim ${claim.claim_id}:`, error.message);
        }
      }

      console.log(`✅ Busca de trocas concluída! ${trocasEncontradas} trocas encontradas de ${fullyEnrichedClaims.length} claims.`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: fullyEnrichedClaims.length,
        claims: fullyEnrichedClaims,
        paging: claimsData.paging || {}
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[ml-claims-fetch] Erro:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
