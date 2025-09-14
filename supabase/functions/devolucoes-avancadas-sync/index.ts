import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ESTRATÉGIA 1: Buscar claims do seller primeiro (abordagem reversa)
async function fetchClaimsFirst(sellerId, accessToken) {
  console.log('🔍 Buscando TODOS os claims do seller primeiro...');
  
  const claimsEndpoints = [
    `https://api.mercadolibre.com/post-purchase/v1/claims/search?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/post-purchase/v1/claims/search?resource=seller&resource_id=${sellerId}`,
    `https://api.mercadolibre.com/claims/search?seller_id=${sellerId}`
  ];

  for (const endpoint of claimsEndpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const claimsData = await response.json();
        console.log(`✅ Claims encontradas em ${endpoint}:`, claimsData.results?.length || 0);
        
        if (claimsData.results && claimsData.results.length > 0) {
          return claimsData.results;
        }
      } else {
        console.log(`⚠️ Endpoint ${endpoint} retornou status ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Erro no endpoint ${endpoint}:`, error);
    }
  }
  
  return [];
}

// ESTRATÉGIA 2: Buscar orders com status problemático
async function fetchProblematicOrders(sellerId, accessToken) {
  console.log('🔍 Buscando orders com status problemático...');
  
  const problematicStatuses = ['cancelled', 'not_delivered', 'returned'];
  const problematicOrders = [];

  for (const status of problematicStatuses) {
    console.log(`🔍 Buscando orders com status: ${status}`);

    const url = new URL('https://api.mercadolibre.com/orders/search');
    url.searchParams.append('seller', sellerId);
    url.searchParams.append('order.status', status);
    url.searchParams.append('sort', 'date_desc');
    url.searchParams.append('limit', '50');

    try {
      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const ordersData = await response.json();
        console.log(`✅ Orders ${status} encontradas:`, ordersData.results?.length || 0);
        
        if (ordersData.results) {
          problematicOrders.push(...ordersData.results);
        }
      }
    } catch (error) {
      console.log(`❌ Erro ao buscar orders ${status}:`, error);
    }
  }

  return problematicOrders;
}

