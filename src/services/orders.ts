// src/services/orders.ts
import { supabase } from '@/integrations/supabase/client';

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
  const { data, error } = await supabase.functions.invoke('unified-orders', { body: params });
  if (error) throw error;
  if (!data?.ok) throw new Error('unified-orders: resposta inesperada');
  return data; // { ok, url, paging, results, raw? }
}

export async function fetchPedidosRealtime(params: UnifiedOrdersParams) {
  const isAudit =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('audit') === '1';

  const { data, error } = await supabase.functions.invoke('unified-orders', {
    body: { ...params, enrich: true, debug: isAudit, audit: isAudit, include_shipping: true }
  });
  
  if (error) throw error;
  if (!data?.ok) throw new Error('unified-orders: resposta inesperada');
  
  const results: RawML[] = data?.results ?? [];
  const unified: Unified[] = data?.unified ?? [];
  
  // Merge por índice: cada linha = { raw, unified }
  const rows: Row[] = results.map((r, i) => ({
    raw: r,
    unified: unified[i] ?? null
  }));

  const total = data?.paging?.total ?? data?.count ?? rows.length;
  return { rows, total, debug: data?.debug };
}

// Backward compatibility (mantido)
export const listOrders = fetchUnifiedOrders;