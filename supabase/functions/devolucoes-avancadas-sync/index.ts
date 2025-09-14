import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Buscar claims reais usando endpoints oficiais
async function fetchRealClaims(orderId, accessToken) {
  const endpoints = [
    `https://api.mercadolibre.com/post-purchase/v1/claims/search?resource_id=${orderId}&resource=order`,
    `https://api.mercadolibre.com/post-purchase/v1/claims/search?order_id=${orderId}`
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Buscando claims reais para order ${orderId} via: ${endpoint}`);
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        const claims = data.data || data.results || [];
        if (claims.length > 0) {
          console.log(`✅ ${claims.length} claims reais encontradas para order ${orderId}`);
          return claims;
        }
      }
    } catch (error) {
      console.warn(`⚠️ Falha no endpoint ${endpoint}:`, error.message);
    }
  }

  console.log(`ℹ️ Nenhum claim real encontrado para order ${orderId}`);
  return [];
}

// Buscar returns reais usando claim_id
async function fetchRealReturns(claimId, accessToken) {
  try {
    console.log(`🔍 Buscando returns reais para claim ${claimId}`);
    const response = await fetch(`https://api.mercadolibre.com/post-purchase/v2/claims/${claimId}/returns`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (response.ok) {
      const returnData = await response.json();
      console.log(`✅ Return real encontrado para claim ${claimId}`);
      return returnData;
    }
  } catch (error) {
    console.warn(`⚠️ Falha ao buscar return para claim ${claimId}:`, error.message);
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

    let processedCount = 0;

    for (const accountId of account_ids) {
      console.log(`📋 Processando conta: ${accountId}`);

      // Buscar orders sem claims processadas
      const { data: localOrders, error: selectError } = await supabase
        .from('devolucoes_avancadas')
        .select('id, order_id, dados_order')
        .eq('integration_account_id', accountId)
        .is('claim_id', null)
        .limit(10); // Processar em lotes pequenos

      if (selectError) throw selectError;
      console.log(`📊 Encontradas ${localOrders.length} orders para processar`);

      // Obter token
      const { data: tokenData } = await supabase
        .from('integration_secrets')
        .select('simple_tokens')
        .eq('integration_account_id', accountId)
        .single();

      if (!tokenData) continue;

      const { data: decryptResult } = await supabase.rpc('decrypt_simple', {
        encrypted_data: tokenData.simple_tokens
      });
      if (!decryptResult) continue;

      const tokenObj = JSON.parse(decryptResult);
      const accessToken = tokenObj.access_token;

      // Processar cada order
      for (const localOrder of localOrders) {
        const order = localOrder.dados_order;

        // 1. Buscar claims reais
        const realClaims = await fetchRealClaims(order.id, accessToken);

        if (realClaims.length > 0) {
          const mainClaim = realClaims[0];

          // 2. Buscar returns para este claim
          const returnData = await fetchRealReturns(mainClaim.id, accessToken);

          // 3. Atualizar registro com dados reais
          const updateData = {
            claim_id: mainClaim.id,
            dados_claim: mainClaim,
            status_devolucao: mainClaim.status || 'open'
          };

          if (returnData) {
            updateData.return_id = returnData.id;
            updateData.dados_return = returnData;
            updateData.status_envio = returnData.status;
          }

          const { error: updateError } = await supabase
            .from('devolucoes_avancadas')
            .update(updateData)
            .eq('id', localOrder.id);

          if (!updateError) {
            processedCount++;
            console.log(`✅ Order ${order.id} processada com claim real ${mainClaim.id}${returnData ? ` e return ${returnData.id}` : ''}`);
          } else {
            console.error(`❌ Erro ao atualizar order ${order.id}:`, updateError.message);
          }
        } else {
          console.log(`ℹ️ Order ${order.id} não possui claims reais`);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed: processedCount,
      message: `Processadas ${processedCount} orders com dados reais da API ML`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro na função:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});