// ESTRATÉGIA 3: Testar IDs específicos da planilha
async function testKnownProblematicOrders(accessToken) {
  console.log('🎯 Testando orders conhecidas da planilha...');
  
  // IDs da planilha que sabemos ter problemas  
  const knownProblematicOrders = [
    '2000012997726818',
    '2000013003995018', 
    '2000013016490018',
    '2000013019495818',
    '2000013020019818'
  ];

  for (const orderId of knownProblematicOrders) {
    console.log(`📦 Testando order da planilha: ${orderId}`);

    const claimsEndpoints = [
      `https://api.mercadolibre.com/post-purchase/v1/claims/search?resource_id=${orderId}&resource=order`,
      `https://api.mercadolibre.com/orders/${orderId}/claims`,
      `https://api.mercadolibre.com/post-purchase/v1/claims/search?order_id=${orderId}`
    ];

    for (const endpoint of claimsEndpoints) {
      try {
        const response = await fetch(endpoint, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (response.ok) {
          const claimsData = await response.json();
          if (claimsData.results && claimsData.results.length > 0) {
            console.log(`🎉 CLAIM REAL ENCONTRADO para order ${orderId}:`, claimsData);
            return { orderId, claims: claimsData.results };
          }
        }
      } catch (error) {
        console.log(`❌ Erro no endpoint ${endpoint}:`, error);
      }
    }
  }
  
  return null;
}

// Função para processar claim real encontrado
async function processRealClaim(claim, supabase, accountId, organizationId) {
  console.log(`📝 Processando claim real: ${claim.id} para order ${claim.order_id || claim.resource_id}`);
  
  try {
    const orderId = claim.order_id || claim.resource_id;
    
    // Buscar detalhes da order
    const orderData = await fetchOrderDetails(orderId, 'accessToken');
    
    // Inserir/atualizar na tabela
    const { error } = await supabase
      .from('devolucoes_avancadas')
      .upsert({
        order_id: orderId,
        claim_id: claim.id,
        integration_account_id: accountId,
        organization_id: organizationId,
        dados_claim: claim,
        dados_order: orderData,
        status_devolucao: claim.status,
        cronograma_status: claim.stage,
        data_criacao: claim.date_created,
        ultima_atualizacao: claim.last_updated,
        produto_titulo: claim.item?.title,
        sku: claim.item?.sku,
        quantidade: claim.quantity?.value || 1,
        id_item: claim.item?.id,
        id_carrinho: orderId,
        processado_em: new Date().toISOString()
      }, {
        onConflict: 'order_id'
      });
      
    if (error) {
      console.log(`❌ Erro ao salvar claim ${claim.id}:`, error);
    } else {
      console.log(`✅ Claim real ${claim.id} salvo com sucesso`);
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Erro ao processar claim ${claim.id}:`, error);
    return false;
  }
}

async function fetchOrderDetails(orderId, accessToken) {
  try {
    const response = await fetch(`https://api.mercadolibre.com/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.log(`❌ Erro ao buscar detalhes da order ${orderId}:`, error);
  }
  
  return null;
}

// Buscar claims reais usando endpoints oficiais (função original mantida)
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

    console.log(`🚀 Iniciando busca estratégica por orders problemáticas...`);
    
    let totalProcessed = 0;
    let totalSuccess = 0;
    let realClaimsFound = 0;

    for (const accountId of account_ids) {
      console.log(`\n📋 Processando conta: ${accountId}`);
      
      // Buscar dados da conta de integração
      const { data: accountData } = await supabase
        .from('integration_accounts')
        .select('account_identifier, organization_id')
        .eq('id', accountId)
        .single();
        
      if (!accountData) {
        console.log(`❌ Conta ${accountId} não encontrada`);
        continue;
      }
      
      const sellerId = accountData.account_identifier;
      const organizationId = accountData.organization_id;

      // Buscar token
      const { data: tokenData } = await supabase
        .from('integration_secrets')
        .select('simple_tokens')
        .eq('integration_account_id', accountId)
        .single();

      if (!tokenData) {
        console.log(`❌ Token não encontrado para conta ${accountId}`);
        continue;
      }

      const { data: decryptResult } = await supabase.rpc('decrypt_simple', {
        encrypted_data: tokenData.simple_tokens
      });
      if (!decryptResult) {
        console.log(`❌ Falha ao descriptografar token para conta ${accountId}`);
        continue;
      }

      const tokenObj = JSON.parse(decryptResult);
      const accessToken = tokenObj.access_token;
      console.log(`✅ Access token obtido para conta ${accountId}`);
      
      // ESTRATÉGIA 1: Testar orders conhecidas da planilha
      console.log(`\n🎯 ESTRATÉGIA 1: Testando orders conhecidas da planilha...`);
      const knownProblematic = await testKnownProblematicOrders(accessToken);
      
      if (knownProblematic) {
        console.log(`🎉 Encontrou order problemática: ${knownProblematic.orderId}`);
        for (const claim of knownProblematic.claims) {
          const success = await processRealClaim(claim, supabase, accountId, organizationId);
          if (success) {
            totalSuccess++;
            realClaimsFound++;
          }
        }
      }
      
      // ESTRATÉGIA 2: Buscar claims do seller primeiro
      console.log(`\n🎯 ESTRATÉGIA 2: Buscando claims do seller primeiro...`);
      if (sellerId) {
        const allClaims = await fetchClaimsFirst(sellerId, accessToken);
        
        if (allClaims.length > 0) {
          console.log(`🎉 Encontrou ${allClaims.length} claims do seller`);
          for (const claim of allClaims.slice(0, 5)) { // Processar os primeiros 5
            const success = await processRealClaim(claim, supabase, accountId, organizationId);
            if (success) {
              totalSuccess++;
              realClaimsFound++;
            }
          }
        }
      }
      
      // ESTRATÉGIA 3: Buscar orders com status problemático
      console.log(`\n🎯 ESTRATÉGIA 3: Buscando orders com status problemático...`);
      if (sellerId) {
        const problematicOrders = await fetchProblematicOrders(sellerId, accessToken);
        
        if (problematicOrders.length > 0) {
          console.log(`🎉 Encontrou ${problematicOrders.length} orders problemáticas`);
          for (const order of problematicOrders.slice(0, 3)) { // Processar as primeiras 3
            const claims = await fetchRealClaims(order.id, accessToken);
            if (claims.length > 0) {
              for (const claim of claims) {
                const success = await processRealClaim(claim, supabase, accountId, organizationId);
                if (success) {
                  totalSuccess++;
                  realClaimsFound++;
                }
              }
            }
          }
        }
      }

      // ESTRATÉGIA 4: Continuar processamento normal para completar dados
      console.log(`\n🎯 ESTRATÉGIA 4: Processamento normal para completar dados...`);
      
      const { data: localOrders, error: selectError } = await supabase
        .from('devolucoes_avancadas')
        .select('id, order_id, dados_order, claim_id, id_carrinho, id_item, sku, quantidade, produto_titulo')
        .eq('integration_account_id', accountId)
        .or('claim_id.is.null,claim_id.like.simulated_%')
        .limit(10);

      if (selectError) throw selectError;

      for (const localOrder of localOrders) {
        const order = localOrder.dados_order || localOrder.raw_data;
        const orderId = order?.id || localOrder.order_id;
        
        console.log(`🎯 Processando order: ${orderId}`);

        // Buscar claims e mensagens
        const realClaims = await fetchRealClaims(orderId, accessToken);
        const messages = await fetchPostSaleMessages(orderId, order?.pack_id, sellerId, accessToken);

        // Extrair dados dos order_items se disponível
        const orderItems = order?.order_items || [];
        const firstItem = orderItems[0];
        
        let updateData = {
          dados_mensagens: messages,
          ultima_atualizacao: new Date().toISOString(),
          id_carrinho: orderId,
          id_item: firstItem?.item?.id || localOrder.id_item,
          sku: firstItem?.item?.seller_sku || localOrder.sku,
          quantidade: firstItem?.quantity || localOrder.quantidade || 1,
          produto_titulo: firstItem?.item?.title || localOrder.produto_titulo
        };

        if (realClaims.length > 0) {
          const claim = realClaims[0];
          realClaimsFound++;

          let returnData = null;
          if (claim.related_entities && claim.related_entities.includes('returns')) {
            returnData = await fetchRealReturns(claim.id, accessToken);
          }

          const actions = await fetchClaimActions(claim.id, accessToken);

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

        const { error: updateError } = await supabase
          .from('devolucoes_avancadas')
          .update(updateData)
          .eq('id', localOrder.id);

        if (!updateError) {
          totalProcessed++;
          console.log(`✅ Order ${orderId} processada com sucesso!`);
        } else {
          console.error(`❌ Erro ao atualizar order ${orderId}:`, updateError.message);
        }
      }
    }

    const summary = {
      success: true,
      total_processed: totalProcessed,
      total_success: totalSuccess,
      real_claims_found: realClaimsFound,
      message: `Busca estratégica concluída: ${realClaimsFound} claims reais encontrados de ${totalProcessed} orders processadas`
    };

    console.log(`🎯 RESULTADO FINAL:`, summary);

    return new Response(JSON.stringify(summary), {
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