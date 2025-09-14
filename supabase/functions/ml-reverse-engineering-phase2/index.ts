import { makeUserClient, makeServiceClient, corsHeaders, ok, fail } from "../_shared/client.ts";
import { decryptAESGCM } from "../_shared/crypto.ts";

// Delay function to avoid rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface OptimizedAnalysis {
  basic_orders: {
    count: number;
    sample: any;
    statuses: string[];
    has_pack_id: boolean;
    has_shipping: boolean;
    has_payments: boolean;
    total_amount: number;
  };
  cancelled_orders: {
    count: number;
    sample: any;
    statuses: string[];
  };
  claims: {
    count: number;
    sample: any;
    types: string[];
    statuses: string[];
    has_resource_id: boolean;
  };
  relationship_test: {
    tested: boolean;
    claim_id: string | null;
    order_id: string | null;
    success: boolean;
    order_status: string | null;
  };
}

interface Phase2OptimizedResults {
  analysis: OptimizedAnalysis;
  summary: {
    total_orders_found: number;
    total_claims_found: number;
    relationship_confirmed: boolean;
    data_quality_score: number;
    endpoints_tested: number;
    execution_time: number;
  };
  account_id: string;
  seller_id: string;
}

async function fase2Otimizada(accessToken: string, sellerId: string): Promise<OptimizedAnalysis> {
  console.log('🔧 FASE 2 OTIMIZADA: Análise controlada iniciada');
  
  let analysis: OptimizedAnalysis = {
    basic_orders: {
      count: 0,
      sample: null,
      statuses: [],
      has_pack_id: false,
      has_shipping: false,
      has_payments: false,
      total_amount: 0
    },
    cancelled_orders: {
      count: 0,
      sample: null,
      statuses: []
    },
    claims: {
      count: 0,
      sample: null,
      types: [],
      statuses: [],
      has_resource_id: false
    },
    relationship_test: {
      tested: false,
      claim_id: null,
      order_id: null,
      success: false,
      order_status: null
    }
  };

  try {
    // 1. TESTAR ENDPOINT BÁSICO DE ORDERS
    console.log('📋 Testando orders básicas...');
    
    const basicOrdersResponse = await fetch(
      `https://api.mercadolibre.com/orders/search?seller=${sellerId}&limit=10`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    if (basicOrdersResponse.ok) {
      const basicOrders = await basicOrdersResponse.json();
      const orders = basicOrders.results || [];
      
      analysis.basic_orders = {
        count: orders.length,
        sample: orders[0] || null,
        statuses: [...new Set(orders.map((o: any) => o.status))],
        has_pack_id: orders.some((o: any) => o.pack_id),
        has_shipping: orders.some((o: any) => o.shipping),
        has_payments: orders.some((o: any) => o.payments && o.payments.length > 0),
        total_amount: orders.reduce((sum: number, o: any) => sum + (parseFloat(o.total_amount) || 0), 0)
      };
      
      console.log(`✅ Orders básicas: ${analysis.basic_orders.count} orders`);
    } else {
      console.log(`❌ Orders básicas falhou: ${basicOrdersResponse.status}`);
    }

    await delay(2000);

    // 2. TESTAR ORDERS CANCELADAS
    console.log('📋 Testando orders canceladas...');
    
    const cancelledOrdersResponse = await fetch(
      `https://api.mercadolibre.com/orders/search?seller=${sellerId}&order.status=cancelled&limit=10`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    if (cancelledOrdersResponse.ok) {
      const cancelledOrders = await cancelledOrdersResponse.json();
      const orders = cancelledOrders.results || [];
      
      analysis.cancelled_orders = {
        count: orders.length,
        sample: orders[0] || null,
        statuses: [...new Set(orders.map((o: any) => o.status))]
      };
      
      console.log(`✅ Orders canceladas: ${analysis.cancelled_orders.count} orders`);
    } else {
      console.log(`❌ Orders canceladas falhou: ${cancelledOrdersResponse.status}`);
    }

    await delay(2000);

    // 3. TESTAR ENDPOINT DE CLAIMS
    console.log('🔍 Testando endpoint de claims...');
    
    const claimsResponse = await fetch(
      `https://api.mercadolibre.com/post-purchase/v1/claims/search?seller_id=${sellerId}&limit=10`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    if (claimsResponse.ok) {
      const claimsData = await claimsResponse.json();
      const claims = claimsData.results || [];
      
      analysis.claims = {
        count: claims.length,
        sample: claims[0] || null,
        types: [...new Set(claims.map((c: any) => c.type))],
        statuses: [...new Set(claims.map((c: any) => c.status))],
        has_resource_id: claims.some((c: any) => c.resource_id)
      };
      
      console.log(`✅ Claims encontradas: ${analysis.claims.count} claims`);

      // 4. TESTAR RELACIONAMENTO (APENAS 1 EXEMPLO)
      if (claims.length > 0 && claims[0].resource_id) {
        console.log('🔗 Testando relacionamento Order ↔ Claim...');
        
        const firstClaim = claims[0];
        const orderId = firstClaim.resource_id;
        
        await delay(2000);
        
        try {
          const orderResponse = await fetch(
            `https://api.mercadolibre.com/orders/${orderId}`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
          );

          if (orderResponse.ok) {
            const order = await orderResponse.json();
            
            analysis.relationship_test = {
              tested: true,
              claim_id: firstClaim.id,
              order_id: orderId,
              success: true,
              order_status: order.status
            };
            
            console.log(`✅ Relacionamento confirmado: Claim ${firstClaim.id} ↔ Order ${orderId}`);
            console.log(`   - Order status: ${order.status}`);
          } else {
            analysis.relationship_test = {
              tested: true,
              claim_id: firstClaim.id,
              order_id: orderId,
              success: false,
              order_status: null
            };
            console.log(`❌ Falha ao buscar order ${orderId}: ${orderResponse.status}`);
          }
        } catch (error) {
          console.log(`❌ Erro no relacionamento: ${error.message}`);
        }
      }
    } else {
      console.log(`❌ Claims falhou: ${claimsResponse.status}`);
    }

    // 5. ANÁLISE ESTRUTURAL
    console.log('\n📊 ANÁLISE ESTRUTURAL:');
    console.log(`   - Orders básicas: ${analysis.basic_orders.count}`);
    console.log(`   - Orders canceladas: ${analysis.cancelled_orders.count}`);
    console.log(`   - Claims: ${analysis.claims.count}`);
    console.log(`   - Status orders: ${analysis.basic_orders.statuses.join(', ')}`);
    console.log(`   - Tipos claims: ${analysis.claims.types.join(', ')}`);
    
    if (analysis.relationship_test.success) {
      console.log(`   - Relacionamento: ✅ Confirmado`);
    }

    return analysis;

  } catch (error) {
    console.error('❌ Erro na Fase 2 Otimizada:', error);
    throw error;
  }
}

function calculateDataQualityScore(analysis: OptimizedAnalysis): number {
  let score = 0;
  let maxScore = 100;

  // Orders básicas (40 pontos)
  if (analysis.basic_orders.count > 0) score += 20;
  if (analysis.basic_orders.has_payments) score += 10;
  if (analysis.basic_orders.has_shipping) score += 5;
  if (analysis.basic_orders.statuses.length > 1) score += 5;

  // Orders canceladas (20 pontos)
  if (analysis.cancelled_orders.count > 0) score += 20;

  // Claims (30 pontos)
  if (analysis.claims.count > 0) score += 15;
  if (analysis.claims.types.length > 0) score += 10;
  if (analysis.claims.has_resource_id) score += 5;

  // Relacionamento (10 pontos)
  if (analysis.relationship_test.success) score += 10;

  return Math.round((score / maxScore) * 100);
}


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return fail('Method not allowed', 405);
  }

  try {
    const startTime = Date.now();
    const { account_ids } = await req.json();

    if (!account_ids || !Array.isArray(account_ids) || account_ids.length === 0) {
      return fail('account_ids array is required');
    }

    const supabase = makeServiceClient();
    const results: Phase2OptimizedResults[] = [];

    console.log(`🚀 INICIANDO FASE 2 OTIMIZADA - Análise Controlada para ${account_ids.length} conta(s)`);

    for (const accountId of account_ids) {
      console.log(`\n📋 Processando conta: ${accountId}`);

      // Buscar dados da conta e secrets
      const { data: account, error: accountError } = await supabase
        .from('integration_accounts')
        .select('*')
        .eq('id', accountId)
        .eq('provider', 'mercadolivre')
        .single();

      if (accountError || !account) {
        console.log(`❌ Conta não encontrada: ${accountId}`);
        continue;
      }

      const { data: secrets, error: secretsError } = await supabase
        .from('integration_secrets')
        .select('simple_tokens')
        .eq('integration_account_id', accountId)
        .single();

      if (secretsError || !secrets?.simple_tokens) {
        console.log(`❌ Secrets não encontrados para conta: ${accountId}`);
        continue;
      }

      // Descriptografar tokens
      const decryptedTokens = await decryptAESGCM(secrets.simple_tokens);
      const tokenData = JSON.parse(decryptedTokens);
      const accessToken = tokenData.access_token;

      // Usar account_identifier como sellerId
      const sellerId = account.account_identifier;

      console.log(`✅ Tokens encontrados para seller: ${sellerId}`);

      // Executar análise otimizada
      const analysis = await fase2Otimizada(accessToken, sellerId);
      
      // Calcular score de qualidade
      const dataQualityScore = calculateDataQualityScore(analysis);

      const accountResult: Phase2OptimizedResults = {
        analysis,
        summary: {
          total_orders_found: analysis.basic_orders.count + analysis.cancelled_orders.count,
          total_claims_found: analysis.claims.count,
          relationship_confirmed: analysis.relationship_test.success,
          data_quality_score: dataQualityScore,
          endpoints_tested: 3, // basic orders, cancelled orders, claims
          execution_time: Date.now() - startTime
        },
        account_id: accountId,
        seller_id: sellerId
      };

      results.push(accountResult);

      console.log(`\n✅ Processamento concluído para conta: ${accountId}`);
      console.log(`📊 Resumo:`);
      console.log(`   - Endpoints testados: ${accountResult.summary.endpoints_tested}`);
      console.log(`   - Orders encontrados: ${accountResult.summary.total_orders_found}`);
      console.log(`   - Claims encontrados: ${accountResult.summary.total_claims_found}`);
      console.log(`   - Relacionamento confirmado: ${accountResult.summary.relationship_confirmed ? '✅' : '❌'}`);
      console.log(`   - Score de qualidade: ${accountResult.summary.data_quality_score}%`);
    }

    console.log(`\n🎯 FASE 2 OTIMIZADA CONCLUÍDA - Análise Controlada:\n`);
    console.log(`Total de contas processadas: ${results.length}`);

    return ok({ 
      success: true, 
      results,
      total_accounts: results.length,
      execution_time: Date.now() - startTime
    });

  } catch (error) {
    console.error('❌ Erro na Fase 2 Otimizada:', error);
    return fail('Erro interno', 500, error.message);
  }
});
