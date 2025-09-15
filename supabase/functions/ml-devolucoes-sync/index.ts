import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-call, x-internal-token',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface RequestBody {
  integration_account_id: string;
  date_from?: string;
  date_to?: string;
  sellerId?: number;
  status?: string;
  mode?: 'claims' | 'returns' | 'both';
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

interface MLReturn {
  id: string;
  order_id: string;
  status: string;
  type: string;
  date_created: string;
  date_closed?: string;
  reason?: string;
  items: Array<{
    id: string;
    quantity: number;
    title: string;
  }>;
}

serve(async (req) => {
  console.log(`🔔 [ML Devoluções] Recebida requisição ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ 
      ok: false, 
      error: 'Method not allowed' 
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const body: RequestBody = await req.json();
    const { 
      integration_account_id, 
      date_from, 
      date_to, 
      sellerId, 
      status, 
      mode = 'both' 
    } = body;
    
    if (!integration_account_id) {
      return new Response(JSON.stringify({ 
        ok: false,
        error: 'integration_account_id é obrigatório' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`🔍 [ML Devoluções] Processando conta: ${integration_account_id}, modo: ${mode}`);

    // 1. Buscar dados da conta de integração
    const { data: account, error: accountError } = await supabase
      .from('integration_accounts')
      .select('*')
      .eq('id', integration_account_id)
      .eq('is_active', true)
      .single();

    if (accountError || !account) {
      console.error('❌ [ML Devoluções] Conta não encontrada:', accountError);
      return new Response(JSON.stringify({ 
        ok: false,
        error: 'Conta de integração não encontrada' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Buscar access token via integrations-get-secret
    const INTERNAL_TOKEN = Deno.env.get("INTERNAL_SHARED_TOKEN") || "ML_DEV_2025_INTERNAL_TOKEN";
    
    let accessToken: string | null = null;
    
    const tokenData = await getAccessToken(supabaseUrl, integration_account_id, INTERNAL_TOKEN, req.headers.get('Authorization') || '');
    
    if (!tokenData.success) {
      if (account.token_status === 'reconnect_required' || account.token_status === 'expired') {
        return new Response(JSON.stringify({ 
          ok: false,
          error: 'Token de acesso inválido',
          details: `Status do token: ${account.token_status}. Favor reconectar a conta.`,
          account_name: account.name
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ 
        ok: false,
        error: 'Erro ao buscar token de acesso',
        details: tokenData.error || 'Token não encontrado'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    accessToken = tokenData.token;

    // 3. Definir parâmetros da busca
    const sellerIdParam = sellerId || account.account_identifier;
    const dateFromParam = date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateToParam = date_to || new Date().toISOString();

    console.log(`📅 [ML Devoluções] Modo: ${mode} - Buscando de ${dateFromParam} até ${dateToParam} para seller ${sellerIdParam}`);

    // 4. Buscar dados das APIs ML com paginação completa
    const results = await fetchAllData(accessToken, sellerIdParam, dateFromParam, dateToParam, status, mode);
    
    if (!results.success) {
      // Se houve erro 401, tentar refresh de token
      if (results.status === 401) {
        console.log('🔄 [ML Devoluções] Tentando refresh de token...');
        const refreshResult = await refreshToken(supabaseUrl, integration_account_id, req.headers.get('Authorization') || '');
        
        if (refreshResult.success) {
          console.log('✅ [ML Devoluções] Token refreshed, tentando novamente...');
          const newTokenData = await getAccessToken(supabaseUrl, integration_account_id, INTERNAL_TOKEN, req.headers.get('Authorization') || '');
          
          if (newTokenData.success) {
            const retryResults = await fetchAllData(newTokenData.token, sellerIdParam, dateFromParam, dateToParam, status, mode);
            
            if (retryResults.success) {
              const persistResult = await persistDevolucoes(supabase, integration_account_id, retryResults.data);
              
              return new Response(JSON.stringify({
                ok: true,
                data: persistResult.data,
                total: persistResult.stats.saved,
                message: persistResult.message,
                mode: mode,
                stats: persistResult.stats
              }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            }
          }
        }
        
        return new Response(JSON.stringify({ 
          ok: false,
          error: 'Token expirado e não foi possível renovar',
          details: 'Favor reconectar a conta'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ 
        ok: false,
        error: results.error || 'Erro ao buscar dados',
        details: results.details
      }), {
        status: results.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 5. Persistir dados no banco
    const persistResult = await persistDevolucoes(supabase, integration_account_id, results.data);

    console.log(`🚀 [ML Devoluções] Processamento concluído: ${results.data.length} encontrados, ${persistResult.stats.saved} salvos, ${persistResult.stats.duplicates} duplicatas`);

    return new Response(JSON.stringify({
      ok: true,
      data: persistResult.data,
      total: persistResult.stats.saved,
      message: persistResult.message,
      mode: mode,
      stats: persistResult.stats
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [ML Devoluções] Erro geral:', error);
    return new Response(JSON.stringify({
      ok: false,
      error: 'Erro interno do servidor',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper Functions

async function getAccessToken(supabaseUrl: string, integration_account_id: string, internalToken: string, authHeader: string) {
  try {
    const secretResponse = await fetch(`${supabaseUrl}/functions/v1/integrations-get-secret`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'x-internal-call': 'true',
        'x-internal-token': internalToken
      },
      body: JSON.stringify({
        integration_account_id: integration_account_id,
        provider: 'mercadolivre'
      })
    });

    if (secretResponse.ok) {
      const tokenData = await secretResponse.json();
      if (tokenData.found && tokenData.secret?.access_token) {
        console.log('🔑 [ML Devoluções] Token obtido com sucesso');
        return { success: true, token: tokenData.secret.access_token };
      } else {
        return { success: false, error: 'Token não encontrado na resposta' };
      }
    } else {
      const errorText = await secretResponse.text();
      console.error('❌ [ML Devoluções] Erro ao buscar token:', errorText);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error('❌ [ML Devoluções] Erro crítico ao buscar token:', error);
    return { success: false, error: error.message };
  }
}

async function refreshToken(supabaseUrl: string, integration_account_id: string, authHeader: string) {
  try {
    const refreshResponse = await fetch(`${supabaseUrl}/functions/v1/mercadolibre-token-refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        integration_account_id: integration_account_id
      })
    });

    if (refreshResponse.ok) {
      console.log('✅ [ML Devoluções] Token refresh bem-sucedido');
      return { success: true };
    } else {
      const errorText = await refreshResponse.text();
      console.error('❌ [ML Devoluções] Erro ao fazer refresh do token:', errorText);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error('❌ [ML Devoluções] Erro crítico no refresh:', error);
    return { success: false, error: error.message };
  }
}

