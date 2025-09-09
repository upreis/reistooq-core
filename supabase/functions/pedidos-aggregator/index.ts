// supabase/functions/pedidos-aggregator/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
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

serve(async (req) => {
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

    // Buscar todos os pedidos do período com os dados de mapeamento
    const unifiedOrdersUrl = new URL(Deno.env.get("SUPABASE_URL") + "/functions/v1/unified-orders");
    
    const accounts = integration_account_ids || (integration_account_id ? [integration_account_id] : []);
    if (!accounts.length) return fail("Missing integration account", 400, null, cid);

    console.log(`[pedidos-aggregator:${cid}] Fetching orders with mappings to count by status...`);

    let prontosBaixaCount = 0;
    let mapeamentoPendenteCount = 0;
    let totalCount = 0;
    
    try {
      // Buscar todos os pedidos do período para analisar o mapeamento
      const requestBody = {
        integration_account_id: accounts[0],
        limit: 50, // Respeitando limite máximo da API do ML (≤ 51)
        offset: 0,
        ...filters // Aplicar filtros (data, busca, etc.)
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
        if (data.ok && data.orders) {
          const orders = data.orders;
          totalCount = data.paging?.total || orders.length;

          console.log(`[pedidos-aggregator:${cid}] Analyzing ${orders.length} orders from total ${totalCount}...`);

          for (const order of orders) {
            const mapping = order.mapping;
            const baixado = order.isPedidoProcessado || 
                           String(order.status_baixa || '').toLowerCase().includes('baixado');

            if (baixado) continue; // Pular pedidos já baixados

            // Pronto p/ Baixar: tem mapeamento completo (skuEstoque ou skuKit)
            const temMapeamentoCompleto = mapping && (mapping.skuEstoque || mapping.skuKit);
            
            // Mapear Incompleto: tem mapeamento mas não completo
            const temMapeamentoIncompleto = mapping && mapping.temMapeamento && !temMapeamentoCompleto;

            if (temMapeamentoCompleto) {
              prontosBaixaCount++;
            } else if (temMapeamentoIncompleto) {
              mapeamentoPendenteCount++;
            }
          }

          console.log(`[pedidos-aggregator:${cid}] Analysis result: prontos=${prontosBaixaCount}, pendentes=${mapeamentoPendenteCount}`);
        }
      }
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

    return ok(result);
  } catch (err: any) {
    console.error(`[pedidos-aggregator:${cid}]`, err);
    return fail(err?.message ?? "Internal server error", 500, String(err), cid);
  }
});