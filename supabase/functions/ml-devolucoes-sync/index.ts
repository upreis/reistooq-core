import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* ============================== CORS/Helpers ============================== */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-call, x-internal-token",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
};

function ok(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

function fail(msg, status = 400, details) {
  return ok({
    ok: false,
    error: msg,
    details
  }, status);
}

const API_BASE = "https://api.mercadolibre.com";

/* ============================== Datas ISO ============================== */
function dayStartISO(d) {
  return new Date(`${d}T00:00:00.000Z`).toISOString();
}

function dayEndISO(d) {
  return new Date(`${d}T23:59:59.999Z`).toISOString();
}

/* ============================== Token Refresh ============================== */
async function refreshTokenIfNeeded(integration_account_id, supabaseUrl, authHeader, internalToken) {
  try {
    console.log(`🔄 [ML Devoluções] Tentando refresh do token para conta: ${integration_account_id}`);
    const r = await fetch(`${supabaseUrl}/functions/v1/mercadolibre-token-refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader || "",
        "x-internal-call": "true",
        ...internalToken ? {
          "x-internal-token": internalToken
        } : {}
      },
      body: JSON.stringify({
        integration_account_id
      })
    });

    if (!r.ok) {
      const t = await r.text().catch(() => "");
      console.error(`❌ [ML Devoluções] Erro no refresh (${r.status}):`, t.slice(0, 200));
      return null;
    }

    const j = await r.json().catch(() => ({}));
    if (j?.access_token) {
      console.log("✅ [ML Devoluções] Token renovado com sucesso");
      return j.access_token;
    }
    return null;
  } catch (e) {
    console.error("❌ [ML Devoluções] Erro crítico no refresh:", e?.message);
    return null;
  }
}

async function fetchWithRetry(url, options, integration_account_id, supabaseUrl, authHeader, internalToken) {
  let response = await fetch(url, options);

  if (response.status === 401) {
    console.log("🔄 [ML Devoluções] Token expirado (401), tentando refresh...");
    const newToken = await refreshTokenIfNeeded(integration_account_id, supabaseUrl, authHeader, internalToken);
    if (newToken) {
      const newOptions = {
        ...options,
        headers: {
          ...options.headers || {},
          Authorization: `Bearer ${newToken}`
        }
      };
      response = await fetch(url, newOptions);
      console.log(`🔄 [ML Devoluções] Retry após refresh: ${response.status}`);
    }
  }

  return response;
}

async function detectWorkingCombo(base, paths, paramVariants, headers) {
  for (const p of paths) {
    for (const pv of paramVariants) {
      const u = new URL(p, base);
      Object.entries(pv).forEach(([k, v]) => v && u.searchParams.set(k, v));

      const resp = await fetch(u.toString(), {
        headers,
        method: "GET"
      });

      if (resp.ok) {
        console.log("✅ [ML Devoluções] Combo aceito:", p, pv);
        return {
          path: p,
          params: pv
        };
      }
    }
  }
  return null;
}

async function fetchPaginatedWithDetectedCombo(base, detectPaths, detectParamsVariants, headers, integration_account_id, supabaseUrl, authHeader, internalToken, maxPages = 20) {
  const detected = await detectWorkingCombo(base, detectPaths, detectParamsVariants, headers);
  if (!detected) {
    console.error("❌ [ML Devoluções] Nenhum combo (path/params) aceito pela API.");
    return {
      items: [],
      meta: {
        path: null,
        params: null
      }
    };
  }

  const items = [];
  let offset = 0;
  const limit = 50;

  for (let page = 0; page < maxPages; page++) {
    const u = new URL(detected.path, base);
    Object.entries(detected.params).forEach(([k, v]) => v && u.searchParams.set(k, v));
    u.searchParams.set("limit", String(limit));
    u.searchParams.set("offset", String(offset));

    console.log(`📄 [ML Devoluções] ${detected.path} página ${page + 1} offset=${offset}`);

    const resp = await fetchWithRetry(u.toString(), {
      headers,
      method: "GET"
    }, integration_account_id, supabaseUrl, authHeader, internalToken);

    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      console.error(`❌ [ML Devoluções] Erro página ${page + 1} (${resp.status})`, txt.slice(0, 200));
      break;
    }

    const json = await resp.json().catch(() => ({}));
    const results = json?.results ?? json?.data ?? (Array.isArray(json) ? json : []);
    console.log(`📦 [ML Devoluções] Página ${page + 1}: ${Array.isArray(results) ? results.length : 0}`);

    if (!Array.isArray(results) || results.length === 0) break;

    items.push(...results);
    if (results.length < limit) break;
    offset += limit;
  }

  return {
    items,
    meta: detected
  };
}

/* ============================== Endpoints de alto nível ============================== */
async function fetchClaimsRobusto(opts) {
  const { accessToken, sellerId, dateFromISO, dateToISO, status, integration_account_id, supabaseUrl, authHeader, internalToken } = opts;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json"
  };

  const paramVariants = [
    {
      ...sellerId ? { seller_id: sellerId } : {},
      ...status ? { status } : {},
      ...dateFromISO ? { "date_created.from": dateFromISO } : {},
      ...dateToISO ? { "date_created.to": dateToISO } : {}
    },
    {
      ...sellerId ? { seller_id: sellerId } : {},
      ...status ? { status } : {},
      ...dateFromISO ? { date_created_from: dateFromISO } : {},
      ...dateToISO ? { date_created_to: dateToISO } : {}
    }
  ];

  const pathCandidates = [
    "/claims",
    "/claims/search"
  ];

  const r = await fetchPaginatedWithDetectedCombo(API_BASE, pathCandidates, paramVariants, headers, integration_account_id, supabaseUrl, authHeader, internalToken);
  console.log("🔎 [ML Devoluções] claims meta:", r.meta);
  return r.items;
}

async function fetchReturnsRobusto(opts) {
  const { accessToken, sellerId, dateFromISO, dateToISO, status, integration_account_id, supabaseUrl, authHeader, internalToken } = opts;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json"
  };

  const paramVariants = [
    {
      ...sellerId ? { seller_id: sellerId } : {},
      ...status ? { status } : {},
      ...dateFromISO ? { "date_created.from": dateFromISO } : {},
      ...dateToISO ? { "date_created.to": dateToISO } : {}
    },
    {
      ...sellerId ? { seller_id: sellerId } : {},
      ...status ? { status } : {},
      ...dateFromISO ? { date_created_from: dateFromISO } : {},
      ...dateToISO ? { date_created_to: dateToISO } : {}
    }
  ];

  const pathCandidates = [
    "/returns",
    "/returns/search"
  ];

  const r = await fetchPaginatedWithDetectedCombo(API_BASE, pathCandidates, paramVariants, headers, integration_account_id, supabaseUrl, authHeader, internalToken);
  console.log("🔎 [ML Devoluções] returns meta:", r.meta);
  return r.items;
}

/* ============================== Handler principal ============================== */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: corsHeaders
  });

  if (req.method !== "POST") return fail("Method not allowed", 405);

  try {
    const body = await req.json();
    const { integration_account_id, date_from, date_to, dateFrom, dateTo, sellerId, status, mode = "both", include_messages = false } = body || {};

    if (!integration_account_id) return fail("integration_account_id é obrigatório", 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseKey) {
      return fail("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes no ambiente", 500);
    }

    const sb = createClient(supabaseUrl, supabaseKey);
    const authHeader = req.headers.get("Authorization") || "";
    const INTERNAL_TOKEN = Deno.env.get("INTERNAL_SHARED_TOKEN") || "internal-shared-token";

    // 1) Conta
    const { data: account, error: accErr } = await sb.from("integration_accounts").select("*").eq("id", integration_account_id).eq("is_active", true).single();
    if (accErr || !account) return fail("Conta de integração não encontrada", 404, accErr);

    // 2) Token via integrations-get-secret
    let accessToken = "";
    let sellerFromSecret;

    const secRes = await fetch(`${supabaseUrl}/functions/v1/integrations-get-secret`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
        "x-internal-call": "true",
        "x-internal-token": INTERNAL_TOKEN
      },
      body: JSON.stringify({
        integration_account_id,
        provider: "mercadolivre"
      })
    });

    if (!secRes.ok) {
      const t = await secRes.text().catch(() => "");
      return fail("Erro ao buscar token de acesso", 500, t.slice(0, 250));
    }

    const secJson = await secRes.json().catch(() => ({}));
    if (secJson?.secret?.access_token) {
      accessToken = secJson.secret.access_token;
      sellerFromSecret = secJson.secret.user_id;
    } else if (typeof secJson?.value === "string") {
      accessToken = secJson.value;
    } else {
      return fail("Token não encontrado na resposta do integrations-get-secret", 500, secJson);
    }

    const sellerParam = sellerId ?? sellerFromSecret ?? account?.account_identifier ?? account?.external_user_id;

    // 3) Datas em ISO completo
    const dateFromStr = (dateFrom ?? date_from) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const dateToStr = (dateTo ?? date_to) || new Date().toISOString().slice(0, 10);
    const dateFromISO = dayStartISO(dateFromStr);
    const dateToISO = dayEndISO(dateToStr);

    console.log(`📅 [ML Devoluções] Buscando de ${dateFromISO} até ${dateToISO} – mode=${mode} seller=${sellerParam}`);

    const all = [];

    /* ============================== Claims ============================== */
    if (mode === "both" || mode === "claims") {
      const claims = await fetchClaimsRobusto({
        accessToken,
        sellerId: sellerParam,
        dateFromISO,
        dateToISO,
        status,
        integration_account_id,
        supabaseUrl,
        authHeader,
        internalToken: INTERNAL_TOKEN
      });

      for (const c of claims) {
        all.push({
          kind: "claim",
          data: c
        });
      }
    }

    /* ============================== Returns ============================== */
    if (mode === "both" || mode === "returns") {
      const returnsItems = await fetchReturnsRobusto({
        accessToken,
        sellerId: sellerParam,
        dateFromISO,
        dateToISO,
        status,
        integration_account_id,
        supabaseUrl,
        authHeader,
        internalToken: INTERNAL_TOKEN
      });

      console.log(`📦 [ML Devoluções] Returns encontrados: ${returnsItems.length}`);

      for (const r of returnsItems) {
        all.push({
          kind: "return",
          data: r
        });
      }
    }

    /* ============================== Persistência ============================== */
    let persisted = 0;
    let errors = 0;

    for (const it of all) {
      try {
        if (it.kind === "claim") {
          const c = it.data ?? {};
          const buyer = c.buyer ?? {
            id: "",
            nickname: "",
            email: ""
          };
          const item = c.items?.[0] ?? c.item ?? {
            id: "",
            title: "",
            sku: ""
          };

          const record = {
            integration_account_id,
            order_id: c.order_id,
            claim_id: c.id,
            return_id: null,
            order_number: `ML-${c.order_id}`,
            claim_data: c,
            type: c.type ?? "claim",
            status: c.status,
            stage: c.stage,
            priority: "normal",
            processed_status: "pending",
            date_created: c.date_created ? new Date(c.date_created) : new Date(),
            date_last_update: new Date(c.date_last_update ?? c.date_created ?? Date.now()),
            amount_claimed: c.amount_claimed ?? 0,
            amount_refunded: c.amount_refunded ?? 0,
            currency: c.currency ?? "BRL",
            buyer_id: buyer.id,
            buyer_nickname: buyer.nickname,
            buyer_email: buyer.email,
            item_id: item.id,
            item_title: item.title,
            item_sku: item.sku,
            quantity: c.quantity ?? 1,
            unit_price: c.unit_price ?? 0,
            reason_code: c.reason_code,
            reason_description: c.reason_description,
            last_message: c.last_message,
            seller_response: c.seller_response,
            resolution: c.resolution,
            updated_at: new Date().toISOString()
          };

          const { error } = await sb.from("ml_devolucoes_reclamacoes").upsert(record, {
            onConflict: "integration_account_id, claim_id"
          });

          if (error) {
            console.error("Persist claim error:", error.message);
            errors++;
          } else persisted++;
        } else {
          const r = it.data ?? {};
          const o = r?._order ?? {};
          const firstItem = o?.order_items?.[0];

          const base = {
            integration_account_id,
            order_id: o?.id ?? r?.order_id,
            claim_id: null,
            return_id: r?.id ?? null,
            order_number: `ML-${o?.id ?? r?.order_id ?? ""}`,
            claim_data: r,
            type: "return",
            status: r?.status ?? "pending",
            priority: "normal",
            processed_status: "pending",
            date_created: new Date(r?.date_created ?? o?.date_created ?? new Date().toISOString()),
            date_last_update: new Date(),
            amount_claimed: 0,
            amount_refunded: 0,
            currency: o?.currency_id ?? "BRL",
            buyer_id: o?.buyer?.id ?? "",
            buyer_nickname: o?.buyer?.nickname ?? "",
            buyer_email: "",
            item_id: firstItem?.item?.id,
            item_title: firstItem?.item?.title,
            item_sku: firstItem?.item?.seller_sku,
            quantity: firstItem?.quantity ?? 1,
            unit_price: firstItem?.unit_price ?? 0,
            updated_at: new Date().toISOString()
          };

          const { error } = await sb.from("ml_devolucoes_reclamacoes").upsert(base, {
            onConflict: "integration_account_id, order_id"
          });

          if (error) {
            console.error("Persist return error:", error.message);
            errors++;
          } else persisted++;
        }
      } catch (e) {
        console.error("Persist fatal error:", e);
        errors++;
      }
    }

    return ok({
      ok: true,
      total_found: all.length,
      persisted,
      errors,
      mode,
      range: {
        from: dateFromISO,
        to: dateToISO
      }
    });
  } catch (e) {
    return fail("Erro interno do servidor", 500, String(e?.message ?? e));
  }
});