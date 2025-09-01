import { supabase } from '@/integrations/supabase/client';
import { LogisticEvent } from '@/types/logistics';

/**
 * Serviço para integração entre sistema logístico e eventos automáticos
 */
export class LogisticEventsService {
  
  /**
   * Cria eventos logísticos automaticamente baseados em um pedido
   */
  static async createEventsFromPedido(pedidoData: any): Promise<string[]> {
    try {
      console.log('🚚 Criando eventos logísticos para pedido:', pedidoData.numero);
      
      const { data, error } = await supabase
        .rpc('create_logistic_events_from_pedido', {
          p_pedido_data: pedidoData
        });

      if (error) throw error;

      console.log('✅ Eventos criados:', data);
      return data || [];
    } catch (error) {
      console.error('❌ Erro ao criar eventos automáticos:', error);
      throw error;
    }
  }

  /**
   * Atualiza status de evento quando pedido muda de situação
   */
  static async updateEventStatusFromPedido(pedidoId: string, novoStatus: string): Promise<void> {
    try {
      // Mapear status do pedido para status do evento
      let eventStatus = 'scheduled';
      
      switch (novoStatus.toLowerCase()) {
        case 'confirmado':
        case 'processando':
          eventStatus = 'confirmed';
          break;
        case 'enviado':
        case 'em_transito':
          eventStatus = 'in_progress';
          break;
        case 'entregue':
        case 'concluido':
          eventStatus = 'completed';
          break;
        case 'cancelado':
          eventStatus = 'cancelled';
          break;
        default:
          eventStatus = 'scheduled';
      }

      const { error } = await supabase
        .from('logistic_events')
        .update({ status: eventStatus })
        .eq('related_pedido_id', pedidoId);

      if (error) throw error;

      console.log(`✅ Status de eventos atualizado para pedido ${pedidoId}: ${eventStatus}`);
    } catch (error) {
      console.error('❌ Erro ao atualizar status de eventos:', error);
      throw error;
    }
  }

  /**
   * Cria eventos de coleta e entrega em lote
   */
  static async createBulkDeliveryEvents(pedidos: any[]): Promise<void> {
    try {
      const events = [];
      
      for (const pedido of pedidos) {
        // Evento de entrega
        const deliveryEvent = {
          title: `Entrega - Pedido ${pedido.numero}`,
          description: `Entrega do pedido ${pedido.numero} para ${pedido.nome_cliente}`,
          type: 'delivery',
          status: 'scheduled',
          priority: pedido.valor_total > 1000 ? 'high' : 'medium',
          event_date: pedido.data_prevista || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          event_time: '14:00',
          duration_minutes: 120,
          location: `${pedido.cidade || ''}, ${pedido.uf || ''}`.trim(),
          customer_name: pedido.nome_cliente,
          tracking_code: pedido.codigo_rastreamento,
          related_pedido_id: pedido.id,
          integration_account_id: pedido.integration_account_id,
          notification_days_before: 2,
          notes: 'Evento criado automaticamente pelo sistema'
        };

        events.push(deliveryEvent);
      }

      if (events.length > 0) {
        const { error } = await supabase
          .from('logistic_events')
          .insert(events as any);

        if (error) throw error;

        console.log(`✅ ${events.length} eventos de entrega criados em lote`);
      }
    } catch (error) {
      console.error('❌ Erro ao criar eventos em lote:', error);
      throw error;
    }
  }

  /**
   * Obtém eventos próximos que precisam de notificação
   */
  static async getUpcomingNotifications(): Promise<LogisticEvent[]> {
    try {
      const today = new Date();
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('logistic_events')
        .select(`
          id, title, description, type, status, priority,
          event_date, event_time, duration_minutes,
          location, customer_name, tracking_code, transport_company,
          related_pedido_id, related_produto_id, integration_account_id,
          notification_days_before, reminder_sent, notes,
          created_at, updated_at
        `)
        .gte('event_date', today.toISOString().split('T')[0])
        .lte('event_date', nextWeek.toISOString().split('T')[0])
        .eq('reminder_sent', false)
        .in('status', ['scheduled', 'confirmed'])
        .order('event_date', { ascending: true });

      if (error) throw error;

      return (data || []).map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        type: event.type as any,
        status: event.status as any,
        priority: event.priority as any,
        date: event.event_date,
        time: event.event_time,
        duration: event.duration_minutes,
        location: event.location,
        customer: event.customer_name,
        tracking_code: event.tracking_code,
        transport_company: event.transport_company,
        notes: event.notes,
        created_at: event.created_at,
        updated_at: event.updated_at,
        reminder_sent: event.reminder_sent,
        notification_days_before: event.notification_days_before,
      }));
    } catch (error) {
      console.error('❌ Erro ao obter notificações:', error);
      throw error;
    }
  }

  /**
   * Marca evento como notificado
   */
  static async markAsNotified(eventId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('logistic_events')
        .update({ reminder_sent: true })
        .eq('id', eventId);

      if (error) throw error;

      console.log(`✅ Evento ${eventId} marcado como notificado`);
    } catch (error) {
      console.error('❌ Erro ao marcar evento como notificado:', error);
      throw error;
    }
  }

  /**
   * Obtém eventos relacionados a um pedido específico
   */
  static async getEventsByPedido(pedidoId: string): Promise<LogisticEvent[]> {
    try {
      const { data, error } = await supabase
        .from('logistic_events')
        .select(`
          id, title, description, type, status, priority,
          event_date, event_time, duration_minutes,
          location, customer_name, tracking_code, transport_company,
          related_pedido_id, related_produto_id, integration_account_id,
          notification_days_before, reminder_sent, notes,
          created_at, updated_at
        `)
        .eq('related_pedido_id', pedidoId)
        .order('event_date', { ascending: true });

      if (error) throw error;

      return (data || []).map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        type: event.type as any,
        status: event.status as any,
        priority: event.priority as any,
        date: event.event_date,
        time: event.event_time,
        duration: event.duration_minutes,
        location: event.location,
        customer: event.customer_name,
        tracking_code: event.tracking_code,
        transport_company: event.transport_company,
        notes: event.notes,
        created_at: event.created_at,
        updated_at: event.updated_at,
        reminder_sent: event.reminder_sent,
        notification_days_before: event.notification_days_before,
      }));
    } catch (error) {
      console.error('❌ Erro ao obter eventos do pedido:', error);
      throw error;
    }
  }

  /**
   * Cria nota automaticamente vinculada a um pedido
   */
  static async createPedidoNote(pedidoId: string, title: string, content: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notes')
        .insert({
          title,
          content,
          color: 'azul',
          tags: ['pedido', 'automatico'],
          related_pedido_id: pedidoId,
          is_pinned: false,
          is_archived: false,
          is_shared: false
        } as any);

      if (error) throw error;

      console.log(`✅ Nota criada para pedido ${pedidoId}`);
    } catch (error) {
      console.error('❌ Erro ao criar nota do pedido:', error);
      throw error;
    }
  }

  /**
   * Obtém todas as notas relacionadas a um pedido
   */
  static async getNotesByPedido(pedidoId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('related_pedido_id', pedidoId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('❌ Erro ao obter notas do pedido:', error);
      throw error;
    }
  }
}