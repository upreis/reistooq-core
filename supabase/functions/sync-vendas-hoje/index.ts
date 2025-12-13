/**
 * 🔴 SYNC VENDAS HOJE - Edge Function
 * 
 * ══════════════════════════════════════════════════════════════════════════════
 * PADRÃO DE SINCRONIZAÇÃO OTIMIZADO (v2.0)
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * 📅 CRON (cada 5 min):
 *    - Busca: Últimos 7 DIAS (rolling window)
 *    - Motivo: Captura mudanças de status (cancelamentos, estornos, devoluções)
 *    - Frequência ideal para detectar alterações sem sobrecarregar API
 * 
 * 🔐 OAuth Callback (conta nova):
 *    - Busca: Últimos 60 DIAS (backfill inicial único)
 *    - Motivo: Popular histórico completo quando conta é autorizada
 *    - Executado via EdgeRuntime.waitUntil() em background
 * 
 * 🗑️ Cleanup Diário (03:00 UTC):
 *    - Remove: Dados com mais de 180 dias (6 meses)
 *    - Edge Function: cleanup-vendas-antigas
 * 
 * ══════════════════════════════════════════════════════════════════════════════
 * PROTEÇÃO CONTRA DUPLICAÇÃO
 * ══════════════════════════════════════════════════════════════════════════════
 * - UPSERT com onConflict: 'organization_id,order_id'
 * - Mesma venda nunca é duplicada, apenas atualizada
 * 
 * ══════════════════════════════════════════════════════════════════════════════
 * USO DE API/EGRESS
 * ══════════════════════════════════════════════════════════════════════════════
 * - CRON 7 dias: ~90% menos dados que 60 dias = economia significativa
 * - Backfill 60 dias: Executado apenas 1x por conta
 * 
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const cid = () => crypto.randomUUID().slice(0, 8);

/**
 * 🖼️ Converte URL de thumbnail do ML para alta qualidade
 * Sufixos ML: -I (pequeno/thumbnail), -O (original/alta qualidade), -F (full)
 */
