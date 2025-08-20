// supabase/functions/unified-orders/index.ts
// Deno (std@0.224) + Supabase Edge
// Busca /orders/search (seguro), refresh resiliente, resolve seller_id
// Opcional: include_shipping -> enriquece com /shipments/{id} para UF/Cidade/CEP
// Retorna: { ok, url, paging, results, unified, ...(debug quando solicitado) }

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "3600",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function makeServiceClient(authHeader: string | null) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, {
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
    auth: { persistSession: false },
  });
}

const ENC_KEY = Deno.env.get("APP_ENCRYPTION_KEY");

// util
function pick(obj: Record<string, any>, keys: string[]) {
  const out: Record<string, any> = {};
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}

type Payload = {
  integration_account_id: string;
  seller_id?: string | number;

  // filtros criação
  date_from?: string;
  date_to?: string;

  // filtros última atualização
  date_last_updated_from?: string;
  date_last_updated_to?: string;

  // outros filtros
  status?: string;
  tags?: string; // CSV
  q?: string;
  sort?: string;
  limit?: number;
  offset?: number;

  // headers/opções
  x_format_new?: string; // "true" | "false"
  debug?: string | boolean;

  // novo: enrichment de envio
  include_shipping?: boolean; // se true, busca /shipments/{id} e preenche UF/Cidade/CEP
};

// mapa nome->UF (fallback quando id não vier como BR-SP)
const BR_UF_BY_NAME: Record<string, string> = {
  "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM", "Bahia": "BA",
  "Ceará": "CE", "Distrito Federal": "DF", "Espírito Santo": "ES", "Goiás": "GO",
  "Maranhão": "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS", "Minas Gerais": "MG",
  "Pará": "PA", "Paraíba": "PB", "Paraná": "PR", "Pernambuco": "PE", "Piauí": "PI",
  "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN", "Rio Grande do Sul": "RS",
  "Rondônia": "RO", "Roraima": "RR", "Santa Catarina": "SC", "São Paulo": "SP",
  "Sergipe": "SE", "Tocantins": "TO",
};

function deriveUF(state: any): string | null {
  const id: string | undefined = state?.id;
  const name: string | undefined = state?.name;
  if (id && id.includes("-")) {
    // ex.: BR-SP -> SP
    const parts = id.split("-");
    const maybeUF = parts[parts.length - 1];
    if (maybeUF?.length === 2) return maybeUF;
  }
  if (name && BR_UF_BY_NAME[name]) return BR_UF_BY_NAME[name];
  return null;
}

function extractAddress(shippingDetails: any) {
  const addr = shippingDetails?.receiver_address ?? {};
  const state = addr?.state ?? {};
  return {
    uf: deriveUF(state),
    cidade: addr?.city?.name ?? null,
    cep: addr?.zip_code ?? null,
  };
}

