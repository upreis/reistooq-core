/**
 * 🔥 GET DEVOLUCOES DIRECT - BUSCA DIRETO DA API ML
 * Copia EXATA do padrão de ml-claims-fetch que FUNCIONA
 * NÃO usa cache do banco - SEMPRE busca fresco da API
 * ✅ APLICA MAPEAMENTO COMPLETO usando mappers consolidados
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

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

      const claimsRes = await fetch(claimsUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

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

    // ✅ ENRIQUECER DADOS - Buscar pedido, mensagens e return para cada claim
    console.log('[get-devolucoes-direct] Enriquecendo dados...');
    const enrichedClaims = await Promise.all(
      claims.map(async (claim: any) => {
        try {
          // ✅ 1. Buscar dados COMPLETOS do pedido (order_data)
          let orderData = null;
          if (claim.resource_id) {
            try {
              const orderRes = await fetch(
                `https://api.mercadolibre.com/orders/${claim.resource_id}`,
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
              );
              if (orderRes.ok) {
                orderData = await orderRes.json();
              }
            } catch (err) {
              console.error(`[get-devolucoes-direct] Erro ao buscar order ${claim.resource_id}:`, err);
            }
          }

          // ✅ 2. Buscar mensagens do claim
          let messagesData = null;
          try {
            const messagesRes = await fetch(
              `https://api.mercadolibre.com/post-purchase/v1/claims/${claim.id}/messages`,
              { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
            if (messagesRes.ok) {
              messagesData = await messagesRes.json();
            }
          } catch (err) {
            console.error(`[get-devolucoes-direct] Erro ao buscar messages do claim ${claim.id}:`, err);
          }

          // ✅ 3. Buscar dados COMPLETOS de return (return_details_v2)
          let returnData = null;
          try {
            const returnRes = await fetch(
              `https://api.mercadolibre.com/post-purchase/v2/claims/${claim.id}/returns`,
              { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
            if (returnRes.ok) {
              returnData = await returnRes.json();
            }
          } catch (err) {
            // Return pode não existir para alguns claims (normal)
          }

          // ✅ 4. Buscar reviews SE existir related_entities
          let reviewsData = null;
          if (returnData?.id && returnData?.related_entities?.includes('reviews')) {
            try {
              const reviewsRes = await fetch(
                `https://api.mercadolibre.com/post-purchase/v1/returns/${returnData.id}/reviews`,
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
              );
              if (reviewsRes.ok) {
                reviewsData = await reviewsRes.json();
              }
            } catch (err) {
              // Reviews podem não existir
            }
          }

          return {
            ...claim,
            order_data: orderData,
            claim_messages: messagesData,
            return_details_v2: returnData,
            review_details: reviewsData
          };
        } catch (err) {
          console.error(`[get-devolucoes-direct] Erro ao enriquecer claim ${claim.id}:`, err);
          return claim;
        }
      })
    );

    console.log(`[get-devolucoes-direct] ${enrichedClaims.length} claims enriquecidos`);

    // ✅ MAPEAR DADOS USANDO MAPPERS CONSOLIDADOS
    console.log('[get-devolucoes-direct] Mapeando dados...');
    const mappedClaims = enrichedClaims.map((claim: any) => {
      try {
        // Estruturar dados no formato esperado pelos mappers
        const item = {
          claim_details: claim,
          order_data: claim.order_data,
          claim_messages: claim.claim_messages,
          return_details_v2: claim.return_details_v2,
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
