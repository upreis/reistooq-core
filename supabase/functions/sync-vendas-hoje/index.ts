/**
 * 🔴 SYNC VENDAS HOJE - Edge Function
 * Busca vendas do dia de todas as contas ML e salva na tabela vendas_hoje_realtime
 * Para painel de vendas ao vivo
 * 
 * ✅ Padrão idêntico a get-vendas-comenvio (tokens via integration_secrets)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Service Client (bypass RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    const params: SyncParams = await req.json().catch(() => ({}));
    
    console.log(`[sync-vendas-hoje:${correlationId}] 📋 Parâmetros:`, params);

    if (!params.organization_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'organization_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Buscar contas ML ativas da organização
    let accountsQuery = supabase
      .from('integration_accounts')
      .select('id, name, account_identifier, organization_id')
      .eq('provider', 'mercadolivre')
      .eq('is_active', true)
      .eq('organization_id', params.organization_id);

    if (params.integration_account_ids?.length) {
      accountsQuery = accountsQuery.in('id', params.integration_account_ids);
    }

    const { data: accounts, error: accountsError } = await accountsQuery;

    if (accountsError) {
      console.error(`[sync-vendas-hoje:${correlationId}] ❌ Erro ao buscar contas:`, accountsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao buscar contas ML' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!accounts?.length) {
      console.log(`[sync-vendas-hoje:${correlationId}] ⚠️ Nenhuma conta ML ativa encontrada`);
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhuma conta ML ativa', synced: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

        // Buscar token de integration_secrets (padrão get-vendas-comenvio)
        const { data: secretRow, error: secretError } = await supabase
          .from('integration_secrets')
          .select('simple_tokens, use_simple')
          .eq('integration_account_id', account.id)
          .eq('provider', 'mercadolivre')
          .maybeSingle();

        if (secretError || !secretRow) {
          console.warn(`[sync-vendas-hoje:${correlationId}] ⚠️ Token não encontrado para ${account.name}`);
          errors.push({ account: account.name, error: 'Token não encontrado' });
          continue;
        }

        let accessToken = '';
        if (secretRow?.use_simple && secretRow?.simple_tokens) {
          const simpleTokensStr = secretRow.simple_tokens as string;
          if (simpleTokensStr.startsWith('SALT2024::')) {
            const base64Data = simpleTokensStr.replace('SALT2024::', '');
            const jsonStr = atob(base64Data);
            const tokensData = JSON.parse(jsonStr);
            accessToken = tokensData.access_token || '';
          }
        }

        if (!accessToken) {
          console.warn(`[sync-vendas-hoje:${correlationId}] ⚠️ Token vazio para ${account.name}`);
          errors.push({ account: account.name, error: 'Token vazio' });
          continue;
        }

        console.log(`[sync-vendas-hoje:${correlationId}] ✅ Token obtido para ${account.name}`);

        // Buscar pedidos do ML usando API direta
        const ordersData = await fetchMLOrdersToday(
          account.account_identifier,
          accessToken,
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

        // 4. Enriquecer com thumbnails e salvar na tabela vendas_hoje_realtime (UPSERT)
        const vendas = await Promise.all(ordersData.results.map(async (order: any) => {
          const firstItem = order.order_items?.[0]?.item || {};
          
          // Buscar thumbnail via API /items/{item_id}
          let itemThumbnail = '';
          if (firstItem.id) {
            try {
              const productInfo = await fetchProductInfo(firstItem.id, accessToken, correlationId);
              itemThumbnail = productInfo.thumbnail || '';
            } catch (e) {
              console.warn(`[sync-vendas-hoje:${correlationId}] ⚠️ Erro buscando thumbnail ${firstItem.id}`);
            }
          }
          
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
            item_thumbnail: itemThumbnail,
            item_quantity: order.order_items?.[0]?.quantity || 1,
            item_unit_price: order.order_items?.[0]?.unit_price || 0,
            item_sku: firstItem.seller_sku || firstItem.seller_custom_field || '',
            order_data: order,
            synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }));

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

    return new Response(
      JSON.stringify({
        success: true,
        synced: totalSynced,
        accounts: results,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[sync-vendas-hoje:${correlationId}] ❌ Erro geral:`, error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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
  // Buscar apenas pedidos PAID (vendas concluídas)
  const url = new URL('https://api.mercadolibre.com/orders/search');
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

/**
 * Busca informações do produto (incluindo thumbnail) via API do ML
 */
async function fetchProductInfo(itemId: string, accessToken: string, cid: string): Promise<{ thumbnail: string }> {
  try {
    const response = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { thumbnail: '' };
    }

    const itemData = await response.json();
    const thumbnail = itemData.thumbnail || itemData.pictures?.[0]?.url || '';
    
    return { thumbnail };
  } catch (error) {
    console.warn(`[sync-vendas-hoje:${cid}] ⚠️ Erro fetchProductInfo ${itemId}:`, error);
    return { thumbnail: '' };
  }
}
