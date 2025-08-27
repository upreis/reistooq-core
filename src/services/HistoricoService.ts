// src/services/HistoricoService.ts
import { supabase } from '@/integrations/supabase/client';

export async function listarHistoricoVendas({ page = 1, pageSize = 20 } = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('historico_vendas')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  console.log('[historico-leitura]', { 
    query: 'select * from historico_vendas order by created_at desc', 
    count, 
    primeirasLinhas: data?.slice(0, 2) 
  });

  return { data: data ?? [], total: count ?? 0 };
}