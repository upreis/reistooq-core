import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Hook para buscar clientes OMS
export function useOMSCustomers(search?: string) {
  return useQuery({
    queryKey: ['oms-customers', search],
    queryFn: async () => {
      let query = supabase
        .from('oms_customers')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (search && search.trim()) {
        query = query.or(`name.ilike.%${search}%,doc.ilike.%${search}%,email.ilike.%${search}%`);
      }
      
      const { data, error } = await query.limit(50);
      
      if (error) throw error;
      return data || [];
    }
  });
}

// Hook para buscar locais de estoque
export function useLocaisEstoque() {
  return useQuery({
    queryKey: ['locais-estoque'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locais_estoque')
        .select('id, nome, tipo')
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return data || [];
    }
  });
}

// Hook para buscar dados da empresa (organização)
export function useEmpresaData() {
  return useQuery({
    queryKey: ['empresa-data'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      // Buscar profile para pegar organization_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('organizacao_id')
        .eq('id', user.id)
        .single();
      
      if (!profile?.organizacao_id) return null;
      
      // Buscar dados da organização
      const { data: org, error } = await supabase
        .from('organizacoes')
        .select('id, nome, fantasia, razao_social, cnpj')
        .eq('id', profile.organizacao_id)
        .single();
      
      if (error) throw error;
      return org;
    }
  });
}

// Hook para gerar próximo número de pedido
export function useNextOrderNumber() {
  return useQuery({
    queryKey: ['next-order-number'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('generate_oms_order_number');
      
      if (error) {
        // Fallback: gerar localmente
        const year = new Date().getFullYear();
        const { data: lastOrder } = await supabase
          .from('oms_orders')
          .select('number')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        let nextNum = 1;
        if (lastOrder?.number) {
          const parts = lastOrder.number.split('/');
          if (parts[1] === String(year)) {
            nextNum = parseInt(parts[0]) + 1;
          }
        }
        
        return `${String(nextNum).padStart(6, '0')}/${year}`;
      }
      
      return data;
    },
    staleTime: 0, // Sempre buscar novo número
    refetchOnWindowFocus: false
  });
}

// Hook para buscar produtos para seleção
export function useOMSProdutos(search?: string) {
  return useQuery({
    queryKey: ['oms-produtos', search],
    queryFn: async () => {
      let query = supabase
        .from('produtos')
        .select('id, sku, titulo, preco_venda, custo')
        .eq('ativo', true)
        .order('titulo');
      
      if (search && search.trim()) {
        query = query.or(`sku.ilike.%${search}%,titulo.ilike.%${search}%`);
      }
      
      const { data, error } = await query.limit(50);
      
      if (error) throw error;
      return data || [];
    },
    enabled: true
  });
}

// Hook para buscar representantes/vendedores
export function useOMSSalesReps() {
  return useQuery({
    queryKey: ['oms-sales-reps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('oms_sales_reps')
        .select('id, name, email, is_active')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });
}

export type OMSCustomer = Awaited<ReturnType<typeof useOMSCustomers>>['data'] extends (infer T)[] ? T : never;
export type LocalEstoque = Awaited<ReturnType<typeof useLocaisEstoque>>['data'] extends (infer T)[] ? T : never;
export type Produto = Awaited<ReturnType<typeof useOMSProdutos>>['data'] extends (infer T)[] ? T : never;
