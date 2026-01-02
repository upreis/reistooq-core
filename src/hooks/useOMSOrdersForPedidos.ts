/**
 * 🛒 Hook para buscar pedidos OMS (Orçamento) aprovados para a página /pedidos
 * Segue o padrão de useShopeeOrdersFromDB para integração unificada
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';

const isDev = process.env.NODE_ENV === 'development';

export interface OMSOrderForPedidos {
  id: string;
  number: string;
  id_unico: string | null;
  customer_id: string | null;
  status: string | null;
  order_date: string | null;
  grand_total: number | null;
  shipping_total: number | null;
  empresa: string | null;
  tipo_logistico: string | null;
  codigo_rastreamento: string | null;
  endereco_rua: string | null;
  endereco_numero: string | null;
  endereco_bairro: string | null;
  endereco_cidade: string | null;
  endereco_uf: string | null;
  endereco_cep: string | null;
  local_estoque_id: string | null;
  comissao_valor: number | null;
  valor_liquido: number | null;
  notes: string | null;
  // Relacionamentos
  customer?: {
    name: string;
    email: string | null;
    document: string | null;
  };
  items?: Array<{
    sku: string;
    title: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  // Campos para compatibilidade com formato unificado
  unified?: any;
  raw?: any;
}

export interface UseOMSOrdersForPedidosResult {
  orders: any[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseOMSOrdersForPedidosParams {
  enabled?: boolean;
  search?: string;
  dataInicio?: Date;
  dataFim?: Date;
  page?: number;
  pageSize?: number;
}

export function useOMSOrdersForPedidos(params: UseOMSOrdersForPedidosParams = {}): UseOMSOrdersForPedidosResult {
  const { enabled = true, search, dataInicio, dataFim, page = 1, pageSize = 50 } = params;
  
  const [rawOrders, setRawOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { profile } = useCurrentProfile();
  const organizationId = profile?.organizacao_id;

  const fetchOrders = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      if (isDev) console.log('🛒 [OMS] Buscando pedidos aprovados...', { organizationId });
      
      // Buscar pedidos aprovados (RLS cuida da segurança)
      let query = supabase
        .from('oms_orders')
        .select(`
          *,
          oms_customers!customer_id (
            name,
            email,
            doc
          )
        `, { count: 'exact' })
        .in('status', ['approved', 'shipped', 'delivered', 'Aprovado', 'Enviado', 'Entregue']) // Apenas pedidos aprovados+
        .order('order_date', { ascending: false });
      
      // Filtrar por organization_id se disponível (mas não obrigatório por causa de dados legados)
      if (organizationId) {
        // Usar OR para pegar tanto os que têm org_id quanto os que têm null (dados antigos)
        query = query.or(`organization_id.eq.${organizationId},organization_id.is.null`);
      }
      
      // Filtro de busca
      if (search && search.trim()) {
        query = query.or(`number.ilike.%${search}%,id_unico.ilike.%${search}%,empresa.ilike.%${search}%,codigo_rastreamento.ilike.%${search}%`);
      }
      
      // Filtro de data
      if (dataInicio) {
        query = query.gte('order_date', dataInicio.toISOString());
      }
      if (dataFim) {
        const endOfDay = new Date(dataFim);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('order_date', endOfDay.toISOString());
      }
      
      // Paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
      
      const { data: orders, error: ordersError, count } = await query;
      
      if (ordersError) {
        console.error('❌ [OMS] Erro ao buscar pedidos:', ordersError);
        setError(ordersError.message);
        return;
      }
      
      if (!orders || orders.length === 0) {
        if (isDev) console.log('🛒 [OMS] Nenhum pedido encontrado');
        setRawOrders([]);
        setTotal(0);
        return;
      }
      
      // Buscar itens de cada pedido
      const orderIds = orders.map(o => o.id);
      const { data: items } = await supabase
        .from('oms_order_items')
        .select('*')
        .in('order_id', orderIds);
      
      // Agrupar itens por order_id
      const itemsByOrder = (items || []).reduce((acc: Record<string, any[]>, item) => {
        if (!acc[item.order_id]) acc[item.order_id] = [];
        acc[item.order_id].push(item);
        return acc;
      }, {});
      
      // Combinar pedidos com itens
      const ordersWithItems = orders.map(order => ({
        ...order,
        items: itemsByOrder[order.id] || [],
        customer: order.oms_customers
      }));
      
      if (isDev) console.log(`🛒 [OMS] ${ordersWithItems.length} pedidos carregados`);
      
      setRawOrders(ordersWithItems);
      setTotal(count || ordersWithItems.length);
      
    } catch (err: any) {
      console.error('❌ [OMS] Erro inesperado:', err);
      setError(err.message || 'Erro ao buscar pedidos OMS');
    } finally {
      setLoading(false);
    }
  }, [enabled, organizationId, search, dataInicio, dataFim, page, pageSize]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 🔄 Transformar pedidos OMS para formato unificado (compatível com ML/Shopee)
  const orders = useMemo(() => {
    return rawOrders.map(order => {
      // Extrair SKUs dos itens
      const skus = (order.items || []).map((item: any) => item.sku).filter(Boolean);
      const firstItem = order.items?.[0];
      
      // Formato unificado compatível com a tabela de pedidos
      const unified = {
        id: order.id,
        order_id: order.number || order.id,
        id_unico: order.id_unico || `OMS-${order.number}`,
        marketplace: 'oms',
        marketplace_label: 'Orçamento',
        
        // Dados do pedido
        data_pedido: order.order_date,
        created_at: order.created_at,
        status: order.status,
        situacao: order.status,
        
        // Dados financeiros
        valor_total: order.grand_total || 0,
        valor_frete: order.shipping_total || 0,
        valor_desconto: order.discount_amount || 0,
        valor_liquido: order.valor_liquido || 0,
        comissao_valor: order.comissao_valor || 0,
        
        // Dados do cliente
        comprador_nome: order.oms_customers?.name || '-',
        comprador_email: order.oms_customers?.email || '-',
        cpf_cnpj: order.oms_customers?.doc || '-',
        
        // Endereço
        endereco_rua: order.endereco_rua,
        endereco_numero: order.endereco_numero,
        endereco_bairro: order.endereco_bairro,
        cidade: order.endereco_cidade,
        uf: order.endereco_uf,
        cep: order.endereco_cep,
        
        // Logística
        empresa: order.empresa || 'Orçamento',
        tipo_logistico: order.tipo_logistico || '-',
        codigo_rastreamento: order.codigo_rastreamento || '-',
        shipping_mode: order.tipo_logistico,
        
        // Produto (primeiro item ou agregado)
        sku: skus[0] || '-',
        skus: skus,
        produto_titulo: firstItem?.title || '-',
        quantidade: order.items?.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0) || 0,
        
        // Observações
        notes: order.notes,
        obs: order.notes,
        
        // Campos extras para compatibilidade
        foi_atualizado: false,
        pack_id: null,
        tags: ['oms'],
        local_estoque_id: order.local_estoque_id,
      };
      
      return {
        ...order,
        unified,
        raw: order
      };
    });
  }, [rawOrders]);

  return {
    orders,
    total,
    loading,
    error,
    refetch: fetchOrders
  };
}
