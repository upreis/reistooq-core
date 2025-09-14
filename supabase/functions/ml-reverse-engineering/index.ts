import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/client.ts";

interface APITestResult {
  endpoint: string;
  status: number;
  success: boolean;
  count?: number;
  data_sample?: any;
  error?: string;
  response_time?: number;
}

interface ReverseEngineeringResult {
  id?: string;
  organization_id: string;
  integration_account_id: string;
  seller_id?: string;
  endpoint_category: string;
  endpoint_url: string;
  http_method: string;
  status_code: number;
  success: boolean;
  response_count?: number;
  response_sample?: any;
  error_message?: string;
  response_time_ms?: number;
  tested_at: string;
  parameters_tested?: any;
}

function makeServiceClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, serviceKey);
}

async function testEndpoint(url: string, accessToken: string): Promise<APITestResult> {
  const startTime = performance.now();
  
  try {
    console.log(`🔍 Testando: ${url}`);
    
    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);
    
    if (response.ok) {
      const data = await response.json();
      const count = data.results?.length || (Array.isArray(data) ? data.length : 0);
      
      console.log(`✅ ${url} → Status ${response.status}, ${count} items, ${responseTime}ms`);
      
      return {
        endpoint: url,
        status: response.status,
        success: true,
        count,
        data_sample: data,
        response_time: responseTime
      };
    } else {
      console.log(`❌ ${url} → Status ${response.status}, ${responseTime}ms`);
      
      return {
        endpoint: url,
        status: response.status,
        success: false,
        error: `HTTP ${response.status}`,
        response_time: responseTime
      };
    }
  } catch (error) {
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);
    
    console.log(`❌ ${url} → Erro: ${error.message}, ${responseTime}ms`);
    
    return {
      endpoint: url,
      status: 0,
      success: false,
      error: error.message,
      response_time: responseTime
    };
  }
}

