import { supabase } from "@/integrations/supabase/client";
import { Cliente, ClientesFilters, ClientesStats } from "@/types/cliente";

export class SecureClienteService {
  /**
   * Fetches customers using the secure RPC function with automatic data masking
   * based on user permissions
   */
  static async getClientes(filters: ClientesFilters = {}) {
    try {
      // ✅ SEGURANÇA: Usar função RPC segura que aplica mascaramento automático
      const { data, error } = await supabase.rpc('get_masked_clients');

      if (error) {
        return { data: [], error, count: 0 };
      }

      let clientes = (data || []) as any[];

      // Apply client-side filters
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        clientes = clientes.filter(c => 
          c.nome_completo?.toLowerCase().includes(searchTerm) ||
          c.cpf_cnpj?.toLowerCase().includes(searchTerm) ||
          c.email?.toLowerCase().includes(searchTerm)
        );
      }

      // Note: Other filters removed since they're not available in the simplified secure function

      return { data: clientes as Cliente[], error: null, count: clientes.length };
    } catch (error) {
      console.error('❌ Erro ao buscar clientes:', error);
      return { data: [], error, count: 0 };
    }
  }

  /**
   * Fetches customer statistics using direct client access (for stats only)
   */
  static async getClientesStats(): Promise<{ data: ClientesStats | null; error: any }> {
    try {
      // For stats, we can use simplified mock data or aggregate from the secure function
      const { data, error } = await supabase.rpc('get_masked_clients');

      if (error) {
        return { data: null, error };
      }

      const clientes = data || [];
      const stats: ClientesStats = {
        total: clientes.length,
        ativos: clientes.length, // Simplified - all returned clients are considered active
        vip: 0, // Not available in simplified secure function
        premium: 0, // Not available in simplified secure function
        ticket_medio: 0, // Not available in simplified secure function
        ltv_medio: 0 // Not available in simplified secure function
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
      const { data, error } = await supabase.rpc('get_masked_clients');

      if (error) {
        return { data: null, error };
      }

      const cliente = (data || []).find((c: any) => c.id === id) || null;
      return { data: cliente as Cliente | null, error: null };
    } catch (error) {
      console.error('❌ Erro ao buscar cliente:', error);
      return { data: null, error };
    }
  }

  /**
   * Creates a new customer (requires customers:create permission)
   */
  static async createCliente(cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at' | 'organization_id'>) {
    try {
      // The organization_id will be set automatically by RLS triggers
      const { data, error } = await supabase
        .from('clientes')
        .insert(cliente as any) // Cast to any to bypass strict type checking for organization_id
        .select()
        .single();

      return { data: data as Cliente | null, error };
    } catch (error) {
      console.error('❌ Erro ao criar cliente:', error);
      return { data: null, error };
    }
  }

  /**
   * Updates an existing customer (requires customers:update permission)
   */
  static async updateCliente(id: string, updates: Partial<Cliente>) {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      return { data: data as Cliente | null, error };
    } catch (error) {
      console.error('❌ Erro ao atualizar cliente:', error);
      return { data: null, error };
    }
  }

  /**
   * Deletes a customer (requires customers:delete permission)
   */
  static async deleteCliente(id: string) {
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

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