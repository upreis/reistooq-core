/**
 * 🚀 FASE 3: HOOK PARA EVENTOS
 * React hook para trabalhar com event bus
 */

import { useEffect, useCallback, useRef } from 'react';
import { 
  pedidosEvents, 
  PedidoEventType, 
  PedidoEvent,
  EventHandler,
  EventSubscription 
} from '../services/PedidosEvents';

/**
 * Hook para escutar eventos de pedidos
 * 
 * ⚠️ NOTA: Hook estrutural da Fase 3
 * - Funcional e seguro para uso
 * - Gerencia subscription automaticamente
 * - Cleanup no unmount
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   usePedidoEvent(PedidoEventType.PEDIDO_CRIADO, (event) => {
 *     toast.success(`Pedido ${event.payload.numero} criado!`);
 *   });
 * 
 *   usePedidoEvent(PedidoEventType.ESTOQUE_BAIXADO, (event) => {
 *     console.log('Estoque baixado:', event.payload);
 *     refetch(); // Atualiza dados
 *   });
 * }
 * ```
 */
export function usePedidoEvent<T = any>(
  eventType: PedidoEventType,
  handler: EventHandler<T>,
  deps: any[] = []
) {
  const subscriptionRef = useRef<EventSubscription | null>(null);

  // Memo do handler para evitar re-subscriptions desnecessárias
  const memoizedHandler = useCallback(handler, deps);

  useEffect(() => {
    // Subscribe
    subscriptionRef.current = pedidosEvents.on(eventType, memoizedHandler);

    // Cleanup no unmount
    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [eventType, memoizedHandler]);
}

/**
 * Hook para escutar múltiplos eventos
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   usePedidoEvents({
 *     [PedidoEventType.PEDIDO_CRIADO]: (event) => {
 *       console.log('Criado:', event.payload);
 *     },
 *     [PedidoEventType.PEDIDO_ATUALIZADO]: (event) => {
 *       console.log('Atualizado:', event.payload);
 *     },
 *   });
 * }
 * ```
 */
export function usePedidoEvents(
  handlers: Partial<Record<PedidoEventType, EventHandler>>
) {
  const subscriptionsRef = useRef<EventSubscription[]>([]);

  useEffect(() => {
    // Subscribe a todos os handlers
    subscriptionsRef.current = Object.entries(handlers).map(
      ([eventType, handler]) => 
        pedidosEvents.on(eventType as PedidoEventType, handler!)
    );

    // Cleanup
    return () => {
      subscriptionsRef.current.forEach(sub => sub.unsubscribe());
      subscriptionsRef.current = [];
    };
  }, [handlers]);
}

/**
 * Hook para emitir eventos facilmente
 * 
 * @example
 * ```tsx
 * function CreateOrderButton() {
 *   const emit = useEmitPedidoEvent();
 * 
 *   const handleCreate = async () => {
 *     const newOrder = await createOrder();
 *     emit(PedidoEventType.PEDIDO_CRIADO, newOrder);
 *   };
 * }
 * ```
 */
export function useEmitPedidoEvent() {
  return useCallback(
    <T = any>(
      eventType: PedidoEventType,
      payload: T,
      metadata?: PedidoEvent['metadata']
    ) => {
      return pedidosEvents.emit(eventType, payload, metadata);
    },
    []
  );
}

/**
 * Hook para acessar histórico de eventos
 * 
 * @example
 * ```tsx
 * function EventHistory() {
 *   const history = useEventHistory(PedidoEventType.PEDIDO_CRIADO);
 *   
 *   return (
 *     <ul>
 *       {history.map(event => (
 *         <li key={event.timestamp.getTime()}>
 *           {event.timestamp.toLocaleString()}: {JSON.stringify(event.payload)}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useEventHistory(eventType?: PedidoEventType): PedidoEvent[] {
  return pedidosEvents.getHistory(eventType);
}

/**
 * Hook para stats de eventos
 */
export function useEventStats() {
  return pedidosEvents.getStats();
}
