import { supabase } from "@/integrations/supabase/client";
import { Cliente, ClientesFilters, ClientesStats } from "@/types/cliente";

export class SecureClienteService {
  /**
   * Fetches customers using the secure function with automatic data masking
   * based on user permissions
   */
  static async getClientes(filters: ClientesFilters = {}) {
    try {
      // ✅ SEGURANÇA: Usar função segura get_clientes_secure com mascaramento automático
      const { data, error } = await supabase.rpc('get_clientes_secure');
      
      
      if (error) {
        console.error('❌ Erro na busca segura de clientes:', error);
        return { data: [], error, count: 0 };
      }

      let clientes = (data || []) as Cliente[];

      // Aplicar filtros se fornecidos
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        clientes = clientes.filter(cliente => 
          cliente.nome_completo?.toLowerCase().includes(searchTerm) ||
          cliente.email?.toLowerCase().includes(searchTerm) ||
          cliente.cpf_cnpj?.toLowerCase().includes(searchTerm)
        );
      }

      // Limitar resultados para evitar sobrecarga
      const limit = 50; // Fixed limit for security
      if (clientes.length > limit) {
        clientes = clientes.slice(0, limit);
      }

      // Log de acesso para auditoria (opcional) - removido por problemas de TypeScript
      // TODO: Implementar logging de acesso em uma versão futura

      return { data: clientes, error: null, count: clientes.length };
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
      // ✅ SEGURANÇA: Usar função segura get_clientes_secure (dados não sensíveis para stats)
      const { data, error } = await supabase.rpc('get_clientes_secure');

      if (error) {
        console.error('❌ Erro na busca de estatísticas:', error);
        return { data: null, error };
      }

      const clientes = data || [];
      
      // Calculate stats from secure view data
      const stats: ClientesStats = {
        total: clientes.length,
        ativos: clientes.filter(c => c.status_cliente === 'Ativo').length,
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
      // ✅ SEGURANÇA: Usar função segura get_clientes_secure e filtrar por ID
      const { data: allData, error } = await supabase.rpc('get_clientes_secure');
      
      if (error) {
        console.error('❌ Erro na busca segura de cliente:', error);
        return { data: null, error };
      }

      const cliente = (allData || []).find((c: any) => c.id === id);
      if (!cliente) {
        return { data: null, error: { message: 'Cliente não encontrado' } };
      }

      // Log de acesso para auditoria - removido por problemas de TypeScript
      // TODO: Implementar logging de acesso em uma versão futura

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