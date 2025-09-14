import { makeUserClient, makeServiceClient, corsHeaders, ok, fail } from "../_shared/client.ts";
import { decryptAESGCM } from "../_shared/crypto.ts";

interface DetailedOrderAnalysis {
  endpoint: string;
  total_orders: number;
  sample_order: any;
  unique_statuses: string[];
  date_range: {
    oldest: string | null;
    newest: string | null;
  };
  has_pack_id: boolean;
  has_shipping: boolean;
  has_payments: boolean;
  orders_by_status: Record<string, number>;
  shipping_modes: string[];
  payment_methods: string[];
  items_count: number;
  total_amount_sum: number;
  avg_amount: number;
}

interface DetailedClaimAnalysis {
  endpoint: string;
  total_claims: number;
  sample_claim: any;
  unique_types: string[];
  unique_stages: string[];
  unique_statuses: string[];
  resource_ids: string[];
  has_reason_id: boolean;
  date_range: {
    oldest: string | null;
    newest: string | null;
  };
  claims_by_type: Record<string, number>;
  claims_by_status: Record<string, number>;
  resolution_time_analysis: any;
}

interface Phase2Results {
  orders_analysis: DetailedOrderAnalysis[];
  claims_analysis: DetailedClaimAnalysis[];
  summary: {
    total_endpoints_analyzed: number;
    orders_endpoints: number;
    claims_endpoints: number;
    total_orders_found: number;
    total_claims_found: number;
    data_completeness_score: number;
  };
  execution_time: number;
  account_id: string;
}