function mapUnified(order: any, shippingDetails?: any) {
  // order (RAW do /orders/search) + opcional detalhes do envio (/shipments/{id})
  const buyer = order?.buyer ?? {};
  const payments = Array.isArray(order?.payments) ? order.payments : [];
  const firstPay = payments[0] ?? {};
  const items = Array.isArray(order?.order_items) ? order.order_items : [];
  const skus = items
    .map((it: any) => it?.item?.seller_sku ?? it?.item?.seller_custom_field)
    .filter(Boolean)
    .join(", ");

  const addr = shippingDetails ? extractAddress(shippingDetails) : { uf: null, cidade: null, cep: null };

  return {
    id: String(order.id),
    numero: String(order.id),
    nome_cliente: buyer.nickname ?? null,
    cpf_cnpj: null,
    data_pedido: order.date_created ?? null,
    data_prevista: order.date_closed ?? null,
    situacao: order.status ?? null,
    valor_total: order.total_amount ?? null,
    valor_frete: firstPay?.shipping_cost ?? null,
    valor_desconto: null,
    numero_ecommerce: String(order.id),
    numero_venda: String(order.id),
    empresa: "mercadolivre",
    cidade: addr.cidade,
    uf: addr.uf,         // 👈 agora vem do envio
    codigo_rastreamento: shippingDetails?.tracking_number ?? order?.shipping?.tracking_number ?? null,
    url_rastreamento: shippingDetails?.tracking_url ?? order?.shipping?.tracking_url ?? null,
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
    const supabase = makeServiceClient(req.headers.get("Authorization"));

    // -------- input (GET ou POST) --------
    const url = new URL(req.url);
    let payload: any = {};
    if (req.method === "GET") {
      for (const [k, v] of url.searchParams.entries()) payload[k] = v;
    } else if (req.method === "POST") {
      const ct = req.headers.get("content-type") || "";
      if (!ct.includes("application/json")) return json({ error: "Content-Type must be application/json" }, 400);
      try { payload = await req.json(); } catch { payload = {}; }
    } else {
      return json({ error: "Method Not Allowed" }, 405);
    }

    const {
      integration_account_id,
      seller_id,

      date_from, date_to,
      date_last_updated_from, date_last_updated_to,

      status, tags, q, sort,
      limit = 50, offset = 0,

      x_format_new = "true",
      debug,

      include_shipping = false,
    } = payload as Payload;

    if (!integration_account_id) return json({ error: "integration_account_id is required" }, 400);

    // -------- tokens --------
    const { data: secret, error: decErr } = await supabase.rpc("decrypt_integration_secret", {
      p_account_id: integration_account_id,
      p_provider: "mercadolivre",
      p_encryption_key: ENC_KEY,
    });
    if (decErr || !secret) {
      console.error("[unified-orders] decrypt error:", decErr);
      return json({ error: "Cannot decrypt tokens" }, 500);
    }

    let access_token: string = secret.access_token;
    const client_id: string = secret.client_id;
    const client_secret: string = secret.client_secret;
    const refresh_token: string | undefined = secret.refresh_token;
    const secretPayload: any = secret.payload;

    // -------- refresh resiliente --------
    try {
      const expiresAt = new Date(secret.expires_at);
      const msLeft = expiresAt.getTime() - Date.now();
      if (Number.isFinite(msLeft) && msLeft < 5 * 60 * 1000 && refresh_token) {
        console.log("[unified-orders] Refreshing token…");
        const params = new URLSearchParams({
          grant_type: "refresh_token",
          client_id,
          client_secret,
          refresh_token,
        });
        const r = await fetch("https://api.mercadolibre.com/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
          body: params,
        });
        if (r.ok) {
          const t = await r.json();
          access_token = t.access_token;
          const newExpISO = new Date(Date.now() + (t.expires_in ?? 21600) * 1000).toISOString();
          await supabase.rpc("encrypt_integration_secret", {
            p_account_id: integration_account_id,
            p_provider: "mercadolivre",
            p_client_id: client_id,
            p_client_secret: client_secret,
            p_access_token: access_token,
            p_refresh_token: t.refresh_token ?? refresh_token,
            p_expires_at: newExpISO,
            p_payload: secretPayload ?? {},
            p_encryption_key: ENC_KEY,
          });
          console.log("[unified-orders] Token refreshed.");
        } else {
          console.warn("[unified-orders] Refresh failed:", await r.text());
        }
      }
    } catch (e) {
      console.warn("[unified-orders] Refresh error:", e);
    }

    // -------- seller_id --------
    let seller = seller_id ?? (secretPayload?.user_id ?? undefined);
    if (!seller) {
      const me = await fetch("https://api.mercadolibre.com/users/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (!me.ok) return json({ error: "Failed to resolve seller_id from token", status: me.status }, 502);
      const u = await me.json();
      seller = u.id;
    }

    // -------- montar query /orders/search --------
    const qs = new URLSearchParams();
    if (seller) qs.set("seller", String(seller));
    if (date_from) qs.set("order.date_created.from", date_from);
    if (date_to) qs.set("order.date_created.to", date_to);
    if (date_last_updated_from) qs.set("order.date_last_updated.from", date_last_updated_from);
    if (date_last_updated_to) qs.set("order.date_last_updated.to", date_last_updated_to);
    if (status) qs.set("order.status", status);
    if (tags) qs.set("tags", tags);
    if (q) qs.set("q", q);
    if (sort) qs.set("sort", sort);
    qs.set("limit", String(Math.min(Number(limit) || 50, 200)));
    qs.set("offset", String(Number(offset) || 0));

    const mlURL = `https://api.mercadolibre.com/orders/search?${qs.toString()}`;
    const mlResp = await fetch(mlURL, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: "application/json",
        ...(x_format_new === "true" ? { "x-format-new": "true" } : {}),
      },
    });

    const rawText = await mlResp.text();
    let mlJson: any;
    try { mlJson = JSON.parse(rawText); } catch { mlJson = { raw: rawText }; }

    if (!mlResp.ok) {
      console.error("[unified-orders] MeLi error", mlResp.status, mlJson);
      return json({ error: "ml_api_error", status: mlResp.status, data: mlJson }, 502);
    }

    const paging = mlJson?.paging;
    const resultsOrig: any[] = Array.isArray(mlJson?.results) ? mlJson.results : ([] as any[]);

    // -------- enrichment opcional: /shipments/{id} --------
    let results: any[] = resultsOrig;
    let shippingMap: Record<string, any> = {};
    const debugWanted = String(debug).toLowerCase() === "true";

    const debugInfo: any = debugWanted
      ? { seller, query_used: pick(payload, [
          "integration_account_id","seller_id",
          "date_from","date_to","date_last_updated_from","date_last_updated_to",
          "status","tags","q","sort","limit","offset","include_shipping"
        ]),
        shipments: { requested: 0, fetched: 0, missingId: 0, failures: {} as Record<string, number> }
      }
      : null;

    if (include_shipping && resultsOrig.length > 0) {
      const ids = resultsOrig
        .map((o) => o?.shipping?.id)
        .filter((v) => v != null);
      if (debugWanted) debugInfo.shipments.requested = ids.length;
      const MAX_ENRICH = 50; // protecao de taxa
      const slice = ids.slice(0, MAX_ENRICH);

      const fetchOne = (id: string | number) =>
        fetch(`https://api.mercadolibre.com/shipments/${id}`, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            Accept: "application/json",
            ...(x_format_new === "true" ? { "x-format-new": "true" } : {}),
          },
        });

      const settled = await Promise.allSettled(slice.map((id) => fetchOne(id)));
      for (let i = 0; i < settled.length; i++) {
        const id = slice[i];
        const res = settled[i];
        if (res.status === "fulfilled") {
          const r = res.value;
          if (r.ok) {
            const j = await r.json();
            shippingMap[String(id)] = j;
            if (debugWanted) debugInfo.shipments.fetched++;
          } else {
            if (debugWanted) {
              const key = String(r.status);
              debugInfo.shipments.failures[key] = (debugInfo.shipments.failures[key] ?? 0) + 1;
            }
          }
        } else {
          if (debugWanted) {
            debugInfo.shipments.failures["promise_rejected"] = (debugInfo.shipments.failures["promise_rejected"] ?? 0) + 1;
          }
        }
      }

      results = resultsOrig.map((o) => {
        const sid = o?.shipping?.id;
        if (!sid) {
          if (debugWanted) debugInfo.shipments.missingId++;
          return o;
        }
        const detail = shippingMap[String(sid)];
        return detail ? { ...o, shipping_details: detail } : o;
      });
    }

    // -------- unified --------
    const unified = results.map((o) => {
      const ship = o.shipping_details ?? null;
      return mapUnified(o, ship);
    });

    // -------- resposta --------
    if (debugWanted) {
      // dica do porquê pode "não aparecer nada"
      const reason =
        (paging?.total ?? 0) === 0
          ? "no_results"
          : include_shipping
          ? undefined
          : undefined;

      return json({
        ok: true,
        url: mlURL,
        paging,
        results,
        unified,
        debug: {
          ...debugInfo,
          hint: reason,
        },
      });
    }

    return json({ ok: true, url: mlURL, paging, results, unified });
  } catch (e: any) {
    console.error("[unified-orders] Fatal:", e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});