async function systematicAPIMapping(accessToken: string, accountId: string, organizationId: string): Promise<ReverseEngineeringResult[]> {
  console.log('🔬 INICIANDO ENGENHARIA REVERSA SISTEMÁTICA DA API ML');
  
  const results: ReverseEngineeringResult[] = [];
  
  // FASE 1.1: Descobrir seller_id
  console.log('📋 FASE 1.1: Descobrindo seller_id...');
  
  const userEndpoints = [
    'https://api.mercadolibre.com/users/me',
    'https://api.mercadolibre.com/users/me/addresses',
    'https://api.mercadolibre.com/myml/profile',
    'https://api.mercadolibre.com/users/me/billing_info',
    'https://api.mercadolibre.com/users/me/preferences'
  ];
  
  let sellerId = null;
  
  for (const endpoint of userEndpoints) {
    const result = await testEndpoint(endpoint, accessToken);
    
    if (result.success && result.data_sample?.id) {
      sellerId = result.data_sample.id;
      console.log(`✅ Seller ID descoberto: ${sellerId} via ${endpoint}`);
    }
    
    // Salvar resultado
    const reverseResult: ReverseEngineeringResult = {
      organization_id: organizationId,
      integration_account_id: accountId,
      seller_id: sellerId,
      endpoint_category: 'user_info',
      endpoint_url: endpoint,
      http_method: 'GET',
      status_code: result.status,
      success: result.success,
      response_count: result.count,
      response_sample: result.data_sample,
      error_message: result.error,
      response_time_ms: result.response_time,
      tested_at: new Date().toISOString()
    };
    
    results.push(reverseResult);
  }
  
  if (!sellerId) {
    console.log('🚨 ERRO: Não foi possível obter seller_id');
    return results;
  }
  
  // FASE 1.2: Testando endpoints de Orders
  console.log('📋 FASE 1.2: Testando endpoints de Orders...');
  
  const orderEndpoints = [
    // Endpoints básicos
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&sort=date_desc&limit=200`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&order.date_created.from=2024-01-01T00:00:00.000-00:00`,
    
    // Por status
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&order.status=paid`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&order.status=cancelled`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&order.status=not_delivered`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&order.status=returned`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&order.status=delivered`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&order.status=pending`,
    
    // Por feedback
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&feedback.rating=negative`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&feedback.rating=neutral`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&feedback.rating=positive`,
    
    // Por shipping
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&shipping.status=not_delivered`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&shipping.status=delivered`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&shipping.status=pending`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&shipping.status=cancelled`,
    
    // Outros endpoints alternativos
    `https://api.mercadolibre.com/users/${sellerId}/orders/search`,
    `https://api.mercadolibre.com/myml/orders`,
    `https://api.mercadolibre.com/myml/orders/search`
  ];
  
  for (const endpoint of orderEndpoints) {
    const result = await testEndpoint(endpoint, accessToken);
    
    const reverseResult: ReverseEngineeringResult = {
      organization_id: organizationId,
      integration_account_id: accountId,
      seller_id: sellerId,
      endpoint_category: 'orders',
      endpoint_url: endpoint,
      http_method: 'GET',
      status_code: result.status,
      success: result.success,
      response_count: result.count,
      response_sample: result.data_sample,
      error_message: result.error,
      response_time_ms: result.response_time,
      tested_at: new Date().toISOString()
    };
    
    results.push(reverseResult);
  }
  
  // FASE 1.3: Testando endpoints de Claims
  console.log('📋 FASE 1.3: Testando endpoints de Claims...');
  
  const claimsEndpoints = [
    // v1 endpoints
    `https://api.mercadolibre.com/post-purchase/v1/claims/search?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/post-purchase/v1/claims/search?resource=seller&resource_id=${sellerId}`,
    `https://api.mercadolibre.com/post-purchase/v1/claims?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/post-purchase/v1/claims/seller/${sellerId}`,
    
    // v2 endpoints
    `https://api.mercadolibre.com/post-purchase/v2/claims/search?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/post-purchase/v2/claims?seller_id=${sellerId}`,
    
    // Endpoints sem versão
    `https://api.mercadolibre.com/claims/search?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/users/${sellerId}/claims`,
    `https://api.mercadolibre.com/post-purchase/claims/search?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/post-purchase/claims?seller_id=${sellerId}`,
    
    // Endpoint myml
    `https://api.mercadolibre.com/myml/claims`,
    `https://api.mercadolibre.com/myml/post-purchase/claims`
  ];
  
  for (const endpoint of claimsEndpoints) {
    const result = await testEndpoint(endpoint, accessToken);
    
    const reverseResult: ReverseEngineeringResult = {
      organization_id: organizationId,
      integration_account_id: accountId,
      seller_id: sellerId,
      endpoint_category: 'claims',
      endpoint_url: endpoint,
      http_method: 'GET',
      status_code: result.status,
      success: result.success,
      response_count: result.count,
      response_sample: result.data_sample,
      error_message: result.error,
      response_time_ms: result.response_time,
      tested_at: new Date().toISOString()
    };
    
    results.push(reverseResult);
  }
  
  // FASE 1.4: Testando endpoints de Mediations
  console.log('📋 FASE 1.4: Testando endpoints de Mediations...');
  
  const mediationEndpoints = [
    `https://api.mercadolibre.com/mediations/search?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/post-purchase/mediations/search?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/post-purchase/v1/mediations/search?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/post-purchase/v2/mediations/search?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/users/${sellerId}/mediations`,
    `https://api.mercadolibre.com/myml/mediations`
  ];
  
  for (const endpoint of mediationEndpoints) {
    const result = await testEndpoint(endpoint, accessToken);
    
    const reverseResult: ReverseEngineeringResult = {
      organization_id: organizationId,
      integration_account_id: accountId,
      seller_id: sellerId,
      endpoint_category: 'mediations',
      endpoint_url: endpoint,
      http_method: 'GET',
      status_code: result.status,
      success: result.success,
      response_count: result.count,
      response_sample: result.data_sample,
      error_message: result.error,
      response_time_ms: result.response_time,
      tested_at: new Date().toISOString()
    };
    
    results.push(reverseResult);
  }
  
  // FASE 1.5: Testando endpoints de Returns
  console.log('📋 FASE 1.5: Testando endpoints de Returns...');
  
  const returnEndpoints = [
    `https://api.mercadolibre.com/returns/search?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/post-purchase/returns/search?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/post-purchase/v1/returns/search?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/post-purchase/v2/returns/search?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/users/${sellerId}/returns`,
    `https://api.mercadolibre.com/myml/returns`
  ];
  
  for (const endpoint of returnEndpoints) {
    const result = await testEndpoint(endpoint, accessToken);
    
    const reverseResult: ReverseEngineeringResult = {
      organization_id: organizationId,
      integration_account_id: accountId,
      seller_id: sellerId,
      endpoint_category: 'returns',
      endpoint_url: endpoint,
      http_method: 'GET',
      status_code: result.status,
      success: result.success,
      response_count: result.count,
      response_sample: result.data_sample,
      error_message: result.error,
      response_time_ms: result.response_time,
      tested_at: new Date().toISOString()
    };
    
    results.push(reverseResult);
  }
  
  // FASE 1.6: Testando endpoints de Messages
  console.log('📋 FASE 1.6: Testando endpoints de Messages...');
  
  const messageEndpoints = [
    `https://api.mercadolibre.com/messages/search?user_id=${sellerId}`,
    `https://api.mercadolibre.com/messages/packs/search?user_id=${sellerId}`,
    `https://api.mercadolibre.com/users/${sellerId}/messages`,
    `https://api.mercadolibre.com/myml/messages`,
    `https://api.mercadolivre.com/myml/inbox`
  ];
  
  for (const endpoint of messageEndpoints) {
    const result = await testEndpoint(endpoint, accessToken);
    
    const reverseResult: ReverseEngineeringResult = {
      organization_id: organizationId,
      integration_account_id: accountId,
      seller_id: sellerId,
      endpoint_category: 'messages',
      endpoint_url: endpoint,
      http_method: 'GET',
      status_code: result.status,
      success: result.success,
      response_count: result.count,
      response_sample: result.data_sample,
      error_message: result.error,
      response_time_ms: result.response_time,
      tested_at: new Date().toISOString()
    };
    
    results.push(reverseResult);
  }
  
  // FASE 1.7: Testando endpoints de Shipping
  console.log('📋 FASE 1.7: Testando endpoints de Shipping...');
  
  const shippingEndpoints = [
    `https://api.mercadolibre.com/shipments/search?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/users/${sellerId}/shipments`,
    `https://api.mercadolibre.com/users/${sellerId}/shipments/search`,
    `https://api.mercadolibre.com/myml/shipments`
  ];
  
  for (const endpoint of shippingEndpoints) {
    const result = await testEndpoint(endpoint, accessToken);
    
    const reverseResult: ReverseEngineeringResult = {
      organization_id: organizationId,
      integration_account_id: accountId,
      seller_id: sellerId,
      endpoint_category: 'shipping',
      endpoint_url: endpoint,
      http_method: 'GET',
      status_code: result.status,
      success: result.success,
      response_count: result.count,
      response_sample: result.data_sample,
      error_message: result.error,
      response_time_ms: result.response_time,
      tested_at: new Date().toISOString()
    };
    
    results.push(reverseResult);
  }
  
  // FASE 1.8: Testando endpoints de Catalog
  console.log('📋 FASE 1.8: Testando endpoints de Catalog...');
  
  const catalogEndpoints = [
    `https://api.mercadolibre.com/users/${sellerId}/items/search`,
    `https://api.mercadolibre.com/users/${sellerId}/items`,
    `https://api.mercadolibre.com/myml/items`,
    `https://api.mercadolibre.com/items/search?seller_id=${sellerId}`
  ];
  
  for (const endpoint of catalogEndpoints) {
    const result = await testEndpoint(endpoint, accessToken);
    
    const reverseResult: ReverseEngineeringResult = {
      organization_id: organizationId,
      integration_account_id: accountId,
      seller_id: sellerId,
      endpoint_category: 'catalog',
      endpoint_url: endpoint,
      http_method: 'GET',
      status_code: result.status,
      success: result.success,
      response_count: result.count,
      response_sample: result.data_sample,
      error_message: result.error,
      response_time_ms: result.response_time,
      tested_at: new Date().toISOString()
    };
    
    results.push(reverseResult);
  }
  
  return results;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { account_ids } = await req.json();

    if (!account_ids || !Array.isArray(account_ids) || account_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'account_ids array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🚀 Iniciando reverse engineering para ${account_ids.length} contas`);

    const supabase = makeServiceClient();
    const allResults = [];

    for (const accountId of account_ids) {
      try {
        console.log(`\n🔄 Processando conta: ${accountId}`);

        // Buscar dados da conta
        const { data: account, error: accountError } = await supabase
          .from('integration_accounts')
          .select('*')
          .eq('id', accountId)
          .eq('provider', 'mercadolivre')
          .eq('is_active', true)
          .single();

        if (accountError || !account) {
          console.log(`❌ Conta não encontrada: ${accountId}`);
          continue;
        }

        const organizationId = account.organization_id;

        // Buscar token de acesso
        const { data: secret, error: secretError } = await supabase
          .from('integration_secrets')
          .select('simple_tokens')
          .eq('integration_account_id', accountId)
          .eq('provider', 'mercadolivre')
          .single();

        if (secretError || !secret?.simple_tokens) {
          console.log(`❌ Token não encontrado para conta: ${accountId}`);
          continue;
        }

        // Descriptografar token
        const { data: decryptedData, error: decryptError } = await supabase
          .rpc('decrypt_simple', { encrypted_data: secret.simple_tokens });

        if (decryptError || !decryptedData) {
          console.log(`❌ Erro ao descriptografar token para conta: ${accountId}`);
          continue;
        }

        let tokenData;
        try {
          tokenData = JSON.parse(decryptedData);
        } catch (error) {
          console.log(`❌ Erro ao fazer parse do token para conta: ${accountId}`);
          continue;
        }

        const accessToken = tokenData.access_token;
        if (!accessToken) {
          console.log(`❌ Access token não encontrado para conta: ${accountId}`);
          continue;
        }

        // Executar mapeamento
        const results = await systematicAPIMapping(accessToken, accountId, organizationId);
        allResults.push(...results);

        // Salvar resultados incrementalmente
        if (results.length > 0) {
          try {
            console.log(`💾 Salvando ${results.length} resultados da conta ${accountId}...`);
            
            const { error: insertError } = await supabase
              .from('ml_reverse_engineering_results')
              .insert(results);
            
            if (insertError) {
              console.error(`❌ Erro ao salvar resultados da conta ${accountId}:`, insertError);
            } else {
              console.log(`✅ Resultados da conta ${accountId} salvos com sucesso`);
            }
          } catch (error) {
            console.error(`❌ Erro ao salvar no banco para conta ${accountId}:`, error);
          }
        }

        console.log(`✅ Processamento concluído para conta: ${accountId}`);

      } catch (error) {
        console.error(`❌ Erro ao processar conta ${accountId}:`, error);
      }
    }

    console.log(`\n🎯 ENGENHARIA REVERSA CONCLUÍDA:`);
    console.log(`Total de endpoints testados: ${allResults.length}`);
    console.log(`Endpoints funcionais: ${allResults.filter(r => r.success).length}`);
    console.log(`Endpoints com erro: ${allResults.filter(r => !r.success).length}`);

    // Estatísticas por categoria
    const categories = [...new Set(allResults.map(r => r.endpoint_category))];
    console.log('\n📊 ESTATÍSTICAS POR CATEGORIA:');
    categories.forEach(category => {
      const categoryResults = allResults.filter(r => r.endpoint_category === category);
      const working = categoryResults.filter(r => r.success).length;
      const total = categoryResults.length;
      console.log(`${category}: ${working}/${total} funcionais`);
    });

    return new Response(
      JSON.stringify({
        success: true,
        total_tested: allResults.length,
        total_working: allResults.filter(r => r.success).length,
        total_errors: allResults.filter(r => !r.success).length,
        categories_stats: categories.map(category => {
          const categoryResults = allResults.filter(r => r.endpoint_category === category);
          return {
            category,
            total: categoryResults.length,
            working: categoryResults.filter(r => r.success).length,
            error: categoryResults.filter(r => !r.success).length
          };
        }),
        message: 'Engenharia reversa sistemática concluída com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});