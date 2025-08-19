import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Pedido, PedidosResponse } from '@/types/pedido';
import { fetchUnifiedOrders } from '@/services/orders';

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

// Mapeia dados do ML para interface da tabela
function mapMlToUi(mlOrders: any[]): Pedido[] {
  return mlOrders.map((order: any) => ({
    id: order.id?.toString() || '',
    numero: order.id?.toString() || '',
    nome_cliente: order.buyer?.first_name && order.buyer?.last_name 
      ? `${order.buyer.first_name} ${order.buyer.last_name}` 
      : order.buyer?.nickname || 'N/A',
    cpf_cnpj: order.buyer?.identification?.number || null,
    data_pedido: order.date_created?.split('T')[0] || new Date().toISOString().split('T')[0],
    data_prevista: order.shipping?.date_promised?.split('T')[0] || null,
    situacao: mapMlStatus(order.status),
    valor_total: order.total_amount || 0,
    valor_frete: order.shipping?.cost || 0,
    valor_desconto: order.coupon?.amount || 0,
    numero_ecommerce: order.pack_id?.toString() || null,
    numero_venda: order.id?.toString() || null,
    empresa: 'Mercado Livre',
    cidade: order.shipping?.receiver_address?.city?.name || null,
    uf: order.shipping?.receiver_address?.state?.name || null,
    codigo_rastreamento: order.shipping?.id?.toString() || null,
    url_rastreamento: null,
    obs: order.order_items?.map((item: any) => item?.item?.title).filter(Boolean).join(', ') || null,
    obs_interna: `Status pagamento: ${order.payments?.[0]?.status || 'N/A'}`,
    integration_account_id: order.seller?.id?.toString() || null,
    created_at: order.date_created || new Date().toISOString(),
    updated_at: order.last_updated || new Date().toISOString(),
  }));
}

function mapMlStatus(mlStatus: string): string {
  switch (mlStatus?.toLowerCase()) {
    case 'paid':
      return 'Pago';
    case 'confirmed':
      return 'Confirmado';
    case 'cancelled':
      return 'Cancelado';
    case 'shipped':
      return 'Enviado';
    case 'delivered':
      return 'Entregue';
    default:
      return mlStatus || 'Aberto';
  }
}

export type FontePedidos = 'banco' | 'tempo-real';

export interface PedidosHybridResult {
  rows: Pedido[];
  total: number;
  fonte: FontePedidos;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UsePedidosHybridParams {
  integrationAccountId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  situacao?: string;
  forceFonte?: FontePedidos; // Para forçar uma fonte específica
}

export function usePedidosHybrid({
  integrationAccountId,
  page = 1,
  pageSize = 25,
  search,
  situacao,
  forceFonte
}: UsePedidosHybridParams): PedidosHybridResult {
  const [rows, setRows] = useState<Pedido[]>([]);
  const [total, setTotal] = useState(0);
  const [fonte, setFonte] = useState<FontePedidos>('banco');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!integrationAccountId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.info('[PedidosHybrid] Iniciando busca. Fonte preferida:', forceFonte || 'banco');
      
      // Se forçar tempo real, pular o banco
      if (forceFonte === 'tempo-real') {
        console.info('[PedidosHybrid] Forçando fonte tempo-real');
        await fetchFromUnifiedOrders();
        return;
      }
      
      // Tentar banco primeiro (padrão)
      const bancoResult = await listPedidos({
        integrationAccountId,
        page,
        pageSize,
        search,
        situacao
      });
      
      if (bancoResult.error) {
        console.warn('[PedidosHybrid] Erro no banco:', bancoResult.error.message);
        await fetchFromUnifiedOrders();
        return;
      }
      
      if (bancoResult.data && bancoResult.data.length > 0) {
        console.info('[PedidosHybrid] fonte=banco rows=', bancoResult.data.length);
        setRows(bancoResult.data);
        setTotal(bancoResult.count || 0);
        setFonte('banco');
      } else {
        console.info('[PedidosHybrid] Banco vazio, fazendo fallback para tempo-real');
        await fetchFromUnifiedOrders();
      }
      
    } catch (err: any) {
      console.error('[PedidosHybrid] Erro geral:', err.message);
      await fetchFromUnifiedOrders();
    } finally {
      setLoading(false);
    }
  }, [integrationAccountId, page, pageSize, search, situacao, forceFonte]);

  const fetchFromUnifiedOrders = async () => {
    try {
      const { results } = await fetchUnifiedOrders({
        integration_account_id: integrationAccountId,
        status: 'paid',
        limit: pageSize,
        offset: (page - 1) * pageSize
      });
      
      const mappedOrders = mapMlToUi(Array.isArray(results) ? results : []);
      console.info('[PedidosHybrid] fonte=tempo-real rows=', mappedOrders.length);
      
      setRows(mappedOrders);
      setTotal(mappedOrders.length); // ML não retorna count total, só os resultados da página
      setFonte('tempo-real');
    } catch (err: any) {
      console.error('[PedidosHybrid] Erro em unified-orders:', err.message);
      setError(err.message || 'Erro ao buscar pedidos em tempo real');
      setRows([]);
      setTotal(0);
      setFonte('banco'); // Volta para banco como fallback
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    rows,
    total,
    fonte,
    loading,
    error,
    refetch: fetchData
  };
}