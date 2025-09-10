import { supabase } from "@/integrations/supabase/client";
import { OrderAdvanced, OrderFiltersState, OrderPaginationState, OrderSortState } from '../types/orders-advanced.types';

export interface OrdersQueryResult {
  orders: OrderAdvanced[];
  total: number;
  page_info: {
    has_next_page: boolean;
    has_previous_page: boolean;
    start_cursor: string | null;
    end_cursor: string | null;
  };
}

export class OrdersQueryService {
  private static instance: OrdersQueryService;

  static getInstance(): OrdersQueryService {
    if (!OrdersQueryService.instance) {
      OrdersQueryService.instance = new OrdersQueryService();
    }
    return OrdersQueryService.instance;
  }

  /**
   * Get paginated orders with advanced filtering
   */
  async getOrdersPaginated(
    filters: OrderFiltersState,
    pagination: OrderPaginationState,
    sorting: OrderSortState
  ): Promise<OrdersQueryResult> {
    try {
      console.log('🔍 Fetching orders with filters:', { filters, pagination, sorting });

      // Desabilitado - função RPC não existe
      console.warn('get_pedidos_masked desabilitada');
      return {
        orders: [],
        total: 0,
        page_info: {
          has_next_page: false,
          has_previous_page: false,
          start_cursor: null,
          end_cursor: null,
        },
      };

    } catch (error: any) {
      console.error('❌ OrdersQueryService error:', error);
      throw new Error(`Falha ao carregar pedidos: ${error.message}`);
    }
  }

  /**
   * Get orders by IDs (for bulk operations)
   */
  async getOrdersByIds(orderIds: string[]): Promise<OrderAdvanced[]> {
    if (orderIds.length === 0) return [];

    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          id,
          numero,
          nome_cliente,
          cpf_cnpj,
          data_pedido,
          data_prevista,
          situacao,
          valor_total,
          valor_frete,
          valor_desconto,
          numero_ecommerce,
          numero_venda,
          empresa,
          cidade,
          uf,
          codigo_rastreamento,
          url_rastreamento,
          obs,
          obs_interna,
          integration_account_id,
          created_at,
          updated_at,
          integration_accounts!inner(name)
        `)
        .in('id', orderIds);

      if (error) throw error;

      return this.transformOrders(data || []);

    } catch (error: any) {
      console.error('Error fetching orders by IDs:', error);
      throw new Error(`Erro ao buscar pedidos: ${error.message}`);
    }
  }

  /**
   * Search orders with intelligent matching
   */
  async searchOrders(query: string, limit: number = 10): Promise<OrderAdvanced[]> {
    if (!query.trim()) return [];

    try {
      // Desabilitado - função RPC não existe
      console.warn('get_pedidos_masked search desabilitada');
      return [];

    } catch (error: any) {
      console.error('Error searching orders:', error);
      throw new Error(`Erro na busca: ${error.message}`);
    }
  }

  /**
   * Get order suggestions for autocomplete
   */
  async getOrderSuggestions(query: string): Promise<Array<{ id: string; label: string; type: string }>> {
    try {
      const orders = await this.searchOrders(query, 5);
      
      return orders.map(order => ({
        id: order.id,
        label: `${order.numero} - ${order.nome_cliente}`,
        type: 'order',
      }));

    } catch (error) {
      console.error('Error getting order suggestions:', error);
      return [];
    }
  }

  /**
   * Transform raw order data to OrderAdvanced type
   */
  private transformOrders(rawOrders: any[]): OrderAdvanced[] {
    return rawOrders.map(order => ({
      ...order,
      // Override empresa with integration account name if available
      empresa: order.integration_accounts?.name || order.empresa || 'Sistema',
      // Enhanced fields with defaults
      priority: this.calculatePriority(order),
      tags: this.extractTags(order),
      last_status_change: order.updated_at,
      estimated_delivery: this.calculateEstimatedDelivery(order),
      profit_margin: this.calculateProfitMargin(order),
    }));
  }

  /**
   * Apply advanced client-side filters
   */
  private applyAdvancedFilters(orders: OrderAdvanced[], filters: OrderFiltersState): OrderAdvanced[] {
    return orders.filter(order => {
      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(order.situacao)) {
        return false;
      }

      // Source filter
      if (filters.source.length > 0) {
        const orderSource = this.determineOrderSource(order);
        if (!filters.source.includes(orderSource)) {
          return false;
        }
      }

      // Priority filter
      if (filters.priority.length > 0 && !filters.priority.includes(order.priority)) {
        return false;
      }

      // Value range filter
      if (filters.value_range.min !== null && order.valor_total < filters.value_range.min) {
        return false;
      }
      if (filters.value_range.max !== null && order.valor_total > filters.value_range.max) {
        return false;
      }

      // Location filter
      if (filters.location.cities.length > 0 && order.cidade && !filters.location.cities.includes(order.cidade)) {
        return false;
      }
      if (filters.location.states.length > 0 && order.uf && !filters.location.states.includes(order.uf)) {
        return false;
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const orderTags = order.tags || [];
        if (!filters.tags.some(tag => orderTags.includes(tag))) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Apply sorting to orders
   */
  private applySorting(orders: OrderAdvanced[], sorting: OrderSortState): OrderAdvanced[] {
    return [...orders].sort((a, b) => {
      const aValue = a[sorting.field];
      const bValue = b[sorting.field];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sorting.direction === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Helper methods for enhanced fields
   */
  private calculatePriority(order: any): 'low' | 'normal' | 'high' | 'urgent' {
    if (order.valor_total >= 5000) return 'urgent';
    if (order.valor_total >= 1000) return 'high';
    if (order.situacao === 'Pendente') return 'high';
    return 'normal';
  }

  private extractTags(order: any): string[] {
    const tags: string[] = [];
    
    if (order.valor_total >= 1000) tags.push('high-value');
    if (order.situacao === 'Pendente') tags.push('pending');
    if (order.codigo_rastreamento) tags.push('tracked');
    if (order.obs_interna) tags.push('has-notes');
    
    return tags;
  }

  private calculateEstimatedDelivery(order: any): string | null {
    if (order.data_prevista) return order.data_prevista;
    
    // Simple estimation: 7 days from order date
    const orderDate = new Date(order.data_pedido);
    orderDate.setDate(orderDate.getDate() + 7);
    return orderDate.toISOString().split('T')[0];
  }

  private calculateProfitMargin(order: any): number {
    // Simplified calculation - in real scenario, you'd have cost data
    const revenue = order.valor_total - order.valor_desconto;
    const estimatedCost = revenue * 0.7; // Assume 70% cost ratio
    return ((revenue - estimatedCost) / revenue) * 100;
  }

  private determineOrderSource(order: any): 'interno' | 'mercadolivre' | 'shopee' | 'tiny' {
    if (order.numero_ecommerce?.startsWith('ML')) return 'mercadolivre';
    if (order.numero_ecommerce?.startsWith('SP')) return 'shopee';
    if (order.empresa?.toLowerCase().includes('tiny')) return 'tiny';
    return 'interno';
  }

  private formatDateForDB(date: string | null): string | null {
    if (!date) return null;
    
    try {
      return new Date(date).toISOString().split('T')[0];
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const ordersQueryService = OrdersQueryService.getInstance();