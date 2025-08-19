import { supabase } from '@/integrations/supabase/client';
import { Pedido, PedidosResponse } from '@/types/pedido';

export interface ListPedidosParams {
  integrationAccountId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  situacao?: string;
}

export async function listPedidos({
  integrationAccountId,
  page = 1,
  pageSize = 25,
  search,
  situacao
}: ListPedidosParams): Promise<PedidosResponse> {
  let query = supabase
    .from('pedidos')
    .select(`
      id,
      numero,
      nome_cliente,
      cpf_cnpj,
      data_pedido,
      data_prevista,
      situacao,
      valor_total,
      valor_frete,
      valor_desconto,
      numero_ecommerce,
      numero_venda,
      empresa,
      cidade,
      uf,
      codigo_rastreamento,
      url_rastreamento,
      obs,
      obs_interna,
      integration_account_id,
      created_at,
      updated_at
    `, { count: 'exact' })
    .eq('integration_account_id', integrationAccountId)
    .order('created_at', { ascending: false });

  // Apply filters
  if (search) {
    query = query.or(
      `numero.ilike.%${search}%,nome_cliente.ilike.%${search}%,cpf_cnpj.ilike.%${search}%`
    );
  }

  if (situacao) {
    query = query.eq('situacao', situacao);
  }

  // Apply pagination
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;
  query = query.range(start, end);

  const result = await query;
  
  return {
    data: result.data as Pedido[] | null,
    count: result.count,
    error: result.error
  };
}