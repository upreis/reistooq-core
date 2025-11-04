import { supabase } from "@/integrations/supabase/client";
import { OrderAdvanced, BulkOperation, BulkOperationType } from '../types/orders-advanced.types';

interface EligibilityResult {
  isEligible: boolean;
  reason: string;
}

export class OrdersBulkService {
  private static instance: OrdersBulkService;

  static getInstance(): OrdersBulkService {
    if (!OrdersBulkService.instance) {
      OrdersBulkService.instance = new OrdersBulkService();
    }
    return OrdersBulkService.instance;
  }

  /**
   * Check if an order is eligible for bulk operations
   */
  static isEligibleForBulkOperations(order: OrderAdvanced): boolean {
    // Basic eligibility: order must not be in final states
    const finalStates = ['Entregue', 'Cancelado', 'Devolvido', 'Reembolsado'];
    return !finalStates.includes(order.situacao);
  }

  /**
   * Get detailed eligibility reason for an order
   */
  static getEligibilityReason(order: OrderAdvanced): EligibilityResult {
    if (order.situacao === 'Entregue') {
      return { isEligible: false, reason: 'Pedido já foi entregue' };
    }
    
    if (order.situacao === 'Cancelado') {
      return { isEligible: false, reason: 'Pedido já foi cancelado' };
    }
    
    if (order.situacao === 'Devolvido') {
      return { isEligible: false, reason: 'Pedido já foi devolvido' };
    }
    
    if (order.situacao === 'Reembolsado') {
      return { isEligible: false, reason: 'Pedido já foi reembolsado' };
    }

    return { isEligible: true, reason: 'Elegível para operações em lote' };
  }

  /**
   * Check if an order can perform a specific operation
   */
  static canPerformOperation(order: OrderAdvanced, operation: BulkOperationType): boolean {
    if (!this.isEligibleForBulkOperations(order)) return false;

    switch (operation) {
      case 'baixar_estoque':
        return ['Pago', 'Aprovado'].includes(order.situacao);
      
      case 'cancelar_pedidos':
        return !['Enviado', 'Entregue', 'Cancelado'].includes(order.situacao);
      
      case 'update_status':
        return true; // Can always update status if eligible
      
      case 'export_data':
        return true; // Can always export if eligible
      
      case 'send_notifications':
        return order.situacao === 'Enviado' || order.situacao === 'Entregue';
      
      default:
        return false;
    }
  }

  /**
   * Start a bulk operation
   */
  async startBulkOperation(
    operation: BulkOperationType,
    orderIds: string[],
    params: Record<string, any> = {}
  ): Promise<string> {
    try {
      console.log('🚀 Starting bulk operation:', { operation, orderIds: orderIds.length, params });

      // Validate orders eligibility
      const orders = await this.validateOrdersForOperation(orderIds, operation);
      
      if (orders.length === 0) {
        throw new Error('Nenhum pedido elegível para esta operação');
      }

      // Create operation record
      const operationRecord = await this.createBulkOperationRecord(operation, orders.length);

      // Execute operation based on type
      switch (operation) {
        case 'baixar_estoque':
          await this.executeBulkStockOperation(operationRecord.id, orders);
          break;
        
        case 'cancelar_pedidos':
          await this.executeBulkCancelOperation(operationRecord.id, orders);
          break;
        
        case 'update_status':
          await this.executeBulkStatusUpdate(operationRecord.id, orders, params.new_status);
          break;
        
        case 'export_data':
          await this.executeBulkExport(operationRecord.id, orders, params.export_format);
          break;
        
        case 'send_notifications':
          await this.executeBulkNotifications(operationRecord.id, orders);
          break;
        
        default:
          throw new Error(`Operação não suportada: ${operation}`);
      }

      return operationRecord.id;

    } catch (error: any) {
      console.error('❌ Bulk operation error:', error);
      throw new Error(`Erro na operação em lote: ${error.message}`);
    }
  }

  /**
   * Get bulk operation status
   */
  async getBulkOperationStatus(operationId: string): Promise<BulkOperation> {
    try {
    // Mock implementation since bulk_operations table doesn't exist yet
    return {
      id: operationId,
      type: 'baixar_estoque' as BulkOperationType,
      status: 'completed',
      progress: 100,
      total_items: 1,
      processed_items: 1,
      failed_items: 0,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      error_message: null,
    };

    } catch (error: any) {
      console.error('Error getting bulk operation status:', error);
      throw new Error(`Erro ao obter status da operação: ${error.message}`);
    }
  }

  /**
   * Cancel a bulk operation
   */
  async cancelBulkOperation(operationId: string): Promise<void> {
    try {
      console.log(`Mock: Cancelling bulk operation ${operationId}`);
      // Mock implementation since bulk_operations table doesn't exist yet
    } catch (error: any) {
      console.error('Error cancelling bulk operation:', error);
      throw new Error(`Erro ao cancelar operação: ${error.message}`);
    }
  }

