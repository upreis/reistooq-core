/**
 * 🔄 SYNC DEVOLUÇÕES ML → SUPABASE
 * 
 * Edge Function que sincroniza TODAS as devoluções do Mercado Livre
 * para a tabela devolucoes_avancadas no Supabase.
 * 
 * FUNCIONALIDADES:
 * - Sincroniza todas as contas ML ativas
 * - Busca devoluções paginadas (50 por vez)
 * - Enriquece com dados de order, messages, returns
 * - Upsert inteligente (não duplica)
 * - Suporta execução manual ou via cron
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncStats {
  total_contas: number;
  total_claims_processados: number;
  total_inseridos: number;
  total_atualizados: number;
  total_erros: number;
  tempo_execucao_ms: number;
  contas_detalhes: Array<{
    account_id: string;
    account_name: string;
    claims_processados: number;
    status: 'success' | 'error';
    erro?: string;
  }>;
}

// 🔧 Criar cliente Supabase com SERVICE ROLE (bypass RLS)
function makeServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// 🔐 Buscar token ML via integrations-get-secret
async function getMLToken(accountId: string): Promise<string | null> {
  try {
    const INTERNAL_TOKEN = Deno.env.get('INTERNAL_SHARED_TOKEN') || 'internal-shared-token';
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    const response = await fetch(`${SUPABASE_URL}/functions/v1/integrations-get-secret`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
        'x-internal-call': 'true',
        'x-internal-token': INTERNAL_TOKEN
      },
      body: JSON.stringify({
        integration_account_id: accountId,
        provider: 'mercadolivre'
      })
    });

    if (!response.ok) {
      console.error(`❌ Erro ao obter token para conta ${accountId}`);
      return null;
    }

    const data = await response.json();
    
    if (!data?.found || !data?.secret?.access_token) {
      console.error(`❌ Token não encontrado para conta ${accountId}`);
      return null;
    }

    return data.secret.access_token;
  } catch (error) {
    console.error(`❌ Erro ao buscar token:`, error);
    return null;
  }
}

// 📡 Buscar claims do ML (paginado)
async function fetchMLClaims(
  sellerId: string,
  accessToken: string,
  offset: number = 0,
  limit: number = 50
): Promise<any[]> {
  try {
    const url = `https://api.mercadolibre.com/post-purchase/v1/claims/search?seller_id=${sellerId}&offset=${offset}&limit=${limit}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`ML API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('❌ Erro ao buscar claims:', error);
    return [];
  }
}

// 📦 Enriquecer claim com dados extras (order, messages, returns)
async function enrichClaimData(claim: any, accessToken: string): Promise<any> {
  const enrichedData: any = {
    // Dados básicos do claim
    claim_id: claim.id?.toString(),
    order_id: claim.resource_id?.toString(),
    data_criacao: claim.date_created,
    status_devolucao: claim.status,
    tipo_claim: claim.type,
    claim_stage: claim.stage,
    reason_id: claim.reason_id,
    
    // Players
    comprador_id: claim.players?.find((p: any) => p.type === 'buyer')?.user_id?.toString(),
    vendedor_id: claim.players?.find((p: any) => p.type === 'seller')?.user_id?.toString(),
    
    // Resolution
    resultado_final: claim.resolution?.reason,
    data_fechamento_devolucao: claim.resolution?.date_created,
    
    // Dados completos (JSONs)
    dados_claim: claim,
    
    // Controle
    ultima_sincronizacao: new Date().toISOString()
  };

  // Buscar dados do Order (se resource for order)
  if (claim.resource === 'order' && claim.resource_id) {
    try {
      const orderResponse = await fetch(
        `https://api.mercadolibre.com/orders/${claim.resource_id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      );

      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        enrichedData.dados_order = orderData;
        enrichedData.produto_titulo = orderData.order_items?.[0]?.item?.title;
        enrichedData.sku = orderData.order_items?.[0]?.item?.seller_sku;
        enrichedData.quantidade = orderData.order_items?.[0]?.quantity || 1;
        enrichedData.valor_retido = orderData.total_amount;
        enrichedData.tipo_pagamento = orderData.payments?.[0]?.payment_type;
        enrichedData.comprador_nickname = orderData.buyer?.nickname;
      }
    } catch (error) {
      console.warn(`⚠️ Erro ao buscar order ${claim.resource_id}:`, error);
    }
  }

  // Buscar mensagens do claim
  if (claim.id) {
    try {
      const messagesResponse = await fetch(
        `https://api.mercadolibre.com/post-purchase/v1/claims/${claim.id}/messages`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      );

      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        enrichedData.dados_mensagens = messagesData;
        enrichedData.timeline_mensagens = messagesData.messages || [];
        enrichedData.mensagens_nao_lidas = messagesData.messages?.filter((m: any) => !m.read)?.length || 0;
        
        if (messagesData.messages?.length > 0) {
          const lastMessage = messagesData.messages[messagesData.messages.length - 1];
          enrichedData.ultima_mensagem_data = lastMessage.date_created;
          enrichedData.ultima_mensagem_remetente = lastMessage.sender;
        }
      }
    } catch (error) {
      console.warn(`⚠️ Erro ao buscar mensagens do claim ${claim.id}:`, error);
    }
  }

  // Buscar returns (se existir)
  if (claim.id) {
    try {
      const returnsResponse = await fetch(
        `https://api.mercadolibre.com/post-purchase/v2/claims/${claim.id}/returns`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      );

      if (returnsResponse.ok) {
        const returnsData = await returnsResponse.json();
        enrichedData.dados_return = returnsData;
        enrichedData.status_rastreamento = returnsData.tracking?.status;
        enrichedData.codigo_rastreamento = returnsData.tracking?.number;
        enrichedData.transportadora = returnsData.tracking?.carrier;
      }
    } catch (error) {
      // 404 é normal para claims sem return
      if (error instanceof Error && !error.message.includes('404')) {
        console.warn(`⚠️ Erro ao buscar returns do claim ${claim.id}:`, error);
      }
    }
  }

  return enrichedData;
}

// 🔄 Sincronizar devoluções de uma conta ML
async function syncAccountReturns(
  supabase: any,
  account: any,
  accessToken: string
): Promise<{ processados: number; inseridos: number; atualizados: number; erros: number }> {
  console.log(`\n🔄 Sincronizando conta: ${account.account_name} (${account.id})`);
  
  let offset = 0;
  let hasMore = true;
  let stats = { processados: 0, inseridos: 0, atualizados: 0, erros: 0 };
  
  // Buscar seller_id da conta
  const sellerId = account.account_identifier;
  
  if (!sellerId) {
    console.error(`❌ Seller ID não encontrado para conta ${account.id}`);
    return stats;
  }

  while (hasMore) {
    console.log(`  📦 Buscando claims (offset: ${offset})...`);
    
    const claims = await fetchMLClaims(sellerId, accessToken, offset, 50);
    
    if (claims.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`  ✅ ${claims.length} claims encontrados`);

    // Processar cada claim
    for (const claim of claims) {
      try {
        // Enriquecer dados
        const enrichedData = await enrichClaimData(claim, accessToken);
        
        // Adicionar integration_account_id
        enrichedData.integration_account_id = account.id;
        
        // Verificar se já existe
        const { data: existing } = await supabase
          .from('devolucoes_avancadas')
          .select('id')
          .eq('claim_id', enrichedData.claim_id)
          .eq('integration_account_id', account.id)
          .maybeSingle();

        if (existing) {
          // Atualizar existente
          const { error } = await supabase
            .from('devolucoes_avancadas')
            .update(enrichedData)
            .eq('id', existing.id);

          if (error) {
            console.error(`❌ Erro ao atualizar claim ${claim.id}:`, error);
            stats.erros++;
          } else {
            stats.atualizados++;
          }
        } else {
          // Inserir novo
          const { error } = await supabase
            .from('devolucoes_avancadas')
            .insert(enrichedData);

          if (error) {
            console.error(`❌ Erro ao inserir claim ${claim.id}:`, error);
            stats.erros++;
          } else {
            stats.inseridos++;
          }
        }
        
        stats.processados++;
        
      } catch (error) {
        console.error(`❌ Erro ao processar claim ${claim.id}:`, error);
        stats.erros++;
      }
      
      // Pequeno delay entre requisições (evitar rate limit)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Continuar paginação
    if (claims.length < 50) {
      hasMore = false;
    } else {
      offset += 50;
    }
    
    // Delay entre páginas
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`  ✅ Conta sincronizada: ${stats.processados} processados, ${stats.inseridos} novos, ${stats.atualizados} atualizados`);
  
  return stats;
}

// 🚀 MAIN HANDLER
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabase = makeServiceClient();
  
  console.log('🚀 Iniciando sincronização de devoluções ML...');

  try {
    // 1. Buscar todas as contas ML ativas
    const { data: accounts, error: accountsError } = await supabase
      .from('integration_accounts')
      .select('id, account_name, account_identifier, organization_id')
      .eq('provider', 'mercadolivre')
      .eq('is_active', true);

    if (accountsError) {
      throw new Error(`Erro ao buscar contas: ${accountsError.message}`);
    }

    if (!accounts || accounts.length === 0) {
      console.log('ℹ️ Nenhuma conta ML ativa encontrada');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhuma conta ML para sincronizar',
          stats: {
            total_contas: 0,
            total_claims_processados: 0,
            total_inseridos: 0,
            total_atualizados: 0,
            total_erros: 0,
            tempo_execucao_ms: Date.now() - startTime
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 ${accounts.length} conta(s) ML ativa(s) encontrada(s)`);

    // 2. Sincronizar cada conta
    const syncStats: SyncStats = {
      total_contas: accounts.length,
      total_claims_processados: 0,
      total_inseridos: 0,
      total_atualizados: 0,
      total_erros: 0,
      tempo_execucao_ms: 0,
      contas_detalhes: []
    };

    for (const account of accounts) {
      try {
        // Obter token ML
        const accessToken = await getMLToken(account.id);
        
        if (!accessToken) {
          console.error(`❌ Token não disponível para conta ${account.account_name}`);
          syncStats.contas_detalhes.push({
            account_id: account.id,
            account_name: account.account_name,
            claims_processados: 0,
            status: 'error',
            erro: 'Token não disponível'
          });
          continue;
        }

        // Sincronizar devoluções da conta
        const accountStats = await syncAccountReturns(supabase, account, accessToken);
        
        syncStats.total_claims_processados += accountStats.processados;
        syncStats.total_inseridos += accountStats.inseridos;
        syncStats.total_atualizados += accountStats.atualizados;
        syncStats.total_erros += accountStats.erros;
        
        syncStats.contas_detalhes.push({
          account_id: account.id,
          account_name: account.account_name,
          claims_processados: accountStats.processados,
          status: 'success'
        });
        
      } catch (error) {
        console.error(`❌ Erro ao sincronizar conta ${account.account_name}:`, error);
        syncStats.total_erros++;
        syncStats.contas_detalhes.push({
          account_id: account.id,
          account_name: account.account_name,
          claims_processados: 0,
          status: 'error',
          erro: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    syncStats.tempo_execucao_ms = Date.now() - startTime;

    console.log('\n═══════════════════════════════════════════');
    console.log('✅ SINCRONIZAÇÃO CONCLUÍDA');
    console.log('═══════════════════════════════════════════');
    console.log(`📊 Total de contas: ${syncStats.total_contas}`);
    console.log(`📦 Claims processados: ${syncStats.total_claims_processados}`);
    console.log(`➕ Novos inseridos: ${syncStats.total_inseridos}`);
    console.log(`🔄 Atualizados: ${syncStats.total_atualizados}`);
    console.log(`❌ Erros: ${syncStats.total_erros}`);
    console.log(`⏱️ Tempo: ${syncStats.tempo_execucao_ms}ms`);
    console.log('═══════════════════════════════════════════\n');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sincronização concluída',
        stats: syncStats
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro fatal na sincronização:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        tempo_execucao_ms: Date.now() - startTime
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
