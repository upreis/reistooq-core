/**
 * 🔴 SYNC VENDAS HOJE - Edge Function
 * Busca vendas do dia de todas as contas ML e salva na tabela vendas_hoje_realtime
 * Para painel de vendas ao vivo
 */

import { makeServiceClient, corsHeaders, ok, fail, getMlConfig } from "../_shared/client.ts";

const cid = () => crypto.randomUUID().slice(0, 8);

interface SyncParams {
  organization_id?: string;
  integration_account_ids?: string[];
  force_refresh?: boolean;
}

Deno.serve(async (req) => {
  const correlationId = cid();
  console.log(`[sync-vendas-hoje:${correlationId}] 🚀 Iniciando sincronização de vendas do dia`);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = makeServiceClient();
    const params: SyncParams = await req.json().catch(() => ({}));
    
    console.log(`[sync-vendas-hoje:${correlationId}] 📋 Parâmetros:`, params);

    // 1. Buscar contas ML ativas
    let accountsQuery = supabase
      .from('integration_accounts')
      .select('id, name, account_identifier, access_token, refresh_token, expires_at')
      .eq('provider', 'mercadolivre')
      .eq('is_active', true);

    if (params.integration_account_ids?.length) {
      accountsQuery = accountsQuery.in('id', params.integration_account_ids);
    }

    const { data: accounts, error: accountsError } = await accountsQuery;

    if (accountsError) {
      console.error(`[sync-vendas-hoje:${correlationId}] ❌ Erro ao buscar contas:`, accountsError);
      return fail('Erro ao buscar contas ML', { status: 500, headers: corsHeaders });
    }

    if (!accounts?.length) {
      console.log(`[sync-vendas-hoje:${correlationId}] ⚠️ Nenhuma conta ML ativa encontrada`);
      return ok({ success: true, message: 'Nenhuma conta ML ativa', synced: 0 }, { headers: corsHeaders });
    }

    console.log(`[sync-vendas-hoje:${correlationId}] ✅ ${accounts.length} contas encontradas`);

    // 2. Definir período: HOJE (00:00 até agora)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateFrom = today.toISOString();
    const dateTo = new Date().toISOString();

    console.log(`[sync-vendas-hoje:${correlationId}] 📅 Período: ${dateFrom} a ${dateTo}`);

    // 3. Buscar vendas de cada conta
    let totalSynced = 0;
    const results: any[] = [];
    const errors: any[] = [];

    for (const account of accounts) {
      try {
        console.log(`[sync-vendas-hoje:${correlationId}] 🔄 Processando conta: ${account.name} (${account.account_identifier})`);

        // Buscar pedidos do ML usando API direta
        const ordersData = await fetchMLOrdersToday(
          account.account_identifier,
          account.access_token,
          dateFrom,
          dateTo,
          correlationId
        );

        if (!ordersData?.results?.length) {
          console.log(`[sync-vendas-hoje:${correlationId}] ℹ️ Nenhum pedido hoje para ${account.name}`);
          results.push({ account: account.name, count: 0 });
          continue;
        }

        console.log(`[sync-vendas-hoje:${correlationId}] 📦 ${ordersData.results.length} pedidos encontrados para ${account.name}`);

        // 4. Salvar na tabela vendas_hoje_realtime (UPSERT)
        const vendas = ordersData.results.map((order: any) => {
          const firstItem = order.order_items?.[0]?.item || {};
          
          return {
            organization_id: params.organization_id,
            integration_account_id: account.id,
            account_name: account.name,
            order_id: String(order.id),
            order_status: order.status,
            date_created: order.date_created,
            date_closed: order.date_closed,
            total_amount: order.total_amount || 0,
            paid_amount: order.paid_amount || 0,
            currency_id: order.currency_id || 'BRL',
            buyer_id: String(order.buyer?.id || ''),
            buyer_nickname: order.buyer?.nickname || '',
            item_id: firstItem.id || '',
            item_title: firstItem.title || '',
            item_thumbnail: firstItem.thumbnail || '',
            item_quantity: order.order_items?.[0]?.quantity || 1,
            item_unit_price: order.order_items?.[0]?.unit_price || 0,
            item_sku: firstItem.seller_sku || firstItem.seller_custom_field || '',
            order_data: order,
            synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        });

        // UPSERT - atualiza se já existe
        const { data: upsertData, error: upsertError } = await supabase
          .from('vendas_hoje_realtime')
          .upsert(vendas, { 
            onConflict: 'organization_id,order_id',
            ignoreDuplicates: false 
          })
          .select('id');

        if (upsertError) {
          console.error(`[sync-vendas-hoje:${correlationId}] ❌ Erro upsert ${account.name}:`, upsertError);
          errors.push({ account: account.name, error: upsertError.message });
        } else {
          const count = upsertData?.length || vendas.length;
          totalSynced += count;
          results.push({ account: account.name, count });
          console.log(`[sync-vendas-hoje:${correlationId}] ✅ ${count} vendas sincronizadas para ${account.name}`);
        }

      } catch (accountError) {
        console.error(`[sync-vendas-hoje:${correlationId}] ❌ Erro processando ${account.name}:`, accountError);
        errors.push({ account: account.name, error: String(accountError) });
      }
    }

    console.log(`[sync-vendas-hoje:${correlationId}] 🏁 Sincronização concluída: ${totalSynced} vendas`);

    return ok({
      success: true,
      synced: totalSynced,
      accounts: results,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    }, { headers: corsHeaders });

  } catch (error) {
    console.error(`[sync-vendas-hoje:${correlationId}] ❌ Erro geral:`, error);
    return fail(String(error), { status: 500, headers: corsHeaders });
  }
});