async function analyzeWorkingOrdersEndpoints(accessToken: string, sellerId: string): Promise<DetailedOrderAnalysis[]> {
  console.log('🔍 FASE 2.1: Analisando endpoints de Orders funcionais...');
  
  // Endpoints que funcionaram na Fase 1 (baseado nos logs)
  const workingOrdersEndpoints = [
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&order.status=paid`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&order.status=cancelled`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&order.status=confirmed`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&order.status=delivered`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&order.status=handling`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&order.status=shipped`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&shipping.status=ready_to_ship`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&shipping.status=shipped`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&shipping.status=delivered`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&payment.status=approved`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&payment.status=pending`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&limit=50`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&limit=100`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&offset=0`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&sort=date_asc`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&sort=date_desc`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&q=*`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&date_from=2024-01-01T00:00:00.000-00:00`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&date_to=2024-12-31T23:59:59.000-00:00`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&archived=false`,
    `https://api.mercadolibre.com/orders/search?seller=${sellerId}&archived=true`
  ];

  const detailedResults: DetailedOrderAnalysis[] = [];

  for (const endpoint of workingOrdersEndpoints) {
    try {
      console.log(`🔍 Analisando: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        const orders = data.results || [];

        if (orders.length > 0) {
          // Análise detalhada dos orders
          const statuses = orders.map((o: any) => o.status).filter(Boolean);
          const uniqueStatuses = [...new Set(statuses)];
          
          const statusCounts = statuses.reduce((acc: Record<string, number>, status: string) => {
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {});

          const shippingModes = orders
            .filter((o: any) => o.shipping?.mode)
            .map((o: any) => o.shipping.mode);
          const uniqueShippingModes = [...new Set(shippingModes)];

          const paymentMethods = orders
            .filter((o: any) => o.payments?.[0]?.payment_method_id)
            .map((o: any) => o.payments[0].payment_method_id);
          const uniquePaymentMethods = [...new Set(paymentMethods)];

          const totalAmounts = orders
            .filter((o: any) => o.total_amount)
            .map((o: any) => parseFloat(o.total_amount));
          
          const totalAmountSum = totalAmounts.reduce((sum, amount) => sum + amount, 0);
          const avgAmount = totalAmounts.length > 0 ? totalAmountSum / totalAmounts.length : 0;

          const itemsCount = orders.reduce((sum: number, o: any) => {
            return sum + (o.order_items?.length || 0);
          }, 0);

          const dates = orders
            .filter((o: any) => o.date_created)
            .map((o: any) => new Date(o.date_created));

          const analysis: DetailedOrderAnalysis = {
            endpoint: endpoint,
            total_orders: orders.length,
            sample_order: orders[0] || null,
            unique_statuses: uniqueStatuses,
            date_range: {
              oldest: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))).toISOString() : null,
              newest: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))).toISOString() : null
            },
            has_pack_id: orders.some((o: any) => o.pack_id),
            has_shipping: orders.some((o: any) => o.shipping),
            has_payments: orders.some((o: any) => o.payments && o.payments.length > 0),
            orders_by_status: statusCounts,
            shipping_modes: uniqueShippingModes,
            payment_methods: uniquePaymentMethods,
            items_count: itemsCount,
            total_amount_sum: totalAmountSum,
            avg_amount: avgAmount
          };

          console.log(`📊 ${endpoint}:`);
          console.log(`   - Total: ${analysis.total_orders} orders`);
          console.log(`   - Status únicos: ${analysis.unique_statuses.join(', ')}`);
          console.log(`   - Tem pack_id: ${analysis.has_pack_id}`);
          console.log(`   - Tem shipping: ${analysis.has_shipping}`);
          console.log(`   - Tem payments: ${analysis.has_payments}`);
          console.log(`   - Total de itens: ${analysis.items_count}`);
          console.log(`   - Valor médio: R$ ${analysis.avg_amount.toFixed(2)}`);

          detailedResults.push(analysis);
        } else {
          console.log(`⚠️ ${endpoint}: Sem dados retornados`);
        }
      } else {
        console.log(`❌ ${endpoint}: Status ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Erro em ${endpoint}:`, error.message);
    }
    
    // Pequeno delay para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return detailedResults;
}

async function analyzeWorkingClaimsEndpoints(accessToken: string, sellerId: string): Promise<DetailedClaimAnalysis[]> {
  console.log('🔍 FASE 2.2: Analisando endpoints de Claims funcionais...');
  
  // Endpoints de claims que funcionaram na Fase 1
  const workingClaimsEndpoints = [
    `https://api.mercadolibre.com/post-purchase/v1/claims/search?seller_id=${sellerId}`,
    `https://api.mercadolibre.com/post-purchase/v1/claims/search?seller_id=${sellerId}&status=opened`
  ];

  const claimsResults: DetailedClaimAnalysis[] = [];

  for (const endpoint of workingClaimsEndpoints) {
    try {
      console.log(`🔍 Analisando: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        const claims = data.results || [];

        if (claims.length > 0) {
          const types = claims.map((c: any) => c.type).filter(Boolean);
          const stages = claims.map((c: any) => c.stage).filter(Boolean);
          const statuses = claims.map((c: any) => c.status).filter(Boolean);
          
          const typeCounts = types.reduce((acc: Record<string, number>, type: string) => {
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {});

          const statusCounts = statuses.reduce((acc: Record<string, number>, status: string) => {
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {});

          const dates = claims
            .filter((c: any) => c.date_created)
            .map((c: any) => new Date(c.date_created));

          // Análise de tempo de resolução
          const resolutionTimeAnalysis = claims
            .filter((c: any) => c.date_created && c.resolution_date)
            .map((c: any) => {
              const created = new Date(c.date_created);
              const resolved = new Date(c.resolution_date);
              return Math.abs(resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // dias
            });

          const analysis: DetailedClaimAnalysis = {
            endpoint: endpoint,
            total_claims: claims.length,
            sample_claim: claims[0] || null,
            unique_types: [...new Set(types)],
            unique_stages: [...new Set(stages)],
            unique_statuses: [...new Set(statuses)],
            resource_ids: claims.map((c: any) => c.resource_id).filter(Boolean),
            has_reason_id: claims.some((c: any) => c.reason_id),
            date_range: {
              oldest: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))).toISOString() : null,
              newest: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))).toISOString() : null
            },
            claims_by_type: typeCounts,
            claims_by_status: statusCounts,
            resolution_time_analysis: {
              avg_days: resolutionTimeAnalysis.length > 0 ? 
                resolutionTimeAnalysis.reduce((sum, days) => sum + days, 0) / resolutionTimeAnalysis.length : 0,
              min_days: resolutionTimeAnalysis.length > 0 ? Math.min(...resolutionTimeAnalysis) : 0,
              max_days: resolutionTimeAnalysis.length > 0 ? Math.max(...resolutionTimeAnalysis) : 0
            }
          };

          console.log(`📊 ${endpoint}:`);
          console.log(`   - Total: ${analysis.total_claims} claims`);
          console.log(`   - Tipos únicos: ${analysis.unique_types.join(', ')}`);
          console.log(`   - Status únicos: ${analysis.unique_statuses.join(', ')}`);
          console.log(`   - Tem reason_id: ${analysis.has_reason_id}`);

          claimsResults.push(analysis);
        } else {
          console.log(`⚠️ ${endpoint}: Sem dados retornados`);
        }
      } else {
        console.log(`❌ ${endpoint}: Status ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Erro em ${endpoint}:`, error.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return claimsResults;
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
    const results: Phase2Results[] = [];

    console.log(`🚀 INICIANDO FASE 2 - Análise Detalhada para ${account_ids.length} conta(s)`);

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

      // Executar análises detalhadas
      const ordersAnalysis = await analyzeWorkingOrdersEndpoints(accessToken, sellerId);
      const claimsAnalysis = await analyzeWorkingClaimsEndpoints(accessToken, sellerId);

      // Calcular métricas de completude dos dados
      const totalOrdersFound = ordersAnalysis.reduce((sum, analysis) => sum + analysis.total_orders, 0);
      const totalClaimsFound = claimsAnalysis.reduce((sum, analysis) => sum + analysis.total_claims, 0);
      
      const dataCompletenessScore = calculateDataCompletenessScore(ordersAnalysis, claimsAnalysis);

      const accountResult: Phase2Results = {
        orders_analysis: ordersAnalysis,
        claims_analysis: claimsAnalysis,
        summary: {
          total_endpoints_analyzed: ordersAnalysis.length + claimsAnalysis.length,
          orders_endpoints: ordersAnalysis.length,
          claims_endpoints: claimsAnalysis.length,
          total_orders_found: totalOrdersFound,
          total_claims_found: totalClaimsFound,
          data_completeness_score: dataCompletenessScore
        },
        execution_time: Date.now() - startTime,
        account_id: accountId
      };

      results.push(accountResult);

      console.log(`\n✅ Processamento concluído para conta: ${accountId}`);
      console.log(`📊 Resumo:`);
      console.log(`   - Endpoints analisados: ${accountResult.summary.total_endpoints_analyzed}`);
      console.log(`   - Orders encontrados: ${accountResult.summary.total_orders_found}`);
      console.log(`   - Claims encontrados: ${accountResult.summary.total_claims_found}`);
      console.log(`   - Score de completude: ${accountResult.summary.data_completeness_score}%`);
    }

    console.log(`\n🎯 FASE 2 CONCLUÍDA - Análise Detalhada:\n`);
    console.log(`Total de contas processadas: ${results.length}`);

    return ok({ 
      success: true, 
      results,
      total_accounts: results.length,
      execution_time: Date.now() - startTime
    });

  } catch (error) {
    console.error('❌ Erro na Fase 2:', error);
    return fail('Erro interno', 500, error.message);
  }
});

function calculateDataCompletenessScore(ordersAnalysis: DetailedOrderAnalysis[], claimsAnalysis: DetailedClaimAnalysis[]): number {
  let score = 0;
  let maxScore = 0;

  // Pontuação para orders
  ordersAnalysis.forEach(analysis => {
    maxScore += 10; // 10 pontos por endpoint
    if (analysis.total_orders > 0) score += 10;
    if (analysis.has_payments) score += 2;
    if (analysis.has_shipping) score += 2;
    if (analysis.has_pack_id) score += 1;
    if (analysis.unique_statuses.length > 1) score += 2;
    if (analysis.items_count > 0) score += 2;
    if (analysis.total_amount_sum > 0) score += 1;
    maxScore += 10; // pontos extras por qualidade dos dados
  });

  // Pontuação para claims
  claimsAnalysis.forEach(analysis => {
    maxScore += 10;
    if (analysis.total_claims > 0) score += 10;
    if (analysis.unique_types.length > 0) score += 3;
    if (analysis.unique_statuses.length > 0) score += 3;
    if (analysis.has_reason_id) score += 2;
    if (analysis.resource_ids.length > 0) score += 2;
    maxScore += 10;
  });

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}