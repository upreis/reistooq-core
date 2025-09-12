/**
 * 🎯 TIPOS DE STATUS UNIFICADOS - MERCADO LIVRE API
 * Baseado na documentação oficial ML para estrutura correta
 */

// ===== CATEGORIAS DE STATUS =====
export type OrderStatusCategory = 'order' | 'shipping' | 'substatus' | 'return';

// ===== 1️⃣ STATUS DO PEDIDO =====
export type OrderStatus = 
  | 'confirmed'
  | 'payment_required'
  | 'payment_in_process'
  | 'paid'
  | 'cancelled'
  | 'invalid'
  | 'paused'
  | 'expired'
  | 'partially_paid'
  | 'not_processed';

export type OrderStatusPT = 
  | 'Confirmado'
  | 'Aguardando Pagamento'
  | 'Processando Pagamento'
  | 'Pago'
  | 'Cancelado'
  | 'Inválido'
  | 'Pausado'
  | 'Expirado'
  | 'Parcialmente Pago'
  | 'Não Processado';

// ===== 2️⃣ STATUS DE ENVIO =====
export type ShippingStatus = 
  | 'pending'
  | 'handling'
  | 'ready_to_ship'
  | 'shipped'
  | 'delivered'
  | 'not_delivered'
  | 'cancelled'
  | 'to_be_agreed';

export type ShippingStatusPT = 
  | 'Pendente'
  | 'Preparando'
  | 'Pronto para Envio'
  | 'Enviado'
  | 'A Caminho'
  | 'Em Trânsito'
  | 'Entregue'
  | 'Não Entregue'
  | 'Cancelado'
  | 'A Combinar';

// ===== 3️⃣ SUBSTATUS DE ENVIO =====
export type ShippingSubstatus = 
  | 'delayed'
  | 'out_for_delivery'
  | 'receiver_absent'
  | 'returning_to_sender'
  | 'printed'
  | 'in_transit'
  | 'waiting_for_withdrawal'
  | 'bad_address'
  | 'refused_delivery'
  | 'dangerous_area'
  | 'buyer_rescheduled'
  | 'at_customs'
  | 'left_customs'
  | 'contact_with_carrier_required'
  | 'not_localized'
  | 'delivery_failed'
  | 'forwarded_to_third'
  | 'soon_deliver'
  | 'changed_address'
  | 'retained'
  | 'delivery_blocked'
  | 'at_the_door';

export type ShippingSubstatusPT = 
  | 'Atrasado'
  | 'Saiu para Entrega'
  | 'Destinatário Ausente'
  | 'Retornando ao Remetente'
  | 'Etiqueta Impressa'
  | 'Em Trânsito'
  | 'Aguardando Retirada'
  | 'Endereço Incorreto'
  | 'Entrega Recusada'
  | 'Área Perigosa'
  | 'Reagendado pelo Comprador'
  | 'Na Alfândega'
  | 'Liberado da Alfândega'
  | 'Contato com Transportadora Necessário'
  | 'Não Localizado'
  | 'Falha na Entrega'
  | 'Encaminhado para Terceiros'
  | 'Entrega em Breve'
  | 'Endereço Alterado'
  | 'Retido'
  | 'Entrega Bloqueada'
  | 'Na Porta do Destinatário';

// ===== 4️⃣ STATUS DE DEVOLUÇÃO =====
export type ReturnStatus = 
  | 'pending'
  | 'authorized'
  | 'to_be_returned'
  | 'returned'
  | 'refunded'
  | 'cancelled';

export type ReturnStatusPT = 
  | 'Devolução Pendente'
  | 'Devolução Autorizada'
  | 'A ser Devolvido'
  | 'Devolvido'
  | 'Reembolsado'
  | 'Devolução Cancelada'
  | 'Sem Devolução';

// ===== INTERFACES DE FILTROS =====
export interface StatusFilters {
  orderStatus: OrderStatusPT[];
  shippingStatus: ShippingStatusPT[];
  shippingSubstatus: ShippingSubstatusPT[];
  returnStatus: ReturnStatusPT[];
}

export interface StatusFilterConfig {
  category: OrderStatusCategory;
  label: string;
  options: { value: string; label: string; description?: string }[];
  multiple: boolean;
}