function getHighQualityImageUrl(url: string): string {
  if (!url) return '';
  return url
    .replace(/-I\.jpg/g, '-O.jpg')
    .replace(/-I\.webp/g, '-O.webp')
    .replace(/-F\.jpg/g, '-O.jpg')
    .replace(/-F\.webp/g, '-O.webp')
    .replace(/http:\/\//g, 'https://');
}

interface SyncParams {
  organization_id?: string;
  integration_account_ids?: string[];
  force_refresh?: boolean;
  days_back?: number; // Quantos dias para trás buscar (default: 7 para CRON, 60 para backfill)
}

Deno.serve(async (req) => {
  const correlationId = cid();
  console.log(`[sync-vendas-hoje:${correlationId}] 🚀 Iniciando sincronização de vendas`);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });

  const params: SyncParams = await req.json().catch(() => ({}));

  try {
    
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

    // 2. Definir período: 
    // - CRON padrão: 7 dias (rolling window para capturar mudanças de status)
    // - OAuth backfill: 60 dias (passado como parâmetro days_back: 60)
    const CRON_DEFAULT_DAYS = 7;
    const daysBack = params.days_back || CRON_DEFAULT_DAYS;
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysBack);
    dateFrom.setHours(0, 0, 0, 0);
    const dateTo = new Date();

    console.log(`[sync-vendas-hoje:${correlationId}] 📅 Período: últimos ${daysBack} dias (${dateFrom.toISOString()} a ${dateTo.toISOString()})`)

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

        // Buscar pedidos do ML usando API direta (com paginação completa)
        const ordersData = await fetchMLOrders(
          account.account_identifier,
          accessToken,
          dateFrom.toISOString(),
          dateTo.toISOString(),
          correlationId
        );

        if (!ordersData?.results?.length) {
          console.log(`[sync-vendas-hoje:${correlationId}] ℹ️ Nenhum pedido hoje para ${account.name}`);
          results.push({ account: account.name, count: 0 });
          continue;
        }

        console.log(`[sync-vendas-hoje:${correlationId}] 📦 ${ordersData.results.length} pedidos encontrados para ${account.name}`);

        // 4. Enriquecer com thumbnails e salvar na tabela vendas_hoje_realtime (UPSERT)
        // SKIP thumbnails para backfills grandes (>14 dias) para evitar timeout
        const skipThumbnails = daysBack > 14;
        if (skipThumbnails) {
          console.log(`[sync-vendas-hoje:${correlationId}] ⚡ Modo rápido: pulando thumbnails para backfill de ${daysBack} dias`);
        }

        const vendas = await Promise.all(ordersData.results.map(async (order: any) => {
          const firstItem = order.order_items?.[0]?.item || {};
          
          // Buscar thumbnail via API /items/{item_id} - APENAS para syncs curtos
          let itemThumbnail = '';
          if (firstItem.id && !skipThumbnails) {
            try {
              const productInfo = await fetchProductInfo(firstItem.id, accessToken, correlationId);
              itemThumbnail = productInfo.thumbnail || '';
            } catch (e) {
              console.warn(`[sync-vendas-hoje:${correlationId}] ⚠️ Erro buscando thumbnail ${firstItem.id}`);
            }
          }
          
          // Buscar shipping info para obter o estado (receiver_address)
          let shippingState = '';
          const shippingId = order.shipping?.id;
          if (shippingId && !skipThumbnails) {
            try {
              const shippingInfo = await fetchShippingInfo(shippingId, accessToken, correlationId);
              shippingState = shippingInfo.state || '';
            } catch (e) {
              console.warn(`[sync-vendas-hoje:${correlationId}] ⚠️ Erro buscando shipping ${shippingId}`);
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
            shipping_state: shippingState || null,
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
          
          // 🖼️ SINCRONIZAR IMAGENS COM ESTOQUE (COM FALLBACK DE/PARA)
          // Para cada venda com SKU e thumbnail, atualizar produtos SEM imagem
          // Se SKU da venda não encontrar produto, busca no mapeamento de/para
          const vendasComImagem = vendas.filter(v => v.item_sku && v.item_thumbnail);
          if (vendasComImagem.length > 0) {
            console.log(`[sync-vendas-hoje:${correlationId}] 🖼️ Sincronizando ${vendasComImagem.length} imagens com estoque...`);
            
            let imagensAtualizadas = 0;
            let imagensViaDePara = 0;
            
            for (const venda of vendasComImagem) {
              try {
                // 🖼️ Garantir alta qualidade: -I (thumbnail) → -O (original)
                const highQualityUrl = getHighQualityImageUrl(venda.item_thumbnail);
                
                // 1️⃣ TENTATIVA DIRETA: Atualiza produto onde sku_interno = item_sku
                const { data: updateData, error: updateError } = await supabase
                  .from('produtos')
                  .update({ url_imagem: highQualityUrl })
                  .eq('sku_interno', venda.item_sku)
                  .eq('organization_id', params.organization_id)
                  .is('url_imagem', null)
                  .select('id');
                
                if (!updateError && updateData?.length > 0) {
                  imagensAtualizadas++;
                  console.log(`[sync-vendas-hoje:${correlationId}] 🖼️ Imagem atualizada para SKU direto: ${venda.item_sku}`);
                  continue; // Encontrou direto, próximo item
                }
                
                // 2️⃣ FALLBACK DE/PARA: Se não encontrou direto, buscar no mapeamento
                const { data: mapeamento } = await supabase
                  .from('mapeamentos_depara')
                  .select('sku_correspondente, sku_simples')
                  .eq('sku_pedido', venda.item_sku)
                  .eq('ativo', true)
                  .maybeSingle();
                
                if (mapeamento) {
                  // Usa sku_correspondente ou sku_simples (fallback)
                  const skuEstoque = mapeamento.sku_correspondente || mapeamento.sku_simples;
                  
                  if (skuEstoque) {
                    const { data: updateViaDePara, error: errorDePara } = await supabase
                      .from('produtos')
                      .update({ url_imagem: highQualityUrl })
                      .eq('sku_interno', skuEstoque)
                      .eq('organization_id', params.organization_id)
                      .is('url_imagem', null)
                      .select('id');
                    
                    if (!errorDePara && updateViaDePara?.length > 0) {
                      imagensViaDePara++;
                      console.log(`[sync-vendas-hoje:${correlationId}] 🖼️ Imagem via De/Para: ${venda.item_sku} → ${skuEstoque}`);
                    }
                  }
                }
              } catch (imgError) {
                console.warn(`[sync-vendas-hoje:${correlationId}] ⚠️ Erro ao atualizar imagem SKU ${venda.item_sku}:`, imgError);
              }
            }
            
            const totalImagens = imagensAtualizadas + imagensViaDePara;
            if (totalImagens > 0) {
              console.log(`[sync-vendas-hoje:${correlationId}] ✅ ${totalImagens} imagens sincronizadas (${imagensAtualizadas} diretas, ${imagensViaDePara} via De/Para)`);
            }
          }
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
 * Busca pedidos via API do Mercado Livre com paginação completa
 * Suporta até 2000 pedidos por conta (limite de segurança)
 */
async function fetchMLOrders(
  sellerId: string,
  accessToken: string,
  dateFrom: string,
  dateTo: string,
  cid: string
): Promise<any> {
const MAX_ORDERS = 25000; // Limite aumentado para cobrir contas com alto volume (15k+ em 2 meses)
  const PAGE_SIZE = 50;
  
  // Buscar TODOS os status de pedidos (paid, shipped, delivered são vendas válidas)
  // NÃO filtrar por status para pegar tudo
  const url = new URL('https://api.mercadolibre.com/orders/search');
  url.searchParams.set('seller', sellerId);
  url.searchParams.set('order.date_created.from', dateFrom);
  url.searchParams.set('order.date_created.to', dateTo);
  // Removido: url.searchParams.set('order.status', 'paid');
  url.searchParams.set('sort', 'date_desc');
  url.searchParams.set('limit', String(PAGE_SIZE));
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
  const total = data.paging?.total || 0;
  console.log(`[sync-vendas-hoje:${cid}] ✅ ML API retornou ${data.results?.length || 0} pedidos (total: ${total})`);

  // Se houver mais páginas, buscar todas
  if (total > PAGE_SIZE) {
    const pagesToFetch = Math.min(total, MAX_ORDERS);
    console.log(`[sync-vendas-hoje:${cid}] 📄 Buscando páginas adicionais (${pagesToFetch} de ${total} total)`);
    
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
          console.log(`[sync-vendas-hoje:${cid}] 📄 Página offset=${offset}: +${pageData.results?.length || 0} pedidos`);
        } else {
          console.warn(`[sync-vendas-hoje:${cid}] ⚠️ Erro página offset=${offset}: ${pageResponse.status}`);
        }
      } catch (pageError) {
        console.warn(`[sync-vendas-hoje:${cid}] ⚠️ Erro fetch página offset=${offset}:`, pageError);
      }
      
      offset += PAGE_SIZE;
      
      // Pequeno delay para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    data.results = allResults;
    console.log(`[sync-vendas-hoje:${cid}] ✅ Total de pedidos coletados: ${allResults.length}`);
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
    let thumbnail = itemData.thumbnail || itemData.pictures?.[0]?.url || '';
    
    // 🖼️ Converter para alta qualidade: -I (thumbnail) → -O (original/alta qualidade)
    thumbnail = getHighQualityImageUrl(thumbnail);
    
    return { thumbnail };
  } catch (error) {
    console.warn(`[sync-vendas-hoje:${cid}] ⚠️ Erro fetchProductInfo ${itemId}:`, error);
    return { thumbnail: '' };
  }
}

/**
 * Busca informações de shipping para obter estado (UF) do destinatário
 * Endpoint: GET /shipments/{shipment_id}
 */
async function fetchShippingInfo(shipmentId: number, accessToken: string, cid: string): Promise<{ state: string }> {
  try {
    const response = await fetch(`https://api.mercadolibre.com/shipments/${shipmentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { state: '' };
    }

    const shipData = await response.json();
    // Extrair estado: pode ser ID (BR-SP) ou nome (São Paulo)
    const stateId = shipData.receiver_address?.state?.id || '';
    const stateName = shipData.receiver_address?.state?.name || '';
    
    // Preferir ID pois é mais padronizado (BR-SP -> SP)
    let state = '';
    if (stateId) {
      // BR-SP -> SP, BR-RJ -> RJ, etc.
      state = stateId.replace('BR-', '');
    } else if (stateName) {
      state = stateName;
    }
    
    return { state };
  } catch (error) {
    console.warn(`[sync-vendas-hoje:${cid}] ⚠️ Erro fetchShippingInfo ${shipmentId}:`, error);
    return { state: '' };
  }
}

