import { makeUserClient, makeServiceClient, corsHeaders, ok, fail } from "../_shared/client.ts";
import { decryptAESGCM } from "../_shared/crypto.ts";

// Delay function to avoid rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface ProcessedRecord {
  order_id: string;
  claim_id?: string;
  data_criacao: string;
  status_devolucao: string;
  valor_total: number;
  comprador: string;
  produto: string;
  motivo_claim?: string;
  dados_order: any;
  dados_claim?: any;
  dados_mensagens?: any;
  dados_acoes?: any;
  cronograma_status: string;
  integration_account_id: string;
  sku?: string;
  quantidade?: number;
  ultima_atualizacao: string;
}

interface FinalImplementationResults {
  success: boolean;
  total_claims: number;
  total_orders: number;
  total_records: number;
  records: ProcessedRecord[];
  account_id: string;
  seller_id: string;
  execution_time: number;
  summary: {
    claims_found: number;
    orders_found: number;
    cancelled_orders_found: number;
    successful_relationships: number;
    data_saved: boolean;
  };
}

async function implementacaoFinalPratica(accessToken: string, accountId: string): Promise<FinalImplementationResults> {
  console.log('🚀 IMPLEMENTAÇÃO FINAL: Sistema prático de devoluções');
  
  const startTime = Date.now();
  let processedData: ProcessedRecord[] = [];
  let sellerId = '';
  
  try {
    // 1. OBTER SELLER ID (sabemos que funciona)
    console.log('🔍 Obtendo seller ID...');
    const userResponse = await fetch('https://api.mercadolibre.com/users/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!userResponse.ok) {
      throw new Error('Falha ao obter seller ID');
    }

    const userData = await userResponse.json();
    sellerId = userData.id.toString();
    console.log(`✅ Seller ID: ${sellerId}`);

    await delay(1000);

    // 2. BUSCAR CLAIMS (usando endpoint que sabemos que funciona)
    console.log('🔍 Buscando claims do seller...');
    
    const claimsResponse = await fetch(
      `https://api.mercadolibre.com/post-purchase/v1/claims/search?seller_id=${sellerId}&limit=50`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    let claims: any[] = [];
    if (claimsResponse.ok) {
      const claimsData = await claimsResponse.json();
      claims = claimsData.results || [];
      console.log(`✅ Claims encontradas: ${claims.length}`);
    } else {
      console.log(`⚠️ Nenhum claim encontrado (status ${claimsResponse.status})`);
    }

    await delay(1000);

    // 3. PARA CADA CLAIM, BUSCAR A ORDER CORRESPONDENTE
    console.log('📋 Processando claims e orders...');
    
    const maxClaims = Math.min(claims.length, 20); // Processar máximo 20 para evitar timeout
    
    for (let i = 0; i < maxClaims; i++) {
      const claim = claims[i];
      
      try {
        await delay(1500); // Delay entre requisições
        
        // Buscar order relacionada ao claim
        const orderResponse = await fetch(
          `https://api.mercadolibre.com/orders/${claim.resource_id}`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        if (orderResponse.ok) {
          const order = await orderResponse.json();
          
          // Criar registro completo
          const record: ProcessedRecord = {
            order_id: order.id.toString(),
            claim_id: claim.id.toString(),
            data_criacao: order.date_created,
            status_devolucao: claim.stage || claim.status,
            valor_total: parseFloat(order.total_amount || 0),
            comprador: order.buyer?.nickname || 'N/A',
            produto: order.order_items?.[0]?.item?.title || 'N/A',
            motivo_claim: claim.reason_id || claim.type,
            dados_order: order,
            dados_claim: claim,
            dados_mensagens: null, // Será implementado depois
            dados_acoes: null, // Será implementado depois
            cronograma_status: `${claim.type} - ${claim.stage}`,
            integration_account_id: sellerId,
            sku: order.order_items?.[0]?.item?.seller_sku,
            quantidade: order.order_items?.[0]?.quantity || 1,
            ultima_atualizacao: new Date().toISOString()
          };
          
          processedData.push(record);
          console.log(`✅ Processado claim ${claim.id} → order ${order.id}`);
        } else {
          console.log(`❌ Falha ao buscar order ${claim.resource_id}: ${orderResponse.status}`);
        }
      } catch (error) {
        console.error('Erro ao processar claim:', error.message);
      }
    }

    // 4. SE NÃO HOUVER CLAIMS, BUSCAR ORDERS CANCELADAS
    if (processedData.length === 0) {
      console.log('📋 Nenhum claim encontrado, buscando orders canceladas...');
      
      await delay(2000);
      
      const cancelledOrdersResponse = await fetch(
        `https://api.mercadolibre.com/orders/search?seller=${sellerId}&order.status=cancelled&limit=20`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      if (cancelledOrdersResponse.ok) {
        const cancelledData = await cancelledOrdersResponse.json();
        const cancelledOrders = cancelledData.results || [];
        
        for (const order of cancelledOrders) {
          const record: ProcessedRecord = {
            order_id: order.id.toString(),
            data_criacao: order.date_created,
            status_devolucao: 'cancelled',
            valor_total: parseFloat(order.total_amount || 0),
            comprador: order.buyer?.nickname || 'N/A',
            produto: order.order_items?.[0]?.item?.title || 'N/A',
            dados_order: order,
            cronograma_status: 'Order Cancelada',
            integration_account_id: sellerId,
            sku: order.order_items?.[0]?.item?.seller_sku,
            quantidade: order.order_items?.[0]?.quantity || 1,
            ultima_atualizacao: new Date().toISOString()
          };
          
          processedData.push(record);
        }
        
        console.log(`✅ Orders canceladas encontradas: ${cancelledOrders.length}`);
      }
    }

    // 5. SALVAR NO BANCO DE DADOS
    console.log(`💾 Salvando ${processedData.length} registros no banco...`);
    
    const supabase = makeServiceClient();
    let dataSaved = false;
    
    if (processedData.length > 0) {
      // Preparar dados para inserção
      const devolucoes = processedData.map(record => ({
        order_id: record.order_id,
        claim_id: record.claim_id,
        data_criacao: record.data_criacao,
        status_devolucao: record.status_devolucao,
        valor_total: record.valor_total,
        integration_account_id: accountId,
        dados_order: record.dados_order,
        dados_claim: record.dados_claim,
        cronograma_status: record.cronograma_status,
        sku: record.sku,
        produto_titulo: record.produto,
        quantidade: record.quantidade,
        ultima_atualizacao: record.ultima_atualizacao
      }));

      const { error } = await supabase
        .from('devolucoes_avancadas')
        .upsert(devolucoes, { 
          onConflict: 'order_id,integration_account_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('❌ Erro ao salvar no banco:', error);
      } else {
        dataSaved = true;
        console.log('✅ Dados salvos com sucesso no banco');
      }
    }

    const executionTime = Date.now() - startTime;
    
    const results: FinalImplementationResults = {
      success: true,
      total_claims: claims.length,
      total_orders: processedData.filter(r => r.claim_id).length,
      total_records: processedData.length,
      records: processedData,
      account_id: accountId,
      seller_id: sellerId,
      execution_time: executionTime,
      summary: {
        claims_found: claims.length,
        orders_found: processedData.filter(r => r.claim_id).length,
        cancelled_orders_found: processedData.filter(r => !r.claim_id).length,
        successful_relationships: processedData.filter(r => r.claim_id && r.dados_order).length,
        data_saved: dataSaved
      }
    };

    console.log('\n🎯 IMPLEMENTAÇÃO FINAL CONCLUÍDA:');
    console.log(`   - Claims encontradas: ${results.summary.claims_found}`);
    console.log(`   - Orders relacionadas: ${results.summary.orders_found}`);
    console.log(`   - Orders canceladas: ${results.summary.cancelled_orders_found}`);
    console.log(`   - Total de registros: ${results.total_records}`);
    console.log(`   - Dados salvos: ${results.summary.data_saved ? '✅' : '❌'}`);
    console.log(`   - Tempo de execução: ${Math.round(executionTime / 1000)}s`);

    return results;

  } catch (error) {
    console.error('❌ Erro na Implementação Final:', error);
    throw error;
  }
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
    const results: FinalImplementationResults[] = [];

    console.log(`🚀 INICIANDO IMPLEMENTAÇÃO FINAL para ${account_ids.length} conta(s)`);

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

      console.log(`✅ Tokens encontrados para conta: ${accountId}`);

      // Executar implementação final
      const result = await implementacaoFinalPratica(accessToken, accountId);
      results.push(result);

      console.log(`\n✅ Processamento concluído para conta: ${accountId}`);
    }

    console.log(`\n🎯 IMPLEMENTAÇÃO FINAL CONCLUÍDA para todas as contas`);
    console.log(`Total de contas processadas: ${results.length}`);

    return ok({ 
      success: true, 
      results,
      total_accounts: results.length,
      execution_time: Date.now() - startTime
    });

  } catch (error) {
    console.error('❌ Erro na Implementação Final:', error);
    return fail('Erro interno', 500, error.message);
  }
});