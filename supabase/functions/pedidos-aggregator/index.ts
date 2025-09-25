// supabase/functions/pedidos-aggregator/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key);
}

function ok(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify({ ok: true, ...data }), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function fail(error: string, status = 400, detail?: unknown, cid?: string) {
  const payload: Record<string, unknown> = { ok: false, error, status };
  if (detail !== undefined) payload.detail = detail;
  if (cid) payload.correlation_id = cid;
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

// Cache simples em memória para a duração da execution
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

function getCachedResult(key: string) {
  return cache.get(key) || null;
}

function isExpired(cached: { timestamp: number; ttl: number }) {
  return Date.now() - cached.timestamp > cached.ttl;
}

function setCachedResult(key: string, data: any, ttl: number) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") return fail("Method Not Allowed", 405);

  const cid = crypto.randomUUID().slice(0, 8);
  try {
    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    if (!authHeader) return fail("Missing Authorization header", 401, null, cid);

    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }
    
    const { 
      integration_account_id,
      integration_account_ids,
      filters = {}
    } = body || {};

    console.log(`[pedidos-aggregator:${cid}] Aggregating counts with filters:`, filters);

    const accounts = integration_account_ids || (integration_account_id ? [integration_account_id] : []);
    if (!accounts.length) return fail("Missing integration account", 400, null, cid);

    // Implementar cache para evitar reprocessar a mesma busca
    const cacheKey = `aggregator_${JSON.stringify({ accounts: accounts.sort(), filters })}`;
    const cached = getCachedResult(cacheKey);

    if (cached && !isExpired(cached)) {
      console.log(`[pedidos-aggregator:${cid}] Returning cached result for key: ${cacheKey.slice(0, 50)}...`);
      return ok({ ...cached.data, correlation_id: cid, from_cache: true });
    }

    console.log(`[pedidos-aggregator:${cid}] Processing fresh aggregation for ${accounts.length} accounts...`);

    // Buscar todos os pedidos do período com os dados de mapeamento
    const unifiedOrdersUrl = new URL(Deno.env.get("SUPABASE_URL") + "/functions/v1/unified-orders");

    let prontosBaixaCount = 0;
    let mapeamentoPendenteCount = 0;
    let totalCount = 0;
    
    try {
    // PROBLEMA IDENTIFICADO: A API do ML retorna erro 401 (token expirado)
      // Precisamos usar uma abordagem diferente para contar os pedidos
      
      // Para múltiplas contas, processar uma por vez com paginação completa
      for (const accountId of accounts) {
        try {
          let offset = 0;
          const limit = 100;
          let hasMore = true;
          let accountTotalProcessed = 0;
          
          // Buscar todos os mapeamentos uma vez para esta conta
          const allAccountSkus = [];
          let mapeamentosMap = new Map();
          
          // Primeiro pass: buscar todos os SKUs para otimizar consulta de mapeamentos
          while (hasMore) {
            const requestBody = {
              integration_account_id: accountId,
              limit,
              offset,
              ...filters
            };

            const response = await fetch(unifiedOrdersUrl.toString(), {
              method: 'POST',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
                'apikey': Deno.env.get("SUPABASE_ANON_KEY")!,
              },
              body: JSON.stringify(requestBody)
            });

            if (response.ok) {
              const data = await response.json();
              if (data?.ok) {
                const orders = data.orders || data.results || data.pedidos || [];
                const accountTotal = data.paging?.total ?? data.total ?? 0;
                
                // Se primeira página, atualizar total count
                if (offset === 0) {
                  totalCount += accountTotal;
                  console.log(`[pedidos-aggregator:${cid}] Account ${accountId.slice(0,8)}: Starting pagination through ${accountTotal} total orders`);
                }

                // Processar pedidos da página atual
                await processOrdersForCounting(orders, mapeamentosMap, cid, accountId);
                
                accountTotalProcessed += orders.length;
                
                // Verificar se há mais páginas
                offset += limit;
                hasMore = offset < accountTotal && orders.length === limit;
                
                console.log(`[pedidos-aggregator:${cid}] Account ${accountId.slice(0,8)}: Processed ${accountTotalProcessed}/${accountTotal} orders`);
              } else {
                hasMore = false;
              }
            } else {
              console.warn(`[pedidos-aggregator:${cid}] Error fetching orders for account ${accountId.slice(0,8)} at offset ${offset}:`, response.status);
              hasMore = false;
            }
          }
        } catch (error) {
          console.warn(`[pedidos-aggregator:${cid}] Error processing account ${accountId.slice(0,8)}:`, error);
        }
      }

      // Função auxiliar para processar pedidos e contabilizar
      async function processOrdersForCounting(orders: any[], mapeamentosMap: Map<string, any>, cid: string, accountId: string) {
        // Buscar dados de mapeamento para calcular status_baixa
        const allSkus = [];
        for (const order of orders) {
          const items = (order as any).order_items || [];
          for (const item of items) {
            if (item.item?.seller_sku) {
              allSkus.push(item.item.seller_sku);
            }
          }
        }

        // Buscar mapeamentos apenas se ainda não foram carregados
        if (allSkus.length > 0 && mapeamentosMap.size === 0) {
          try {
            const supabaseClient = serviceClient();
            const { data: mapeamentos, error: mapeamentosError } = await supabaseClient.rpc('get_mapeamentos_by_skus', {
              skus: allSkus
            });
            
            if (!mapeamentosError && mapeamentos) {
              for (const m of mapeamentos) {
                mapeamentosMap.set(m.sku_pedido, m);
              }
              console.log(`[pedidos-aggregator:${cid}] Found ${mapeamentosMap.size} mappings for account ${accountId.slice(0,8)}`);
            } else if (mapeamentosError) {
              console.warn(`[pedidos-aggregator:${cid}] Error in mappings RPC:`, mapeamentosError);
            }
          } catch (err) {
            console.warn(`[pedidos-aggregator:${cid}] Error fetching mappings:`, err);
          }
        }

        for (const order of orders) {
          const items = (order as any).order_items || [];
          let temMapeamentoCompleto = false;
          let temMapeamentoIncompleto = false;
          let temSemMapeamento = false;

          // Analisar cada item do pedido
          for (const item of items) {
            const sku = item.item?.seller_sku;
            if (!sku) continue;

            const mapeamento = mapeamentosMap.get(sku);
            if (!mapeamento) {
              temSemMapeamento = true;
            } else {
              // Verificar se o mapeamento está completo
              if (mapeamento.sku_correspondente || mapeamento.sku_simples) {
                temMapeamentoCompleto = true;
              } else {
                temMapeamentoIncompleto = true;
              }
            }
          }

          // Calcular status da baixa baseado na lógica do frontend
          if (temMapeamentoCompleto && !temMapeamentoIncompleto && !temSemMapeamento) {
            prontosBaixaCount++;
          } else if (temMapeamentoIncompleto || temSemMapeamento) {
            mapeamentoPendenteCount++;
          }
        }
      }
    } catch (error) {
      console.warn(`[pedidos-aggregator:${cid}] Error processing account ${accountId.slice(0,8)}:`, error);
    }
  }

    console.log(`[pedidos-aggregator:${cid}] Analysis result: total=${totalCount}, prontos=${prontosBaixaCount}, pendentes=${mapeamentoPendenteCount}`);
    } catch (error) {
      console.warn(`[pedidos-aggregator:${cid}] Error fetching orders for analysis:`, error);
    }

    // Buscar contadores de histórico para "baixados" via RPC
    const sb = serviceClient();
    let baixadosCount = 0;

    const dateFrom = (filters as any)?.date_from ?? null;
    const dateTo = (filters as any)?.date_to ?? null;
    const search = (filters as any)?.search ?? (filters as any)?.q ?? null;

    try {
      const { data: baixadosData, error: baixadosErr } = await sb.rpc('count_baixados', {
        _account_ids: accounts,
        _from: dateFrom,
        _to: dateTo,
        _search: search
      });
      if (baixadosErr) throw baixadosErr;
      baixadosCount = baixadosData || 0;
    } catch (error) {
      console.warn(`[pedidos-aggregator:${cid}] Error fetching baixados via RPC:`, error);
    }

    // Mapear para estrutura esperada pelos cards
    const result = {
      total: totalCount,
      prontosBaixa: prontosBaixaCount, // Pedidos com mapeamento completo
      mapeamentoPendente: mapeamentoPendenteCount, // Pedidos com mapeamento incompleto
      baixados: baixadosCount, // Histórico de vendas (já processados)
      shipped: 0, // TODO: implementar se necessário
      delivered: 0, // TODO: implementar se necessário
      correlation_id: cid
    };

    console.log(`[pedidos-aggregator:${cid}] Aggregated counts:`, result);

    // Cachear resultado por 5 minutos (300.000ms)
    setCachedResult(cacheKey, result, 5 * 60 * 1000);
    console.log(`[pedidos-aggregator:${cid}] Result cached for 5 minutes`);

    return ok(result);
  } catch (err: any) {
    console.error(`[pedidos-aggregator:${cid}]`, err);
    return fail(err?.message ?? "Internal server error", 500, String(err), cid);
  }
});