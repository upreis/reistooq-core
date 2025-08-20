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
};

export async function fetchUnifiedOrders(params: UnifiedOrdersParams) {
  const { data, error } = await supabase.functions.invoke('unified-orders', { body: params });
  if (error) throw error;
  if (!data?.ok) throw new Error('unified-orders: resposta inesperada');
  return data; // { ok, url, paging, results, raw? }
}

// Backward compatibility
export const listOrders = fetchUnifiedOrders;