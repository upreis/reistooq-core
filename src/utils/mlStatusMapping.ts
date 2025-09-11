// Mapeamento completo dos status e sub-status do MercadoLivre para português
export interface StatusMapping {
  portuguese: string;
  description?: string;
}

// Status principais do MercadoLivre
export const ML_STATUS_MAP: Record<string, StatusMapping> = {
  // Status principais
  'confirmed': { portuguese: 'Confirmado' },
  'payment_required': { portuguese: 'Aguardando Pagamento' },
  'payment_in_process': { portuguese: 'Processando Pagamento' },
  'paid': { portuguese: 'Pago' },
  'partially_paid': { portuguese: 'Parcialmente Pago' },
  'partially_refunded': { portuguese: 'Parcialmente Reembolsado' },
  'pending_cancel': { portuguese: 'Cancelamento Pendente' },
  'shipped': { portuguese: 'Enviado' },
  'delivered': { portuguese: 'Entregue' },
  'cancelled': { portuguese: 'Cancelado' },
  'invalid': { portuguese: 'Inválido' },
  'not_processed': { portuguese: 'Não Processado' },
  'pending': { portuguese: 'Pendente' },
  'active': { portuguese: 'Ativo' },
  'completed': { portuguese: 'Concluído' },
  'expired': { portuguese: 'Expirado' },
  'paused': { portuguese: 'Pausado' },
};

// Sub-status detalhados de envio do MercadoLivre (40+ status)
export const ML_SHIPPING_SUBSTATUS_MAP: Record<string, StatusMapping> = {
  // Status principais de envio
  'pending': { portuguese: 'Pendente', description: 'Aguardando processamento' },
  'handling': { portuguese: 'Preparando', description: 'Preparando para envio' },
  'ready_to_ship': { portuguese: 'Pronto para Enviar', description: 'Pronto para despacho' },
  'shipped': { portuguese: 'A Caminho', description: 'Em transporte' },
  'delivered': { portuguese: 'Entregue', description: 'Entrega concluída' },
  'not_delivered': { portuguese: 'Não Entregue', description: 'Falha na entrega' },
  'cancelled': { portuguese: 'Cancelado', description: 'Envio cancelado' },
  
  // Status detalhados de trânsito
  'in_transit': { portuguese: 'Em Trânsito', description: 'Mercadoria em movimento' },
  'out_for_delivery': { portuguese: 'Saiu para Entrega', description: 'Veículo a caminho do destino' },
  'returning_to_sender': { portuguese: 'Retornando ao Remetente', description: 'Retorno ao vendedor' },
  'delivery_failed': { portuguese: 'Falha na Entrega', description: 'Tentativa de entrega sem sucesso' },
  'receiver_absent': { portuguese: 'Destinatário Ausente', description: 'Ninguém no local de entrega' },
  'damaged': { portuguese: 'Danificado', description: 'Produto com avarias' },
  'lost': { portuguese: 'Perdido', description: 'Mercadoria extraviada' },
  'delayed': { portuguese: 'Atrasado', description: 'Entrega com atraso' },
  'picked_up': { portuguese: 'Coletado', description: 'Retirado pelo transportador' },
  'dropped_off': { portuguese: 'Despachado', description: 'Entregue ao transportador' },
  
  // Status aduaneiros
  'at_customs': { portuguese: 'Na Alfândega', description: 'Em processo aduaneiro' },
  'delayed_at_customs': { portuguese: 'Retido na Alfândega', description: 'Retenção para verificação' },
  'left_customs': { portuguese: 'Liberado da Alfândega', description: 'Desembaraço concluído' },
  
  // Status de rejeição/problemas
  'refused_delivery': { portuguese: 'Recusou a Entrega', description: 'Destinatário recusou receber' },
  'waiting_for_withdrawal': { portuguese: 'Aguardando Retirada', description: 'Disponível para coleta' },
  'contact_with_carrier_required': { portuguese: 'Contato com Transportadora Necessário', description: 'Ação do destinatário requerida' },
  'not_localized': { portuguese: 'Não Localizado', description: 'Endereço não encontrado' },
  'forwarded_to_third': { portuguese: 'Encaminhado para Terceiros', description: 'Redirecionado' },
  'soon_deliver': { portuguese: 'Entrega em Breve', description: 'Próximo da entrega' },
  'bad_address': { portuguese: 'Endereço Incorreto', description: 'Dados de endereço inválidos' },
  'changed_address': { portuguese: 'Endereço Alterado', description: 'Mudança de destino' },
  'stale': { portuguese: 'Parado', description: 'Sem movimentação' },
  'claimed_me': { portuguese: 'Reclamado pelo Comprador', description: 'Disputa aberta' },
  'retained': { portuguese: 'Retido', description: 'Retenção administrativa' },
  'stolen': { portuguese: 'Roubado', description: 'Furto/roubo reportado' },
  'returned': { portuguese: 'Devolvido', description: 'Retorno completo' },
  'confiscated': { portuguese: 'Confiscado', description: 'Apreendido por autoridades' },
  'destroyed': { portuguese: 'Destruído', description: 'Mercadoria destruída' },
  'in_storage': { portuguese: 'Em Depósito', description: 'Armazenado temporariamente' },
  'pending_recovery': { portuguese: 'Aguardando Recuperação', description: 'Processo de recuperação' },
  'agency_unavailable': { portuguese: 'Agência Indisponível', description: 'Local de entrega fechado' },
  'rejected_damaged': { portuguese: 'Rejeitado por Danos', description: 'Recusado devido a avarias' },
  'refunded_by_delay': { portuguese: 'Reembolsado por Atraso', description: 'Compensação por demora' },
  'shipment_stopped': { portuguese: 'Envio Parado', description: 'Transporte interrompido' },
  'awaiting_tax_documentation': { portuguese: 'Aguardando Documentação Fiscal', description: 'Pendência tributária' },
  
  // Status adicionais específicos
  'to_be_agreed': { portuguese: 'A Combinar', description: 'Agendamento necessário' },
  'under_review': { portuguese: 'Em Análise', description: 'Verificação em andamento' },
  'customs_review': { portuguese: 'Revisão Alfandegária', description: 'Análise aduaneira' },
  'waiting_for_pickup': { portuguese: 'Aguardando Coleta', description: 'Pronto para retirada' },
  'delivery_attempt': { portuguese: 'Tentativa de Entrega', description: 'Tentando entregar' },
  'rescheduled': { portuguese: 'Reagendado', description: 'Nova data marcada' },
  'on_route': { portuguese: 'Em Rota', description: 'A caminho do destino' },
  'sorting_center': { portuguese: 'Centro de Triagem', description: 'Em processo de separação' },
  'loaded_on_truck': { portuguese: 'Carregado no Caminhão', description: 'Pronto para transporte' },
  'arrived_at_facility': { portuguese: 'Chegou à Unidade', description: 'Na unidade de distribuição' },
  'departed_facility': { portuguese: 'Saiu da Unidade', description: 'Deixou centro de distribuição' },
  'international_departure': { portuguese: 'Saída Internacional', description: 'Deixou país de origem' },
  'international_arrival': { portuguese: 'Chegada Internacional', description: 'Chegou ao país destino' },
  'processing_at_destination': { portuguese: 'Processando no Destino', description: 'Preparando para entrega local' },
};

