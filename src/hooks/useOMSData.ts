import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// ✅ INTEGRAÇÃO REAL COM SUPABASE - REMOVENDO DADOS MOCK
export function useOMSCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('oms_customers')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const createCustomer = async (data: any) => {
    setLoading(true);
    try {
      const { data: newCustomer, error } = await supabase
        .from('oms_customers')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      setCustomers([...customers, newCustomer]);
      return newCustomer;
    } finally {
      setLoading(false);
    }
  };

  const updateCustomer = async (id: string, data: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('oms_customers')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
      await fetchCustomers(); // Recarregar dados
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('oms_customers')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
      await fetchCustomers(); // Recarregar dados
    } finally {
      setLoading(false);
    }
  };

  return {
    customers,
    loading,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refetch: fetchCustomers
  };
}

export function useOMSSalesReps() {
  const [salesReps, setSalesReps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSalesReps = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('oms_sales_reps')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setSalesReps(data || []);
    } catch (error) {
      console.error('Erro ao buscar representantes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesReps();
  }, []);

  return {
    salesReps,
    loading,
    refetch: fetchSalesReps
  };
}

export function useOMSProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchProducts = async (query: string): Promise<any[]> => {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      // ✅ BUSCAR PRODUTOS DO ESTOQUE REAL (tabela produtos)
      const { data, error } = await supabase
        .from('produtos')
        .select('id, sku_interno, nome, preco_venda, quantidade_atual, ativo')
        .eq('ativo', true)
        .or(`sku_interno.ilike.%${query}%,nome.ilike.%${query}%`)
        .limit(20);
      
      if (error) {
        console.error('Erro ao buscar produtos:', error);
        return [];
      }
      
      // Mapear para formato esperado pelo OMS
      return (data || []).map(product => ({
        id: product.id,
        sku: product.sku_interno,
        title: product.nome,
        price: product.preco_venda || 0,
        stock: product.quantidade_atual || 0,
        is_active: product.ativo
      }));
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      return [];
    }
  };

  return {
    products,
    loading,
    searchProducts
  };
}

export function useOMSOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('oms_orders')
        .select(`
          *,
          oms_customers:customer_id(*),
          oms_sales_reps:sales_rep_id(*),
          oms_order_items(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const createOrder = async (orderData: any) => {
    setLoading(true);
    try {
      // Gerar número do pedido
      const orderNumber = `${String(orders.length + 1).padStart(6, '0')}/2025`;
      
      // Criar pedido principal
      const { data: newOrder, error: orderError } = await supabase
        .from('oms_orders')
        .insert([{
          number: orderNumber,
          customer_id: orderData.customer_id,
          sales_rep_id: orderData.sales_rep_id,
          order_date: orderData.order_date,
          delivery_date: orderData.delivery_date,
          payment_terms: orderData.payment_terms,
          payment_term_days: orderData.payment_term_days,
          payment_method: orderData.payment_method,
          shipping_total: orderData.shipping_total,
          shipping_method: orderData.shipping_method,
          delivery_address: orderData.delivery_address,
          discount_amount: orderData.discount_amount,
          discount_type: orderData.discount_type,
          subtotal: orderData.subtotal,
          tax_total: orderData.tax_total,
          grand_total: orderData.grand_total,
          notes: orderData.notes,
          internal_notes: orderData.internal_notes,
          status: 'draft'
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Criar itens do pedido
      if (orderData.items && orderData.items.length > 0) {
        const orderItems = orderData.items.map((item: any) => ({
          order_id: newOrder.id,
          product_id: item.product_id,
          sku: item.sku,
          title: item.title,
          qty: item.qty,
          unit_price: item.unit_price,
          discount_pct: item.discount_pct,
          discount_value: item.discount_value,
          tax_value: item.tax_value,
          total: item.total
        }));

        const { error: itemsError } = await supabase
          .from('oms_order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      await fetchOrders(); // Recarregar dados
      return newOrder;
    } finally {
      setLoading(false);
    }
  };

  const updateOrder = async (id: string, orderData: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('oms_orders')
        .update(orderData)
        .eq('id', id);
      
      if (error) throw error;
      await fetchOrders(); // Recarregar dados
    } finally {
      setLoading(false);
    }
  };

  const approveOrder = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('oms_orders')
        .update({ 
          status: 'approved', 
          confirmed_at: new Date().toISOString() 
        })
        .eq('id', id);
      
      if (error) throw error;
      await fetchOrders(); // Recarregar dados
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('oms_orders')
        .update({ status: 'cancelled' })
        .eq('id', id);
      
      if (error) throw error;
      await fetchOrders(); // Recarregar dados
    } finally {
      setLoading(false);
    }
  };

  return {
    orders,
    loading,
    createOrder,
    updateOrder,
    approveOrder,
    cancelOrder,
    refetch: fetchOrders
  };
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'draft': return 'bg-yellow-100 text-yellow-800';
    case 'approved': return 'bg-blue-100 text-blue-800';
    case 'invoiced': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function getPriceTierMultiplier(tier: 'standard' | 'premium' | 'vip'): number {
  switch (tier) {
    case 'standard': return 1.0;
    case 'premium': return 0.95;
    case 'vip': return 0.90;
    default: return 1.0;
  }
}