import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

// ===== SCHEMAS =====
export const OrderListParamsSchema = z.object({
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  situacoes: z.array(z.string()).optional(),
  fonte: z.enum(['interno', 'mercadolivre', 'shopee', 'tiny']).optional(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
});

export const OrderDetailsParamsSchema = z.object({
  id: z.string().min(1),
});

export const BulkStockPayloadSchema = z.object({
  orderIds: z.array(z.string()).min(1),
  action: z.enum(['baixar_estoque', 'cancelar_pedido']),
});

export type OrderListParams = z.infer<typeof OrderListParamsSchema>;
export type OrderDetailsParams = z.infer<typeof OrderDetailsParamsSchema>;
export type BulkStockPayload = z.infer<typeof BulkStockPayloadSchema>;

// ===== TYPES =====
export interface Order {
  id: string;
  numero: string;
  nome_cliente: string;
  cpf_cnpj: string | null;
  data_pedido: string;
  data_prevista: string | null;
  situacao: string;
  valor_total: number;
  valor_frete: number;
  valor_desconto: number;
  numero_ecommerce: string | null;
  numero_venda: string | null;
  empresa: string | null;
  cidade: string | null;
  uf: string | null;
  codigo_rastreamento: string | null;
  url_rastreamento: string | null;
  obs: string | null;
  obs_interna: string | null;
  integration_account_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderStats {
  today: number;
  pending: number;
  completed: number;
  cancelled: number;
}

export interface OrderExportResult {
  success: boolean;
  filename?: string;
  error?: string;
}

// ===== VALIDATION HELPER =====
function safeParseWithIssues<T>(schema: z.ZodSchema<T>, data: unknown) {
  try {
    const result = schema.parse(data);
    return { success: true as const, data: result, issues: [] };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { 
        success: false as const, 
        data: null, 
        issues: e.issues.map(i => i.message) 
      };
    }
    return { 
      success: false as const, 
      data: null, 
      issues: ['Erro de validação desconhecido'] 
    };
  }
}

// ===== SERVICE CLASS =====
export class OrderService {
  private static instance: OrderService;

  static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }

  /**
   * Fallback strategy: Edge Function → RPC on timeout/5xx
   */
  private async tryEdgeFunctionWithFallback<T>(
    functionName: string,
    body: any,
    fallbackQuery: () => Promise<T>
  ): Promise<T> {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body,
        headers: { 'Content-Type': 'application/json' }
      });

      if (error) {
        console.warn(`Edge function ${functionName} failed:`, error);
        return await fallbackQuery();
      }

      return data;
    } catch (error: any) {
      console.warn(`Edge function ${functionName} error, falling back to RPC:`, error.message);
      return await fallbackQuery();
    }
  }

  /**
   * List orders with filters and pagination - now supports unified sources
   */
  async list(params: OrderListParams): Promise<{ data: Order[]; count: number }> {
    const validation = safeParseWithIssues(OrderListParamsSchema, params);
    if (!validation.success) {
      throw new Error(`Parâmetros inválidos: ${validation.issues.join(', ')}`);
    }

    const validParams = validation.data;

    // REMOVIDO FALLBACK - APENAS API MERCADO LIVRE EM TEMPO REAL
    console.log('🔄 OrderService: Chamando unified-orders APENAS (sem fallback DB)');
    
    const { data, error } = await supabase.functions.invoke('unified-orders', {
      body: validParams,
      headers: { 'Content-Type': 'application/json' }
    });

    if (error) {
      console.error('❌ unified-orders falhou:', error);
      throw new Error(`Erro na API Mercado Livre: ${error.message || 'Falha na comunicação'}`);
    }

    if (!data?.ok) {
      console.error('❌ unified-orders resposta inválida:', data);
      throw new Error(`API Mercado Livre: ${data?.error || 'Resposta inesperada'}`);
    }

    console.log('✅ unified-orders sucesso:', { 
      resultCount: data?.unified?.length || 0,
      total: data?.paging?.total || 0 
    });

    return { data: data?.unified || [], count: data?.paging?.total || 0 };
  }

  /**
   * Get order details by ID
   */
  async details(id: string): Promise<Order | null> {
    const validation = safeParseWithIssues(OrderDetailsParamsSchema, { id });
    if (!validation.success) {
      throw new Error(`ID inválido: ${validation.issues.join(', ')}`);
    }

    // Edge function with direct query fallback
    return this.tryEdgeFunctionWithFallback(
      'obter-pedido-tiny',
      { id },
      async () => {
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
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        
        // Transform empresa field to use integration account name
        if (data) {
          data.empresa = data.integration_accounts?.name || data.empresa || 'Sistema';
        }
        
        return data;
      }
    );
  }

  /**
   * Bulk stock operations
   */
  async bulkStock(payload: BulkStockPayload): Promise<void> {
    const validation = safeParseWithIssues(BulkStockPayloadSchema, payload);
    if (!validation.success) {
      throw new Error(`Payload inválido: ${validation.issues.join(', ')}`);
    }

    // Always use edge function for bulk operations
    const { error } = await supabase.functions.invoke('processar-baixa-estoque', {
      body: validation.data,
      headers: { 'Content-Type': 'application/json' }
    });

    if (error) {
      throw new Error(`Erro no processamento em lote: ${error.message}`);
    }
  }

  /**
   * Export orders to CSV
   */
  async exportCsv(params: OrderListParams, filename?: string): Promise<OrderExportResult> {
    try {
      // For exports > 5k, use server-side edge function
      if (params.limit && params.limit > 5000) {
        const { data, error } = await supabase.functions.invoke('exportar-pedidos-csv', {
          body: { ...params, filename },
          headers: { 'Content-Type': 'application/json' }
        });

        if (error) throw error;
        return { success: true, filename: data.filename };
      }

      // For ≤5k, use client-side processing
      const { data } = await this.list({ ...params, limit: 5000, offset: 0 });
      
      const csvContent = this.generateCsvContent(data);
      const finalFilename = filename || `pedidos_${new Date().toISOString().split('T')[0]}.csv`;
      
      // Trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = finalFilename;
      link.click();
      URL.revokeObjectURL(link.href);

      return { success: true, filename: finalFilename };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get order statistics - now includes all sources
   */
  async getStats(): Promise<OrderStats> {
    // Use unified orders to get comprehensive stats
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's orders from all sources
      const todayOrders = await this.list({
        fonte: 'interno', // Default fonte is required
        startDate: today,
        endDate: today,
        limit: 1000,
        offset: 0,
      });

      // Get all recent orders to calculate stats
      const recentOrders = await this.list({
        fonte: 'interno', // Default fonte is required
        limit: 1000,
        offset: 0,
      });

      const allOrders = recentOrders.data;
      
      // Calculate stats from unified data
      const stats = {
        today: todayOrders.data.length,
        pending: allOrders.filter(order => 
          ['Pendente', 'Aguardando', 'Aguardando Pagamento', 'Processando Pagamento'].includes(order.situacao)
        ).length,
        completed: allOrders.filter(order => 
          ['Concluído', 'Entregue', 'Pago', 'Enviado'].includes(order.situacao)
        ).length,
        cancelled: allOrders.filter(order => 
          ['Cancelado', 'Inválido'].includes(order.situacao)
        ).length,
      };

      return stats;
    } catch (error) {
      console.error('Error calculating unified stats, falling back to basic counts:', error);
      
      // Fallback to basic internal counts only
      const today = new Date().toISOString().split('T')[0];
      
      const [todayResult, pendingResult, completedResult, cancelledResult] = await Promise.allSettled([
        supabase.from('pedidos').select('id', { count: 'exact', head: true }).gte('data_pedido', today),
        supabase.from('pedidos').select('id', { count: 'exact', head: true }).in('situacao', ['Pendente', 'Aguardando']),
        supabase.from('pedidos').select('id', { count: 'exact', head: true }).in('situacao', ['Concluído', 'Entregue']),
        supabase.from('pedidos').select('id', { count: 'exact', head: true }).eq('situacao', 'Cancelado'),
      ]);

      return {
        today: todayResult.status === 'fulfilled' ? (todayResult.value.count || 0) : 0,
        pending: pendingResult.status === 'fulfilled' ? (pendingResult.value.count || 0) : 0,
        completed: completedResult.status === 'fulfilled' ? (completedResult.value.count || 0) : 0,
        cancelled: cancelledResult.status === 'fulfilled' ? (cancelledResult.value.count || 0) : 0,
      };
    }
  }

  /**
   * Generate CSV content from orders
   */
  private generateCsvContent(orders: Order[]): string {
    const headers = [
      'ID', 'Número', 'Cliente', 'CPF/CNPJ', 'Data Pedido', 'Data Prevista',
      'Situação', 'Valor Total', 'Valor Frete', 'Valor Desconto', 'Cidade', 'UF',
      'Código Rastreamento', 'URL Rastreamento', 'Observações'
    ];

    const rows = orders.map(order => [
      order.id,
      order.numero,
      order.nome_cliente,
      order.cpf_cnpj || '',
      order.data_pedido,
      order.data_prevista || '',
      order.situacao,
      order.valor_total.toFixed(2),
      order.valor_frete.toFixed(2),
      order.valor_desconto.toFixed(2),
      order.cidade || '',
      order.uf || '',
      order.codigo_rastreamento || '',
      order.url_rastreamento || '',
      order.obs || ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }
}

// ===== SINGLETON EXPORT =====
export const orderService = OrderService.getInstance();