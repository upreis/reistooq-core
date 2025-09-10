// src/services/HistoricoService.ts
import { supabase } from '@/integrations/supabase/client';

export async function listarHistoricoVendas({ page = 1, pageSize = 20 } = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  console.log('[historico-query-start]', { page, pageSize, from, to });

  const { data, error } = await supabase
    .rpc('get_historico_vendas_browse', {
      _limit: pageSize,
      _offset: from,
      _search: null,
      _start: null,
      _end: null
    });

  if (error) {
    console.error('[historico-error]', error);
    throw error;
  }

  const rows = data ?? [];
  const hasMore = rows.length === pageSize;
  const estimatedTotal = hasMore ? from + rows.length + 1 : from + rows.length;

  console.log('[historico-leitura]', { 
    source: 'rpc:get_historico_vendas_masked',
    page,
    pageSize,
    returned: rows.length,
    estimatedTotal,
    sample: rows.slice(0, 2)
  });

  return { data: rows, total: estimatedTotal };
}