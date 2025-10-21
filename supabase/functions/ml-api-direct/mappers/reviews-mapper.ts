/**
 * 🔍 REVIEWS DATA MAPPER
 * Mapeia dados de reviews do endpoint /returns/{id}/reviews
 */

export function mapReviewsData(reviewsData: any) {
  if (!reviewsData) return null;

  return {
    review_id: reviewsData.id || null,
    review_status: reviewsData.status || null,
    review_result: reviewsData.result || null,
    review_type: reviewsData.type || null,
    created_at: reviewsData.date_created || null,
    closed_at: reviewsData.date_closed || null,
    
    // Player information
    player_role: reviewsData.player?.role || null,
    player_available_actions: reviewsData.player?.available_actions || [],
    
    // Quality assessment
    quality_score: reviewsData.quality?.score || null,
    quality_level: reviewsData.quality?.level || null,
    
    // Identified problems
    problems: reviewsData.problems?.map((p: any) => ({
      id: p.id || null,
      description: p.description || null,
      severity: p.severity || null,
      category: p.category || null
    })) || [],
    
    // Actions required
    required_actions: reviewsData.required_actions?.map((a: any) => ({
      action: a.action || null,
      deadline: a.deadline || null,
      status: a.status || null,
      description: a.description || null
    })) || [],
    
    // Metadata
    requires_manual_action: reviewsData.requires_manual_action || false,
    reviewer: reviewsData.reviewer || null,
    observations: reviewsData.observations || null,
    
    // Full raw data
    raw_data: reviewsData
  };
}

/**
 * Extrai campos específicos para salvar na tabela principal
 */
export function extractReviewsFields(reviewsData: any) {
  if (!reviewsData) return {};

  const mapped = mapReviewsData(reviewsData);
  
  return {
    review_id: mapped?.review_id || null,
    review_status: mapped?.review_status || null,
    review_result: mapped?.review_result || null,
    score_qualidade: mapped?.quality_score || null,
    necessita_acao_manual: mapped?.requires_manual_action || false,
    revisor_responsavel: mapped?.reviewer || null,
    observacoes_review: mapped?.observations || null,
    categoria_problema: mapped?.problems?.[0]?.category || null,
    
    // Salvar dados completos no JSONB
    dados_reviews: mapped
  };
}
