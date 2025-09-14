import { supabase } from "@/integrations/supabase/client";
import { Cliente, ClientesFilters, ClientesStats } from "@/types/cliente";

export class SecureClienteService {
  /**
   * Fetches customers using the secure function with automatic data masking
   * based on user permissions
   */
  static async getClientes(filters: ClientesFilters = {}) {
    try {
      // ✅ SEGURANÇA: Usar view segura clientes_secure com mascaramento automático
      let query = supabase.from('clientes_secure').select('*');
      
      // Aplicar filtros se fornecidos
      if (filters.search) {
        query = query.or(`nome_completo.ilike.%${filters.search}%,email.ilike.%${filters.search}%,cpf_cnpj.ilike.%${filters.search}%`);
      }
      
      // Aplicar filtros básicos apenas (remove filtros não suportados)
      // if (filters.status_cliente) {
      //   query = query.eq('status_cliente', filters.status_cliente);
      // }
      
      // Limitar resultados para evitar sobrecarga
      const limit = 50; // Fixed limit for security
      query = query.limit(limit);
      
      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro na busca segura de clientes:', error);
        return { data: [], error, count: 0 };
      }

      const clientes = (data || []) as Cliente[];

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
      // ✅ SEGURANÇA: Usar view segura clientes_secure (dados não sensíveis para stats)
      const { data, error } = await supabase
        .from('clientes_secure')
        .select('status_cliente,ticket_medio,valor_total_gasto');

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
      // ✅ SEGURANÇA: Usar view segura clientes_secure
      const { data, error } = await supabase
        .from('clientes_secure')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Erro na busca segura de cliente:', error);
        return { data: null, error };
      }

      // Log de acesso para auditoria - removido por problemas de TypeScript
      // TODO: Implementar logging de acesso em uma versão futura

      return { data: data as Cliente | null, error: null };
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