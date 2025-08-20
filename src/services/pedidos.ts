// src/services/pedidos.ts
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
  valorMax,
}: ListPedidosParams): Promise<PedidosResponse> {
  let query = supabase
    .from('pedidos')
    .select(
      `
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
    `,
      { count: 'exact' }
    )
    .eq('integration_account_id', integrationAccountId)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(
      `numero.ilike.%${search}%,nome_cliente.ilike.%${search}%,cpf_cnpj.ilike.%${search}%`
    );
  }
  if (situacao) query = query.eq('situacao', situacao);
  if (dataInicio) query = query.gte('data_pedido', dataInicio);
  if (dataFim) query = query.lte('data_pedido', dataFim);
  if (cidade) query = query.ilike('cidade', `%${cidade}%`);
  if (uf) query = query.eq('uf', uf);
  if (valorMin !== undefined) query = query.gte('valor_total', valorMin);
  if (valorMax !== undefined) query = query.lte('valor_total', valorMax);

  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;
  query = query.range(start, end);

  const result = await query;

  const processedData =
    result.data?.map((pedido: any) => {
      const itens = pedido.itens_pedidos || [];
      const totalItens = itens.reduce(
        (sum: number, item: any) => sum + (item.quantidade || 0),
        0
      );
      const skuPrincipal =
        itens[0]?.sku || pedido.obs?.split(',')[0]?.trim() || '';

      return {
        ...pedido,
        id_unico: skuPrincipal ? `${skuPrincipal}-${pedido.numero}` : pedido.numero,
        itens,
        total_itens: totalItens > 0 ? totalItens : 1,
        sku_estoque: null,
        sku_kit: null,
        qtd_kit: null,
        status_estoque: 'pronto_baixar' as const,
      };
    }) || [];

  return {
    data: processedData as Pedido[] | null,
    count: result.count,
    error: result.error,
  };
}

// Helpers
function parseUF(state: any): string | null {
  const id = state?.id as string | undefined;
  const name = state?.name as string | undefined;
  if (id && id.includes('-')) {
    const p = id.split('-').pop();
    if (p && p.length === 2) return p;
  }
  return name || null;
}

// Mapeia dados do ML (raw/unified) para interface da tabela – usado no fallback
function mapMlToUi(mlOrders: any[]): Pedido[] {
  return mlOrders.map((order: any) => {
    // preferir shipping_details (enrichment) e cair para shipping básico
    const ship = order.shipping_details ?? order.shipping ?? {};
    const addr = ship.receiver_address ?? {};
    const state = addr.state ?? {};

    const itens =
      order.order_items?.map((item: any) => ({
        sku: item.item?.id?.toString() || '',
        descricao: item.item?.title || '',
        quantidade: item.quantity || 1,
        valor_unitario: item.unit_price || 0,
        valor_total: (item.unit_price || 0) * (item.quantity || 1),
      })) || [];

    const totalItens = itens.reduce((sum: number, it: any) => sum + it.quantidade, 0);
    const skuPrincipal = itens[0]?.sku || order.id?.toString() || '';

    return {
      id: order.id?.toString() || '',
      numero: order.id?.toString() || '',
      id_unico: `${skuPrincipal}-${order.id}`,
      nome_cliente:
        order.buyer?.first_name && order.buyer?.last_name
          ? `${order.buyer.first_name} ${order.buyer.last_name}`
          : order.buyer?.nickname || 'N/A',
      cpf_cnpj: order.buyer?.identification?.number || null,
      data_pedido:
        order.date_created?.split('T')[0] ||
        new Date().toISOString().split('T')[0],
      situacao: mapMlStatus(order.status),
      valor_total: order.total_amount || 0,
      valor_frete: order.payments?.[0]?.shipping_cost ?? ship.cost ?? 0,
      valor_desconto: order.coupon?.amount || 0,
      numero_ecommerce: order.pack_id?.toString() || null,
      numero_venda: order.id?.toString() || null,
      empresa: 'Mercado Livre',
      cidade: addr.city?.name || null,
      uf: parseUF(state),
      obs:
        order.order_items
          ?.map((item: any) => item?.item?.title)
          .filter(Boolean)
          .join(', ') || null,
      integration_account_id: order.seller?.id?.toString() || null,
      created_at: order.date_created || new Date().toISOString(),
      updated_at: order.last_updated || new Date().toISOString(),

      // campos auxiliares
      itens,
      total_itens: totalItens > 0 ? totalItens : 1,
      sku_estoque: null,
      sku_kit: null,
      qtd_kit: null,
      status_estoque: 'pronto_baixar' as const,
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
  forceFonte?: FontePedidos;
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
  forceFonte,
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
      if (forceFonte === 'tempo-real') {
        await fetchFromUnifiedOrders();
        return;
      }

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
        valorMax,
      });

      if (bancoResult.error) {
        await fetchFromUnifiedOrders();
        return;
      }

      if (bancoResult.data && bancoResult.data.length > 0) {
        setRows(bancoResult.data);
        setTotal(bancoResult.count || 0);
        setFonte('banco');
      } else {
        await fetchFromUnifiedOrders();
      }
    } catch {
      await fetchFromUnifiedOrders();
    } finally {
      setLoading(false);
    }
  }, [
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
    valorMax,
    forceFonte,
  ]);

  const fetchFromUnifiedOrders = async () => {
    try {
      const { results } = await fetchUnifiedOrders({
        integration_account_id: integrationAccountId,
        status: 'paid',
        limit: pageSize,
        offset: (page - 1) * pageSize,
        include_shipping: true, // 👈 pede UF/Cidade/CEP/Tracking
      });

      const mappedOrders = mapMlToUi(Array.isArray(results) ? results : []);
      setRows(mappedOrders);
      setTotal(mappedOrders.length);
      setFonte('tempo-real');
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar pedidos em tempo real');
      setRows([]);
      setTotal(0);
      setFonte('banco');
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { rows, total, fonte, loading, error, refetch: fetchData };
}
