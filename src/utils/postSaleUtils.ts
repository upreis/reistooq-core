/**
 * 🎯 UTILIDADES PÓS-VENDA - DERIVAÇÃO DE STATUS
 * Funções client-side para extrair e traduzir status de envio
 */

function toTitle(s?: string) { 
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '—'; 
}

const ORDER_STATUS_EN_TO_PT: Record<string, string> = {
  confirmed: 'Confirmado', 
  payment_required: 'Aguardando pagamento',
  payment_in_process: 'Processando pagamento', 
  paid: 'Pago', 
  shipped: 'Enviado',
  delivered: 'Entregue', 
  cancelled: 'Cancelado', 
  invalid: 'Inválido'
};

const SHIPPING_STATUS_EN_TO_PT: Record<string, string> = {
  ready_to_ship: 'Pronto para envio', 
  handling: 'Pronto para envio',
  shipped: 'A caminho', 
  delivered: 'Entregue', 
  not_delivered: 'Não entregue'
};

const SHIPPING_SUBSTATUS_EN_TO_PT: Record<string, string> = {
  ready_to_print: 'Etiqueta pronta', 
  printed: 'Etiqueta impressa', 
  in_preparation: 'Em preparação',
  in_transit: 'Em trânsito', 
  in_hub: 'Em hub', 
  in_cross_docking: 'Em cross-docking',
  delayed: 'Atrasado', 
  returning_to_sender: 'Devolução em andamento',
  returned: 'Devolvido ao vendedor', 
  claimed_me: 'Reclamação aberta',
  reclaimed_me: 'Reclamação reaberta'
};

function isAfterNow(iso?: string | null) {
  if (!iso) return false; 
  const t = new Date(iso).getTime(); 
  return !Number.isNaN(t) && t < Date.now();
}

export function deriveStatuses(row: any) {
  const orderStatusEN = (row?.status || row?.order?.status || '').toLowerCase();
  const shipping = row?.shipping || row?.raw?.shipping || {};
  const shipStatusEN = (shipping.status || '').toLowerCase();
  const subEN = (shipping.substatus || '').toLowerCase();
  const tags = Array.isArray(shipping.tags) ? shipping.tags.map((t: string) => t.toLowerCase()) : [];
  const etaTo = shipping?.estimated_delivery_time?.to ?? null;

  const pedidoPT = ORDER_STATUS_EN_TO_PT[orderStatusEN] ?? toTitle(orderStatusEN);
  const envioPT = SHIPPING_STATUS_EN_TO_PT[shipStatusEN] ?? (shipStatusEN ? toTitle(shipStatusEN) : '—');
  const subPT = SHIPPING_SUBSTATUS_EN_TO_PT[subEN] ?? (subEN ? toTitle(subEN) : (tags[0] ? toTitle(tags[0]) : '—'));

  let devolucaoPT: '—' | 'Em devolução' | 'Devolvido' = '—';
  if (['returning_to_sender', 'claimed_me', 'reclaimed_me'].includes(subEN) || tags.includes('returning')) 
    devolucaoPT = 'Em devolução';
  if (subEN === 'returned' || tags.includes('returned_to_sender')) 
    devolucaoPT = 'Devolvido';

  const atrasado = shipStatusEN !== 'delivered' && (subEN === 'delayed' || isAfterNow(etaTo));

  return { pedidoPT, envioPT, subPT, devolucaoPT, etaTo, atrasado };
}

// Filtro client-side "Status de envio"
export function matchesShippingStatusFilter(order: any, selected: string[] | string): boolean {
  const { envioPT, devolucaoPT, atrasado } = deriveStatuses(order);
  const list = Array.isArray(selected) ? selected : [selected];
  return list.every((pt) => {
    const k = pt.toLowerCase().trim();
    if (['pronto para envio', 'pronto envio'].includes(k)) return envioPT === 'Pronto para envio';
    if (['a caminho', 'em trânsito', 'em transito'].includes(k)) return envioPT === 'A caminho';
    if (k === 'entregue') return envioPT === 'Entregue';
    if (['não entregue', 'nao entregue'].includes(k)) return envioPT === 'Não entregue';
    if (k === 'atrasado') return !!atrasado;
    if (['devolução em andamento', 'devolucao em andamento', 'devolucao'].includes(k)) return devolucaoPT === 'Em devolução';
    if (['devolvido', 'devolvido ao vendedor'].includes(k)) return devolucaoPT === 'Devolvido';
    return true;
  });
}