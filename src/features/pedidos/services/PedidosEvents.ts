/**
 * 🚀 FASE 3: SISTEMA DE EVENTOS E NOTIFICAÇÕES
 * Event bus para comunicação desacoplada entre componentes
 */

/**
 * Tipos de eventos disponíveis
 */
export enum PedidoEventType {
  // Ciclo de vida
  PEDIDO_CRIADO = 'pedido:criado',
  PEDIDO_ATUALIZADO = 'pedido:atualizado',
  PEDIDO_DELETADO = 'pedido:deletado',
  
  // Status
  STATUS_ALTERADO = 'pedido:status_alterado',
  PAGAMENTO_CONFIRMADO = 'pedido:pagamento_confirmado',
  PEDIDO_ENVIADO = 'pedido:enviado',
  PEDIDO_ENTREGUE = 'pedido:entregue',
  PEDIDO_CANCELADO = 'pedido:cancelado',
  
  // Estoque
  ESTOQUE_BAIXADO = 'pedido:estoque_baixado',
  ESTOQUE_INSUFICIENTE = 'pedido:estoque_insuficiente',
  
  // Mapeamento
  MAPEAMENTO_CRIADO = 'pedido:mapeamento_criado',
  MAPEAMENTO_ATUALIZADO = 'pedido:mapeamento_atualizado',
  
  // Bulk operations
  BULK_OPERATION_START = 'pedido:bulk_operation_start',
  BULK_OPERATION_PROGRESS = 'pedido:bulk_operation_progress',
  BULK_OPERATION_COMPLETE = 'pedido:bulk_operation_complete',
  BULK_OPERATION_ERROR = 'pedido:bulk_operation_error',
  
  // Anomalias e alertas
  ANOMALIA_DETECTADA = 'pedido:anomalia_detectada',
  ALERTA_CRITICO = 'pedido:alerta_critico',
  
  // Cache
  CACHE_INVALIDATED = 'pedido:cache_invalidated',
}

/**
 * Estrutura de um evento
 */
export interface PedidoEvent<T = any> {
  type: PedidoEventType;
  payload: T;
  timestamp: Date;
  metadata?: {
    userId?: string;
    source?: string;
    [key: string]: any;
  };
}

/**
 * Handler de evento (callback)
 */
export type EventHandler<T = any> = (event: PedidoEvent<T>) => void | Promise<void>;

/**
 * Subscription retornada ao registrar listener
 */
export interface EventSubscription {
  unsubscribe: () => void;
}

/**
 * Serviço de eventos (Event Bus)
 */
class PedidosEventService {
  private listeners = new Map<PedidoEventType, Set<EventHandler>>();
  private eventHistory: PedidoEvent[] = [];
  private maxHistorySize = 100;

  /**
   * Registra um listener para um tipo de evento
   */
  on<T = any>(
    eventType: PedidoEventType,
    handler: EventHandler<T>
  ): EventSubscription {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(handler as EventHandler);

    // Retorna subscription para unsubscribe
    return {
      unsubscribe: () => this.off(eventType, handler)
    };
  }

  /**
   * Remove um listener
   */
  off<T = any>(
    eventType: PedidoEventType,
    handler: EventHandler<T>
  ): void {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.delete(handler as EventHandler);
    }
  }

  /**
   * Emite um evento
   */
  async emit<T = any>(
    eventType: PedidoEventType,
    payload: T,
    metadata?: PedidoEvent['metadata']
  ): Promise<void> {
    const event: PedidoEvent<T> = {
      type: eventType,
      payload,
      timestamp: new Date(),
      metadata
    };

    // Adiciona ao histórico
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Log em development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📢 [EVENT] ${eventType}`, payload);
    }

    // Dispara listeners
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      const promises = Array.from(handlers).map(handler => {
        try {
          return Promise.resolve(handler(event));
        } catch (error) {
          console.error(`[EVENT ERROR] Handler failed for ${eventType}:`, error);
          return Promise.resolve();
        }
      });

      await Promise.allSettled(promises);
    }
  }

  /**
   * Emite múltiplos eventos em batch
   */
  async emitBatch(events: Array<{ type: PedidoEventType; payload: any }>): Promise<void> {
    await Promise.all(
      events.map(({ type, payload }) => this.emit(type, payload))
    );
  }

  /**
   * Retorna histórico de eventos
   */
  getHistory(eventType?: PedidoEventType): PedidoEvent[] {
    if (eventType) {
      return this.eventHistory.filter(e => e.type === eventType);
    }
    return [...this.eventHistory];
  }

  /**
   * Limpa histórico de eventos
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Retorna estatísticas de eventos
   */
  getStats() {
    const eventCounts = new Map<PedidoEventType, number>();
    
    this.eventHistory.forEach(event => {
      const count = eventCounts.get(event.type) || 0;
      eventCounts.set(event.type, count + 1);
    });

    return {
      totalEvents: this.eventHistory.length,
      uniqueTypes: eventCounts.size,
      eventCounts: Object.fromEntries(eventCounts),
      oldestEvent: this.eventHistory[0]?.timestamp,
      newestEvent: this.eventHistory[this.eventHistory.length - 1]?.timestamp
    };
  }

  /**
   * Remove todos os listeners
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }
}

// Singleton instance
export const pedidosEvents = new PedidosEventService();

/**
 * Hook helper para usar eventos em React
 * Exemplo de como será usado (implementação em hook separado):
 * 
 * ```typescript
 * function MyComponent() {
 *   usePedidoEvent(PedidoEventType.PEDIDO_CRIADO, (event) => {
 *     console.log('Novo pedido:', event.payload);
 *     toast.success('Pedido criado!');
 *   });
 * }
 * ```
 */
export const createEventEmitter = (eventType: PedidoEventType) => {
  return <T = any>(payload: T, metadata?: PedidoEvent['metadata']) => {
    return pedidosEvents.emit(eventType, payload, metadata);
  };
};

/**
 * Helpers para eventos comuns
 */
export const emitPedidoCriado = createEventEmitter(PedidoEventType.PEDIDO_CRIADO);
export const emitPedidoAtualizado = createEventEmitter(PedidoEventType.PEDIDO_ATUALIZADO);
export const emitStatusAlterado = createEventEmitter(PedidoEventType.STATUS_ALTERADO);
export const emitEstoqueBaixado = createEventEmitter(PedidoEventType.ESTOQUE_BAIXADO);
export const emitAnomaliaDetectada = createEventEmitter(PedidoEventType.ANOMALIA_DETECTADA);
