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

    // Validar seller_id recebido
    if (!sellerId) {
      console.error('[ml-claims-fetch] seller_id não fornecido', { accountId });
      throw new Error('seller_id não fornecido. Informe o seller_id da conta.');
    }

    // Construir URL da busca com paginação
    const params = new URLSearchParams({
      seller_id: sellerId.toString(),
      limit: (limit || 50).toString(),
      offset: (offset || 0).toString()
    });

    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);

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
    const claims = claimsData.data || [];

    console.log(`[ml-claims-fetch] ${claims.length} claims encontrados`);

    // Cache de reasons para evitar chamadas repetidas
    const reasonsCache = new Map<string, any>();

    // Enriquecer claims com reasons
    const enrichedClaims = await Promise.all(claims.map(async (claim: any) => {
      let reasonData = null;

      if (claim.reason_id && !reasonsCache.has(claim.reason_id)) {
        try {
          const reasonUrl = `https://api.mercadolibre.com/post-purchase/v1/claims/reasons/${claim.reason_id}`;
          const reasonRes = await fetch(reasonUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });

          if (reasonRes.ok) {
            reasonData = await reasonRes.json();
            reasonsCache.set(claim.reason_id, reasonData);
          }
        } catch (error) {
          console.error(`[ml-claims-fetch] Erro ao buscar reason ${claim.reason_id}`, error);
        }
      } else if (claim.reason_id) {
        reasonData = reasonsCache.get(claim.reason_id);
      }

      // Extrair dados importantes
      const players = claim.players || {};
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
        
        // Reason
        reason_name: reasonData?.reason_name || null,
        reason_detail: reasonData?.reason_detail || null,
        reason_category: reasonData?.category || null,
        
        // Players
        buyer_id: players.buyer?.id || null,
        buyer_nickname: players.buyer?.nickname || null,
        seller_id: players.seller?.id || null,
        seller_nickname: players.seller?.nickname || null,
        mediator_id: players.mediator?.id || null,
        
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
        tem_mediacao: claim.type === 'mediation',
        
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
    }));

    // Buscar organization_id da conta
    const { data: accountData } = await supabase
      .from('integration_accounts')
      .select('organization_id')
      .eq('id', accountId)
      .single();

    const organizationId = accountData?.organization_id;

    // Salvar ou atualizar claims no banco
    const claimsToUpsert = enrichedClaims.map(claim => ({
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
      const claimsComEvidencias = enrichedClaims.filter(c => c.tem_evidencias);
      
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
