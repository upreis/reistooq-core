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

// Função para buscar mensagens de pós-venda
async function fetchPostSaleMessages(orderId, packId, sellerId, accessToken) {
  try {
    const endpoint = `https://api.mercadolibre.com/messages/packs/${packId || orderId}/sellers/${sellerId}?tag=post_sale`;
    console.log(`📧 Buscando mensagens para order ${orderId}`);
    
    const response = await fetch(endpoint, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (response.ok) {
      const data = await response.json();
      const messages = data.messages || [];
      console.log(`✅ ${messages.length} mensagens encontradas para order ${orderId}`);
      return messages;
    }
  } catch (error) {
    console.warn(`⚠️ Falha ao buscar mensagens para order ${orderId}:`, error.message);
  }

  return [];
}

// Função para buscar ações disponíveis do claim
async function fetchClaimActions(claimId, accessToken) {
  try {
    const endpoint = `https://api.mercadolibre.com/post-purchase/v1/claims/${claimId}/actions`;
    console.log(`⚡ Buscando ações para claim ${claimId}`);
    
    const response = await fetch(endpoint, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (response.ok) {
      const actions = await response.json();
      console.log(`✅ ${actions.length} ações encontradas para claim ${claimId}`);
      return actions;
    }
  } catch (error) {
    console.warn(`⚠️ Falha ao buscar ações para claim ${claimId}:`, error.message);
  }

  return [];
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

      // Buscar orders sem claims processadas OU com claims simulados
      const { data: localOrders, error: selectError } = await supabase
        .from('devolucoes_avancadas')
        .select('id, order_id, dados_order, claim_id')
        .eq('integration_account_id', accountId)
        .or('claim_id.is.null,claim_id.like.simulated_%')
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
      const sellerId = tokenObj.user_id || 'unknown';

      // Processar cada order com fluxo completo
      for (const localOrder of localOrders) {
        const order = localOrder.dados_order || localOrder.raw_data;

        // 1. Buscar claims reais
        const realClaims = await fetchRealClaims(order.id, accessToken);

        // 2. Buscar mensagens de pós-venda
        const messages = await fetchPostSaleMessages(order.id, order.pack_id, sellerId, accessToken);

        let updateData = {
          dados_mensagens: messages,
          ultima_atualizacao: new Date().toISOString()
        };

        if (realClaims.length > 0) {
          const claim = realClaims[0];

          // 3. Buscar returns se existir
          let returnData = null;
          if (claim.related_entities && claim.related_entities.includes('returns')) {
            returnData = await fetchRealReturns(claim.id, accessToken);
          }

          // 4. Buscar ações do claim
          const actions = await fetchClaimActions(claim.id, accessToken);

          // 5. Atualizar com dados reais
          updateData = {
            ...updateData,
            claim_id: claim.id.toString(),
            dados_claim: claim,
            dados_acoes: actions,
            status_devolucao: claim.status,
            cronograma_status: claim.stage || 'unknown'
          };

          if (returnData) {
            updateData.return_id = returnData.id.toString();
            updateData.dados_return = returnData;
            updateData.status_envio = returnData.status;
          }
        }

        // 6. Salvar no banco
        const { error: updateError } = await supabase
          .from('devolucoes_avancadas')
          .update(updateData)
          .eq('id', localOrder.id);

        if (!updateError) {
          processedCount++;
          console.log(`✅ Order ${order.id} processada - Claims: ${realClaims.length}, Mensagens: ${messages.length}`);
        } else {
          console.error(`❌ Erro ao atualizar order ${order.id}:`, updateError.message);
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