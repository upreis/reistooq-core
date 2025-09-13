import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface MLClaimResponse {
  results: MLClaim[];
  paging: {
    total: number;
    offset: number;
    limit: number;
  };
}

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

interface MLOrder {
  id: string;
  order_number?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { integration_account_id, date_from, date_to } = await req.json();

    if (!integration_account_id) {
      throw new Error('integration_account_id é obrigatório');
    }

    console.log(`🔄 [ML Devoluções] Iniciando sync para conta: ${integration_account_id}`);

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Buscar dados da conta
    const { data: account, error: accountError } = await supabase
      .from('integration_accounts')
      .select('*')
      .eq('id', integration_account_id)
      .eq('provider', 'mercadolivre')
      .single();

    if (accountError || !account) {
      throw new Error('Conta de integração não encontrada');
    }

    // 2. Buscar access token
    const INTERNAL_TOKEN = Deno.env.get("INTERNAL_SHARED_TOKEN") || "internal-shared-token";
    
    let secretResponse = await fetch(
      `${supabaseUrl}/functions/v1/integrations-get-secret`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization') || '',
          'x-internal-call': 'true',
          'x-internal-token': INTERNAL_TOKEN
        },
        body: JSON.stringify({ 
          integration_account_id,
          provider: 'mercadolivre'
        })
      }
    );

    if (!secretResponse.ok) {
      console.error(`❌ [ML Devoluções] Erro ao buscar secrets: ${secretResponse.status}`);
      throw new Error(`Erro ao buscar secrets: ${secretResponse.status}`);
    }

    let secretData = await secretResponse.json();
    
    // Se não encontrou token ou está expirado, tentar renovar
    if (!secretData?.found || !secretData?.secret?.access_token) {
      console.log(`🔄 [ML Devoluções] Token não encontrado, tentando renovar...`);
      
      const refreshResponse = await fetch(
        `${supabaseUrl}/functions/v1/mercadolivre-token-refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || ''
          },
          body: JSON.stringify({ 
            account_id: integration_account_id,
            internal_call: true
          })
        }
      );

      if (refreshResponse.ok) {
        console.log(`✅ [ML Devoluções] Token renovado, buscando novamente...`);
        
        // Buscar token novamente após renovação
        secretResponse = await fetch(
          `${supabaseUrl}/functions/v1/integrations-get-secret`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': req.headers.get('Authorization') || '',
              'x-internal-call': 'true',
              'x-internal-token': INTERNAL_TOKEN
            },
            body: JSON.stringify({ 
              integration_account_id,
              provider: 'mercadolivre'
            })
          }
        );

        if (secretResponse.ok) {
          secretData = await secretResponse.json();
        }
      } else {
        console.warn(`⚠️ [ML Devoluções] Falha ao renovar token: ${refreshResponse.status}`);
      }
    }

    if (!secretData?.found || !secretData?.secret?.access_token) {
      throw new Error('Token de acesso não encontrado após tentativa de renovação');
    }

    const accessToken = secretData.secret.access_token;

    const sellerId = account.account_identifier;
    console.log(`🔑 [ML Devoluções] Token obtido para seller: ${sellerId}`);

    // 3. Buscar claims da API do Mercado Livre
    let allClaims: MLClaim[] = [];
    let offset = 0;
    const limit = 50;
    
    // Definir período de busca (últimos 30 dias se não especificado)
    const dateFrom = date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = date_to || new Date().toISOString();

    console.log(`📅 [ML Devoluções] Buscando claims de ${dateFrom} até ${dateTo}`);

    while (true) {
      // ✅ ENDPOINT CORRETO (com /search) + parâmetros corretos
      const claimsUrl = `https://api.mercadolibre.com/post-purchase/v1/claims/search?` +
        `resource=order&` +
        `date_created=after:${new Date(dateFrom).toISOString()}&` +
        `offset=${offset}&` +
        `limit=${limit}`;

      console.log(`🔍 [ML Devoluções] Buscando claims - offset: ${offset}`);
      console.log(`🔗 [ML Devoluções] URL: ${claimsUrl}`);

      const claimsResponse = await fetch(claimsUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!claimsResponse.ok) {
        console.error(`❌ [ML Devoluções] Erro ao buscar claims: ${claimsResponse.status}`);
        console.error(`🔗 [ML Devoluções] URL tentada: ${claimsUrl}`);
        
        // Log do erro detalhado
        try {
          const errorBody = await claimsResponse.text();
          console.error(`💥 [ML Devoluções] Resposta do erro: ${errorBody}`);
        } catch (e) {
          console.error(`💥 [ML Devoluções] Não foi possível ler o corpo do erro`);
        }
        
        throw new Error(`Erro na API do ML: ${claimsResponse.status}`);
      }

      const claimsData: MLClaimResponse = await claimsResponse.json();
      
      if (claimsData.results && claimsData.results.length > 0) {
        allClaims.push(...claimsData.results);
        console.log(`📦 [ML Devoluções] Encontrados ${claimsData.results.length} claims`);
      }

      // Verificar se há mais páginas
      if (!claimsData.results || claimsData.results.length < limit) {
        break;
      }
      
      offset += limit;
    }

    console.log(`📊 [ML Devoluções] Total de claims encontrados: ${allClaims.length}`);

    // 4. Buscar dados dos pedidos para obter order_number
    const orderIds = [...new Set(allClaims.map(claim => claim.order_id))];
    const orderNumbers: Record<string, string> = {};

    for (const orderId of orderIds) {
      try {
        const orderResponse = await fetch(
          `https://api.mercadolibre.com/orders/${orderId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (orderResponse.ok) {
          const orderData: MLOrder = await orderResponse.json();
          if (orderData.order_number) {
            orderNumbers[orderId] = orderData.order_number;
          }
        }
      } catch (error) {
        console.warn(`⚠️ [ML Devoluções] Erro ao buscar pedido ${orderId}:`, error);
      }
    }

    // 5. Processar e salvar claims no banco
    let processedCount = 0;
    let updatedCount = 0;

    for (const claim of allClaims) {
      try {
        const claimData = {
          integration_account_id,
          organization_id: account.organization_id,
          claim_id: claim.id,
          order_id: claim.order_id,
          order_number: orderNumbers[claim.order_id] || null,
          buyer_id: claim.buyer.id,
          buyer_nickname: claim.buyer.nickname,
          buyer_email: claim.buyer.email || null,
          item_id: claim.item.id,
          item_title: claim.item.title,
          sku: claim.item.sku || null,
          variation_id: claim.item.variation_id || null,
          quantity: claim.quantity,
          unit_price: claim.unit_price,
          claim_type: claim.type,
          claim_status: claim.status,
          claim_stage: claim.stage,
          resolution: claim.resolution || null,
          reason_code: claim.reason_code || null,
          reason_description: claim.reason_description || null,
          amount_claimed: claim.amount_claimed || null,
          amount_refunded: claim.amount_refunded || 0,
          currency: claim.currency,
          date_created: claim.date_created,
          date_closed: claim.date_closed || null,
          date_last_update: claim.date_last_update || null,
          last_message: claim.last_message || null,
          seller_response: claim.seller_response || null,
          raw_data: claim,
          updated_at: new Date().toISOString()
        };

        // Upsert do claim
        const { error: upsertError } = await supabase
          .from('ml_devolucoes_reclamacoes')
          .upsert(claimData, { 
            onConflict: 'claim_id,integration_account_id',
            ignoreDuplicates: false 
          });

        if (upsertError) {
          console.error(`❌ [ML Devoluções] Erro ao salvar claim ${claim.id}:`, upsertError);
        } else {
          processedCount++;
        }
      } catch (error) {
        console.error(`❌ [ML Devoluções] Erro ao processar claim ${claim.id}:`, error);
      }
    }

    console.log(`✅ [ML Devoluções] Processados ${processedCount} claims com sucesso`);

    // 6. Buscar estatísticas atualizadas
    const { data: stats } = await supabase
      .from('ml_devolucoes_reclamacoes')
      .select('claim_status, processed_status')
      .eq('integration_account_id', integration_account_id);

    const pendingCount = stats?.filter(s => s.processed_status === 'pending').length || 0;
    const reviewedCount = stats?.filter(s => s.processed_status === 'reviewed').length || 0;
    const totalCount = stats?.length || 0;

    return new Response(JSON.stringify({
      success: true,
      processed: processedCount,
      total_found: allClaims.length,
      stats: {
        total: totalCount,
        pending: pendingCount,
        reviewed: reviewedCount
      },
      date_range: {
        from: dateFrom,
        to: dateTo
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [ML Devoluções] Erro na sincronização:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});