  /**
   * Private helper methods
   */
  private async validateOrdersForOperation(
    orderIds: string[],
    operation: BulkOperationType
  ): Promise<OrderAdvanced[]> {
    // Get orders data
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .in('id', orderIds);

    if (error) throw error;

    const orders = data.map(order => ({
      ...order,
      priority: 'normal' as const,
      tags: (order as any).tags || [],
      last_status_change: order.updated_at,
      estimated_delivery: order.data_prevista,
      profit_margin: 0
    })) as OrderAdvanced[];
    
    // Filter eligible orders
    return orders.filter(order => 
      OrdersBulkService.canPerformOperation(order, operation)
    );
  }

  private async createBulkOperationRecord(
    operation: BulkOperationType,
    totalItems: number
  ): Promise<{ id: string }> {
    // Mock implementation since bulk_operations table doesn't exist yet
    const id = crypto.randomUUID();
    console.log(`Created bulk operation record: ${id}`);
    return { id };
  }

  private async updateOperationProgress(
    operationId: string,
    processed: number,
    failed: number,
    status: 'processing' | 'completed' | 'failed' = 'processing'
  ): Promise<void> {
    // Mock implementation - just log progress
    console.log(`Operation ${operationId}: ${processed}/${processed + failed} (${status})`);
  }

  private async executeBulkStockOperation(
    operationId: string,
    orders: OrderAdvanced[]
  ): Promise<void> {
    await this.updateOperationProgress(operationId, 0, 0, 'processing');

    let processed = 0;
    let failed = 0;

    for (const order of orders) {
      try {
        // Call the stock operation edge function
        const { error } = await supabase.functions.invoke('processar-baixa-estoque', {
          body: {
            orderIds: [order.id],
            action: 'baixar_estoque'
          }
        });

        if (error) throw error;
        processed++;

      } catch (error) {
        console.error(`Failed to process stock for order ${order.id}:`, error);
        failed++;
      }

      // Update progress periodically
      if ((processed + failed) % 10 === 0) {
        await this.updateOperationProgress(operationId, processed, failed);
      }
    }

    // Final update
    await this.updateOperationProgress(
      operationId, 
      processed, 
      failed, 
      failed === 0 ? 'completed' : 'failed'
    );
  }

  private async executeBulkCancelOperation(
    operationId: string,
    orders: OrderAdvanced[]
  ): Promise<void> {
    await this.updateOperationProgress(operationId, 0, 0, 'processing');

    let processed = 0;
    let failed = 0;

    for (const order of orders) {
      try {
        const { error } = await supabase
          .from('pedidos')
          .update({ 
            situacao: 'Cancelado',
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);

        if (error) throw error;
        processed++;

      } catch (error) {
        console.error(`Failed to cancel order ${order.id}:`, error);
        failed++;
      }

      if ((processed + failed) % 10 === 0) {
        await this.updateOperationProgress(operationId, processed, failed);
      }
    }

    await this.updateOperationProgress(
      operationId, 
      processed, 
      failed, 
      failed === 0 ? 'completed' : 'failed'
    );
  }

  private async executeBulkStatusUpdate(
    operationId: string,
    orders: OrderAdvanced[],
    newStatus: string
  ): Promise<void> {
    await this.updateOperationProgress(operationId, 0, 0, 'processing');

    let processed = 0;
    let failed = 0;

    for (const order of orders) {
      try {
        const { error } = await supabase
          .from('pedidos')
          .update({ 
            situacao: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);

        if (error) throw error;
        processed++;

      } catch (error) {
        console.error(`Failed to update status for order ${order.id}:`, error);
        failed++;
      }

      if ((processed + failed) % 10 === 0) {
        await this.updateOperationProgress(operationId, processed, failed);
      }
    }

    await this.updateOperationProgress(
      operationId, 
      processed, 
      failed, 
      failed === 0 ? 'completed' : 'failed'
    );
  }

  private async executeBulkExport(
    operationId: string,
    orders: OrderAdvanced[],
    format: string
  ): Promise<void> {
    await this.updateOperationProgress(operationId, 0, 0, 'processing');

    try {
      // Call export edge function
      const { error } = await supabase.functions.invoke('exportar-pedidos-csv', {
        body: {
          orderIds: orders.map(o => o.id),
          format,
        }
      });

      if (error) throw error;

      await this.updateOperationProgress(operationId, orders.length, 0, 'completed');

    } catch (error) {
      console.error('Bulk export failed:', error);
      await this.updateOperationProgress(operationId, 0, orders.length, 'failed');
    }
  }

  private async executeBulkNotifications(
    operationId: string,
    orders: OrderAdvanced[]
  ): Promise<void> {
    await this.updateOperationProgress(operationId, 0, 0, 'processing');

    let processed = 0;
    let failed = 0;

    for (const order of orders) {
      try {
        // Call notification edge function
        const { error } = await supabase.functions.invoke('enviar-notificacao-pedido', {
          body: {
            orderId: order.id,
            type: 'status_update',
          }
        });

        if (error) throw error;
        processed++;

      } catch (error) {
        console.error(`Failed to send notification for order ${order.id}:`, error);
        failed++;
      }

      if ((processed + failed) % 5 === 0) {
        await this.updateOperationProgress(operationId, processed, failed);
      }
    }

    await this.updateOperationProgress(
      operationId, 
      processed, 
      failed, 
      failed === 0 ? 'completed' : 'failed'
    );
  }
}

// Export singleton instance
export const ordersBulkService = OrdersBulkService.getInstance();