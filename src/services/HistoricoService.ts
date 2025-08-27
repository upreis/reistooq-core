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

  console.log('[historico-leitura]', { 
    query: 'select * from historico_vendas order by created_at desc', 
    count, 
    primeirasLinhas: data?.slice(0, 2) 
  }); // Log 4: dados lidos pelo histórico

  return { data: data ?? [], total: count ?? 0 };
}

// Função para buscar uma linha específica por ID (para validação)
export async function buscarHistoricoPorId(id: string) {
  const { data, error } = await supabase
    .from('historico_vendas')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  
  console.log('[historico-por-id]', data); // Log específico da linha buscada
  return data;
}