/**
 * 🗂️ MAPEAMENTO DE STATUS ML
 * Mapeia status da API do Mercado Livre para labels PT-BR
 */

export const ML_ORDER_STATUS_MAP = {
  // Confirmados
  'confirmed': { label: 'Confirmado', color: 'blue' },
  'payment_required': { label: 'Aguardando Pagamento', color: 'yellow' },
  'payment_in_process': { label: 'Pagamento em Processo', color: 'yellow' },
  
  // Pagos
  'paid': { label: 'Pago', color: 'green' },
  
  // Cancelados
  'cancelled': { label: 'Cancelado', color: 'red' },
  
  // Outros
  'invalid': { label: 'Inválido', color: 'gray' },
} as const;

export const ML_SHIPPING_STATUS_MAP = {
  // Status principais de envio
  'to_be_agreed': { label: 'A Combinar', color: 'gray' },
  'pending': { label: 'Pendente', color: 'yellow' },
  'handling': { label: 'Em Preparação', color: 'blue' },
  'ready_to_ship': { label: 'Pronto para Envio', color: 'blue' },
  'shipped': { label: 'A Caminho', color: 'purple' },
  'delivered': { label: 'Entregue', color: 'green' },
  'not_delivered': { label: 'Não Entregue', color: 'red' },
  'not_verified': { label: 'Não Verificado', color: 'gray' },
  'cancelled': { label: 'Cancelado', color: 'gray' },
  'closed': { label: 'Fechado', color: 'gray' },
  'error': { label: 'Erro', color: 'red' },
  'active': { label: 'Ativo', color: 'blue' },
  'not_specified': { label: 'Não Especificado', color: 'gray' },
  'stale_ready_to_ship': { label: 'Pronto para Envio (Atrasado)', color: 'yellow' },
  'stale_shipped': { label: 'Enviado (Atrasado)', color: 'yellow' },
} as const;

