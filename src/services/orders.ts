// src/services/orders.ts
import { supabase } from '@/integrations/supabase/client';

export type UnifiedOrdersParams = {
  integration_account_id: string;
  status?: string;        // ex: 'paid'
  date_from?: string;     // ISO (ex: 2025-02-01T00:00:00-00:00)
  date_to?: string;       // ISO
  tags?: string;          // ex: 'mshops' ou 'test_order'
  limit?: number;         // default 50
  offset?: number;        // paginação
};

export async function listOrders(params: UnifiedOrdersParams) {
  const { data, error } = await supabase.functions.invoke('unified-orders', {
    body: {
      ...params,
      status: params.status ?? 'paid',
      limit: params.limit ?? 50,
      offset: params.offset ?? 0,
    },
  });
  if (error) throw error;
  return data as {
    ok: boolean;
    url: string;
    paging: { total: number; offset: number; limit: number };
    results: any[];
  };
}