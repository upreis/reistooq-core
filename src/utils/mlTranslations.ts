/**
 * 🌐 TRADUÇÕES DO MERCADO LIVRE
 * Sistema híbrido: mapeamentos específicos + tradução genérica
 */

// ========================================
// 1️⃣ STATUS DA DEVOLUÇÃO
// ========================================
export const STATUS_DEVOLUCAO_MAP: Record<string, string> = {
  'opened': 'Aberto',
  'closed': 'Fechado',
  'completed': 'Completo',
  'cancelled': 'Cancelado',
  'pending': 'Pendente',
  'in_process': 'Em Processo',
  'waiting_buyer': 'Aguardando Comprador',
  'waiting_seller': 'Aguardando Vendedor'
};

// ========================================
// 2️⃣ RESOLUÇÃO (resolution.reason)
// ========================================
export const RESOLUCAO_MAP: Record<string, string> = {
  'already_shipped': 'Produto a caminho',
  'buyer_claim_opened': 'Devolução encerrada por nova reclamação',
  'buyer_dispute_opened': 'Devolução encerrada por nova disputa',
  'charged_back': 'Encerramento por chargeback',
  'coverage_decision': 'Disputa encerrada com cobertura do ML',
  'found_missing_parts': 'Comprador encontrou peças faltantes',
  'item_returned': 'Produto devolvido',
  'no_bpp': 'Encerramento sem cobertura do ML',
  'not_delivered': 'Produto não entregue',
  'opened_claim_by_mistake': 'Reclamação aberta por engano',
  'partial_refunded': 'Reembolso parcial concedido',
  'payment_refunded': 'Pagamento reembolsado',
  'prefered_to_keep_product': 'Comprador preferiu ficar com o produto',
  'product_delivered': 'Produto entregue',
  'reimbursed': 'Reembolsado',
  'rep_resolution': 'Decisão do representante ML',
  'respondent_timeout': 'Vendedor não respondeu',
  'return_canceled': 'Devolução cancelada pelo comprador',
  'return_expired': 'Devolução expirada',
  'seller_asked_to_close_claim': 'Vendedor pediu para fechar',
  'seller_did_not_help': 'Resolvido sem ajuda do vendedor',
  'seller_explained_functions': 'Vendedor explicou funcionamento',
  'seller_sent_product': 'Vendedor enviou o produto',
  'timeout': 'Encerrado por inatividade',
  'warehouse_decision': 'Decisão do depósito',
  'warehouse_timeout': 'Expiração de tempo no depósito',
  'worked_out_with_seller': 'Resolvido diretamente com vendedor',
  'low_cost': 'Custo de envio maior que valor',
  'item_changed': 'Troca concluída',
  'change_expired': 'Troca não realizada no prazo',
  'change_cancelled_buyer': 'Troca cancelada pelo comprador',
  'change_cancelled_seller': 'Troca cancelada pelo vendedor',
  'change_cancelled_meli': 'Troca cancelada pelo ML',
  'shipment_not_stopped': 'Envio não foi interrompido',
  'cancel_installation': 'Cancelamento de instalação'
};

// ========================================
// 3️⃣ TIPO DE RECLAMAÇÃO (type)
// ========================================
export const TIPO_CLAIM_MAP: Record<string, string> = {
  'mediations': 'Mediação',
  'return': 'Devolução',
  'fulfillment': 'Fulfillment',
  'ml_case': 'Caso ML',
  'cancel_sale': 'Cancelamento de Venda',
  'cancel_purchase': 'Cancelamento de Compra',
  'change': 'Troca',
  'service': 'Serviço'
};

// ========================================
// 4️⃣ RESULTADO MEDIAÇÃO (stage)
// ========================================
export const STAGE_MAP: Record<string, string> = {
  'claim': 'Reclamação',
  'dispute': 'Disputa',
  'recontact': 'Recontato',
  'none': 'Nenhum',
  'stale': 'Inativo'
};

// ========================================
// 5️⃣ RESULTADO FINAL (resolution.reason combinado com benefited)
// ========================================
export const RESULTADO_FINAL_MAP: Record<string, string> = {
  'favor_comprador': 'A Favor do Comprador',
  'favor_vendedor': 'A Favor do Vendedor',
  'acordo_mutuo': 'Acordo Mútuo',
  'sem_resolucao': 'Sem Resolução'
};

// ========================================
// 6️⃣ RESPONSÁVEL CUSTO (shipping_return.cost.beneficiary)
// ========================================
export const RESPONSAVEL_CUSTO_MAP: Record<string, string> = {
  'buyer': 'Comprador',
  'seller': 'Vendedor',
  'meli': 'Mercado Livre',
  'shared': 'Compartilhado',
  'complainant': 'Reclamante',
  'respondent': 'Reclamado'
};

// ========================================
// 7️⃣ TAGS PEDIDO (internal_tags)
// ========================================
export const TAGS_PEDIDO_MAP: Record<string, string> = {
  'invoiced': 'Faturado',
  'not_delivered': 'Não Entregue',
  'paid': 'Pago',
  'not_paid': 'Não Pago',
  'fulfilled': 'Cumprido',
  'pending_payment': 'Pagamento Pendente',
  'cancelled': 'Cancelado',
  'resolved': 'Resolvido',
  'mediated': 'Mediado',
  'exchange': 'Troca',
  'refund': 'Reembolso',
  'has_shipping': 'Tem Envio'
};

// ========================================
// 8️⃣ FUNÇÃO GENÉRICA - Para campos não mapeados
// ========================================
export const traduzirGenerico = (valor: string | null | undefined): string => {
  if (!valor) return '-';
  
  // ✅ PROTEÇÃO: Garantir que valor é string
  const valorString = typeof valor === 'string' ? valor : String(valor);
  
  return valorString
    .replace(/_/g, ' ') // Substitui _ por espaço
    .split(' ')
    .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase())
    .join(' ');
};

// ========================================
// 9️⃣ FUNÇÕES DE TRADUÇÃO POR CAMPO
// ========================================
export const traduzirStatusDevolucao = (status: string | null | undefined): string => {
  if (!status) return '-';
  return STATUS_DEVOLUCAO_MAP[status] || traduzirGenerico(status);
};

export const traduzirResolucao = (resolucao: string | null | undefined): string => {
  if (!resolucao) return '-';
  return RESOLUCAO_MAP[resolucao] || traduzirGenerico(resolucao);
};

export const traduzirTipoClaim = (tipo: string | null | undefined): string => {
  if (!tipo) return '-';
  return TIPO_CLAIM_MAP[tipo] || traduzirGenerico(tipo);
};

export const traduzirStage = (stage: string | null | undefined): string => {
  if (!stage) return '-';
  return STAGE_MAP[stage] || traduzirGenerico(stage);
};

export const traduzirResultadoFinal = (resultado: string | null | undefined): string => {
  if (!resultado) return '-';
  return RESULTADO_FINAL_MAP[resultado] || traduzirGenerico(resultado);
};

export const traduzirResponsavelCusto = (responsavel: string | null | undefined): string => {
  if (!responsavel) return '-';
  return RESPONSAVEL_CUSTO_MAP[responsavel] || traduzirGenerico(responsavel);
};

export const traduzirTag = (tag: string | null | undefined): string => {
  if (!tag) return '';
  return TAGS_PEDIDO_MAP[tag] || traduzirGenerico(tag);
};

export const traduzirTags = (tags: string[] | null | undefined): string[] => {
  if (!tags || tags.length === 0) return [];
  return tags.map(tag => traduzirTag(tag));
};
