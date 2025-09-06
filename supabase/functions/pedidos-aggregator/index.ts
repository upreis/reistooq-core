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

    // Usar o unified-orders para buscar contadores por status
    const unifiedOrdersUrl = new URL(Deno.env.get("SUPABASE_URL") + "/functions/v1/unified-orders");
    
    const accounts = integration_account_ids || (integration_account_id ? [integration_account_id] : []);
    if (!accounts.length) return fail("Missing integration account", 400, null, cid);

    // Agregadores para cada status
    const aggregatedCounts = {
      total: 0,
      confirmed: 0,
      paid: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };

    // Buscar contadores para cada status relevante
    const statusesToCheck = ['confirmed', 'paid', 'shipped', 'delivered', 'cancelled'];
    
    for (const status of statusesToCheck) {
      const requestBody = {
        integration_account_id: accounts[0], // Usar primeira conta para simplificar
        status: status,
        limit: 1, // Só queremos o total, não os dados
        offset: 0,
        ...filters // Aplicar filtros (data, busca, etc.)
      };

      try {
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
          if (data.ok && data.paging?.total) {
            aggregatedCounts[status as keyof typeof aggregatedCounts] = data.paging.total;
            aggregatedCounts.total += data.paging.total;
          }
        }
      } catch (error) {
        console.warn(`[pedidos-aggregator:${cid}] Error fetching ${status}:`, error);
      }
    }

    // Buscar contadores de histórico para "baixados"
    // Contadores adicionais via RPC para evitar problemas de permissão/RLS
    const sb = serviceClient();
    let baixadosCount = 0;
    let mapeamentoPendenteCount = 0;

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

    try {
      const { data: pendData, error: pendErr } = await sb.rpc('count_mapeamentos_pendentes', {
        _account_ids: accounts,
        _from: dateFrom,
        _to: dateTo
      });
      if (pendErr) throw pendErr;
      mapeamentoPendenteCount = pendData || 0;
    } catch (error) {
      console.warn(`[pedidos-aggregator:${cid}] Error fetching mapeamentos via RPC:`, error);
    }

    // Mapear para estrutura esperada pelos cards
    const result = {
      total: aggregatedCounts.total,
      prontosBaixa: aggregatedCounts.paid, // Pedidos pagos = prontos para baixar
      mapeamentoPendente: mapeamentoPendenteCount, // Mapeamentos incompletos
      baixados: baixadosCount,
      shipped: aggregatedCounts.shipped,
      delivered: aggregatedCounts.delivered,
      correlation_id: cid
    };

    console.log(`[pedidos-aggregator:${cid}] Aggregated counts:`, result);

    return ok(result);
  } catch (err: any) {
    console.error(`[pedidos-aggregator:${cid}]`, err);
    return fail(err?.message ?? "Internal server error", 500, String(err), cid);
  }
});