import { makeServiceClient, ok, fail, corsHeaders } from '../_shared/client.ts';

const SYSTEMATIC_TESTING_RESULTS: any[] = [];

// Função principal de engenharia reversa sistemática
async function systematicAPIMapping(accessToken: string, sellerId: string) {
  console.log('🔬 INICIANDO ENGENHARIA REVERSA SISTEMÁTICA DA API ML');
  
  const results = {
    sellerId,
    userEndpoints: [],
    orderEndpoints: [],
    claimsEndpoints: [],
    mediationEndpoints: [],
    returnEndpoints: [],
    messagesEndpoints: [],
    shippingEndpoints: [],
    catalogEndpoints: [],
    advertisingEndpoints: [],
    analyticsEndpoints: [],
    billingEndpoints: [],
    disputeEndpoints: [],
    feedbackEndpoints: [],
    configEndpoints: [],
    timing: new Date().toISOString()
  };

  // FASE 1.1: Descobrir e validar seller_id
  console.log('📋 FASE 1.1: Validando seller_id...');
  const userEndpoints = [
    'https://api.mercadolibre.com/users/me',
    'https://api.mercadolibre.com/users/me/addresses',
    'https://api.mercadolibre.com/myml/profile',
    'https://api.mercadolibre.com/users/me/brands',
    'https://api.mercadolibre.com/users/me/classifieds_promotion_packs'
  ];

  for (const endpoint of userEndpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const userData = await response.json();
        results.userEndpoints.push({
          endpoint,
          status: 'success',
          dataCount: Object.keys(userData).length,
          hasUsefulData: !!(userData.id || userData.seller_id)
        });
        console.log(`✅ ${endpoint} → ${Object.keys(userData).length} campos`);
      } else {
        results.userEndpoints.push({
          endpoint,
          status: 'failed',
          statusCode: response.status
        });
        console.log(`❌ ${endpoint} → Status ${response.status}`);
      }
    } catch (error) {
      results.userEndpoints.push({
        endpoint,
        status: 'error',
        error: error.message
      });
      console.log(`❌ ${endpoint} → Erro: ${error.message}`);
    }
  }

  // FASE 1.2: Testando endpoints de Orders
  console.log('📋 FASE 1.2: Testando endpoints de Orders...');
  const orderEndpoints = [
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&order.status=paid`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&order.status=cancelled`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&order.status=not_delivered`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&order.status=returned`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&feedback.rating=negative`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&shipping.status=not_delivered`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&sort=date_desc&limit=200`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&order.date_created.from=2024-01-01T00:00:00.000-00:00`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&order.date_created.to=2024-12-31T23:59:59.999-00:00`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&payments.status=approved`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&shipping.mode=me2`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&shipping.type=fulfillment`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&tags=not_delivered`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&tags=delivered`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&has_buyers_protection=true`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&mediations=true`
  ];

  for (const endpoint of orderEndpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        const count = data.results?.length || 0;
        results.orderEndpoints.push({
          endpoint,
          status: 'success',
          count,
          hasResults: count > 0,
          paging: data.paging
        });
        console.log(`✅ ${endpoint} → ${count} orders`);
      } else {
        results.orderEndpoints.push({
          endpoint,
          status: 'failed',
          statusCode: response.status
        });
        console.log(`❌ ${endpoint} → Status ${response.status}`);
      }
    } catch (error) {
      results.orderEndpoints.push({
        endpoint,
        status: 'error',
        error: error.message
      });
      console.log(`❌ ${endpoint} → Erro: ${error.message}`);
    }
  }

  // FASE 1.3: Testando endpoints de Claims
  console.log('📋 FASE 1.3: Testando endpoints de Claims...');
  const claimsEndpoints = [
    `https://api.mercadolibre.com/post-purchase/v1/claims/search?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/post-purchase/v1/claims/search?resource=seller&resource_id=${sellerId}`,
    `https://api.mercadolibre.com/claims/search?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/users/${sellerId}/claims`,
    `https://api.mercadolibre.com/post-purchase/v1/claims?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/post-purchase/claims/search?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/claims?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/post-purchase/v2/claims/search?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/post-purchase/v1/claims/search?type=claim&seller_id=${sellerId}`,
    `https://api.mercadolibre.com/post-purchase/v1/claims/search?stage=claim_received&seller_id=${sellerId}`
  ];

  for (const endpoint of claimsEndpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        const count = data.results?.length || data.data?.length || 0;
        results.claimsEndpoints.push({
          endpoint,
          status: 'success',
          count,
          hasResults: count > 0,
          structure: data.results ? 'results' : (data.data ? 'data' : 'other')
        });
        console.log(`✅ ${endpoint} → ${count} claims`);
      } else {
        results.claimsEndpoints.push({
          endpoint,
          status: 'failed',
          statusCode: response.status
        });
        console.log(`❌ ${endpoint} → Status ${response.status}`);
      }
    } catch (error) {
      results.claimsEndpoints.push({
        endpoint,
        status: 'error',
        error: error.message
      });
      console.log(`❌ ${endpoint} → Erro: ${error.message}`);
    }
  }

  // FASE 1.4: Testando endpoints de Mediações
  console.log('📋 FASE 1.4: Testando endpoints de Mediações...');
  const mediationEndpoints = [
    `https://api.mercadolibre.com/post-purchase/v1/mediations/search?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/mediations/search?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/users/${sellerId}/mediations`,
    `https://api.mercadolibre.com/post-purchase/mediations/search?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/post-purchase/v2/mediations/search?seller_id=${sellerId}`
  ];

  for (const endpoint of mediationEndpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        const count = data.results?.length || data.data?.length || 0;
        results.mediationEndpoints.push({
          endpoint,
          status: 'success',
          count,
          hasResults: count > 0
        });
        console.log(`✅ ${endpoint} → ${count} mediations`);
      } else {
        results.mediationEndpoints.push({
          endpoint,
          status: 'failed',
          statusCode: response.status
        });
        console.log(`❌ ${endpoint} → Status ${response.status}`);
      }
    } catch (error) {
      results.mediationEndpoints.push({
        endpoint,
        status: 'error',
        error: error.message
      });
      console.log(`❌ ${endpoint} → Erro: ${error.message}`);
    }
  }

  // FASE 1.5: Testando endpoints de Returns
  console.log('📋 FASE 1.5: Testando endpoints de Returns...');
  const returnEndpoints = [
    `https://api.mercadolibre.com/post-purchase/v1/returns/search?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/post-purchase/v2/returns/search?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/returns/search?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/users/${sellerId}/returns`
  ];

  for (const endpoint of returnEndpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        const count = data.results?.length || data.data?.length || 0;
        results.returnEndpoints.push({
          endpoint,
          status: 'success',
          count,
          hasResults: count > 0
        });
        console.log(`✅ ${endpoint} → ${count} returns`);
      } else {
        results.returnEndpoints.push({
          endpoint,
          status: 'failed',
          statusCode: response.status
        });
        console.log(`❌ ${endpoint} → Status ${response.status}`);
      }
    } catch (error) {
      results.returnEndpoints.push({
        endpoint,
        status: 'error',
        error: error.message
      });
      console.log(`❌ ${endpoint} → Erro: ${error.message}`);
    }
  }

  // FASE 1.6: Testando endpoints de Mensagens
  console.log('📋 FASE 1.6: Testando endpoints de Mensagens...');
  const messagesEndpoints = [
    `https://api.mercadolibre.com/messages/search?user_id=${sellerId}`,
    `https://api.mercadolibre.com/messages/packs?user_id=${sellerId}`,
    `https://api.mercadolibre.com/messages?user_id=${sellerId}`,
    `https://api.mercadolibre.com/myml/messages`,
    `https://api.mercadolibre.com/users/${sellerId}/messages`,
    `https://api.mercadolibre.com/messages/search?tag=post_sale&user_id=${sellerId}`
  ];

  for (const endpoint of messagesEndpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        const count = data.results?.length || data.messages?.length || 0;
        results.messagesEndpoints.push({
          endpoint,
          status: 'success',
          count,
          hasResults: count > 0
        });
        console.log(`✅ ${endpoint} → ${count} messages`);
      } else {
        results.messagesEndpoints.push({
          endpoint,
          status: 'failed',
          statusCode: response.status
        });
        console.log(`❌ ${endpoint} → Status ${response.status}`);
      }
    } catch (error) {
      results.messagesEndpoints.push({
        endpoint,
        status: 'error',
        error: error.message
      });
      console.log(`❌ ${endpoint} → Erro: ${error.message}`);
    }
  }

  // FASE 1.7: Endpoints de Shipping/Logística
  console.log('📋 FASE 1.7: Testando endpoints de Shipping...');
  const shippingEndpoints = [
    `https://api.mercadolibre.com/users/${sellerId}/shipping_preferences`,
    `https://api.mercadolibre.com/shipments/search?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/shipping/search?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/logistics/search?seller_id=${sellerId}`
  ];

  for (const endpoint of shippingEndpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        const count = data.results?.length || Object.keys(data).length || 0;
        results.shippingEndpoints.push({
          endpoint,
          status: 'success',
          count,
          hasResults: count > 0
        });
        console.log(`✅ ${endpoint} → ${count} shipping items`);
      } else {
        results.shippingEndpoints.push({
          endpoint,
          status: 'failed',
          statusCode: response.status
        });
        console.log(`❌ ${endpoint} → Status ${response.status}`);
      }
    } catch (error) {
      results.shippingEndpoints.push({
        endpoint,
        status: 'error',
        error: error.message
      });
      console.log(`❌ ${endpoint} → Erro: ${error.message}`);
    }
  }

  // FASE 1.8: Endpoints de Catálogo/Produtos
  console.log('📋 FASE 1.8: Testando endpoints de Catálogo...');
  const catalogEndpoints = [
    `https://api.mercadolibre.com/users/${sellerId}/items/search`,
    `https://api.mercadolibre.com/users/${sellerId}/items`,
    `https://api.mercadolibre.com/sites/MLB/search?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/users/${sellerId}/brands`,
    `https://api.mercadolibre.com/users/${sellerId}/catalogs`
  ];

  for (const endpoint of catalogEndpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        const count = data.results?.length || data.length || Object.keys(data).length || 0;
        results.catalogEndpoints.push({
          endpoint,
          status: 'success',
          count,
          hasResults: count > 0
        });
        console.log(`✅ ${endpoint} → ${count} catalog items`);
      } else {
        results.catalogEndpoints.push({
          endpoint,
          status: 'failed',
          statusCode: response.status
        });
        console.log(`❌ ${endpoint} → Status ${response.status}`);
      }
    } catch (error) {
      results.catalogEndpoints.push({
        endpoint,
        status: 'error',
        error: error.message
      });
      console.log(`❌ ${endpoint} → Erro: ${error.message}`);
    }
  }

  return results;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { account_ids } = await req.json();
    const supabase = makeServiceClient();

    console.log('🔬 Iniciando Engenharia Reversa Sistemática ML API...');
    
    const allResults = [];

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
      
      // Executar mapeamento sistemático
      const mappingResults = await systematicAPIMapping(accessToken, sellerId);
      mappingResults.accountId = accountId;
      mappingResults.organizationId = organizationId;
      
      allResults.push(mappingResults);
      
      // Salvar resultados no banco
      await supabase
        .from('ml_reverse_engineering_results')
        .upsert({
          integration_account_id: accountId,
          organization_id: organizationId,
          seller_id: sellerId,
          mapping_results: mappingResults,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'integration_account_id'
        });
    }

    const summary = {
      success: true,
      accounts_processed: allResults.length,
      timestamp: new Date().toISOString(),
      results: allResults,
      summary: {
        totalEndpointsTested: allResults.reduce((sum, r) => 
          sum + r.userEndpoints.length + r.orderEndpoints.length + 
          r.claimsEndpoints.length + r.mediationEndpoints.length + 
          r.returnEndpoints.length + r.messagesEndpoints.length + 
          r.shippingEndpoints.length + r.catalogEndpoints.length, 0),
        workingEndpoints: allResults.reduce((sum, r) => 
          sum + r.userEndpoints.filter(e => e.status === 'success').length +
          r.orderEndpoints.filter(e => e.status === 'success').length +
          r.claimsEndpoints.filter(e => e.status === 'success').length +
          r.mediationEndpoints.filter(e => e.status === 'success').length +
          r.returnEndpoints.filter(e => e.status === 'success').length +
          r.messagesEndpoints.filter(e => e.status === 'success').length +
          r.shippingEndpoints.filter(e => e.status === 'success').length +
          r.catalogEndpoints.filter(e => e.status === 'success').length, 0)
      }
    };

    console.log(`🎯 ENGENHARIA REVERSA CONCLUÍDA:`, summary.summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro na engenharia reversa:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});