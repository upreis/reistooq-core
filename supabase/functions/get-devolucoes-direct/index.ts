/**
 * 🔥 GET DEVOLUCOES DIRECT - BUSCA DIRETO DA API ML
 * Copia EXATA do padrão de ml-claims-fetch que FUNCIONA
 * NÃO usa cache do banco - SEMPRE busca fresco da API
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

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
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const { 
      integration_account_id, 
      date_from, 
      date_to 
    } = await req.json();

    console.log('[get-devolucoes-direct] Parâmetros:', { integration_account_id, date_from, date_to });

    // ✅ Buscar dados da conta
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    });

    const { data: account, error: accountError } = await supabase
      .from('integration_accounts')
      .select('account_identifier, credentials')
      .eq('id', integration_account_id)
      .single();

    if (accountError || !account) {
      throw new Error('Conta ML não encontrada');
    }

    // ✅ Descriptografar token
    const encryptedTokens = account.credentials?.simple_tokens;
    if (!encryptedTokens) {
      throw new Error('Tokens não encontrados');
    }

    const accessToken = encryptedTokens.access_token;
    const sellerId = account.account_identifier;

    // ✅ BUSCAR CLAIMS DA API ML
    const params = new URLSearchParams({
      seller_id: sellerId,
      offset: '0',
      limit: '200', // Buscar mais dados de uma vez
      sort: 'date_created',
      order: 'desc'
    });

    // ⚠️ API ML NÃO aceita filtro de data no endpoint
    // Vamos filtrar client-side depois
    const claimsUrl = `https://api.mercadolibre.com/post-purchase/v1/claims/search?${params}`;
    
    console.log('[get-devolucoes-direct] Chamando API ML:', claimsUrl);

    const claimsRes = await fetch(claimsUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!claimsRes.ok) {
      const errorText = await claimsRes.text();
      console.error('[get-devolucoes-direct] Erro ML API:', errorText);
      throw new Error(`ML API error: ${claimsRes.status}`);
    }

    const claimsData = await claimsRes.json();
    let claims = claimsData.data || [];

    console.log(`[get-devolucoes-direct] ${claims.length} claims retornados pela API ML`);

    // ✅ FILTRAR POR DATA CLIENT-SIDE (igual /reclamacoes)
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

    // ✅ RETORNAR DADOS DIRETO (sem salvar no banco)
    return new Response(
      JSON.stringify({
        success: true,
        data: claims,
        total: claims.length,
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