/**
 * Mapeia status principal do ML para português
 */
export function mapMLStatus(mlStatus: string): string {
  if (!mlStatus) return 'Pendente';
  
  const mapping = ML_STATUS_MAP[mlStatus.toLowerCase()];
  return mapping?.portuguese || mlStatus;
}

/**
 * Mapeia sub-status de envio do ML para português
 */
export function mapMLShippingSubstatus(substatus: string): string | null {
  if (!substatus) return null;
  
  const mapping = ML_SHIPPING_SUBSTATUS_MAP[substatus.toLowerCase()];
  return mapping?.portuguese || substatus;
}

/**
 * Cria um status combinado com status principal + sub-status
 */
export function createCombinedStatus(mainStatus: string, substatus?: string | null): string {
  const mappedMainStatus = mapMLStatus(mainStatus);
  
  if (!substatus) {
    return mappedMainStatus;
  }
  
  const mappedSubstatus = mapMLShippingSubstatus(substatus);
  if (!mappedSubstatus) {
    return mappedMainStatus;
  }
  
  // Se o sub-status for igual ao status principal, mostrar apenas um
  if (mappedSubstatus === mappedMainStatus) {
    return mappedMainStatus;
  }
  
  return `${mappedMainStatus} • ${mappedSubstatus}`;
}

/**
 * Obtém descrição detalhada do sub-status
 */
export function getSubstatusDescription(substatus: string): string | null {
  if (!substatus) return null;
  
  const mapping = ML_SHIPPING_SUBSTATUS_MAP[substatus.toLowerCase()];
  return mapping?.description || null;
}

/**
 * Verifica se é um status de entrega bem-sucedida
 */
export function isDeliveredStatus(status: string, substatus?: string): boolean {
  const deliveredStatuses = ['delivered', 'entregue'];
  const deliveredSubstatuses = ['delivered'];
  
  return deliveredStatuses.includes(status?.toLowerCase()) || 
         (substatus && deliveredSubstatuses.includes(substatus.toLowerCase()));
}

/**
 * Verifica se é um status de problema/falha
 */
export function isProblemStatus(status: string, substatus?: string): boolean {
  const problemStatuses = ['cancelled', 'not_delivered', 'invalid'];
  const problemSubstatuses = [
    'delivery_failed', 'receiver_absent', 'damaged', 'lost', 
    'refused_delivery', 'not_localized', 'bad_address', 
    'stolen', 'confiscated', 'destroyed', 'rejected_damaged'
  ];
  
  return problemStatuses.includes(status?.toLowerCase()) || 
         (substatus && problemSubstatuses.includes(substatus.toLowerCase()));
}

/**
 * Obtém variante de badge baseada no status
 */
export function getStatusBadgeVariant(status: string, substatus?: string): "default" | "secondary" | "destructive" | "outline" {
  if (isDeliveredStatus(status, substatus)) {
    return 'default'; // Verde (sucesso)
  }
  
  if (isProblemStatus(status, substatus)) {
    return 'destructive'; // Vermelho (erro)
  }
  
  const inTransitStatuses = ['shipped', 'in_transit', 'out_for_delivery'];
  if (inTransitStatuses.includes(status?.toLowerCase()) || 
      (substatus && inTransitStatuses.includes(substatus.toLowerCase()))) {
    return 'secondary'; // Azul (em progresso)
  }
  
  return 'outline'; // Cinza (pendente)
}