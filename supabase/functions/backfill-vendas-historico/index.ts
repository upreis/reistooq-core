/**
 * 🔴 BACKFILL VENDAS HISTÓRICO - Edge Function
 * Busca vendas históricas (últimos 6 meses) e popula vendas_hoje_realtime
 * Processa MÊS A MÊS para não sobrecarregar a API
 * 
 * ✅ Executar UMA VEZ para popular dados históricos
 * ✅ Depois CRON sync-vendas-hoje mantém atualizado
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const cid = () => crypto.randomUUID().slice(0, 8);

interface BackfillParams {
  organization_id: string;
  integration_account_ids?: string[];
  months_back?: number; // Quantos meses para trás (default: 6)
}

Deno.serve(async (req) => {
  const correlationId = cid();
  console.log(`[backfill-vendas:${correlationId}] 🚀 Iniciando backfill de vendas históricas`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    const params: BackfillParams = await req.json().catch(() => ({}));
    
    console.log(`[backfill-vendas:${correlationId}] 📋 Parâmetros:`, params);

    if (!params.organization_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'organization_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Buscar contas ML ativas
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

    if (accountsError || !accounts?.length) {
      console.error(`[backfill-vendas:${correlationId}] ❌ Erro/Nenhuma conta:`, accountsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Nenhuma conta ML encontrada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[backfill-vendas:${correlationId}] ✅ ${accounts.length} contas encontradas`);

    // 2. Definir meses para processar
    const monthsBack = params.months_back || 6;
    const months = generateMonthRanges(monthsBack);
    
    console.log(`[backfill-vendas:${correlationId}] 📅 Processando ${months.length} meses`);

    let totalSynced = 0;
    const results: any[] = [];
    const errors: any[] = [];

    // 3. Processar cada conta
    for (const account of accounts) {
      try {
        console.log(`[backfill-vendas:${correlationId}] 🔄 Conta: ${account.name}`);

        // Buscar token
        const { data: secretRow } = await supabase
          .from('integration_secrets')
          .select('simple_tokens, use_simple')
          .eq('integration_account_id', account.id)
          .eq('provider', 'mercadolivre')
          .maybeSingle();

        if (!secretRow) {
          console.warn(`[backfill-vendas:${correlationId}] ⚠️ Token não encontrado para ${account.name}`);
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
          errors.push({ account: account.name, error: 'Token vazio' });
          continue;
        }

        let accountSynced = 0;

        // 4. Processar cada mês separadamente
        for (const month of months) {
          console.log(`[backfill-vendas:${correlationId}] 📆 ${account.name} - ${month.label}`);

          try {
            const ordersData = await fetchMLOrdersForPeriod(
              account.account_identifier,
              accessToken,
              month.from,
              month.to,
              correlationId
            );

            if (!ordersData?.results?.length) {
              console.log(`[backfill-vendas:${correlationId}] ℹ️ Nenhum pedido em ${month.label}`);
              continue;
            }

            console.log(`[backfill-vendas:${correlationId}] 📦 ${ordersData.results.length} pedidos em ${month.label}`);

            // Preparar dados para upsert (sem buscar thumbnails para ser mais rápido)
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
                item_thumbnail: '', // Não buscar thumbnails no backfill (muito lento)
                item_quantity: order.order_items?.[0]?.quantity || 1,
                item_unit_price: order.order_items?.[0]?.unit_price || 0,
                item_sku: firstItem.seller_sku || firstItem.seller_custom_field || '',
                order_data: order,
                synced_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
            });

            // UPSERT em batches de 100
            const batchSize = 100;
            for (let i = 0; i < vendas.length; i += batchSize) {
              const batch = vendas.slice(i, i + batchSize);
              
              const { error: upsertError } = await supabase
                .from('vendas_hoje_realtime')
                .upsert(batch, { 
                  onConflict: 'organization_id,order_id',
                  ignoreDuplicates: false 
                });

              if (upsertError) {
                console.error(`[backfill-vendas:${correlationId}] ❌ Erro upsert:`, upsertError);
              } else {
                accountSynced += batch.length;
              }
            }

            // Delay entre meses para não sobrecarregar
            await new Promise(resolve => setTimeout(resolve, 500));

          } catch (monthError) {
            console.error(`[backfill-vendas:${correlationId}] ❌ Erro mês ${month.label}:`, monthError);
          }
        }

        totalSynced += accountSynced;
        results.push({ account: account.name, synced: accountSynced });
        console.log(`[backfill-vendas:${correlationId}] ✅ ${account.name}: ${accountSynced} vendas`);

      } catch (accountError) {
        console.error(`[backfill-vendas:${correlationId}] ❌ Erro conta ${account.name}:`, accountError);
        errors.push({ account: account.name, error: String(accountError) });
      }
    }

    console.log(`[backfill-vendas:${correlationId}] 🏁 Backfill concluído: ${totalSynced} vendas totais`);

    return new Response(
      JSON.stringify({
        success: true,
        total_synced: totalSynced,
        accounts: results,
        errors: errors.length > 0 ? errors : undefined,
        months_processed: months.length,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[backfill-vendas:${correlationId}] ❌ Erro geral:`, error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Gera ranges de datas para cada mês
 */
function generateMonthRanges(monthsBack: number): Array<{ from: string; to: string; label: string }> {
  const ranges: Array<{ from: string; to: string; label: string }> = [];
  const now = new Date();
  
  for (let i = 0; i < monthsBack; i++) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    
    // Se for o mês atual, usar hoje como fim
    if (i === 0) {
      monthEnd.setTime(now.getTime());
    }
    
    ranges.push({
      from: monthStart.toISOString(),
      to: monthEnd.toISOString(),
      label: `${monthStart.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`
    });
  }
  
  // Inverter para processar do mais antigo ao mais recente
  return ranges.reverse();
}

/**
 * Busca pedidos de um período específico com paginação completa
 */
async function fetchMLOrdersForPeriod(
  sellerId: string,
  accessToken: string,
  dateFrom: string,
  dateTo: string,
  cid: string
): Promise<any> {
  const MAX_ORDERS = 5000; // Limite maior para backfill
  const PAGE_SIZE = 50;
  
  const url = new URL('https://api.mercadolibre.com/orders/search');
  url.searchParams.set('seller', sellerId);
  url.searchParams.set('order.date_created.from', dateFrom);
  url.searchParams.set('order.date_created.to', dateTo);
  url.searchParams.set('order.status', 'paid');
  url.searchParams.set('sort', 'date_desc');
  url.searchParams.set('limit', String(PAGE_SIZE));
  url.searchParams.set('offset', '0');

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'x-format-new': 'true'
    }
  });

  if (!response.ok) {
    console.error(`[backfill-vendas:${cid}] ❌ ML API error ${response.status}`);
    return { results: [] };
  }

  const data = await response.json();
  const total = data.paging?.total || 0;

  // Paginação completa
  if (total > PAGE_SIZE) {
    const pagesToFetch = Math.min(total, MAX_ORDERS);
    const allResults = [...data.results];
    let offset = PAGE_SIZE;
    
    while (offset < pagesToFetch) {
      url.searchParams.set('offset', String(offset));
      
      try {
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
        }
      } catch (pageError) {
        console.warn(`[backfill-vendas:${cid}] ⚠️ Erro página offset=${offset}`);
      }
      
      offset += PAGE_SIZE;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    data.results = allResults;
  }

  return data;
}
