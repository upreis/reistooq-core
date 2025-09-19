import { corsHeaders, makeServiceClient } from '../_shared/client.ts';

interface SyncRequest {
  integration_account_id: string;
}

async function syncMLOrders(accountId: string) {
  const supabase = makeServiceClient();
  
  try {
    console.log(`🔄 Iniciando sincronização de pedidos ML para conta: ${accountId}`);
    
    // Buscar dados da conta
    const { data: account, error: accountError } = await supabase
      .from('integration_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('provider', 'mercadolivre')
      .eq('is_active', true)
      .single();
    
    if (accountError || !account) {
      throw new Error(`Conta não encontrada: ${accountError?.message}`);
    }
    
    console.log(`📋 Conta encontrada: ${account.account_identifier}`);
    
    // Chamar função unified-orders para buscar pedidos
    const { data: ordersData, error: ordersError } = await supabase.functions.invoke('unified-orders', {
      body: {
        integration_account_id: accountId,
        provider: 'mercadolivre',
        limit: 100, // Buscar até 100 pedidos
        enrich: true,
        include_shipping: true
      }
    });
    
    if (ordersError) {
      console.error('❌ Erro ao buscar pedidos:', ordersError);
      throw new Error(`Erro ao buscar pedidos: ${ordersError.message}`);
    }
    
    console.log(`✅ Resposta da função unified-orders:`, ordersData);
    
    // Verificar quantos pedidos foram inseridos na tabela
    const { data: insertedOrders, error: countError } = await supabase
      .from('unified_orders')
      .select('id', { count: 'exact' })
      .eq('integration_account_id', accountId);
    
    if (countError) {
      console.error('❌ Erro ao contar pedidos inseridos:', countError);
    }
    
    const ordersCount = insertedOrders?.length || 0;
    console.log(`📊 Total de pedidos na base: ${ordersCount}`);
    
    return {
      success: true,
      account_id: accountId,
      account_identifier: account.account_identifier,
      orders_synced: ordersData?.unified?.length || ordersData?.results?.length || 0,
      orders_in_db: ordersCount,
      message: `Sincronização concluída para conta ${account.account_identifier}`
    };
    
  } catch (error) {
    console.error(`❌ Erro na sincronização:`, error);
    throw error;
  }
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
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { integration_account_id }: SyncRequest = await req.json();
    
    if (!integration_account_id) {
      return new Response(
        JSON.stringify({ error: 'integration_account_id é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const result = await syncMLOrders(integration_account_id);
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('❌ Erro na função sync-ml-orders:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});