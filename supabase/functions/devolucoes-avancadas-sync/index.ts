import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função de fetch com timeout
const fetchWithTimeout = async (url, options, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

// Função robusta para buscar claims com múltiplos fallbacks
async function fetchClaimsRobust(orderId, accessToken) {
  const endpoints = [
    `https://api.mercadolibre.com/claims/search?resource_id=${orderId}`,
    `https://api.mercadolibre.com/orders/${orderId}/claims`,
    `https://api.mercadolibre.com/post-purchase/v1/claims/search?resource_id=${orderId}&resource=order`
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Buscando claims para order ${orderId} via: ${endpoint}`);
      const response = await fetchWithTimeout(endpoint, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && (data.results || Array.isArray(data))) {
          console.log(`✅ Sucesso! Claims encontradas para order ${orderId}`);
          return data.results || data;
        }
      }
    } catch (error) {
      console.warn(`⚠️ Falha no endpoint de claims ${endpoint}:`, error.message);
    }
  }
  console.log(`Nenhum endpoint de claims funcionou para a order ${orderId}.`);
  return [];
}

// Função para simular claim se a API falhar
function simulateClaimFromOrder(order) {
  const problemTags = ['not_delivered', 'claim', 'dispute'];
  const hasProblem = order.tags?.some(tag => problemTags.includes(tag));

  if (order.status === 'cancelled' || hasProblem) {
    console.log(`Simulando claim para order ${order.id} baseado no status/tags.`);
    return {
      id: `simulated_${order.id}`,
      status: 'open',
      reason: order.status === 'cancelled' ? 'BUYER_REGRET' : 'UNKNOWN',
      simulated: true
    };
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { account_ids } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

    console.log(`Processando contas: ${account_ids}`);

    let processedCount = 0;
    for (const accountId of account_ids) {
      console.log(`Processando conta: ${accountId}`);

      // 1. Obter todas as orders da tabela local primeiro
      const { data: localOrders, error: selectError } = await supabase
        .from('devolucoes_avancadas')
        .select('id, order_id, dados_order')
        .eq('integration_account_id', accountId)
        .is('claim_id', null); // Processar apenas as que não têm claim

      if (selectError) throw selectError;
      console.log(`Encontradas ${localOrders.length} orders locais para enriquecer.`);

      // 2. Obter token descriptografado
      const { data: tokenData } = await supabase
        .from('integration_secrets')
        .select('simple_tokens')
        .eq('integration_account_id', accountId)
        .single();
      
      if (!tokenData) throw new Error('Token não encontrado');

      // Decrypt the access token
      const { data: decryptResult } = await supabase.rpc('decrypt_simple', { 
        encrypted_data: tokenData.simple_tokens 
      });
      if (!decryptResult) throw new Error('Falha ao descriptografar token');
      
      const tokenObj = JSON.parse(decryptResult);
      const accessToken = tokenObj.access_token;

      // 3. Enriquecer cada order local com claims
      for (const localOrder of localOrders) {
        const order = localOrder.dados_order;
        let claims = await fetchClaimsRobust(order.id, accessToken);
        let finalClaim = claims.length > 0 ? claims[0] : null;

        // Se a API falhar, tentar simular
        if (!finalClaim) {
          finalClaim = simulateClaimFromOrder(order);
        }

        if (finalClaim) {
          const { error: updateError } = await supabase
            .from('devolucoes_avancadas')
            .update({
              claim_id: finalClaim.id,
              dados_claim: finalClaim,
              status_devolucao: finalClaim.simulated ? 'under_review' : order.status
            })
            .eq('id', localOrder.id);

          if (updateError) {
            console.error(`Falha ao atualizar order ${order.id}:`, updateError.message);
          } else {
            processedCount++;
            console.log(`✅ Order ${order.id} enriquecida com claim ${finalClaim.id}`);
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, enriched: processedCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na função:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});