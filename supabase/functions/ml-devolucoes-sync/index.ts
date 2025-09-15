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
    const { integration_account_id, date_from, date_to } = await req.json();
    
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

    // 2. Buscar access token
    const INTERNAL_TOKEN = Deno.env.get("INTERNAL_SHARED_TOKEN") || "internal-shared-token";
    
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
        secret_name: 'access_token'
      })
    });

    if (!secretResponse.ok) {
      console.error('❌ [ML Devoluções] Erro ao buscar token:', await secretResponse.text());
      return new Response(JSON.stringify({ error: 'Token não encontrado ou expirado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { value: accessToken } = await secretResponse.json();

    // 3. Buscar pedidos da conta para verificar devoluções
    const dateFromParam = date_from || new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const dateToParam = date_to || new Date().toISOString();

    console.log(`📅 [ML Devoluções] Buscando pedidos de ${dateFromParam} até ${dateToParam}`);

    // Buscar pedidos
    const ordersUrl = `https://api.mercadolibre.com/orders/search?seller=${account.external_user_id}&order.date_created.from=${dateFromParam}&order.date_created.to=${dateToParam}&sort=date_desc&limit=50`;
    
    const ordersResponse = await fetch(ordersUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!ordersResponse.ok) {
      console.error('❌ [ML Devoluções] Erro ao buscar pedidos:', await ordersResponse.text());
      return new Response(JSON.stringify({ error: 'Erro ao buscar pedidos' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const ordersData = await ordersResponse.json();
    const orders = ordersData.results || [];

    console.log(`📦 [ML Devoluções] Encontrados ${orders.length} pedidos`);

    let processedClaims = 0;
    let totalClaims = 0;

    // Processar cada pedido
    for (const order of orders) {
      console.log(`🔍 [ML Devoluções] Processando order: ${order.id} - Status: ${order.status} - Cancel Detail: ${order.cancel_detail || 'N/A'}`);

      try {
        // Buscar claims para a order
        const claimsUrl = `https://api.mercadolibre.com/v1/orders/${order.id}/claims`;
        const claimsResponse = await fetch(claimsUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        let claims: MLClaim[] = [];

        if (claimsResponse.ok) {
          const claimsData = await claimsResponse.json();
          claims = claimsData.data || [];
          console.log(`🔍 [ML Devoluções] Claims para order ${order.status} ${order.id}:`, { total: claims.length });
        } else {
          console.log(`⚠️ [ML Devoluções] Falha na busca claims ${order.id}: ${claimsResponse.status}`);
        }

        // Se não há claims mas a order foi cancelada, buscar mediação
        if (claims.length === 0 && order.status === 'cancelled') {
          try {
            const mediationUrl = `https://api.mercadolibre.com/mediations/orders/${order.id}`;
            const mediationResponse = await fetch(mediationUrl, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            });

            if (mediationResponse.ok) {
              const mediation: MLMediation = await mediationResponse.json();
              console.log(`🔍 [ML Devoluções] Mediação encontrada para order ${order.id}:`, mediation.reason);

              // Converter mediação em claim
              const syntheticClaim: MLClaim = {
                id: `mediation_${mediation.id}`,
                order_id: order.id,
                type: 'cancellation',
                status: mediation.status || 'opened',
                stage: mediation.stage || 'pending',
                resolution: order.cancel_detail,
                reason_code: 'ORDER_CANCELLED',
                reason_description: mediation.reason || order.cancel_detail,
                date_created: mediation.date_created,
                date_closed: mediation.date_closed,
                date_last_update: mediation.date_closed || mediation.date_created,
                amount_claimed: order.total_amount,
                amount_refunded: order.status === 'cancelled' ? order.total_amount : 0,
                currency: order.currency_id,
                buyer: {
                  id: String(mediation.buyer_id),
                  nickname: 'Buyer',
                  email: mediation.external_agent_email
                },
                item: {
                  id: mediation.items[0]?.id || '',
                  title: mediation.items[0]?.title || 'Item',
                  sku: '',
                  variation_id: ''
                },
                quantity: mediation.items[0]?.quantity || 1,
                unit_price: mediation.items[0]?.sale_price || 0,
                last_message: `Pedido cancelado: ${mediation.reason}`,
                seller_response: ''
              };

              claims = [syntheticClaim];
              console.log(`✅ [ML Devoluções] Claim sintética criada para order ${order.id}`);
            } else {
              console.log(`⚠️ [ML Devoluções] Falha na busca mediação ${order.id}: ${mediationResponse.status}`);
            }
          } catch (mediationError) {
            console.error(`❌ [ML Devoluções] Erro na mediação ${order.id}:`, mediationError);
          }
        }

        if (claims.length === 0) {
          console.log(`📋 [ML Devoluções] Order ${order.status} ${order.id} sem claims associadas`);
        }

        totalClaims += claims.length;

        // Salvar claims na base de dados
        for (const claim of claims) {
          try {
            // Buscar organization_id da conta
            const { data: accountInfo } = await supabase
              .from('integration_accounts')
              .select('organization_id')
              .eq('id', integration_account_id)
              .single();

            const claimData = {
              integration_account_id: integration_account_id,
              organization_id: accountInfo?.organization_id,
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

            const { error: insertError } = await supabase
              .from('ml_devolucoes_reclamacoes')
              .upsert(claimData, {
                onConflict: 'claim_id',
                ignoreDuplicates: false
              });

            if (insertError) {
              console.error(`❌ [ML Devoluções] Erro ao salvar claim ${claim.id}:`, insertError);
            } else {
              processedClaims++;
              console.log(`💾 [ML Devoluções] Claim ${claim.id} salva com sucesso`);
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
    console.error('❌ [ML Devoluções] Erro geral:', error);
    return new Response(JSON.stringify({
      error: 'Erro interno do servidor',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});