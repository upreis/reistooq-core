import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-call, x-internal-token',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface MLClaimResponse {
  results: MLClaim[];
  paging: {
    total: number;
    offset: number;
    limit: number;
  };
}

interface MLClaim {
  id: string;
  order_id: string;
  type: 'claim' | 'return' | 'cancellation';
  status: string;
  stage: string;
  resolution?: string;
  reason_code?: string;
  reason_description?: string;
  date_created: string;
  date_closed?: string;
  date_last_update?: string;
  amount_claimed?: number;
  amount_refunded?: number;
  currency: string;
  buyer: {
    id: string;
    nickname: string;
    email?: string;
  };
  item: {
    id: string;
    title: string;
    sku?: string;
    variation_id?: string;
  };
  quantity: number;
  unit_price: number;
  last_message?: string;
  seller_response?: string;
}

interface MLOrder {
  id: string;
  order_number?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { integration_account_id, date_from, date_to } = await req.json();

    if (!integration_account_id) {
      throw new Error('integration_account_id é obrigatório');
    }

    console.log(`🔄 [ML Devoluções] Iniciando sync para conta: ${integration_account_id}`);

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Buscar dados da conta
    const { data: account, error: accountError } = await supabase
      .from('integration_accounts')
      .select('*')
      .eq('id', integration_account_id)
      .eq('provider', 'mercadolivre')
      .single();

    if (accountError || !account) {
      throw new Error('Conta de integração não encontrada');
    }

    // 2. Buscar access token
    const INTERNAL_TOKEN = Deno.env.get("INTERNAL_SHARED_TOKEN") || "internal-shared-token";
    