/**
 * Busca pedidos do dia via API do Mercado Livre
 */
async function fetchMLOrdersToday(
  sellerId: string,
  accessToken: string,
  dateFrom: string,
  dateTo: string,
  cid: string
): Promise<any> {
  const mlConfig = getMlConfig();
  
  // Buscar apenas pedidos PAID (vendas concluídas)
  const url = new URL(`${mlConfig.apiUrl}/orders/search`);
  url.searchParams.set('seller', sellerId);
  url.searchParams.set('order.date_created.from', dateFrom);
  url.searchParams.set('order.date_created.to', dateTo);
  url.searchParams.set('order.status', 'paid');
  url.searchParams.set('sort', 'date_desc');
  url.searchParams.set('limit', '50'); // Máximo por página
  url.searchParams.set('offset', '0');

  console.log(`[sync-vendas-hoje:${cid}] 🔍 Buscando: ${url.toString()}`);

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'x-format-new': 'true'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[sync-vendas-hoje:${cid}] ❌ ML API error ${response.status}: ${errorText}`);
    throw new Error(`ML API error: ${response.status}`);
  }

  const data = await response.json();
  console.log(`[sync-vendas-hoje:${cid}] ✅ ML API retornou ${data.results?.length || 0} pedidos (total: ${data.paging?.total || 0})`);

  // Se houver mais páginas, buscar todas
  if (data.paging?.total > 50) {
    console.log(`[sync-vendas-hoje:${cid}] 📄 Buscando páginas adicionais (${data.paging.total} total)`);
    
    const allResults = [...data.results];
    let offset = 50;
    
    while (offset < data.paging.total && offset < 500) { // Limite de segurança: 500 pedidos/dia
      url.searchParams.set('offset', String(offset));
      
      const pageResponse = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'x-format-new': 'true'
        }
      });
      
      if (pageResponse.ok) {
        const pageData = await pageResponse.json();
        allResults.push(...(pageData.results || []));
        console.log(`[sync-vendas-hoje:${cid}] 📄 Página offset=${offset}: +${pageData.results?.length || 0} pedidos`);
      }
      
      offset += 50;
    }
    
    data.results = allResults;
  }

  return data;
}
