/**
 * 🔍 REVIEWS DATA MAPPER
 * Mapeia dados de reviews do endpoint /v2/returns/{id}/reviews
 * 
 * ✅ ESTRUTURA REAL DA API ML (conforme documentação oficial):
 * {
 *   "reviews": [
 *     {
 *       "resource": "order",
 *       "resource_id": 2000008958860420,
 *       "method": "triage" | "none",
 *       "resource_reviews": [
 *         {
 *           "stage": "closed" | "pending" | "seller_review_pending" | "timeout",
 *           "status": "success" | "failed" | null,
 *           "product_condition": "saleable" | "unsaleable" | "discard" | "missing",
 *           "product_destination": "seller" | "buyer" | "meli",
 *           "reason_id": "accepted" | "different_product" | ...,
 *           "benefited": "buyer" | "seller" | "both" | null,
 *           "seller_status": "pending" | "success" | "failed" | "claimed",
 *           "seller_reason": "SRF2" | "SRF3" | ...,
 *           "missing_quantity": 1
 *         }
 *       ],
 *       "date_created": "2024-08-27T14:58:21.978Z",
 *       "last_updated": "2024-08-27T14:58:21.978Z"
 *     }
 *   ]
 * }
 */

export function mapReviewsData(reviewsData: any, reviewReasons: any[] = []) {
  console.log(`🔍 [MAPPER REVIEWS] Input:`, {
    hasReviews: !!reviewsData?.reviews,
    reviewsCount: reviewsData?.reviews?.length || 0,
    hasReasons: reviewReasons.length > 0
  });
  
  if (!reviewsData?.reviews || reviewsData.reviews.length === 0) {
    console.log(`⚠️ [MAPPER REVIEWS] Sem reviews para mapear - reviewsData vazio`);
    return null;
  }

  const firstReview = reviewsData.reviews[0];
  const resourceReview = firstReview.resource_reviews?.[0];
  
  console.log(`🔍 [MAPPER REVIEWS] Estrutura:`, {
    hasFirstReview: !!firstReview,
    hasResourceReviews: !!resourceReview,
    stage: resourceReview?.stage,
    status: resourceReview?.status,
    sellerReason: resourceReview?.seller_reason
  });

  // ✅ FASE 10: Extrair anexos se existirem
  const attachments = resourceReview?.attachments?.map((att: any) => ({
    id: att.id || att.attachment_id,
    url: att.url || att.attachment_url,
    type: att.type || att.content_type || 'unknown',
    filename: att.filename || att.name,
    description: att.description
  })) || [];

  // ✅ FASE 10: Buscar descrição da razão de falha
  const sellerReasonId = resourceReview?.seller_reason;
  const sellerReasonDescription = sellerReasonId 
    ? reviewReasons.find(r => r.id === sellerReasonId)?.detail 
    : null;

  // ✅ NOVO: Extrair available_actions do claim players
  const availableActions = reviewsData.players?.find((p: any) => p.role === 'respondent')?.available_actions?.map((action: any) => ({
    action: action.action,
    mandatory: action.mandatory || false,
    due_date: action.due_date || null
  })) || [];

  // ✅ NOVO: Mapear resolution completa
  const resolution = reviewsData.resolution ? {
    reason: reviewsData.resolution.reason,
    date_created: reviewsData.resolution.date_created,
    benefited: Array.isArray(reviewsData.resolution.benefited) 
      ? reviewsData.resolution.benefited 
      : [reviewsData.resolution.benefited],
    closed_by: reviewsData.resolution.closed_by,
    applied_coverage: reviewsData.resolution.applied_coverage
  } : null;

  return {
    // ✅ Identificação (nível do review)
    resource: firstReview.resource || null, // 'order'
    resource_id: firstReview.resource_id?.toString() || null,
    method: firstReview.method || null, // 'triage' (MELI) ou 'none' (vendedor)
    
    // ✅ Status do review (nível do resource_review)
    stage: resourceReview?.stage || null, // 'closed', 'pending', 'seller_review_pending', 'timeout'
    status: resourceReview?.status || null, // 'success', 'failed', null
    
    // ✅ Condição e destino do produto
    product_condition: resourceReview?.product_condition || null, // 'saleable', 'unsaleable', 'discard', 'missing'
    product_destination: resourceReview?.product_destination || null, // 'seller', 'buyer', 'meli'
    reason_id: resourceReview?.reason_id || null, // 'accepted', 'different_product', etc
    
    // ✅ Beneficiado pela revisão
    benefited: resourceReview?.benefited || null, // 'buyer', 'seller', 'both'
    
    // ✅ Status do vendedor
    seller_status: resourceReview?.seller_status || null, // 'pending', 'success', 'failed', 'claimed'
    seller_reason: sellerReasonId, // 'SRF2', 'SRF3', 'SRF6', 'SRF7'
    
    // ✅ FASE 10: Dados detalhados da revisão do vendedor
    seller_reason_description: sellerReasonDescription,
    seller_message: resourceReview?.seller_message || resourceReview?.message || null,
    seller_attachments: attachments,
    
    // ✅ Quantidade faltante/danificada (quando produto não chegou)
    missing_quantity: resourceReview?.missing_quantity || 0,
    damaged_quantity: resourceReview?.damaged_quantity || 0,
    
    // ✅ FASE 10: Decisão do MELI (se houver)
    meli_resolution: resourceReview?.meli_decision ? {
      date: resourceReview.meli_decision.date || new Date().toISOString(),
      reason: resourceReview.meli_decision.reason,
      final_benefited: resourceReview.meli_decision.benefited || resourceReview.benefited,
      comments: resourceReview.meli_decision.comments,
      decided_by: resourceReview.meli_decision.decided_by || 'MELI'
    } : null,
    
    // ✅ FASE 10: Razões disponíveis para o vendedor
    available_reasons: reviewReasons,
    
    // ✅ NOVO: Available Actions do vendedor
    available_actions: availableActions,
    
    // ✅ NOVO: Resolution completa
    resolution: resolution,
    
    // ✅ Datas
    date_created: firstReview.date_created || null,
    last_updated: firstReview.last_updated || null,
    
    // ✅ Dados completos para análise futura
    raw_data: reviewsData,
    all_reviews: reviewsData.reviews || [] // Múltiplos reviews se existirem
  };
}

