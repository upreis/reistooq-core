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
  dataInicio?: string; // YYYY-MM-DD
  dataFim?: string; // YYYY-MM-DD
  cidade?: string;
  uf?: string;
  valorMin?: number;
  valorMax?: number;
}

export async function listPedidos({
  integrationAccountId,
  page = 1,
  pageSize = 25,
  search,
  situacao,
  dataInicio,
  dataFim,
  cidade,
  uf,
  valorMin,
  valorMax
}: ListPedidosParams): Promise<PedidosResponse> {
  let query = supabase
    .from('pedidos')
    .select(`
      id,
      numero,
      nome_cliente,
      cpf_cnpj,
      data_pedido,
      situacao,
      valor_total,
      valor_frete,
      valor_desconto,
      numero_ecommerce,
      numero_venda,
      empresa,
      cidade,
      uf,
      obs,
      integration_account_id,
      created_at,
      updated_at,
      itens_pedidos (
        sku,
        descricao,
        quantidade,
        valor_unitario,
        valor_total
      )
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

  if (dataInicio) {
    query = query.gte('data_pedido', dataInicio);
  }

  if (dataFim) {
    query = query.lte('data_pedido', dataFim);
  }

  if (cidade) {
    query = query.ilike('cidade', `%${cidade}%`);
  }

  if (uf) {
    query = query.eq('uf', uf);
  }

  if (valorMin !== undefined) {
    query = query.gte('valor_total', valorMin);
  }

  if (valorMax !== undefined) {
    query = query.lte('valor_total', valorMax);
  }

  // Apply pagination
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;
  query = query.range(start, end);

  const result = await query;

  // Processar os dados para incluir campos calculados
  const processedData = result.data?.map((pedido: any) => {
    const itens = pedido.itens_pedidos || [];
    const totalItens = itens.reduce((sum: number, item: any) => sum + (item.quantidade || 0), 0);
    const skuPrincipal = itens[0]?.sku || pedido.obs?.split(',')[0]?.trim() || '';
    
    return {
      ...pedido,
      id_unico: skuPrincipal ? `${skuPrincipal}-${pedido.numero}` : pedido.numero,
      itens: itens,
      total_itens: totalItens > 0 ? totalItens : 1,
      sku_estoque: null, // Será preenchido quando verificar mapeamento
      sku_kit: null,
      qtd_kit: null,
      status_estoque: 'pronto_baixar' as const
    };
  }) || [];
  
  return {
    data: processedData as Pedido[] | null,
    count: result.count,
    error: result.error
  };
}

// Mapeia dados do ML para interface da tabela
function mapMlToUi(mlOrders: any[]): Pedido[] {
  return mlOrders.map((order: any) => {
    const itens = order.order_items?.map((item: any) => ({
      sku: item.item?.id?.toString() || '',
      descricao: item.item?.title || '',
      quantidade: item.quantity || 1,
      valor_unitario: item.unit_price || 0,
      valor_total: (item.unit_price || 0) * (item.quantity || 1)
    })) || [];
    
    const totalItens = itens.reduce((sum, item) => sum + item.quantidade, 0);
    const skuPrincipal = itens[0]?.sku || order.id?.toString() || '';
    
    return {
      id: order.id?.toString() || '',
      numero: order.id?.toString() || '',
      id_unico: `${skuPrincipal}-${order.id}`,
      nome_cliente: order.buyer?.first_name && order.buyer?.last_name 
        ? `${order.buyer.first_name} ${order.buyer.last_name}` 
        : order.buyer?.nickname || 'N/A',
      cpf_cnpj: order.buyer?.identification?.number || null,
      data_pedido: order.date_created?.split('T')[0] || new Date().toISOString().split('T')[0],
      situacao: mapMlStatus(order.status),
      valor_total: order.total_amount || 0,
      valor_frete: order.shipping?.cost || 0,
      valor_desconto: order.coupon?.amount || 0,
      numero_ecommerce: order.pack_id?.toString() || null,
      numero_venda: order.id?.toString() || null,
      empresa: 'Mercado Livre',
      cidade: order.shipping?.receiver_address?.city?.name || null,
      uf: order.shipping?.receiver_address?.state?.name || null,
      obs: order.order_items?.map((item: any) => item?.item?.title).filter(Boolean).join(', ') || null,
      integration_account_id: order.seller?.id?.toString() || null,
      created_at: order.date_created || new Date().toISOString(),
      updated_at: order.last_updated || new Date().toISOString(),
      
      // Novos campos
      itens: itens,
      total_itens: totalItens > 0 ? totalItens : 1,
      sku_estoque: null,
      sku_kit: null, 
      qtd_kit: null,
      status_estoque: 'pronto_baixar' as const
    };
  });
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
  dataInicio?: string;
  dataFim?: string;
  cidade?: string;
  uf?: string;
  valorMin?: number;
  valorMax?: number;
  forceFonte?: FontePedidos; // Para forçar uma fonte específica
}

export function usePedidosHybrid({
  integrationAccountId,
  page = 1,
  pageSize = 25,
  search,
  situacao,
  dataInicio,
  dataFim,
  cidade,
  uf,
  valorMin,
  valorMax,
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
        situacao,
        dataInicio,
        dataFim,
        cidade,
        uf,
        valorMin,
        valorMax
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
  }, [integrationAccountId, page, pageSize, search, situacao, dataInicio, dataFim, cidade, uf, valorMin, valorMax, forceFonte]);

  const fetchFromUnifiedOrders = async () => {
    try {
      const { rows } = await fetchUnifiedOrders({
        integration_account_id: integrationAccountId,
        status: 'paid',
        limit: pageSize,
        offset: (page - 1) * pageSize
      });
      
      const mappedOrders = mapMlToUi(rows.map(r => r.raw) || []);
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