async function fetchWithRetry(url: string, headers: any, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, { headers });
      
      if (response.ok) {
        return { success: true, data: await response.json(), status: response.status };
      } else if (response.status === 401) {
        return { success: false, status: 401, error: 'Unauthorized' };
      } else {
        const errorText = await response.text();
        console.warn(`⚠️ [ML Devoluções] Tentativa ${attempt}/${maxRetries} falhou: ${response.status} - ${errorText}`);
        
        if (attempt === maxRetries) {
          return { success: false, status: response.status, error: errorText };
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    } catch (error) {
      console.warn(`⚠️ [ML Devoluções] Erro na tentativa ${attempt}/${maxRetries}:`, error.message);
      
      if (attempt === maxRetries) {
        return { success: false, error: error.message };
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

async function fetchAllPages(baseUrl: string, accessToken: string, limit = 50) {
  const allResults = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const url = `${baseUrl}&limit=${limit}&offset=${offset}`;
    console.log(`📄 [ML Devoluções] Buscando página offset=${offset}`);

    const result = await fetchWithRetry(url, {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    });

    if (!result.success) {
      return result;
    }

    const results = result.data.results || [];
    allResults.push(...results);
    
    console.log(`📦 [ML Devoluções] Página offset=${offset}: ${results.length} itens`);

    // Se retornou menos que o limite, não há mais páginas
    if (results.length < limit) {
      hasMore = false;
    } else {
      offset += limit;
    }

    // Pequena pausa entre requests para evitar rate limit
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return { success: true, data: { results: allResults } };
}

async function fetchAllData(accessToken: string, sellerId: string, dateFrom: string, dateTo: string, status?: string, mode: string = 'both') {
  const allResults = [];
  let totalFound = 0;

  try {
    // Buscar Claims (mode='claims' ou mode='both')
    if (mode === 'claims' || mode === 'both') {
      let claimsUrl = `https://api.mercadolibre.com/claims/search?seller_id=${sellerId}`;
      
      if (dateFrom) claimsUrl += `&date_created_from=${dateFrom}`;
      if (dateTo) claimsUrl += `&date_created_to=${dateTo}`;
      if (status) claimsUrl += `&status=${status}`;
      
      console.log(`🔗 [ML Devoluções] Buscando claims com paginação...`);
      
      const claimsResult = await fetchAllPages(claimsUrl, accessToken);
      
      if (!claimsResult.success) {
        return claimsResult;
      }

      const claims = claimsResult.data.results || [];
      console.log(`📦 [ML Devoluções] Total claims encontrados: ${claims.length}`);
      
      // Marcar como claims e adicionar ao resultado
      claims.forEach(claim => {
        claim._source_type = 'claim';
      });
      allResults.push(...claims);
      totalFound += claims.length;
    }

    // Buscar Returns (mode='returns' ou mode='both')
    if (mode === 'returns' || mode === 'both') {
      let returnsUrl = `https://api.mercadolibre.com/post-sale/returns/search?seller_id=${sellerId}`;
      
      if (dateFrom) returnsUrl += `&date_created.from=${dateFrom}`;
      if (dateTo) returnsUrl += `&date_created.to=${dateTo}`;
      if (status) returnsUrl += `&status=${status}`;
      
      console.log(`🔗 [ML Devoluções] Buscando returns com paginação...`);
      
      const returnsResult = await fetchAllPages(returnsUrl, accessToken);
      
      if (!returnsResult.success) {
        return returnsResult;
      }

      const returns = returnsResult.data.results || [];
      console.log(`📦 [ML Devoluções] Total returns encontrados: ${returns.length}`);
      
      // Marcar como returns e adicionar ao resultado
      returns.forEach(returnItem => {
        returnItem._source_type = 'return';
      });
      allResults.push(...returns);
      totalFound += returns.length;
    }

    console.log(`📊 [ML Devoluções] Total encontrado: ${totalFound} itens`);

    return { success: true, data: allResults };

  } catch (error) {
    console.error('❌ [ML Devoluções] Erro ao buscar dados:', error);
    return { success: false, error: error.message };
  }
}

function unifyClaimData(item: MLClaim, orderData: any) {
  return {
    claim_id: item.id,
    return_id: null,
    data_criacao: item.date_created,
    status_devolucao: item.status,
    valor_retido: item.amount_claimed || orderData.total_amount || 0,
    produto_titulo: item.item?.title || orderData.order_items?.[0]?.item?.title || 'N/A',
    sku: item.item?.sku || orderData.order_items?.[0]?.item?.seller_sku || '',
    quantidade: item.quantity || orderData.order_items?.[0]?.quantity || 1,
    dados_order: orderData,
    dados_claim: item,
    dados_return: null,
    dados_mensagens: null
  };
}

function unifyReturnData(item: MLReturn, orderData: any) {
  return {
    claim_id: null,
    return_id: item.id,
    data_criacao: item.date_created,
    status_devolucao: item.status,
    valor_retido: orderData.total_amount || 0,
    produto_titulo: item.items?.[0]?.title || orderData.order_items?.[0]?.item?.title || 'N/A',
    sku: orderData.order_items?.[0]?.item?.seller_sku || '',
    quantidade: item.items?.[0]?.quantity || orderData.order_items?.[0]?.quantity || 1,
    dados_order: orderData,
    dados_claim: null,
    dados_return: item,
    dados_mensagens: null
  };
}

async function persistDevolucoes(supabase: any, integration_account_id: string, allResults: any[]) {
  const processedDevolucoes = [];
  let savedCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;
  
  for (const item of allResults) {
    try {
      // Determinar se é claim ou return
      const isReturn = item._source_type === 'return';
      const orderId = item.order_id;
      const itemId = item.id;
      
      // Buscar detalhes da order (com retry)
      const orderResult = await fetchWithRetry(`https://api.mercadolibre.com/orders/${orderId}`, {
        'Authorization': `Bearer ${item._access_token || 'TOKEN_PLACEHOLDER'}`,
        'Content-Type': 'application/json'
      });

      if (!orderResult.success) {
        console.warn(`⚠️ [ML Devoluções] Erro ao buscar order ${orderId}: ${orderResult.error}`);
        errorCount++;
        continue;
      }

      const orderData = orderResult.data;

      // Criar objeto devolução unificado
      const devolucaoData = {
        integration_account_id,
        order_id: orderId,
        ...(isReturn ? unifyReturnData(item, orderData) : unifyClaimData(item, orderData))
      };

      // Tentar inserir no banco (com upsert baseado nos índices únicos condicionais)
      const { data: insertedData, error: insertError } = await supabase
        .from('ml_devolucoes_reclamacoes')
        .upsert(devolucaoData, {
          onConflict: isReturn ? 'return_id,integration_account_id' : 'claim_id,integration_account_id'
        })
        .select();

      if (insertError) {
        if (insertError.code === '23505') { // Unique constraint violation
          duplicateCount++;
          console.log(`⚠️ [ML Devoluções] Duplicata ignorada: ${isReturn ? 'return' : 'claim'} ${itemId}`);
        } else {
          console.error(`❌ [ML Devoluções] Erro ao inserir:`, insertError);
          errorCount++;
        }
      } else {
        savedCount++;
        console.log(`✅ [ML Devoluções] ${isReturn ? 'Return' : 'Claim'} ${itemId} salvo`);
        
        // Adicionar para retorno (formato frontend)
        processedDevolucoes.push({
          id: insertedData?.[0]?.id || `${isReturn ? 'return' : 'claim'}-${itemId}`,
          ...devolucaoData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error(`❌ [ML Devoluções] Erro ao processar item:`, error);
      errorCount++;
    }
  }

  const message = `${allResults.length} itens encontrados, ${savedCount} novos salvos, ${duplicateCount} duplicatas ignoradas`;
  if (errorCount > 0) {
    console.warn(`⚠️ [ML Devoluções] ${errorCount} erros durante o processamento`);
  }

  return {
    data: processedDevolucoes,
    message,
    stats: {
      found: allResults.length,
      saved: savedCount,
      duplicates: duplicateCount,
      errors: errorCount
    }
  };
}