export const ML_SHIPPING_SUBSTATUS_MAP = {
  // Pending substatuses
  'cost_exceeded': { label: 'Custo Excedido', description: 'O custo do envio foi excedido' },
  'under_review': { label: 'Em Revisão', description: 'Sob revisão (ex: fraude)' },
  'reviewed': { label: 'Revisado', description: 'Revisão concluída' },
  'fraudulent': { label: 'Fraudulento', description: 'Detectado como fraudulento' },
  'waiting_for_payment': { label: 'Aguardando Pagamento', description: 'Aguardando pagamento do frete' },
  'shipment_paid': { label: 'Frete Pago', description: 'O custo do frete foi pago' },
  'creating_route': { label: 'Criando Rota', description: 'Rota está sendo criada' },
  'manufacturing': { label: 'Fabricação', description: 'Em processo de fabricação' },
  'buffered': { label: 'Em Buffer', description: 'Aguardando processamento' },
  'creating_shipping_order': { label: 'Criando Ordem de Envio', description: 'Ordem de envio sendo criada' },
  
  // Handling substatuses
  'regenerating': { label: 'Regenerando', description: 'Regenerando dados de envio' },
  'waiting_for_label_generation': { label: 'Aguardando Etiqueta', description: 'Aguardando geração da etiqueta' },
  'invoice_pending': { label: 'Nota Fiscal Pendente', description: 'Aguardando nota fiscal' },
  'waiting_for_return_confirmation': { label: 'Aguardando Confirmação de Devolução', description: 'Aguardando confirmação de devolução' },
  'return_confirmed': { label: 'Devolução Confirmada', description: 'Devolução confirmada' },
  'agency_unavailable': { label: 'Agência Indisponível', description: 'Agência não disponível' },
  
  // Ready to ship substatuses
  'ready_to_print': { label: 'Pronto para Imprimir', description: 'Etiqueta pronta para impressão' },
  'printed': { label: 'Impresso', description: 'Etiqueta impressa' },
  'in_pickup_list': { label: 'Na Lista de Coleta', description: 'Incluído na lista de coleta' },
  'ready_for_pkl_creation': { label: 'Pronto para PKL', description: 'Pronto para criação de PKL' },
  'ready_for_pickup': { label: 'Pronto para Coleta', description: 'Aguardando coleta' },
  'ready_for_dropoff': { label: 'Pronto para Despacho', description: 'Pronto para ser despachado' },
  'picked_up': { label: 'Coletado', description: 'O vendedor enviou o seu pacote' },
  'stale': { label: 'Atrasado', description: 'Envio atrasado' },
  'dropped_off': { label: 'Despachado no Melipoint', description: 'Despachado no ponto Mercado Livre' },
  'delayed': { label: 'Atrasado', description: 'Envio com atraso' },
  'claimed_me': { label: 'Reclamado pelo Comprador', description: 'Envio reclamado pelo comprador' },
  'waiting_for_last_mile_authorization': { label: 'Aguardando Autorização', description: 'Aguardando autorização última milha' },
  'rejected_in_hub': { label: 'Rejeitado no Centro', description: 'Rejeitado no centro de distribuição' },
  'in_transit': { label: 'Em Trânsito', description: 'Em trânsito' },
  'in_warehouse': { label: 'No Armazém', description: 'No armazém' },
  'ready_to_pack': { label: 'Pronto para Embalar', description: 'Pronto para embalagem' },
  'in_hub': { label: 'No Centro de Distribuição', description: 'Recebido no centro de distribuição' },
  'measures_ready': { label: 'Medidas Prontas', description: 'Medidas e peso registrados' },
  'waiting_for_carrier_authorization': { label: 'Aguardando Transportadora', description: 'Aguardando autorização da transportadora' },
  'authorized_by_carrier': { label: 'Autorizado pela Transportadora', description: 'O vendedor enviou o seu pacote' },
  'in_packing_list': { label: 'Na Lista de Embalagem', description: 'Na lista de embalagem' },
  'in_plp': { label: 'No PLP', description: 'No PLP' },
  'on_hold': { label: 'Em Espera', description: 'Em espera' },
  'packed': { label: 'Embalado', description: 'Pacote embalado' },
  'on_route_to_pickup': { label: 'A Caminho da Coleta', description: 'A caminho para coleta' },
  'picking_up': { label: 'Coletando', description: 'Em processo de coleta' },
  'shipping_order_initialized': { label: 'Ordem Iniciada', description: 'Ordem de envio iniciada' },
  'looking_for_driver': { label: 'Buscando Motorista', description: 'Procurando motorista' },
  
  // Shipped substatuses
  'waiting_for_withdrawal': { label: 'Aguardando Retirada', description: 'Aguardando retirada' },
  'contact_with_carrier_required': { label: 'Contato Necessário', description: 'Necessário contato com transportadora' },
  'receiver_absent': { label: 'Destinatário Ausente', description: 'Destinatário não estava presente' },
  'reclaimed': { label: 'Reclamado', description: 'Envio reclamado' },
  'not_localized': { label: 'Não Localizado', description: 'Endereço não localizado' },
  'forwarded_to_third': { label: 'Encaminhado a Terceiros', description: 'Encaminhado para terceiros' },
  'soon_deliver': { label: 'Entrega em Breve', description: 'Será entregue em breve' },
  'refused_delivery': { label: 'Entrega Recusada', description: 'Entrega recusada pelo destinatário' },
  'bad_address': { label: 'Endereço Incorreto', description: 'Endereço inválido' },
  'changed_address': { label: 'Endereço Alterado', description: 'Endereço foi alterado' },
  'negative_feedback': { label: 'Feedback Negativo', description: 'Envio com feedback negativo' },
  'need_review': { label: 'Requer Revisão', description: 'Necessita revisão do status' },
  'operator_intervention': { label: 'Intervenção Necessária', description: 'Requer intervenção do operador' },
  'retained': { label: 'Retido', description: 'Pacote retido' },
  'out_for_delivery': { label: 'Saiu para Entrega', description: 'Saiu para entrega' },
  'delivery_failed': { label: 'Falha na Entrega', description: 'Tentativa de entrega falhou' },
  'waiting_for_confirmation': { label: 'Aguardando Confirmação', description: 'Aguardando confirmação' },
  'at_the_door': { label: 'Na Porta', description: 'Entregador na porta do comprador' },
  'buyer_edt_limit_stale': { label: 'Prazo Expirado', description: 'Prazo limite do comprador expirado' },
  'delivery_blocked': { label: 'Entrega Bloqueada', description: 'Entrega bloqueada' },
  'awaiting_tax_documentation': { label: 'Aguardando Documentação Fiscal', description: 'Aguardando documentação de impostos' },
  'dangerous_area': { label: 'Área Perigosa', description: 'Área de entrega perigosa' },
  'buyer_rescheduled': { label: 'Reagendado pelo Comprador', description: 'Comprador reagendou a entrega' },
  'failover': { label: 'Failover', description: 'Failover do sistema' },
  'at_customs': { label: 'Na Alfândega', description: 'Pacote na alfândega' },
  'delayed_at_customs': { label: 'Atrasado na Alfândega', description: 'Atrasado na alfândega' },
  'left_customs': { label: 'Liberado da Alfândega', description: 'Liberado da alfândega' },
  'missing_sender_payment': { label: 'Falta Pagamento Remetente', description: 'Falta pagamento do remetente' },
  'missing_sender_documentation': { label: 'Falta Documentação Remetente', description: 'Falta documentação do remetente' },
  'missing_recipient_documentation': { label: 'Falta Documentação Destinatário', description: 'Falta documentação do destinatário' },
  'missing_recipient_payment': { label: 'Falta Pagamento Destinatário', description: 'Falta pagamento do destinatário' },
  'import_taxes_paid': { label: 'Impostos Pagos', description: 'Impostos de importação pagos' },
  
  // Delivered substatuses
  'damaged': { label: 'Danificado', description: 'Pacote entregue danificado' },
  'fulfilled_feedback': { label: 'Confirmado por Feedback', description: 'Confirmado pelo feedback do comprador' },
  'no_action_taken': { label: 'Sem Ação', description: 'Comprador não tomou nenhuma ação' },
  'double_refund': { label: 'Reembolso Duplo', description: 'Reembolso duplicado' },
  'inferred': { label: 'Entrega Inferida', description: 'Entrega inferida pelo sistema' },
  
  // Not delivered substatuses
  'returning_to_sender': { label: 'Retornando ao Remetente', description: 'Retornando ao vendedor' },
  'to_review': { label: 'Para Revisão', description: 'Envio fechado para revisão' },
  'destroyed': { label: 'Destruído', description: 'Pacote destruído' },
  'cancelled_measurement_exceeded': { label: 'Cancelado por Medidas', description: 'Cancelado por exceder medidas' },
  'returned_to_hub': { label: 'Retornado ao Centro', description: 'Retornado ao centro de distribuição' },
  'returned_to_agency': { label: 'Retornado à Agência', description: 'Retornado à agência' },
  'picked_up_for_return': { label: 'Coletado para Devolução', description: 'Coletado para retorno' },
  'returning_to_warehouse': { label: 'Retornando ao Armazém', description: 'Retornando ao armazém' },
  'returning_to_hub': { label: 'Retornando ao Centro', description: 'Retornando ao centro' },
  'soon_to_be_returned': { label: 'Retorno em Breve', description: 'Será retornado em breve' },
  'return_failed': { label: 'Falha no Retorno', description: 'Falha no processo de retorno' },
  'in_storage': { label: 'Em Armazenagem', description: 'Em armazenamento' },
  'pending_recovery': { label: 'Recuperação Pendente', description: 'Aguardando recuperação' },
  'rejected_damaged': { label: 'Rejeitado Danificado', description: 'Rejeitado por dano' },
  'refunded_by_delay': { label: 'Reembolsado por Atraso', description: 'Reembolsado devido a atraso' },
  'delayed_to_hub': { label: 'Atrasado ao Centro', description: 'Atrasado para o centro' },
  'shipment_stopped': { label: 'Envio Parado', description: 'Envio interrompido' },
  'stolen': { label: 'Roubado', description: 'Pacote roubado' },
  'returned': { label: 'Devolvido', description: 'Devolvido ao remetente' },
  'confiscated': { label: 'Confiscado', description: 'Pacote confiscado' },
  'lost': { label: 'Perdido', description: 'Pacote perdido' },
  'recovered': { label: 'Recuperado', description: 'Pacote recuperado' },
  'returned_to_warehouse': { label: 'Devolvido ao Armazém', description: 'Devolvido ao armazém' },
  'not_recovered': { label: 'Não Recuperado', description: 'Não foi possível recuperar' },
  'detained_at_customs': { label: 'Retido na Alfândega', description: 'Retido pela alfândega' },
  'detained_at_origin': { label: 'Retido na Origem', description: 'Retido na origem' },
  'unclaimed': { label: 'Não Reclamado', description: 'Não reclamado pelo vendedor' },
  'import_tax_rejected': { label: 'Imposto Rejeitado', description: 'Imposto de importação rejeitado' },
  'import_tax_expired': { label: 'Imposto Expirado', description: 'Imposto de importação expirado' },
  'rider_not_found': { label: 'Entregador Não Encontrado', description: 'Não foi possível encontrar entregador' },
  
  // Cancelled substatuses
  'label_expired': { label: 'Etiqueta Expirada', description: 'Etiqueta de envio expirada' },
  'cancelled_manually': { label: 'Cancelado Manualmente', description: 'Cancelado manualmente' },
  'return_expired': { label: 'Devolução Expirada', description: 'Prazo de devolução expirado' },
  'return_session_expired': { label: 'Sessão de Devolução Expirada', description: 'Sessão de devolução expirada' },
  'unfulfillable': { label: 'Não Realizável', description: 'Não foi possível realizar' },
  'closed_by_user': { label: 'Fechado pelo Usuário', description: 'Usuário alterou o tipo de envio' },
  'pack_splitted': { label: 'Pacote Dividido', description: 'Pacote foi dividido' },
  'shipped_outside_me': { label: 'Enviado Fora do ML', description: 'Enviado fora do Mercado Livre' },
  'shipped_outside_me_trusted': { label: 'Enviado Fora (Confiável)', description: 'Enviado fora por vendedor confiável' },
  'inferred_shipped': { label: 'Envio Inferido', description: 'Envio inferido pelo sistema' },
  'service_unavailable': { label: 'Serviço Indisponível', description: 'Serviço não disponível' },
  'dismissed': { label: 'Dispensado', description: 'Envio dispensado' },
  'time_expired': { label: 'Tempo Expirado', description: 'Prazo expirado' },
  'pack_partially_cancelled': { label: 'Pacote Parcialmente Cancelado', description: 'Parte do pacote foi cancelada' },
  'rejected_manually': { label: 'Rejeitado Manualmente', description: 'Rejeitado manualmente' },
  'closed_store': { label: 'Loja Fechada', description: 'Loja fechada' },
  'out_of_range': { label: 'Fora de Alcance', description: 'Fora da área de entrega' },
} as const;

export const getOrderStatusLabel = (status: string) => {
  return ML_ORDER_STATUS_MAP[status as keyof typeof ML_ORDER_STATUS_MAP]?.label || status;
};

export const getOrderStatusColor = (status: string) => {
  return ML_ORDER_STATUS_MAP[status as keyof typeof ML_ORDER_STATUS_MAP]?.color || 'gray';
};

export const getShippingStatusLabel = (status: string) => {
  return ML_SHIPPING_STATUS_MAP[status as keyof typeof ML_SHIPPING_STATUS_MAP]?.label || status;
};

export const getShippingStatusColor = (status: string) => {
  return ML_SHIPPING_STATUS_MAP[status as keyof typeof ML_SHIPPING_STATUS_MAP]?.color || 'gray';
};

export const getShippingSubstatusLabel = (substatus: string) => {
  return ML_SHIPPING_SUBSTATUS_MAP[substatus as keyof typeof ML_SHIPPING_SUBSTATUS_MAP]?.label || substatus;
};

export const getShippingSubstatusDescription = (substatus: string) => {
  return ML_SHIPPING_SUBSTATUS_MAP[substatus as keyof typeof ML_SHIPPING_SUBSTATUS_MAP]?.description || null;
};
