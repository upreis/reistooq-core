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
  const endpoints = [
    `https://api.mercadolibre.com/messages/packs/${packId || orderId}/sellers/${sellerId}?tag=post_sale`,
    `https://api.mercadolibre.com/messages/orders/${orderId}`,
    `https://api.mercadolibre.com/messages/search?order_id=${orderId}`
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📧 Testando endpoint de mensagens: ${endpoint}`);
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        const messages = data.messages || data.results || [];
        console.log(`✅ ${messages.length} mensagens encontradas para order ${orderId} via ${endpoint}`);
        return messages;
      } else {
        console.log(`⚠️ Endpoint ${endpoint} retornou status ${response.status}`);
      }
    } catch (error) {
      console.warn(`⚠️ Falha no endpoint ${endpoint}:`, error.message);
    }
  }

  console.log(`ℹ️ Nenhuma mensagem encontrada para order ${orderId}`);
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

    // IDs REAIS para teste baseados na planilha
    const testOrderIds = [
      '20000129977268',
      '20000130039950', 
      '20000130164900',
      '20000130194958',
      '20000130200198'
    ];
    
    for (const accountId of account_ids) {
      console.log(`📋 Processando conta: ${accountId}`);

      // Buscar orders sem claims processadas OU com claims simulados
      const { data: localOrders, error: selectError } = await supabase
        .from('devolucoes_avancadas')
        .select('id, order_id, dados_order, claim_id, id_carrinho, id_item, sku, quantidade, produto_titulo')
        .eq('integration_account_id', accountId)
        .or('claim_id.is.null,claim_id.like.simulated_%')
        .limit(20); // Aumentar lote para testar mais orders

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
        const orderId = order?.id || localOrder.order_id;
        
        // Logs detalhados para debug
        console.log(`🎯 Processando order real da planilha: ${orderId}`);
        console.log(`📦 ID Carrinho: ${localOrder.id_carrinho || 'N/A'}`);
        console.log(`🏷 ID Item: ${localOrder.id_item || 'N/A'}`);
        console.log(`📋 SKU: ${localOrder.sku || 'N/A'}`);
        console.log(`📊 Quantidade: ${localOrder.quantidade || 'N/A'}`);
        console.log(`🛍 Produto: ${localOrder.produto_titulo || 'N/A'}`);

        // Verificar se é um dos IDs de teste REAIS
        const isTestOrder = testOrderIds.includes(orderId?.toString());
        if (isTestOrder) {
          console.log(`🎯 ORDEM DE TESTE REAL DETECTADA: ${orderId}`);
        }

        // 1. Buscar claims reais
        console.log(`🔍 Buscando claims para order real...`);
        const realClaims = await fetchRealClaims(orderId, accessToken);

        // 2. Buscar mensagens de pós-venda  
        const messages = await fetchPostSaleMessages(orderId, order?.pack_id, sellerId, accessToken);

        // Extrair dados dos order_items se disponível
        const orderItems = order?.order_items || [];
        const firstItem = orderItems[0];
        
        let updateData = {
          dados_mensagens: messages,
          ultima_atualizacao: new Date().toISOString(),
          // Preencher campos da planilha baseados no order
          id_carrinho: orderId,
          id_item: firstItem?.item?.id || localOrder.id_item,
          sku: firstItem?.item?.seller_sku || localOrder.sku,
          quantidade: firstItem?.quantity || localOrder.quantidade || 1,
          produto_titulo: firstItem?.item?.title || localOrder.produto_titulo
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
          console.log(`✅ Order ${orderId} processada com sucesso!`);
          console.log(`   📊 Claims: ${realClaims.length}, Mensagens: ${messages.length}`);
          console.log(`   📦 SKU: ${updateData.sku}, Quantidade: ${updateData.quantidade}`);
          console.log(`   🛍 Produto: ${updateData.produto_titulo?.substring(0, 50)}...`);
          
          if (isTestOrder) {
            console.log(`🎯 TESTE REAL CONCLUÍDO PARA: ${orderId}`);
          }
        } else {
          console.error(`❌ Erro ao atualizar order ${orderId}:`, updateError.message);
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