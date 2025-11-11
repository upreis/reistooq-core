/**
 * 🔥 GET DEVOLUCOES DIRECT - BUSCA DIRETO DA API ML
 * Copia EXATA do padrão de ml-claims-fetch que FUNCIONA
 * NÃO usa cache do banco - SEMPRE busca fresco da API
 * ✅ APLICA MAPEAMENTO COMPLETO usando mappers consolidados
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { fetchWithRetry } from '../_shared/retryUtils.ts';

// ✅ Importar função de mapeamento completo
import { mapDevolucaoCompleta } from './mapeamento.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { 
      integration_account_id, 
      date_from, 
      date_to 
    } = await req.json();

    console.log('[get-devolucoes-direct] Parâmetros:', { integration_account_id, date_from, date_to });

    // ✅ Buscar dados da conta com SERVICE CLIENT
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    const { data: account, error: accountError } = await supabase
      .from('integration_accounts')
      .select('account_identifier')
      .eq('id', integration_account_id)
      .eq('is_active', true)
      .single();

    if (accountError || !account) {
      console.error('[get-devolucoes-direct] Account error:', accountError);
      throw new Error(`Conta ML não encontrada: ${accountError?.message || 'No account data'}`);
    }

    const sellerId = account.account_identifier;
    const accountName = `Conta ${sellerId}`; // Nome padrão baseado no ID

    // ✅ Buscar integration_secrets DIRETO do banco (igual unified-orders)
    const { data: secretRow, error: secretError } = await supabase
      .from('integration_secrets')
      .select('simple_tokens, use_simple, secret_enc, provider, expires_at, access_token, refresh_token')
      .eq('integration_account_id', integration_account_id)
      .eq('provider', 'mercadolivre')
      .maybeSingle();

    if (secretError || !secretRow) {
      console.error('[get-devolucoes-direct] Erro ao buscar secrets:', secretError);
      throw new Error('Token ML não encontrado. Reconecte a integração.');
    }

    let accessToken = '';
    
    // ✅ Descriptografar usando método EXATO de unified-orders
    // Primeiro: tentar nova estrutura simples
    if (secretRow?.use_simple && secretRow?.simple_tokens) {
      try {
        const simpleTokensStr = secretRow.simple_tokens as string;
        console.log('[get-devolucoes-direct] Descriptografando simple_tokens');
        
        // Remover prefixo SALT2024:: e descriptografar base64
        if (simpleTokensStr.startsWith('SALT2024::')) {
          const base64Data = simpleTokensStr.replace('SALT2024::', '');
          const jsonStr = atob(base64Data);
          const tokensData = JSON.parse(jsonStr);
          accessToken = tokensData.access_token || '';
          console.log('[get-devolucoes-direct] ✅ Token descriptografado com sucesso');
        }
      } catch (err) {
        console.error('[get-devolucoes-direct] Erro descriptografia simples:', err);
      }
    }

    if (!accessToken) {
      throw new Error('Token ML não disponível. Reconecte a integração.');
    }

    // ✅ BUSCAR CLAIMS DA API ML COM PAGINAÇÃO
    let allClaims: any[] = [];
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
      const params = new URLSearchParams({
        player_role: 'respondent',
        player_user_id: sellerId.toString(),
        limit: limit.toString(),
        offset: offset.toString(),
        sort: 'date_created:desc'
      });

      const claimsUrl = `https://api.mercadolibre.com/post-purchase/v1/claims/search?${params}`;
      
      console.log(`[get-devolucoes-direct] Buscando página offset=${offset}`);

      // ✅ CORREÇÃO 3: Usar fetchWithRetry para tratar 429 automaticamente
      const claimsRes = await fetchWithRetry(claimsUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }, { maxRetries: 3, retryDelay: 1000, retryOnStatus: [429, 500, 502, 503, 504] });

      if (!claimsRes.ok) {
        const errorText = await claimsRes.text();
        console.error('[get-devolucoes-direct] Erro ML API:', errorText);
        throw new Error(`ML API error: ${claimsRes.status}`);
      }

      const claimsData = await claimsRes.json();
      const claims = claimsData.data || [];
      
      console.log(`[get-devolucoes-direct] Página offset=${offset}: ${claims.length} claims`);

      if (claims.length === 0) {
        hasMore = false;
      } else {
        allClaims.push(...claims);
        offset += limit;
        
        // Se retornou menos que o limite, não há mais páginas
        if (claims.length < limit) {
          hasMore = false;
        }
      }
    }

    console.log(`[get-devolucoes-direct] Total de ${allClaims.length} claims da API ML`);
    let claims = allClaims;

    // ✅ FILTRAR POR DATA CLIENT-SIDE (igual ml-claims-fetch)
    if (date_from || date_to) {
      const dateFromObj = date_from ? new Date(date_from) : null;
      const dateToObj = date_to ? new Date(date_to) : null;

      claims = claims.filter((claim: any) => {
        const claimDate = new Date(claim.date_created);
        if (dateFromObj && claimDate < dateFromObj) return false;
        if (dateToObj && claimDate > dateToObj) return false;
        return true;
      });

      console.log(`[get-devolucoes-direct] Após filtro de data: ${claims.length} claims`);
    }

    // ✅ ENRIQUECER SEQUENCIALMENTE (evitar rate limit 429)
    console.log('[get-devolucoes-direct] Enriquecendo dados sequencialmente...');
    
    const allEnrichedClaims: any[] = [];
    const DELAY_BETWEEN_REQUESTS = 100; // 100ms entre cada request individual
    
    for (let i = 0; i < claims.length; i++) {
      const claim = claims[i];
      console.log(`🔄 Processando claim ${i + 1}/${claims.length} (ID: ${claim.id})...`);
      
      try {
        // ✅ 1. Buscar dados COMPLETOS do pedido (order_data)
        let orderData = null;
        if (claim.resource_id) {
          try {
            // ✅ CORREÇÃO 3: Usar fetchWithRetry
            const orderRes = await fetchWithRetry(
              `https://api.mercadolibre.com/orders/${claim.resource_id}`,
              { headers: { 'Authorization': `Bearer ${accessToken}` } },
              { maxRetries: 2, retryDelay: 500, retryOnStatus: [429, 500, 502, 503] }
            );
            if (orderRes.ok) {
              orderData = await orderRes.json();
              console.log(`✅ Order ${claim.resource_id} buscado`);
            }
            await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
          } catch (err) {
            console.error(`❌ Erro ao buscar order ${claim.resource_id}:`, err);
          }
        }

        // ✅ 2. Buscar mensagens do claim
        let messagesData = null;
        try {
          // ✅ CORREÇÃO 3: Usar fetchWithRetry
          const messagesRes = await fetchWithRetry(
            `https://api.mercadolibre.com/post-purchase/v1/claims/${claim.id}/messages`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } },
            { maxRetries: 2, retryDelay: 500, retryOnStatus: [429, 500, 502, 503] }
          );
          if (messagesRes.ok) {
            messagesData = await messagesRes.json();
            console.log(`✅ Messages do claim ${claim.id} buscadas`);
          }
          await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
        } catch (err) {
          console.error(`❌ Erro ao buscar messages do claim ${claim.id}:`, err);
        }

        // ✅ 3. Buscar dados COMPLETOS de return (return_details_v2)
        let returnData = null;
        try {
          // ✅ CORREÇÃO 3: Usar fetchWithRetry
          const returnRes = await fetchWithRetry(
            `https://api.mercadolibre.com/post-purchase/v2/claims/${claim.id}/returns`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } },
            { maxRetries: 2, retryDelay: 500, retryOnStatus: [429, 500, 502, 503] }
          );
          if (returnRes.ok) {
            returnData = await returnRes.json();
            console.log(`✅ Return do claim ${claim.id} buscado`);
          }
          await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
        } catch (err) {
          // Return pode não existir para alguns claims (normal)
        }

        // ✅ 4. Buscar reviews SE existir related_entities
        let reviewsData = null;
        if (returnData?.id && returnData?.related_entities?.includes('reviews')) {
          try {
            // ✅ CORREÇÃO 3: Usar fetchWithRetry
            const reviewsRes = await fetchWithRetry(
              `https://api.mercadolibre.com/post-purchase/v1/returns/${returnData.id}/reviews`,
              { headers: { 'Authorization': `Bearer ${accessToken}` } },
              { maxRetries: 2, retryDelay: 500, retryOnStatus: [429, 500, 502, 503] }
            );
            if (reviewsRes.ok) {
              reviewsData = await reviewsRes.json();
              console.log(`✅ Reviews do return ${returnData.id} buscadas`);
            }
            await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
          } catch (err) {
            console.error(`❌ Erro ao buscar reviews:`, err);
          }
        }

        allEnrichedClaims.push({
          ...claim,
          order_data: orderData,
          claim_messages: messagesData,
          return_details_v2: returnData,
          review_details: reviewsData
        });
      } catch (err) {
        console.error(`❌ Erro ao enriquecer claim ${claim.id}:`, err);
        allEnrichedClaims.push(claim);
      }
    }
    
    console.log(`[get-devolucoes-direct] ${allEnrichedClaims.length} claims enriquecidos com sucesso`);

    // ✅ MAPEAR DADOS USANDO MAPPERS CONSOLIDADOS
    console.log('[get-devolucoes-direct] Mapeando dados...');
    const mappedClaims = allEnrichedClaims.map((claim: any, index: number) => {
      try {
        // 🔍 DEBUG: Log estrutura de dados do primeiro claim
        if (index === 0) {
          console.log('🔍 ESTRUTURA DO CLAIM ENRIQUECIDO:', {
            claim_id: claim.id,
            claim_keys: Object.keys(claim),
            order_data_exists: !!claim.order_data,
            order_data_keys: claim.order_data ? Object.keys(claim.order_data).slice(0, 10) : [],
            return_exists: !!claim.return_details_v2,
            return_keys: claim.return_details_v2 ? Object.keys(claim.return_details_v2) : []
          });
        }
        
        // ✅ Estruturar dados no formato esperado pelos mappers
        const item = {
          claim_details: claim,  // Claim básico da API /claims/search
          order_data: claim.order_data,  // Dados completos de /orders/{id}
          claim_messages: claim.claim_messages,  // Mensagens de /claims/{id}/messages
          return_details_v2: claim.return_details_v2,  // Return de /claims/{id}/returns
          review_details: claim.review_details,  // ✅ CORRIGIDO: Reviews de /returns/{id}/reviews
          amount: claim.seller_amount || null
        };

        return mapDevolucaoCompleta(item, integration_account_id, accountName, null);
      } catch (err) {
        console.error('[get-devolucoes-direct] Erro ao mapear claim:', claim.id, err);
        return null;
      }
    }).filter(Boolean);

    console.log(`[get-devolucoes-direct] ${mappedClaims.length} claims mapeados com sucesso`);

    // ✅ RETORNAR DADOS MAPEADOS
    return new Response(
      JSON.stringify({
        success: true,
        data: mappedClaims,
        total: mappedClaims.length,
        integration_account_id,
        date_range: { from: date_from, to: date_to }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('[get-devolucoes-direct] Erro:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