/**
 * Extrai campos específicos para salvar na tabela principal
 * ✅ CORRIGIDO: Usa estrutura real reviews[].resource_reviews[]
 */
export function extractReviewsFields(reviewsData: any) {
  if (!reviewsData) return {};

  const mapped = mapReviewsData(reviewsData);
  
  return {
    // ✅ Campos principais do review
    review_id: mapped?.resource_id?.toString() || null,
    review_status: mapped?.status || null, // 'success', 'failed', null (resultado da revisão)
    review_stage: mapped?.stage || null, // 'closed', 'pending', 'seller_review_pending', 'timeout' (etapa)
    review_result: mapped?.status || null, // 'success', 'failed' (duplicado para compatibilidade)
    
    // ✅ Score de qualidade calculado
    score_qualidade: (() => {
      if (!mapped) return null;
      
      // Score baseado no resultado da revisão
      if (mapped.status === 'success' && mapped.product_condition === 'saleable') {
        return 95; // Produto OK
      } else if (mapped.status === 'success') {
        return 80; // Aprovado mas com ressalvas
      } else if (mapped.status === 'failed') {
        if (mapped.product_condition === 'missing') return 0; // Produto não chegou
        if (mapped.product_condition === 'discard') return 10; // Produto descartado
        if (mapped.product_condition === 'unsaleable') return 30; // Não vendável
        return 50; // Falhou por outro motivo
      }
      return 70; // Padrão quando não há status
    })(),
    
    // ✅ Necessita ação manual
    necessita_acao_manual: mapped?.stage === 'seller_review_pending' || 
                           mapped?.seller_status === 'pending' ||
                           mapped?.stage === 'timeout',
    
    // ✅ Responsável pela revisão
    revisor_responsavel: mapped?.method === 'triage' ? 'MELI' : 'SELLER',
    
    // ✅ Observações
    observacoes_review: (() => {
      if (!mapped) return null;
      const parts = [];
      if (mapped.product_condition) parts.push(`Condição: ${mapped.product_condition}`);
      if (mapped.benefited) parts.push(`Beneficiado: ${mapped.benefited}`);
      if (mapped.seller_reason) parts.push(`Motivo vendedor: ${mapped.seller_reason}`);
      return parts.length > 0 ? parts.join(' | ') : null;
    })(),
    
    // ✅ Categoria do problema (baseado em reason_id)
    categoria_problema: mapped?.reason_id || mapped?.product_condition || null,
    
    // Salvar dados completos no JSONB
    dados_reviews: mapped
  };
}
