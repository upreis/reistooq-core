/**
 * ⏰ DEADLINE CALCULATOR
 * Calcula todos os prazos e deadlines de uma devolução
 */

import { logger } from './logger.ts';

export interface Deadlines {
  shipment_deadline: string | null;
  seller_receive_deadline: string | null;
  seller_review_deadline: string | null;
  meli_decision_deadline: string | null;
  expiration_date: string | null;
  
  // Horas restantes
  shipment_deadline_hours_left: number | null;
  seller_review_deadline_hours_left: number | null;
  
  // Flags de urgência
  is_shipment_deadline_critical: boolean;
  is_review_deadline_critical: boolean;
}

interface LeadTimeData {
  estimated_delivery_time?: {
    date?: string;
    shipping?: number;
    handling?: number;
  };
  estimated_schedule_limit?: {
    date?: string;
  };
}

interface ClaimData {
  players?: Array<{
    role?: string;
    type?: string;
    available_actions?: Array<{
      action?: string;
      due_date?: string;
    }>;
  }>;
}

/**
 * Calcula todos os deadlines de uma devolução
 */
export function calculateDeadlines(
  returnData: any,
  leadTime: LeadTimeData | null,
  claimData: ClaimData | null
): Deadlines {
  const created = new Date(returnData.date_created);
  const now = new Date();
  
  // 1. Prazo para comprador enviar (10 dias úteis ou do lead_time)
  let shipmentDeadline: Date | null = null;
  
  if (leadTime?.estimated_schedule_limit?.date) {
    shipmentDeadline = new Date(leadTime.estimated_schedule_limit.date);
  } else {
    // Fallback: 10 dias úteis após criação
    shipmentDeadline = addBusinessDays(created, 10);
  }
  
  // 2. Prazo para vendedor receber (shipment + lead_time.shipping)
  let sellerReceiveDeadline: Date | null = null;
  
  if (leadTime?.estimated_delivery_time?.shipping && shipmentDeadline) {
    sellerReceiveDeadline = addDays(shipmentDeadline, leadTime.estimated_delivery_time.shipping);
  } else if (shipmentDeadline) {
    // Fallback: +5 dias para entrega
    sellerReceiveDeadline = addDays(shipmentDeadline, 5);
  }
  
  // 3. Prazo para vendedor avaliar (do claim.players.available_actions.due_date)
  let sellerReviewDeadline: string | null = null;
  
  if (claimData?.players) {
    const sellerPlayer = claimData.players.find(
      p => p.role === 'seller' || p.role === 'respondent' || p.type === 'seller'
    );
    
    const reviewAction = sellerPlayer?.available_actions?.find(
      a => a.action === 'return_review_ok' || a.action === 'return_review_fail'
    );
    
    sellerReviewDeadline = reviewAction?.due_date || null;
    
    // Se não encontrou mas é FULL (intermediate_check), estimar 3 dias após recebimento
    if (!sellerReviewDeadline && returnData.intermediate_check && sellerReceiveDeadline) {
      sellerReviewDeadline = addDays(sellerReceiveDeadline, 3).toISOString();
    }
  }
  
  // 4. Calcular horas restantes
  const shipmentHoursLeft = shipmentDeadline 
    ? differenceInHours(shipmentDeadline, now)
    : null;
    
  const reviewHoursLeft = sellerReviewDeadline
    ? differenceInHours(new Date(sellerReviewDeadline), now)
    : null;
  
  // 5. Determinar criticidade (< 48 horas)
  const isShipmentCritical = shipmentHoursLeft !== null && shipmentHoursLeft > 0 && shipmentHoursLeft <= 48;
  const isReviewCritical = reviewHoursLeft !== null && reviewHoursLeft > 0 && reviewHoursLeft <= 48;
  
  const result: Deadlines = {
    shipment_deadline: shipmentDeadline?.toISOString() || null,
    seller_receive_deadline: sellerReceiveDeadline?.toISOString() || null,
    seller_review_deadline: sellerReviewDeadline,
    meli_decision_deadline: null, // TODO: calcular se for mediação
    expiration_date: returnData.expiration_date || null,
    
    shipment_deadline_hours_left: shipmentHoursLeft,
    seller_review_deadline_hours_left: reviewHoursLeft,
    is_shipment_deadline_critical: isShipmentCritical,
    is_review_deadline_critical: isReviewCritical,
  };
  
  logger.info(`Deadlines calculados para return ${returnData.id}`, {
    shipment_hours_left: shipmentHoursLeft,
    review_hours_left: reviewHoursLeft,
    is_critical: isShipmentCritical || isReviewCritical
  });
  
  return result;
}

/**
 * Adiciona dias úteis (pula finais de semana)
 */
function addBusinessDays(date: Date, days: number): Date {
  let result = new Date(date);
  let addedDays = 0;
  
  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    // Pular fins de semana (0 = domingo, 6 = sábado)
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      addedDays++;
    }
  }
  
  return result;
}

/**
 * Adiciona dias corridos
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Calcula diferença em horas
 */
function differenceInHours(futureDate: Date, pastDate: Date): number {
  return Math.floor((futureDate.getTime() - pastDate.getTime()) / (1000 * 60 * 60));
}
