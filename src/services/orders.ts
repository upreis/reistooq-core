// src/services/orders.ts
import { supabase } from '@/integrations/supabase/client';
import { shopeeService } from './ShopeeService';

// 🔒 GUARDRAILS:
// - Não tocar em supabase/functions/**
// - Consumir SOMENTE a edge 'unified-orders' (usa /orders/search)
// - Manter contrato { rows, total } e estrutura Row = { raw, unified }
// - Sempre enrich: true e debug: false no fetch principal

export type UnifiedOrdersParams = {
  integration_account_id: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  date_last_updated_from?: string;
  date_last_updated_to?: string;
  tags?: string;
  q?: string;
  sort?: string;
  limit?: number;
  offset?: number;
  debug?: string | boolean;
  enrich?: boolean;
  include_shipping?: boolean;
};

export type RawML = any;

export type Unified = {
  id: string;
  numero: string;
  nome_cliente: string | null;
  cpf_cnpj: string | null;
  data_pedido: string | null;
  data_prevista: string | null;
  situacao: string | null;
  valor_total: number | null;
  valor_frete: number | null;
  valor_desconto: number | null;
  numero_ecommerce: string | null;
  numero_venda: string | null;
  empresa: string | null;
  cidade: string | null;
  uf: string | null;
  codigo_rastreamento: string | null;
  url_rastreamento: string | null;
  obs: string | null;
  obs_interna: string | null;
  integration_account_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Row = { raw: RawML; unified: Unified | null };

export type FetchPedidosResult = { rows: Row[]; total: number; debug?: any };

// Helpers seguros (⚠️ nunca use || para placeholder)
export const get = (obj: any, path: string) =>
  path.split('.').reduce((acc, k) => (acc?.[k] ?? undefined), obj);
export const show = (v: any) => (v ?? '—');

export async function fetchUnifiedOrders(params: UnifiedOrdersParams) {
  if (!params.integration_account_id?.trim()) {
    throw new Error('integration_account_id é obrigatório para buscar pedidos');
  }

  console.info('[Orders] Buscando pedidos unified-orders:', { 
    account_id: params.integration_account_id,
    status: params.status 
  });

  const invoke = async () => {
    return await supabase.functions.invoke('unified-orders', { 
      body: { ...params, enrich: true, include_shipping: true, debug: false } 
    });
  };

  // 1ª tentativa
  let { data, error } = await invoke();

  // Se token expirado (401), tenta refresh automático e repete 1 vez
  if (error && (error.status === 401 || /401/.test(String(error.message || '')))) {
    try {
      console.warn('[Orders] 401 na unified-orders, tentando refresh de token e repetindo...');
      const { error: refreshErr } = await supabase.functions.invoke('mercadolibre-token-refresh', {
        body: { integration_account_id: params.integration_account_id }
      });
      if (!refreshErr) {
        ({ data, error } = await invoke());
      }
    } catch (_) { /* noop */ }
  }

  if (error) throw new Error(error.message || 'unified-orders: erro na função');
  if (!data?.ok) throw new Error('unified-orders: resposta inesperada');
  return data; // { ok, url, paging, results, raw? }
}

export async function fetchPedidosRealtime(params: UnifiedOrdersParams) {
  const isAudit =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('audit') === '1';

  const invoke = async () =>
    supabase.functions.invoke('unified-orders', {
      body: { ...params, enrich: true, debug: isAudit, audit: isAudit, include_shipping: true }
    });

  // 1ª tentativa
  let { data, error } = await invoke();

  // Refresh e retry se 401
  if (error && (error.status === 401 || /401/.test(String(error.message || '')))) {
    try {
      console.warn('[Orders] 401 na unified-orders (realtime), tentando refresh e repetindo...');
      const { error: refreshErr } = await supabase.functions.invoke('mercadolibre-token-refresh', {
        body: { integration_account_id: params.integration_account_id }
      });
      if (!refreshErr) {
        ({ data, error } = await invoke());
      }
    } catch (_) { /* noop */ }
  }
  
  if (error) throw error;
  if (!data?.ok) throw new Error('unified-orders: resposta inesperada');
  
  // Suportar tanto o formato antigo (results/unified) quanto o novo (pedidos)
  const resultsRaw: RawML[] = Array.isArray(data?.results) ? data.results : [];
  const unifiedRaw: Unified[] = Array.isArray(data?.unified) ? data.unified : [];
  const pedidos: Unified[] = Array.isArray(data?.pedidos) ? data.pedidos : [];

  const results: RawML[] = resultsRaw.length ? resultsRaw : pedidos;
  const unified: Unified[] = unifiedRaw.length ? unifiedRaw : pedidos;

  const rows: Row[] = results.map((r, i) => ({
    raw: resultsRaw.length ? r : null,
    unified: unified[i] ?? null
  }));

  const total = data?.paging?.total ?? data?.paging?.count ?? data?.total ?? (Array.isArray(results) ? results.length : rows.length);
  return { rows, total, debug: data?.debug };
}

// 🛍️ Função específica para buscar pedidos do Shopee
export async function fetchShopeeOrders(params: UnifiedOrdersParams): Promise<FetchPedidosResult> {
  try {
    console.log('🛍️ [Orders] Buscando pedidos Shopee:', params);
    
    const response = await shopeeService.fetchOrders({
      integration_account_id: params.integration_account_id,
      page: Math.ceil((params.offset || 0) / (params.limit || 50)) + 1,
      pageSize: params.limit || 50,
      status: params.status,
      search: params.q,
      date_from: params.date_from,
      date_to: params.date_to
    });

    if (!response.success) {
      throw new Error(response.error || 'Erro ao buscar pedidos Shopee');
    }

    // Converter formato Shopee para unified
    const rows: Row[] = (response.data?.orders || []).map((order: any) => ({
      raw: order,
      unified: {
        id: order.order_sn || order.id,
        numero: order.order_sn || order.id,
        nome_cliente: order.recipient_address?.name || null,
        cpf_cnpj: null,
        data_pedido: order.create_time ? new Date(order.create_time * 1000).toISOString() : null,
        data_prevista: order.ship_by_date ? new Date(order.ship_by_date * 1000).toISOString() : null,
        situacao: order.order_status || null,
        valor_total: order.total_amount || 0,
        valor_frete: order.shipping_fee || 0,
        valor_desconto: order.voucher_details_list?.reduce((sum: number, v: any) => sum + (v.discount_amount || 0), 0) || 0,
        numero_ecommerce: order.order_sn || order.id,
        numero_venda: order.order_sn || order.id,
        empresa: 'Shopee',
        cidade: order.recipient_address?.city || null,
        uf: order.recipient_address?.state || null,
        codigo_rastreamento: order.tracking_number || null,
        url_rastreamento: null,
        obs: order.note || null,
        obs_interna: null,
        integration_account_id: params.integration_account_id,
        created_at: order.create_time ? new Date(order.create_time * 1000).toISOString() : null,
        updated_at: order.update_time ? new Date(order.update_time * 1000).toISOString() : null,
      } as Unified
    }));

    return {
      rows,
      total: response.data?.total || rows.length,
      debug: { provider: 'shopee', orders_count: rows.length }
    };

  } catch (error: any) {
    console.error('🛍️ [Orders] Erro ao buscar pedidos Shopee:', error);
    throw new Error(`Erro Shopee: ${error.message}`);
  }
}

// Backward compatibility (mantido)
export const listOrders = fetchUnifiedOrders;