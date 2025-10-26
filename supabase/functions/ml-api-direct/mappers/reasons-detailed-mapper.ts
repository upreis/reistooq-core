/**
 * 📋 DETAILED REASONS DATA MAPPER
 * Mapeia dados detalhados de reasons do endpoint /returns/reasons/{id}
 */

export function mapDetailedReasonsData(reasonsData: any) {
  if (!reasonsData) return null;

  return {
    reason_id: reasonsData.id || null,
    name: reasonsData.name || null,
    description: reasonsData.description || null,
    
    // Category and classification
    category: reasonsData.category || null,
    subcategory: reasonsData.subcategory || null,
    severity: reasonsData.severity || null,
    priority: reasonsData.priority || null,
    
    // Business rules
    rules: {
      auto_approve: reasonsData.rules?.auto_approve || false,
      requires_review: reasonsData.rules?.requires_review || false,
      requires_evidence: reasonsData.rules?.requires_evidence || false,
      max_days_for_claim: reasonsData.rules?.max_days_for_claim || null
    },
    
    // Expected resolutions
    expected_resolutions: reasonsData.expected_resolutions?.map((r: any) => ({
      type: r.type || null,
      percentage: r.percentage || null,
      conditions: r.conditions || []
    })) || [],
    
    // Workflow information
    workflow: {
      initial_status: reasonsData.workflow?.initial_status || null,
      possible_transitions: reasonsData.workflow?.possible_transitions || [],
      average_resolution_time: reasonsData.workflow?.average_resolution_time || null
    },
    
    // Statistics and analytics
    statistics: {
      total_claims: reasonsData.statistics?.total_claims || 0,
      approval_rate: reasonsData.statistics?.approval_rate || 0,
      average_amount: reasonsData.statistics?.average_amount || 0,
      most_common_resolution: reasonsData.statistics?.most_common_resolution || null
    },
    
    // Seller guidance
    seller_guidance: {
      prevention_tips: reasonsData.seller_guidance?.prevention_tips || [],
      resolution_steps: reasonsData.seller_guidance?.resolution_steps || [],
      documentation_required: reasonsData.seller_guidance?.documentation_required || []
    },
    
    // Active status
    is_active: reasonsData.is_active !== false,
    effective_from: reasonsData.effective_from || null,
    effective_until: reasonsData.effective_until || null,
    
    // Full raw data
    raw_data: reasonsData
  };
}

/**
 * Extrai campos específicos para salvar na tabela principal
 */
export function extractDetailedReasonsFields(reasonsData: any) {
  if (!reasonsData) return {};

  const mapped = mapDetailedReasonsData(reasonsData);
  
  return {
    reason_name: mapped?.name || null,
    reason_category: mapped?.category || null,
    reason_detail: mapped?.description || null,
    reason_priority: mapped?.priority || null,
    reason_expected_resolutions: mapped?.expected_resolutions?.map((r: any) => r.type) || null,
    reason_rules_engine: mapped?.rules ? Object.keys(mapped.rules).filter(k => mapped.rules[k] === true) : null,
    
    // Salvar dados completos no JSONB
    dados_reasons: mapped
  };
}
