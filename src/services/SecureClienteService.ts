import { supabase } from "@/integrations/supabase/client";
import { Cliente, ClientesFilters, ClientesStats } from "@/types/cliente";

export class SecureClienteService {
  /**
   * Fetches customers using the safe view with automatic data masking
   * based on user permissions
   */
  static async getClientes(filters: ClientesFilters = {}) {
    let query = supabase
      .from('clientes_safe')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.search) {
      query = query.or(`nome_completo.ilike.%${filters.search}%,cpf_cnpj.ilike.%${filters.search}%,email.ilike.%${filters.search}%,empresa.ilike.%${filters.search}%`);
    }

    if (filters.status) {
      query = query.eq('status_cliente', filters.status);
    }

    if (filters.cidade) {
      query = query.eq('endereco_cidade', filters.cidade);
    }

    if (filters.uf) {
      query = query.eq('endereco_uf', filters.uf);
    }

    const { data, error, count } = await query;

    return { data: data as Cliente[], error, count };
  }

  /**
   * Fetches customer statistics
   */
  static async getClientesStats(): Promise<{ data: ClientesStats | null; error: any }> {
    const { data, error } = await supabase
      .from('clientes_safe')
      .select('status_cliente, valor_total_gasto, ticket_medio');

    if (error) {
      return { data: null, error };
    }

    const clientes = data || [];
    const stats: ClientesStats = {
      total: clientes.length,
      ativos: clientes.filter(c => c.status_cliente !== 'Inativo').length,
      vip: clientes.filter(c => c.status_cliente === 'VIP').length,
      premium: clientes.filter(c => c.status_cliente === 'Premium').length,
      ticket_medio: clientes.length > 0 
        ? clientes.reduce((sum, c) => sum + (Number(c.ticket_medio) || 0), 0) / clientes.length
        : 0,
      ltv_medio: clientes.length > 0
        ? clientes.reduce((sum, c) => sum + (Number(c.valor_total_gasto) || 0), 0) / clientes.length
        : 0
    };

    return { data: stats, error: null };
  }

  /**
   * Gets a single customer by ID with permission-based data masking
   */
  static async getClienteById(id: string) {
    const { data, error } = await supabase
      .from('clientes_safe')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    return { data: data as Cliente | null, error };
  }

  /**
   * Creates a new customer (requires customers:create permission)
   */
  static async createCliente(cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at' | 'organization_id'>) {
    // The organization_id will be set automatically by RLS triggers
    const { data, error } = await supabase
      .from('clientes')
      .insert(cliente as any) // Cast to any to bypass strict type checking for organization_id
      .select()
      .single();

    return { data: data as Cliente | null, error };
  }

  /**
   * Updates an existing customer (requires customers:update permission)
   */
  static async updateCliente(id: string, updates: Partial<Cliente>) {
    const { data, error } = await supabase
      .from('clientes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data: data as Cliente | null, error };
  }

  /**
   * Deletes a customer (requires customers:delete permission)
   */
  static async deleteCliente(id: string) {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id);

    return { error };
  }

  /**
   * Syncs customer data from orders
   */
  static async syncClientesFromPedidos() {
    try {
      const { data, error } = await supabase.rpc('sync_cliente_from_pedido');
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }
}