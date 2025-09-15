import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-call, x-internal-token',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface MLClaim {
  id: string;
  order_id: string;
  type: 'claim' | 'return' | 'cancellation';
  status: string;
  stage: string;
  resolution?: string;
  reason_code?: string;
  reason_description?: string;
  date_created: string;
  date_closed?: string;
  date_last_update?: string;
  amount_claimed?: number;
  amount_refunded?: number;
  currency: string;
  buyer: {
    id: string;
    nickname: string;
    email?: string;
  };
  item: {
    id: string;
    title: string;
    sku?: string;
    variation_id?: string;
  };
  quantity: number;
  unit_price: number;
  last_message?: string;
  seller_response?: string;
}

interface MLMediation {
  id: string;
  site_id: string;
  status: string;
  stage: string;
  order_id: string;
  buyer_id: string;
  seller_id: string;
  date_created: string;
  date_closed?: string;
  reason: string;
  external_agent_email: string;
  external_agent_name: string;
  items: Array<{
    id: string;
    quantity: number;
    sale_price: number;
    title: string;
  }>;
}

serve(async (req) => {
  console.log(`🔔 [ML Devoluções] Recebida requisição ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { integration_account_id, date_from, date_to, sellerId, dateFrom, dateTo, status } = await req.json();
    
    if (!integration_account_id) {
      return new Response(JSON.stringify({ error: 'integration_account_id é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`🔍 [ML Devoluções] Processando conta: ${integration_account_id}`);

    // 1. Buscar dados da conta de integração
    const { data: account, error: accountError } = await supabase
      .from('integration_accounts')
      .select('*')
      .eq('id', integration_account_id)
      .eq('is_active', true)
      .single();

    if (accountError || !account) {
      console.error('❌ [ML Devoluções] Conta não encontrada:', accountError);
      return new Response(JSON.stringify({ error: 'Conta de integração não encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Buscar access token via integrations-get-secret
    const INTERNAL_TOKEN = Deno.env.get("INTERNAL_SHARED_TOKEN") || "internal-shared-token";
    
    let accessToken;
    let tokenRetrievalError = null;
    
    try {
      const secretResponse = await fetch(`${supabaseUrl}/functions/v1/integrations-get-secret`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization') || '',
          'x-internal-call': 'true',
          'x-internal-token': INTERNAL_TOKEN
        },
        body: JSON.stringify({
          integration_account_id: integration_account_id,
          provider: 'mercadolivre'
        })
      });

      if (secretResponse.ok) {
        const tokenData = await secretResponse.json();
        if (tokenData.found && tokenData.access_token) {
          accessToken = tokenData.access_token;
          console.log('🔑 [ML Devoluções] Token obtido com sucesso');
        } else {
          tokenRetrievalError = 'Token não encontrado na resposta';
        }
      } else {
        const errorText = await secretResponse.text();
        tokenRetrievalError = errorText;
        console.error('❌ [ML Devoluções] Erro ao buscar token:', errorText);
      }
    } catch (error) {
      tokenRetrievalError = error.message;
      console.error('❌ [ML Devoluções] Erro crítico ao buscar token:', error);
    }

    // Se não conseguiu buscar o token, verificar o status na tabela
    if (!accessToken) {
      if (account.token_status === 'reconnect_required') {
        console.error(`❌ [ML Devoluções] Token status inválido: reconnect_required para conta ${account.name}`);
        return new Response(JSON.stringify({ 
          error: 'Token de acesso inválido',
          details: `Status do token: reconnect_required. Favor reconectar a conta.`,
          account_name: account.name
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else if (account.token_status !== 'valid') {
        console.error(`❌ [ML Devoluções] Token status inválido: ${account.token_status} para conta ${account.name}`);
        return new Response(JSON.stringify({ 
          error: 'Token de acesso inválido',
          details: `Status do token: ${account.token_status}. Favor reconectar a conta.`,
          account_name: account.name
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Se chegou aqui, significa que o status indica válido mas não conseguiu buscar o token
      return new Response(JSON.stringify({ 
        error: 'Erro ao buscar token de acesso',
        details: tokenRetrievalError || 'Token não encontrado',
        suggestion: 'Favor tentar novamente ou reconectar a conta'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    // 3. Buscar claims direto da API ML
    const sellerIdParam = sellerId || account.account_identifier;
    const dateFromParam = dateFrom || date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateToParam = dateTo || date_to || new Date().toISOString();

    console.log(`📅 [ML Devoluções] Buscando claims de ${dateFromParam} até ${dateToParam} para seller ${sellerIdParam}`);

    // Buscar claims direto da API ML
    let claimsUrl = `https://api.mercadolibre.com/claims/search?seller_id=${sellerIdParam}`;
    
    if (dateFromParam) claimsUrl += `&date_created_from=${dateFromParam}`;
    if (dateToParam) claimsUrl += `&date_created_to=${dateToParam}`;
    if (status) claimsUrl += `&status=${status}`;
    
    claimsUrl += '&limit=50&offset=0';
    
    console.log(`🔗 [ML Devoluções] URL da busca claims: ${claimsUrl}`);
    
    const claimsResponse = await fetch(claimsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!claimsResponse.ok) {
      const errorText = await claimsResponse.text();
      console.error(`❌ [ML Devoluções] Erro ao buscar claims:`, {
        status: claimsResponse.status,
        statusText: claimsResponse.statusText,
        url: claimsUrl,
        response: errorText,
        seller_id: sellerIdParam
      });
      return new Response(JSON.stringify({ 
        error: 'Erro ao buscar claims',
        details: `Status ${claimsResponse.status}: ${errorText}`,
        seller_id: sellerIdParam
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const claimsData = await claimsResponse.json();
    const claims = claimsData.results || [];

    console.log(`📦 [ML Devoluções] Encontrados ${claims.length} claims`);

    // 4. Processar cada claim e buscar detalhes da order
    const processedDevolucoes = [];
    
    for (const claim of claims) {
      try {
          try {
            // Buscar organization_id da conta
            const { data: accountInfo, error: accountError } = await supabase
              .from('integration_accounts')
              .select('organization_id')
              .eq('id', integration_account_id)
              .single();

            if (accountError || !accountInfo?.organization_id) {
              console.error(`❌ [ML Devoluções] Erro ao buscar organização da conta ${integration_account_id}:`, accountError);
              continue;
            }

            console.log(`🏢 [ML Devoluções] Organization ID encontrado: ${accountInfo.organization_id}`);

            const claimData = {
              integration_account_id: integration_account_id,
              organization_id: accountInfo.organization_id,
              claim_id: claim.id,
              order_id: claim.order_id,
              order_number: order.pack_id ? String(order.pack_id) : null,
              buyer_id: claim.buyer.id,
              buyer_nickname: claim.buyer.nickname,
              buyer_email: claim.buyer.email,
              item_id: claim.item.id,
              item_title: claim.item.title,
              sku: claim.item.sku,
              variation_id: claim.item.variation_id,
              quantity: claim.quantity,
              unit_price: claim.unit_price,
              claim_type: claim.type,
              claim_status: claim.status,
              claim_stage: claim.stage,
              resolution: claim.resolution,
              reason_code: claim.reason_code,
              reason_description: claim.reason_description,
              amount_claimed: claim.amount_claimed || 0,
              amount_refunded: claim.amount_refunded || 0,
              currency: claim.currency,
              date_created: new Date(claim.date_created),
              date_closed: claim.date_closed ? new Date(claim.date_closed) : null,
              date_last_update: claim.date_last_update ? new Date(claim.date_last_update) : new Date(),
              last_message: claim.last_message,
              seller_response: claim.seller_response,
              processed_status: 'pending',
              priority: 'normal',
              raw_data: {
                order: order,
                claim: claim
              }
            };

            console.log(`💾 [ML Devoluções] Tentando inserir claim ${claim.id} para organização ${accountInfo.organization_id}`);

            const { error: insertError } = await supabase
              .from('ml_devolucoes_reclamacoes')
              .upsert(claimData, {
                onConflict: 'claim_id',
                ignoreDuplicates: false
              });

            if (insertError) {
              console.error(`❌ [ML Devoluções] Erro detalhado ao salvar claim ${claim.id}:`, {
                error: insertError,
                message: insertError.message,
                details: insertError.details,
                hint: insertError.hint,
                code: insertError.code,
                claimId: claim.id,
                organizationId: accountInfo.organization_id
              });
            } else {
              processedClaims++;
              console.log(`✅ [ML Devoluções] Claim ${claim.id} salva com sucesso`);
            }
          } catch (saveError) {
            console.error(`❌ [ML Devoluções] Erro ao processar claim ${claim.id}:`, saveError);
          }
        }

        // Salvar order completa mesmo sem claims
        console.log(`💾 [ML Devoluções] Order completa salva: ${order.id}`);

      } catch (orderError) {
        console.error(`❌ [ML Devoluções] Erro ao processar order ${order.id}:`, orderError);
      }
    }

    const stats = {
      account_id: integration_account_id,
      orders_processed: orders.length,
      total_claims_found: totalClaims,
      claims_processed: processedClaims,
      date_from: dateFromParam,
      date_to: dateToParam
    };

    console.log(`🚀 [ML Devoluções] Sincronização concluída:`, stats);

    return new Response(JSON.stringify({
      success: true,
      message: `Sincronização concluída: ${processedClaims} devoluções processadas de ${totalClaims} encontradas`,
      stats: stats
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [ML Devoluções] Erro geral detalhado:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
      toString: error.toString()
    });
    return new Response(JSON.stringify({
      error: 'Erro interno do servidor',
      details: error.message,
      type: error.name
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});