// src/services/orders.ts
import { supabase } from '@/integrations/supabase/client';

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
  debug?: boolean;
  enrich?: boolean;
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

// Safe object path accessor using nullish coalescing
export const get = (obj: any, path: string) =>
  path.split('.').reduce((acc, k) => (acc?.[k] ?? undefined), obj);

// Safe display helper using nullish coalescing (never ||)
export const show = (v: any) => (v ?? '—');

export async function fetchUnifiedOrders(params: UnifiedOrdersParams) {
  const { data, error } = await supabase.functions.invoke('unified-orders', { body: params });
  if (error) throw error;
  if (!data?.ok) throw new Error('unified-orders: resposta inesperada');
  return data; // { ok, url, paging, results, raw? }
}

export async function fetchPedidosRealtime(params: UnifiedOrdersParams) {
  const { data, error } = await supabase.functions.invoke('unified-orders', {
    body: { ...params, enrich: true, debug: false }
  });
  
  if (error) throw error;
  if (!data?.ok) throw new Error('unified-orders: resposta inesperada');
  
  const results: RawML[] = data?.results ?? [];
  const unified: Unified[] = data?.unified ?? [];
  
  // Merge by index: each row has { raw, unified }
  const rows: Row[] = results.map((r, i) => ({ 
    raw: r, 
    unified: unified[i] ?? null 
  }));

  const total = data?.paging?.total ?? data?.count ?? rows.length;
  
  return { rows, total };
}

// Backward compatibility
export const listOrders = fetchUnifiedOrders;