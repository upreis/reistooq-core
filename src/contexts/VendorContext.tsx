import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface VendorContextType {
  currentSalesRep: any | null;
  loading: boolean;
  isVendor: boolean;
  canViewOrder: (order: any) => boolean;
  canEditOrder: (order: any) => boolean;
  getVendorOrders: () => Promise<any[]>;
}

const VendorContext = createContext<VendorContextType | null>(null);

export function useVendor() {
  const context = useContext(VendorContext);
  if (!context) {
    throw new Error('useVendor deve ser usado dentro de VendorProvider');
  }
  return context;
}

export function VendorProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentSalesRep, setCurrentSalesRep] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSalesRep();
    } else {
      setCurrentSalesRep(null);
      setLoading(false);
    }
  }, [user]);

  const loadSalesRep = async () => {
    try {
      setLoading(true);
      
      // Buscar se o usuário atual é um vendedor cadastrado
      const { data: salesRep, error } = await supabase
        .from('oms_sales_reps')
        .select('*')
        .eq('email', user?.email)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar sales rep:', error);
        return;
      }

      setCurrentSalesRep(salesRep || null);
    } catch (error) {
      console.error('Erro ao carregar sales rep:', error);
    } finally {
      setLoading(false);
    }
  };

  const canViewOrder = (order: any): boolean => {
    if (!currentSalesRep) return false;
    
    // Vendedor só pode ver seus próprios pedidos
    return order.sales_rep_id === currentSalesRep.id;
  };

  const canEditOrder = (order: any): boolean => {
    if (!currentSalesRep) return false;
    
    // Vendedor só pode editar pedidos em rascunho que são seus
    return order.sales_rep_id === currentSalesRep.id && order.status === 'draft';
  };

  const getVendorOrders = async (): Promise<any[]> => {
    if (!currentSalesRep) return [];
    
    try {
      const { data, error } = await supabase
        .from('oms_orders')
        .select(`
          *,
          oms_customers:customer_id(*),
          oms_sales_reps:sales_rep_id(*),
          oms_order_items(*)
        `)
        .eq('sales_rep_id', currentSalesRep.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar pedidos do vendedor:', error);
      return [];
    }
  };

  const value: VendorContextType = {
    currentSalesRep,
    loading,
    isVendor: !!currentSalesRep,
    canViewOrder,
    canEditOrder,
    getVendorOrders
  };

  return (
    <VendorContext.Provider value={value}>
      {children}
    </VendorContext.Provider>
  );
}