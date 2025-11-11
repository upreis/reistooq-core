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

    // ✅ BUSCAR CLAIMS DA API ML com filtros corretos
    const params = new URLSearchParams({
      offset: '0',
      limit: '200',
      sort: 'date_created',
      order: 'desc'
    });

    // Adicionar filtros de data se fornecidos (OBRIGATÓRIO para API ML)
    if (date_from) {
      params.append('date_created.from', date_from + 'T00:00:00.000-00:00');
    }
    if (date_to) {
      params.append('date_created.to', date_to + 'T23:59:59.999-00:00');
    }

    // ⚠️ API ML NÃO aceita seller_id como filtro - usa date_created
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
