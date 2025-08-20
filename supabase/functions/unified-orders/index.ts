// supabase/functions/unified-orders/index.ts
// Deno + Supabase Edge Function
// Blindado para: token refresh (401), seller id, order.status, sort/limit/offset
// Retorna: { ok: true, paging, results, unified, debug? }

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

type Body = {
  integration_account_id: string;
  status?: string; // ex.: "paid" (mapeado para order.status)
  sort?: "date_desc" | "date_asc";
  limit?: number;
  offset?: number;
  q?: string;
  date_from?: string;
  date_to?: string;
  date_last_updated_from?: string;
  date_last_updated_to?: string;
  enrich?: boolean;
  debug?: boolean;
};

function ok<T>(data: T, debug?: any) {
  return new Response(JSON.stringify({ ok: true, ...data, ...(debug ? { debug } : {}) }), {
    headers: corsHeaders,
  });
}
function bad(status: number, message: string, debug?: any) {
  return new Response(JSON.stringify({ ok: false, error: message, ...(debug ? { debug } : {}) }), {
    status,
    headers: corsHeaders,
  });
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// Ajuste aqui conforme seu schema: precisa ter access_token/refresh_token e (opcional) ml_user_id
const TOKENS_TABLE = "ml_tokens";

async function getTokenRow(integration_account_id: string) {
  const { data, error } = await sb
    .from(TOKENS_TABLE)
    .select("access_token, refresh_token, client_id, client_secret, ml_user_id")
    .eq("integration_account_id", integration_account_id)
    .single();
  if (error) throw error;
  return data as {
    access_token: string;
    refresh_token?: string;
    client_id?: string;
    client_secret?: string;
    ml_user_id?: string | number;
  };
}

async function refreshAccessToken(row: any) {
  if (!row?.refresh_token || !row?.client_id || !row?.client_secret) return null;
  const payload = new URLSearchParams();
  payload.set("grant_type", "refresh_token");
  payload.set("client_id", row.client_id);
  payload.set("client_secret", row.client_secret);
  payload.set("refresh_token", row.refresh_token);

  const r = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: payload.toString(),
  });
  if (!r.ok) return null;
  const j = await r.json();
  const new_access = j.access_token as string;
  const new_refresh = (j.refresh_token ?? row.refresh_token) as string;

  // persistir
  await sb.from(TOKENS_TABLE)
    .update({ access_token: new_access, refresh_token: new_refresh })
    .eq("access_token", row.access_token);

  return { access_token: new_access, refresh_token: new_refresh };
}

async function resolveSellerId(access_token: string, fallback?: string | number) {
  if (fallback) return String(fallback);
  const r = await fetch("https://api.mercadolibre.com/users/me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!r.ok) throw new Error("Falha ao obter /users/me");
  const me = await r.json();
  return String(me.id);
}

function mapUnified(o: any) {
  // Mapeamento mínimo para as 22 colunas mais usadas no frontend
  const buyer = o?.buyer ?? {};
  const shipping = o?.shipping ?? {};
  const payments = Array.isArray(o?.payments) ? o.payments : [];
  const firstPay = payments[0] ?? {};
  const orderItems = Array.isArray(o?.order_items) ? o.order_items : [];
  const skus = orderItems
    .map((it: any) => it?.item?.seller_sku ?? it?.item?.seller_custom_field)
    .filter(Boolean)
    .join(", ");

  return {
    id: String(o.id),
    numero: String(o.id),
    nome_cliente: buyer.nickname ?? null,
    cpf_cnpj: null,
    data_pedido: o.date_created ?? null,
    data_prevista: o.date_closed ?? null,
    situacao: o.status ?? null,
    valor_total: o.total_amount ?? null,
    valor_frete: firstPay?.shipping_cost ?? null,
    valor_desconto: null,
    numero_ecommerce: String(o.id),
    numero_venda: String(o.id),
    empresa: "mercadolivre",
    cidade: null,
    uf: null,
    codigo_rastreamento: shipping?.tracking_number ?? null,
    url_rastreamento: shipping?.tracking_url ?? null,
    obs: skus || null,
    obs_interna: null,
    integration_account_id: null,
    created_at: null,
    updated_at: null,
  };
}

async function fetchOrders(access_token: string, seller: string, q: URLSearchParams) {
  const url = new URL("https://api.mercadolibre.com/orders/search");
  url.search = q.toString();
  url.searchParams.set("seller", seller);
  const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${access_token}` } });
  return r;
}

async function fetchOrderDetail(access_token: string, id: string | number) {
  const r = await fetch(`https://api.mercadolibre.com/orders/${id}`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!r.ok) throw new Error(`Falha ao enriquecer pedido ${id}: ${r.status}`);
  return r.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = (await req.json()) as Body;
    if (!body?.integration_account_id) {
      return bad(400, "integration_account_id é obrigatório");
    }

    // Carrega tokens
    const tokenRow = await getTokenRow(body.integration_account_id);
    let access = tokenRow.access_token;

    // Monta query do /orders/search
    const q = new URLSearchParams();
    if (body.status) q.set("order.status", body.status); // 👈 ML exige order.status
    q.set("sort", body.sort ?? "date_desc");
    q.set("limit", String(Math.min(Math.max(body.limit ?? 25, 1), 50)));
    if (body.offset) q.set("offset", String(body.offset));
    if (body.q) q.set("q", body.q);
    if (body.date_from) q.set("date_created.from", body.date_from);
    if (body.date_to) q.set("date_created.to", body.date_to);
    if (body.date_last_updated_from) q.set("last_updated.from", body.date_last_updated_from);
    if (body.date_last_updated_to) q.set("last_updated.to", body.date_last_updated_to);

    // Resolve seller id
    const seller = await resolveSellerId(access, tokenRow.ml_user_id);

    // Primeira tentativa
    let r = await fetchOrders(access, seller, q);

    // Se 401, tenta refresh e repete 1x
    if (r.status === 401) {
      const refreshed = await refreshAccessToken(tokenRow);
      if (!refreshed) return bad(401, "Token expirado e refresh indisponível");
      access = refreshed.access_token;
      r = await fetchOrders(access, seller, q);
    }

    if (!r.ok) {
      const txt = await r.text();
      return bad(r.status, `ML /orders/search falhou: ${txt}`, body.debug ? { q: Object.fromEntries(q.entries()), seller } : undefined);
    }

    const j = await r.json();
    const results = Array.isArray(j?.results) ? j.results : [];
    const paging = j?.paging ?? { total: results.length, limit: Number(q.get("limit")) || 25, offset: Number(q.get("offset")) || 0 };

    // enrich opcional (busca /orders/{id})
    let resultsFinal = results;
    if (body.enrich) {
      // Limite de 25 para evitar rate limit
      const slice = results.slice(0, 25);
      const detailed = await Promise.allSettled(slice.map((o: any) => fetchOrderDetail(access, o.id)));
      const merged = detailed.map((res, idx) => (res.status === "fulfilled" ? res.value : slice[idx]));
      resultsFinal = merged.concat(results.slice(25));
    }

    const unified = resultsFinal.map(mapUnified);

    return ok(
      {
        paging: { total: paging.total, limit: paging.limit, offset: paging.offset },
        results: resultsFinal,
        unified,
      },
      body.debug ? { q: Object.fromEntries(q.entries()), seller } : undefined,
    );
  } catch (e: any) {
    return bad(500, e?.message ?? "Erro inesperado");
  }
});