    let secretResponse = await fetch(
      `${supabaseUrl}/functions/v1/integrations-get-secret`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization') || '',
          'x-internal-call': 'true',
          'x-internal-token': INTERNAL_TOKEN
        },
        body: JSON.stringify({ 
          integration_account_id,
          provider: 'mercadolivre'
        })
      }
    );

    if (!secretResponse.ok) {
      console.error(`❌ [ML Devoluções] Erro ao buscar secrets: ${secretResponse.status}`);
      throw new Error(`Erro ao buscar secrets: ${secretResponse.status}`);
    }

    let secretData = await secretResponse.json();
    
    // Se não encontrou token ou está expirado, tentar renovar
    if (!secretData?.found || !secretData?.secret?.access_token) {
      console.log(`🔄 [ML Devoluções] Token não encontrado, tentando renovar...`);
      
      const refreshResponse = await fetch(
        `${supabaseUrl}/functions/v1/mercadolivre-token-refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || ''
          },
          body: JSON.stringify({ 
            account_id: integration_account_id,
            internal_call: true
          })
        }
      );

      if (refreshResponse.ok) {
        console.log(`✅ [ML Devoluções] Token renovado, buscando novamente...`);
        
        // Buscar token novamente após renovação
        secretResponse = await fetch(
          `${supabaseUrl}/functions/v1/integrations-get-secret`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': req.headers.get('Authorization') || '',
              'x-internal-call': 'true',
              'x-internal-token': INTERNAL_TOKEN
            },
            body: JSON.stringify({ 
              integration_account_id,
              provider: 'mercadolivre'
            })
          }
        );

        if (secretResponse.ok) {
          secretData = await secretResponse.json();
        }
      } else {
        console.warn(`⚠️ [ML Devoluções] Falha ao renovar token: ${refreshResponse.status}`);
      }
    }

    if (!secretData?.found || !secretData?.secret?.access_token) {
      throw new Error('Token de acesso não encontrado após tentativa de renovação');
    }

    const accessToken = secretData.secret.access_token;

    const sellerId = account.account_identifier;
    console.log(`🔑 [ML Devoluções] Token obtido para seller: ${sellerId}`);

    // 🎯 FLUXO EXATO DA PLANILHA: BUSCAR ORDERS CANCELADAS
    let allClaims: MLClaim[] = [];
    let orderOffset = 0;
    const limit = 50;
    
    // Definir período de busca (últimos 60 dias como a planilha)
    const dateFrom = date_from || new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = date_to || new Date().toISOString();

    console.log(`📅 [ML Devoluções] EXPANDINDO BUSCA: buscando orders com MÚLTIPLOS STATUS de ${dateFrom} até ${dateTo}`);

    // PASSO 1: Buscar orders com STATUS QUE FUNCIONAM (corrigindo erro 400)
    while (true) {
      const ordersUrl = `https://api.mercadolibre.com/orders/search?` +
        `seller=${sellerId}&` +
        `order.status=cancelled,paid&` +  // ← APENAS STATUS QUE FUNCIONAM (delivered causava erro 400)
        `sort=date_desc&` +
        `limit=${limit}&` +
        `offset=${orderOffset}`;

      console.log(`🔍 [ML Devoluções] Buscando orders com status funcionais - offset: ${orderOffset}`);
      console.log(`🔗 [ML Devoluções] URL: ${ordersUrl}`);

      const ordersResponse = await fetch(ordersUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      // Rate limit protection - aguardar antes de continuar
      await new Promise(resolve => setTimeout(resolve, 500));

      if (!ordersResponse.ok) {
        // Tratar erro 429 (rate limit)
        if (ordersResponse.status === 429) {
          console.warn(`⏳ [ML Devoluções] Rate limit atingido, aguardando 5 segundos...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue; // Tentar novamente
        }
        console.error(`❌ [ML Devoluções] Erro ao buscar orders canceladas: ${ordersResponse.status}`);
        const errorBody = await ordersResponse.text();
        console.error(`💥 [ML Devoluções] Erro: ${errorBody}`);
        break;
      }

      const ordersData = await ordersResponse.json();
      console.log(`📦 [ML Devoluções] Orders encontradas: ${ordersData.results?.length || 0}`);

      if (!ordersData.results || ordersData.results.length === 0) {
        console.log(`📭 [ML Devoluções] Nenhuma order encontrada neste offset`);
        break;
      }

      // PASSO 2: Para cada order, buscar claims específicas
      for (const order of ordersData.results) {
        // Verificar se order está no período desejado (últimos 60 dias)
        const orderDate = new Date(order.date_created);
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
        
        if (orderDate < sixtyDaysAgo) {
          continue;
        }

        // ADICIONAR LOG DOS MOTIVOS E STATUS
        const statusDetail = order.status_detail?.description || 'N/A';
        const cancelDetail = order.cancel_detail?.description || 'N/A';
        console.log(`🔍 [ML Devoluções] Processando order: ${order.id} - Status: ${order.status} - Status Detail: ${statusDetail} - Cancel Detail: ${cancelDetail} (${order.date_created})`);

        // 💾 SALVAR ORDER COMPLETA NA NOVA TABELA
        try {
          const orderCompleteData = {
            order_id: order.id.toString(),
            status: order.status,
            date_created: order.date_created,
            total_amount: order.total_amount || 0,
            currency: order.currency_id || 'BRL',
            buyer_id: order.buyer?.id?.toString() || null,
            buyer_nickname: order.buyer?.nickname || null,
            item_title: order.order_items?.[0]?.item?.title || null,
            quantity: order.order_items?.[0]?.quantity || 1,
            has_claims: false, // será atualizado quando encontrar claims
            claims_count: 0,
            raw_data: order,
            integration_account_id,
            organization_id: account.organization_id
          };

          const { error: orderCompleteError } = await supabase
            .from('ml_orders_completas')
            .upsert(orderCompleteData, { 
              onConflict: 'order_id,integration_account_id',
              ignoreDuplicates: false 
            });

          if (orderCompleteError) {
            console.error(`❌ [ML Devoluções] Erro ao salvar order completa:`, orderCompleteError);
          } else {
            console.log(`💾 [ML Devoluções] Order completa salva: ${order.id}`);
          }

          // 💾 SALVAR ORDER RAW NA TABELA TEMPORÁRIA TAMBÉM
          const orderRawData = {
            data_type: 'order',
            order_id: order.id.toString(),
            claim_id: null,
            raw_json: order,
            integration_account_id,
            organization_id: account.organization_id
          };

          const { error: orderInsertError } = await supabase
            .from('ml_api_raw_data')
            .insert(orderRawData);

          if (orderInsertError) {
            console.error(`❌ [ML Devoluções] Erro ao salvar order raw data:`, orderInsertError);
          }
        } catch (error) {
          console.warn(`⚠️ [ML Devoluções] Erro ao salvar order data:`, error);
        }

        // Buscar claims para esta order específica
        const claimsUrl = `https://api.mercadolibre.com/post-purchase/v1/claims/search?` +
          `resource=order&` +
          `resource_id=${order.id}`;
          
        try {
          const claimsResponse = await fetch(claimsUrl, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          // Rate limit protection - aguardar entre claims
          await new Promise(resolve => setTimeout(resolve, 500));
          
          if (claimsResponse.ok) {
            const claimsData = await claimsResponse.json();
            console.log(`🔍 [ML Devoluções] Claims para order cancelada ${order.id}:`, JSON.stringify(claimsData, null, 2));
            
            if (claimsData.results && claimsData.results.length > 0) {
              // 💾 SALVAR CADA CLAIM RAW NA TABELA TEMPORÁRIA
              for (const claim of claimsData.results) {
                try {
                  const claimRawData = {
                    data_type: 'claim',
                    order_id: order.id.toString(),
                    claim_id: claim.id.toString(),
                    raw_json: claim,
                    integration_account_id,
                    organization_id: account.organization_id
                  };

                  const { error: claimInsertError } = await supabase
                    .from('ml_api_raw_data')
                    .insert(claimRawData);

                  if (claimInsertError) {
                    console.error(`❌ [ML Devoluções] Erro ao salvar claim raw data:`, claimInsertError);
                  } else {
                    console.log(`💾 [ML Devoluções] Claim raw data salva: ${claim.id}`);
                  }
                } catch (error) {
                  console.warn(`⚠️ [ML Devoluções] Erro ao salvar claim raw data:`, error);
                }
              }

              allClaims.push(...claimsData.results);
              console.log(`✅ [ML Devoluções] ENCONTRADAS ${claimsData.results.length} claims para order ${order.status} ${order.id}`);
              
              // 🔄 ATUALIZAR ORDER COMO TENDO CLAIMS
              try {
                await supabase
                  .from('ml_orders_completas')
                  .update({ 
                    has_claims: true, 
                    claims_count: claimsData.results.length 
                  })
                  .eq('order_id', order.id.toString())
                  .eq('integration_account_id', integration_account_id);
              } catch (error) {
                console.warn(`⚠️ [ML Devoluções] Erro ao atualizar has_claims:`, error);
              }
              
              // 💾 DEBUG: Log das claims encontradas com motivos
              console.log(`💾 [ML Devoluções] Claims encontradas para order ${order.status}:`, JSON.stringify(claimsData.results, null, 2));
            } else {
              console.log(`📋 [ML Devoluções] Order ${order.status} ${order.id} sem claims associadas`);
            }
          } else {
            // Tratar erro 429 (rate limit) nas claims também
            if (claimsResponse.status === 429) {
              console.warn(`⏳ [ML Devoluções] Rate limit atingido ao buscar claims, aguardando 5 segundos...`);
              await new Promise(resolve => setTimeout(resolve, 5000));
            } else {
              console.warn(`⚠️ [ML Devoluções] Falha ao buscar claims para order cancelada ${order.id}: ${claimsResponse.status}`);
            }
          }
        } catch (error) {
          console.warn(`⚠️ [ML Devoluções] Erro ao buscar claims para order cancelada ${order.id}:`, error);
        }

        // Não precisa de pausa adicional aqui pois já temos rate limit nas claims
      }

      // Verificar se há mais páginas de orders canceladas
      if (ordersData.results.length < limit) {
        break;
      }
      
      orderOffset += limit;

      // Limite de segurança para não processar infinitamente
      if (orderOffset > 500) {
        console.log(`⚠️ [ML Devoluções] Limite de 500 orders atingido, parando busca`);
        break;
      }
    }

    console.log(`📊 [ML Devoluções] Total de claims encontrados: ${allClaims.length}`);

    // 4. Buscar dados dos pedidos para obter order_number
    const orderIds = [...new Set(allClaims.map(claim => claim.order_id))];
    const orderNumbers: Record<string, string> = {};

    for (const orderId of orderIds) {
      try {
        const orderResponse = await fetch(
          `https://api.mercadolibre.com/orders/${orderId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (orderResponse.ok) {
          const orderData: MLOrder = await orderResponse.json();
          if (orderData.order_number) {
            orderNumbers[orderId] = orderData.order_number;
          }
        }
      } catch (error) {
        console.warn(`⚠️ [ML Devoluções] Erro ao buscar pedido ${orderId}:`, error);
      }
    }

    // 5. Processar e salvar claims no banco
    let processedCount = 0;
    let updatedCount = 0;

    for (const claim of allClaims) {
      try {
        console.log(`🔍 [ML Devoluções] Processando claim:`, claim);
        
        const claimData = {
          integration_account_id,
          organization_id: account.organization_id,
          claim_id: claim.id.toString(),
          order_id: claim.resource_id ? claim.resource_id.toString() : claim.order_id?.toString(),
          order_number: orderNumbers[claim.resource_id || claim.order_id] || null,
          buyer_id: claim.players?.find(p => p.type === 'buyer')?.user_id?.toString() || null,
          buyer_nickname: claim.players?.find(p => p.type === 'buyer')?.nickname || null,
          buyer_email: claim.players?.find(p => p.type === 'buyer')?.email || null,
          item_id: claim.item?.id?.toString() || null,
          item_title: claim.item?.title || null,
          sku: claim.item?.sku || null,
          variation_id: claim.item?.variation_id?.toString() || null,
          quantity: claim.quantity || 1,
          unit_price: claim.unit_price || 0,
          claim_type: claim.type,
          claim_status: claim.status,
          claim_stage: claim.stage,
          resolution: claim.resolution?.reason || null,
          reason_code: claim.reason_id || null,
          reason_description: claim.reason_description || null,
          amount_claimed: claim.amount_claimed || null,
          amount_refunded: claim.amount_refunded || 0,
          currency: claim.currency || 'BRL',
          date_created: claim.date_created,
          date_closed: claim.resolution?.date_created || null,
          date_last_update: claim.last_updated,
          last_message: claim.last_message || null,
          seller_response: claim.seller_response || null,
          raw_data: claim,
          updated_at: new Date().toISOString()
        };

        console.log(`💾 [ML Devoluções] Salvando claim no banco:`, claimData);

        // Upsert do claim
        const { data: upsertedData, error: upsertError } = await supabase
          .from('ml_devolucoes_reclamacoes')
          .upsert(claimData, { 
            onConflict: 'claim_id,integration_account_id',
            ignoreDuplicates: false 
          })
          .select();

        if (upsertError) {
          console.error(`❌ [ML Devoluções] Erro ao salvar claim ${claim.id}:`, upsertError);
          console.error(`❌ [ML Devoluções] Dados que falharam:`, JSON.stringify(claimData, null, 2));
        } else {
          processedCount++;
          console.log(`✅ [ML Devoluções] Claim salva no banco: ${claim.id}`, upsertedData);
        }
      } catch (error) {
        console.error(`❌ [ML Devoluções] Erro ao processar claim ${claim.id}:`, error);
        console.error(`❌ [ML Devoluções] Stack trace:`, error.stack);
      }
    }

    console.log(`✅ [ML Devoluções] Total de registros salvos: ${processedCount}`);
    console.log(`📊 [ML Devoluções] Total de claims encontradas: ${allClaims.length}`);

    // 6. Buscar estatísticas atualizadas
    const { data: stats } = await supabase
      .from('ml_devolucoes_reclamacoes')
      .select('claim_status, processed_status')
      .eq('integration_account_id', integration_account_id);

    const pendingCount = stats?.filter(s => s.processed_status === 'pending').length || 0;
    const reviewedCount = stats?.filter(s => s.processed_status === 'reviewed').length || 0;
    const totalCount = stats?.length || 0;

    return new Response(JSON.stringify({
      success: true,
      processed: processedCount,
      total_found: allClaims.length,
      stats: {
        total: totalCount,
        pending: pendingCount,
        reviewed: reviewedCount
      },
      date_range: {
        from: dateFrom,
        to: dateTo
      }
    }), {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('❌ [ML Devoluções] Erro na sincronização:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }
});