// ===== CONFIGURAÇÕES DE FILTROS =====
export const STATUS_FILTER_CONFIGS: Record<OrderStatusCategory, StatusFilterConfig> = {
  order: {
    category: 'order',
    label: 'Status do Pedido',
    multiple: true,
    options: [
      { value: 'Pago', label: 'Pago', description: 'Pedido com pagamento confirmado' },
      { value: 'Aguardando Pagamento', label: 'Aguardando Pagamento', description: 'Pagamento pendente' },
      { value: 'Processando Pagamento', label: 'Processando Pagamento', description: 'Pagamento em análise' },
      { value: 'Confirmado', label: 'Confirmado', description: 'Pedido confirmado' },
      { value: 'Cancelado', label: 'Cancelado', description: 'Pedido cancelado' },
      { value: 'Pausado', label: 'Pausado', description: 'Pedido pausado' },
    ]
  },
  shipping: {
    category: 'shipping',
    label: 'Status de Envio',
    multiple: true,
    options: [
      { value: 'Entregue', label: 'Entregue', description: 'Produto entregue ao cliente' },
      { value: 'Enviado', label: 'Enviado/A Caminho', description: 'Produto em trânsito' },
      { value: 'Pronto para Envio', label: 'Pronto para Envio', description: 'Aguardando coleta' },
      { value: 'Preparando', label: 'Preparando', description: 'Produto sendo preparado' },
      { value: 'Não Entregue', label: 'Não Entregue', description: 'Falha na entrega' },
      { value: 'Pendente', label: 'Pendente', description: 'Envio pendente' },
    ]
  },
  substatus: {
    category: 'substatus',
    label: 'Detalhes do Envio',
    multiple: true,
    options: [
      { value: 'Atrasado', label: 'Atrasado', description: 'Envio com atraso' },
      { value: 'Saiu para Entrega', label: 'Saiu para Entrega', description: 'Em rota de entrega' },
      { value: 'Destinatário Ausente', label: 'Destinatário Ausente', description: 'Cliente não localizado' },
      { value: 'Retornando ao Remetente', label: 'Retornando', description: 'Produto retornando' },
      { value: 'Endereço Incorreto', label: 'Endereço Incorreto', description: 'Problema no endereço' },
      { value: 'Em Trânsito', label: 'Em Trânsito', description: 'Produto em movimento' },
    ]
  },
  return: {
    category: 'return',
    label: 'Status de Devolução',
    multiple: true,
    options: [
      { value: 'Sem Devolução', label: 'Sem Devolução', description: 'Nenhuma devolução' },
      { value: 'Devolução Pendente', label: 'Devolução Pendente', description: 'Solicitação de devolução' },
      { value: 'Devolvido', label: 'Devolvido', description: 'Produto devolvido' },
      { value: 'Reembolsado', label: 'Reembolsado', description: 'Valor reembolsado' },
      { value: 'Devolução Autorizada', label: 'Devolução Autorizada', description: 'Devolução aprovada' },
    ]
  }
};

// ===== BADGES E CORES =====
export function getStatusBadgeVariant(status: string, category: OrderStatusCategory): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (category) {
    case 'order':
      if (['Pago', 'Confirmado'].includes(status)) return 'default';
      if (['Cancelado', 'Inválido'].includes(status)) return 'destructive';
      if (['Processando Pagamento'].includes(status)) return 'secondary';
      return 'outline';
      
    case 'shipping':
      if (['Entregue'].includes(status)) return 'default';
      if (['Não Entregue', 'Cancelado'].includes(status)) return 'destructive';
      if (['Enviado', 'A Caminho', 'Em Trânsito'].includes(status)) return 'secondary';
      return 'outline';
      
    case 'substatus':
      if (['Atrasado', 'Destinatário Ausente', 'Endereço Incorreto'].includes(status)) return 'destructive';
      if (['Saiu para Entrega', 'Em Trânsito'].includes(status)) return 'secondary';
      return 'outline';
      
    case 'return':
      if (['Reembolsado', 'Devolvido'].includes(status)) return 'destructive';
      if (['Devolução Autorizada'].includes(status)) return 'secondary';
      return 'outline';
      
    default:
      return 'outline';
  }
}