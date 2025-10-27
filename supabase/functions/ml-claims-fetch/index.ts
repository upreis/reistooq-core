/**
 * 📋 ML CLAIMS FETCH - Busca Claims do Mercado Livre
 * FASE 1: Busca básica de claims com enriquecimento de reasons
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

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
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } }
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { accountId, sellerId, filters, limit, offset } = await req.json() as {
      accountId: string;
      sellerId: string;
      filters?: ClaimFilters;
      limit?: number;
      offset?: number;
    };

    console.log('[ml-claims-fetch] Buscando claims', { accountId, sellerId, filters });

    // Buscar token ML
    const tokenUrl = `${supabaseUrl}/functions/v1/integrations-get-secret`;
    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'x-internal-call': 'true',
        'x-internal-token': Deno.env.get('INTERNAL_SHARED_TOKEN') || ''
      },
      body: JSON.stringify({
        integration_account_id: accountId,
        provider: 'mercadolivre'
      })
    });

    if (!tokenRes.ok) {
      throw new Error('Token ML indisponível');
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.secret?.access_token;

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

    const claimsRes = await fetch(claimsUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

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
          console.log(`[ml-claims-fetch] ✅ Reason ${reasonId} encontrado:`, reasonData?.name || 'sem nome');
        } else {
          console.warn(`[ml-claims-fetch] ⚠️ Reason ${reasonId} não encontrado (${reasonRes.status})`);
        }
      } catch (error) {
        console.error(`[ml-claims-fetch] ❌ Erro ao buscar reason ${reasonId}:`, error);
      }
    }));

    console.log('✅ Reasons buscados:', {
      total: reasonsMap.size,
      ids: Array.from(reasonsMap.keys())
    });

    // 3️⃣ Enriquecer claims com os reasons
    const enrichedClaims = claims.map((claim: any) => {
      const reasonData = claim.reason_id ? reasonsMap.get(claim.reason_id) : null;

      // Extrair dados importantes
      const complainant = claim.players?.find((p: any) => p.role === 'complainant');
      const respondent = claim.players?.find((p: any) => p.role === 'respondent');
      const resolution = claim.resolution || {};
      const relatedEntities = claim.related_entities || [];

      return {
        claim_id: claim.id,
        type: claim.type,
        status: claim.status,
        stage: claim.stage,
        resource_id: claim.resource_id,
        resource: claim.resource,
        reason_id: claim.reason_id,
        date_created: claim.date_created,
        last_updated: claim.last_updated,
        site_id: claim.site_id,
        
        // Reason (usando dados da API - campos corretos)
        reason_name: reasonData?.id || null,
        reason_detail: reasonData?.detail || null,
        reason_category: reasonData?.filter?.group?.[0] || null,
        
        // Players (extraídos corretamente do array)
        buyer_id: complainant?.user_id || null,
        buyer_nickname: complainant?.nickname || null,
        seller_id: respondent?.user_id || null,
        seller_nickname: respondent?.nickname || null,
        mediator_id: claim.players?.find((p: any) => p.role === 'mediator')?.user_id || null,
        
        // Valores
        amount_value: claim.claim_details?.amount?.value || 0,
        amount_currency: claim.claim_details?.amount?.currency_id || 'BRL',
        
        // Resolution
        resolution_type: resolution.type || null,
        resolution_subtype: resolution.subtype || null,
        resolution_benefited: resolution.benefited || null,
        resolution_date: resolution.date || null,
        resolution_amount: resolution.amount?.value || null,
        resolution_reason: resolution.reason || null,
        
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
        order_id: claim.resource_id,
        order_status: null,
        order_total: null,
        
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

    // 4️⃣ ETAPA 2: Enriquecer com dados dos PEDIDOS (Orders)
    console.log('🛒 Iniciando enriquecimento com dados dos pedidos...');
    
    const fullyEnrichedClaims = await Promise.all(enrichedClaims.map(async (claim) => {
      // Só buscar orders para claims de pedidos (resource === 'order')
      if (claim.resource !== 'order' || !claim.order_id) {
        return claim;
      }

      try {
        const orderUrl = `https://api.mercadolibre.com/orders/${claim.order_id}`;
        const orderResponse = await fetch(orderUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (orderResponse.ok) {
          const order = await orderResponse.json();
          
          console.log(`[ml-claims-fetch] 🛒 Order ${claim.order_id} enriquecido`);
          
          return {
            ...claim,
            buyer_nickname: order.buyer?.nickname || claim.buyer_nickname,
            seller_nickname: order.seller?.nickname || claim.seller_nickname,
            amount_value: order.total_amount || claim.amount_value,
            amount_currency: order.currency_id || claim.amount_currency,
            order_status: order.status || null,
            order_total: order.total_amount || null
          };
        } else {
          console.warn(`[ml-claims-fetch] ⚠️ Order ${claim.order_id} não encontrado (${orderResponse.status})`);
        }
      } catch (error) {
        console.error(`[ml-claims-fetch] ❌ Erro ao buscar order ${claim.order_id}:`, error);
      }

      return claim;
    }));

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

      // Buscar evidências para claims que têm evidências
      const claimsComEvidencias = fullyEnrichedClaims.filter(c => c.tem_evidencias);
      
      for (const claim of claimsComEvidencias) {
        try {
          const evidenciasUrl = `https://api.mercadolibre.com/post-purchase/v1/claims/${claim.claim_id}/evidences`;
          const evidenciasRes = await fetch(evidenciasUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });

          if (evidenciasRes.ok) {
            const evidenciasData = await evidenciasRes.json();
            const evidencias = evidenciasData.data || [];

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

              console.log(`[ml-claims-fetch] ${evidencias.length} evidências salvas para claim ${claim.claim_id}`);
            }
          }
        } catch (error) {
          console.error(`[ml-claims-fetch] Erro ao buscar evidências do claim ${claim.claim_id}`, error);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: enrichedClaims.length,
        claims: enrichedClaims,
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
