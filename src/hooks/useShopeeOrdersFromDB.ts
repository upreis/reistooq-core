/**
 * 🛍️ Hook para buscar pedidos Shopee importados do banco de dados
 * Diferente de fetchShopeeOrders que usa Edge Function para API tempo real
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';

export interface ShopeeOrderFromDB {
  id: string;
  order_id: string;
  order_status: string | null;
  data_pedido: string | null;
  comprador_nome: string | null;
  sku: string | null;
  produto_nome: string | null;
  quantidade: number | null;
  preco_total: number | null;
  endereco_rua: string | null;
  endereco_bairro: string | null;
  endereco_cidade: string | null;
  endereco_estado: string | null;
  endereco_cep: string | null;
  codigo_rastreamento: string | null;
  tipo_logistico: string | null;
  taxa_marketplace: number | null;
  receita_flex: number | null;
  custo_envio: number | null;
  custo_fixo: number | null;
  empresa: string | null;
  baixa_estoque_realizada: boolean;
  created_at: string;
  // Campos para compatibilidade com formato unificado
  unified?: any;
  raw?: any;
}

export interface UseShopeeOrdersResult {
  orders: any[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseShopeeOrdersParams {
  enabled?: boolean;
  search?: string;
  dataInicio?: Date;
  dataFim?: Date;
  page?: number;
  pageSize?: number;
}

export function useShopeeOrdersFromDB(params: UseShopeeOrdersParams = {}): UseShopeeOrdersResult {
  const { enabled = true, search, dataInicio, dataFim, page = 1, pageSize = 50 } = params;
  
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { profile } = useCurrentProfile();
  const organizationId = profile?.organizacao_id;

  const fetchOrders = useCallback(async () => {
    if (!enabled || !organizationId) {
      console.log('🛍️ [ShopeeDB] Busca desabilitada ou sem organization_id');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🛍️ [ShopeeDB] Buscando pedidos Shopee do banco...', {
        organizationId,
        search,
        dataInicio,
        dataFim,
        page,
        pageSize
      });
      
      // Query base - buscar TODOS os pedidos sem filtro de data inicialmente para debug
      let query = supabase
        .from('pedidos_shopee')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId)
        .order('data_pedido', { ascending: false });
      
      // Filtro de busca
      if (search) {
        query = query.or(`order_id.ilike.%${search}%,comprador_nome.ilike.%${search}%,sku.ilike.%${search}%,produto_nome.ilike.%${search}%`);
      }
      
      // Filtro de data - usar filtro mais flexível
      if (dataInicio) {
        const dataInicioStr = dataInicio.toISOString().split('T')[0];
        query = query.gte('data_pedido', dataInicioStr);
      }
      if (dataFim) {
        const dataFimStr = dataFim.toISOString().split('T')[0] + 'T23:59:59.999Z';
        query = query.lte('data_pedido', dataFimStr);
      }
      
      // Paginação
      const offset = (page - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1);
      
      const { data, error: queryError, count } = await query;
      
      if (queryError) {
        throw queryError;
      }
      
      console.log('🛍️ [ShopeeDB] Pedidos encontrados:', data?.length, 'Total:', count);
      
      // Converter para formato unificado compatível com PedidosTable
      const unifiedOrders = (data || []).map(order => ({
        // Dados originais
        raw: order,
        // Formato unificado para compatibilidade
        unified: {
          id: order.id,
          order_id: order.order_id,
          numero: order.order_id,
          status: order.order_status || 'Pendente',
          data_pedido: order.data_pedido,
          date_created: order.data_pedido,
          comprador: {
            nome: order.comprador_nome,
            nickname: order.comprador_nome
          },
          buyer: {
            nickname: order.comprador_nome
          },
          items: [{
            sku: order.sku,
            title: order.produto_nome,
            quantity: order.quantidade || 1,
            unit_price: order.preco_total
          }],
          total: order.preco_total,
          total_amount: order.preco_total,
          valor_total: order.preco_total,
          shipping: {
            status: order.order_status?.includes('Concluído') ? 'delivered' : 
                   order.order_status?.includes('Enviado') ? 'shipped' : 'pending',
            tracking_number: order.codigo_rastreamento,
            receiver_address: {
              street_name: order.endereco_rua,
              neighborhood: order.endereco_bairro,
              city: { name: order.endereco_cidade },
              state: { name: order.endereco_estado },
              zip_code: order.endereco_cep
            }
          },
          empresa: order.empresa,
          account_name: order.empresa,
          provider: 'shopee',
          marketplace: 'shopee',
          baixa_estoque_realizada: order.baixa_estoque_realizada,
          // 🔑 Campo obs - usado pela tabela para exibir SKU
          obs: order.sku,
          // 🔑 Campo titulo_anuncio - usado pela tabela para exibir título
          titulo_anuncio: order.produto_nome,
          // 🔑 Campo marketplace_fee - usado pela tabela para taxa
          marketplace_fee: order.taxa_marketplace,
          // Campos extras para mapeamento
          sku: order.sku,
          sku_vendedor: order.sku,
          tipo_logistico: order.tipo_logistico,
          // Taxas e custos
          taxa_marketplace: order.taxa_marketplace,
          receita_flex: order.receita_flex,
          custo_envio: order.custo_envio,
          custo_fixo: order.custo_fixo,
          // Endereço direto para compatibilidade
          endereco_rua: order.endereco_rua,
          endereco_bairro: order.endereco_bairro,
          endereco_cidade: order.endereco_cidade,
          endereco_estado: order.endereco_estado,
          endereco_cep: order.endereco_cep,
          codigo_rastreamento: order.codigo_rastreamento,
          produto_nome: order.produto_nome,
          // Nome do destinatário
          nome_destinatario: order.comprador_nome,
          // 🔄 Campo para indicar atualização recente
          foi_atualizado: order.foi_atualizado || false,
          updated_at: order.updated_at
        }
      }));
      
      setOrders(unifiedOrders);
      setTotal(count || 0);
      
    } catch (err: any) {
      console.error('🛍️ [ShopeeDB] Erro ao buscar pedidos:', err);
      setError(err.message || 'Erro ao buscar pedidos Shopee');
    } finally {
      setLoading(false);
    }
  }, [enabled, organizationId, search, dataInicio, dataFim, page, pageSize]);

  // Buscar automaticamente quando habilitado e com organization_id
  useEffect(() => {
    if (enabled && organizationId) {
      fetchOrders();
    }
  }, [enabled, organizationId, fetchOrders]);

  return {
    orders,
    total,
    loading,
    error,
    refetch: fetchOrders
  };
}
