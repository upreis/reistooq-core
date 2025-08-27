// src/services/HistoricoService.ts
import { supabase } from '@/integrations/supabase/client';

export async function listarHistoricoVendas({ page = 1, pageSize = 20 } = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const q = supabase
    .from('historico_vendas')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  const { data, error, count } = await q;
  if (error) throw error;

  return { data: data ?? [], total: count ?? 0 };
}