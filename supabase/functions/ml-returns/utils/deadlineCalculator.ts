/**
 * 📅 DEADLINE CALCULATOR - Cálculo de Prazos de Devolução
 * 
 * Calcula todos os deadlines críticos de uma devolução do Mercado Livre:
 * - Prazo para comprador enviar produto
 * - Prazo para vendedor receber produto
 * - Prazo para vendedor revisar produto
 * - Prazo para Mercado Livre decidir
 * - Data de expiração da reclamação
 * 
 * IMPORTANTE: Usa dias úteis (exclui sábados e domingos)
 */

export interface Deadlines {
  // Prazos calculados
  shipment_deadline: string | null;           // Prazo para comprador enviar
  seller_receive_deadline: string | null;     // Prazo para vendedor receber
  seller_review_deadline: string | null;      // Prazo para vendedor revisar
  meli_decision_deadline: string | null;      // Prazo para ML decidir
  expiration_date: string | null;             // Data de expiração do claim
  
  // Horas restantes
  hours_to_shipment: number | null;           // Horas até prazo de envio
  hours_to_review: number | null;             // Horas até prazo de review
  
  // Flags de criticidade
  is_shipment_critical: boolean;              // Menos de 48h para envio
  is_review_critical: boolean;                // Menos de 48h para review
  
  // Metadados
  calculated_at: string;                      // Quando foi calculado
  business_days_used: boolean;                // Se usou dias úteis
}

export interface LeadTimeData {
  estimated_delivery_time?: {
    date?: string;
    shipping?: number;  // dias de envio
    handling?: number;  // dias de manuseio
    time_frame?: {
      from?: number;
      to?: number;
    };
  };
  estimated_delivery_limit?: {
    date?: string;
  };
}

export interface ClaimData {
  available_actions?: Array<{
    action?: string;
    due_date?: string;
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
  
  if (leadTime?.estimated_delivery_time?.shipping) {
    // Usar dados do lead time
    const shippingDays = leadTime.estimated_delivery_time.shipping;
    shipmentDeadline = addBusinessDays(created, shippingDays);
  } else {
    // Fallback: 10 dias úteis padrão do ML
    shipmentDeadline = addBusinessDays(created, 10);
  }
  
  // 2. Prazo para vendedor receber (shipment + tempo de envio)
  let sellerReceiveDeadline: Date | null = null;
  
  if (shipmentDeadline && leadTime?.estimated_delivery_time?.shipping) {
    const deliveryDays = leadTime.estimated_delivery_time.shipping || 3;
    sellerReceiveDeadline = addBusinessDays(shipmentDeadline, deliveryDays);
  } else if (shipmentDeadline) {
    // Fallback: + 3 dias úteis de envio
    sellerReceiveDeadline = addBusinessDays(shipmentDeadline, 3);
  }
  
  // 3. Prazo para vendedor revisar (buscar do claim ou estimar)
  let sellerReviewDeadline: Date | null = null;
  
  // Tentar buscar do claim available_actions
  if (claimData?.available_actions) {
    const reviewAction = claimData.available_actions.find(
      (action) => action.action === 'review' || action.action === 'review_product'
    );
    
    if (reviewAction?.due_date) {
      sellerReviewDeadline = new Date(reviewAction.due_date);
    }
  }
  
  // Se não encontrou, estimar (receive + 5 dias úteis)
  if (!sellerReviewDeadline && sellerReceiveDeadline) {
    sellerReviewDeadline = addBusinessDays(sellerReceiveDeadline, 5);
  }
  
  // 4. Prazo para ML decidir (review + 3 dias úteis)
  let meliDecisionDeadline: Date | null = null;
  
  if (sellerReviewDeadline) {
    meliDecisionDeadline = addBusinessDays(sellerReviewDeadline, 3);
  }
  
  // 5. Data de expiração do claim (do returnData)
  const expirationDate = returnData.expiration_date 
    ? new Date(returnData.expiration_date) 
    : null;
  
  // 6. Calcular horas restantes
  const hoursToShipment = shipmentDeadline 
    ? differenceInHours(shipmentDeadline, now) 
    : null;
  
  const hoursToReview = sellerReviewDeadline 
    ? differenceInHours(sellerReviewDeadline, now) 
    : null;
  
  // 7. Flags de criticidade (menos de 48h)
  const isShipmentCritical = hoursToShipment !== null && hoursToShipment <= 48 && hoursToShipment > 0;
  const isReviewCritical = hoursToReview !== null && hoursToReview <= 48 && hoursToReview > 0;
  
  return {
    shipment_deadline: shipmentDeadline?.toISOString() || null,
    seller_receive_deadline: sellerReceiveDeadline?.toISOString() || null,
    seller_review_deadline: sellerReviewDeadline?.toISOString() || null,
    meli_decision_deadline: meliDecisionDeadline?.toISOString() || null,
    expiration_date: expirationDate?.toISOString() || null,
    hours_to_shipment: hoursToShipment,
    hours_to_review: hoursToReview,
    is_shipment_critical: isShipmentCritical,
    is_review_critical: isReviewCritical,
    calculated_at: new Date().toISOString(),
    business_days_used: true,
  };
}

/**
 * Adiciona dias úteis a uma data (pula fins de semana)
 */
function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let addedDays = 0;
  
  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    
    // Pular sábado (6) e domingo (0)
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      addedDays++;
    }
  }
  
  return result;
}

/**
 * Adiciona dias corridos a uma data
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Calcula diferença em horas entre duas datas
 */
function differenceInHours(futureDate: Date, pastDate: Date): number {
  const diffMs = futureDate.getTime() - pastDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60));
}
