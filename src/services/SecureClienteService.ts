import { supabase } from "@/integrations/supabase/client";
import { Cliente, ClientesFilters, ClientesStats } from "@/types/cliente";

export class SecureClienteService {
  /**
   * Fetches customers using the secure function with automatic data masking
   * based on user permissions
   */
  static async getClientes(filters: ClientesFilters = {}) {
    try {
      const { search, status, cidade, uf } = filters;
      
      // ✅ SEGURANÇA: Usar função segura search_customers_secure com mascaramento automático
      const { data, error } = await supabase.rpc('search_customers_secure', {
        p_search: search || null,
        p_status: status || null,
        p_cidade: cidade || null,
        p_uf: uf || null,
        p_limit: 100
      });

      if (error) {
        console.error('❌ Erro na busca segura de clientes:', error);
        return { data: [], error, count: 0 };
      }

      // Map the data to match Cliente interface (remove extra fields)
      const totalCount = (data as any)?.[0]?.total_count || 0;
      const mappedData = data?.map((item: any) => {
        const { data_is_masked, total_count, ...cliente } = item;
        return cliente;
      }) || [];

      return { 
        data: mappedData, 
        error: null, 
        count: totalCount
      };
    } catch (error) {
      console.error('❌ Erro ao buscar clientes:', error);
      return { data: [], error, count: 0 };
    }
  }

  /**
   * Fetches customer statistics using the secure view
   */
  static async getClientesStats(): Promise<{ data: ClientesStats | null; error: any }> {
    try {
      // ✅ SEGURANÇA: Usar função segura search_customers_secure para estatísticas
      const { data, error } = await supabase.rpc('search_customers_secure', {
        p_search: null,
        p_status: null,
        p_cidade: null,
        p_uf: null,
        p_limit: 1000 // Higher limit for stats calculation
      });

      if (error) {
        console.error('❌ Erro na busca de estatísticas:', error);
        return { data: null, error };
      }

      const clientes = data || [];
      
      // Calculate stats from secure view data
      const stats: ClientesStats = {
        total: clientes.length,
        ativos: clientes.filter(c => c.status_cliente === 'Regular').length,
        vip: clientes.filter(c => c.status_cliente === 'VIP').length,
        premium: clientes.filter(c => c.status_cliente === 'Premium').length,
        ticket_medio: clientes.reduce((acc, c) => acc + (Number(c.ticket_medio) || 0), 0) / clientes.length || 0,
        ltv_medio: clientes.reduce((acc, c) => acc + (Number(c.valor_total_gasto) || 0), 0) / clientes.length || 0
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      return { data: null, error };
    }
  }

  /**
   * Gets a single customer by ID using the secure function
   */
  static async getClienteById(id: string) {
    try {
      // ✅ SEGURANÇA: Usar função segura get_customer_secure com mascaramento automático
      const { data, error } = await supabase.rpc('get_customer_secure', {
        p_customer_id: id
      });

      if (error) {
        console.error('❌ Erro na busca segura de cliente:', error);
        return { data: null, error };
      }

      // Map the data to match Cliente interface (remove extra fields)
      const cliente = data?.[0];
      if (cliente) {
        const { data_is_masked, ...mappedCliente } = cliente as any;
        return { data: mappedCliente as Cliente, error: null };
      }

      return { data: null, error: { message: 'Cliente não encontrado' } };
    } catch (error) {
      console.error('❌ Erro ao buscar cliente:', error);
      return { data: null, error };
    }
  }

  /**
   * Creates a new customer (requires customers:create AND customers:manage permissions)
   * For enhanced security, direct table operations require management permissions
   */
  static async createCliente(cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at' | 'organization_id'>) {
    try {
      // Note: This operation now requires customers:manage permission due to enhanced security
      // The organization_id will be set automatically by RLS triggers
      const { data, error } = await supabase
        .from('clientes')
        .insert(cliente as any) // Cast to any to bypass strict type checking for organization_id
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar cliente (pode ser falta de permissão customers:manage):', error);
      }

      return { data: data as Cliente | null, error };
    } catch (error) {
      console.error('❌ Erro ao criar cliente:', error);
      return { data: null, error };
    }
  }

  /**
   * Updates an existing customer (requires customers:update AND customers:manage permissions)
   * For enhanced security, direct table operations require management permissions
   */
  static async updateCliente(id: string, updates: Partial<Cliente>) {
    try {
      // Note: This operation now requires customers:manage permission due to enhanced security
      const { data, error } = await supabase
        .from('clientes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar cliente (pode ser falta de permissão customers:manage):', error);
      }

      return { data: data as Cliente | null, error };
    } catch (error) {
      console.error('❌ Erro ao atualizar cliente:', error);
      return { data: null, error };
    }
  }

  /**
   * Deletes a customer (requires customers:delete AND customers:manage permissions)
   * For enhanced security, direct table operations require management permissions
   */
  static async deleteCliente(id: string) {
    try {
      // Note: This operation now requires customers:manage permission due to enhanced security
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao deletar cliente (pode ser falta de permissão customers:manage):', error);
      }

      return { error };
    } catch (error) {
      console.error('❌ Erro ao deletar cliente:', error);
      return { error };
    }
  }

  /**
   * Syncs customer data from orders
   */
  static async syncClientesFromPedidos() {
    try {
      const { data, error } = await supabase.rpc('sync_cliente_from_pedido');
      return { data, error };
    } catch (error) {
      console.error('❌ Erro ao sincronizar clientes:', error);
      return { data: null, error };
    }
  }
}