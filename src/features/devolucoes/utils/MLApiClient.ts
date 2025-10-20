/**
 * 🌐 CLIENTE DA API DO MERCADO LIVRE
 * Centraliza todas as chamadas à edge function ml-api-direct
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { DevolucaoBuscaFilters } from '../hooks/useDevolucoesBusca';

/**
 * Busca claims e returns da API ML
 */
export const fetchClaimsAndReturns = async (
  accountId: string,
  sellerId: string,
  filters: DevolucaoBuscaFilters
) => {
  const { data: apiResponse, error: apiError } = await supabase.functions.invoke('ml-api-direct', {
    body: {
      action: 'get_claims_and_returns',
      integration_account_id: accountId,
      seller_id: sellerId,
      filters: {
        date_from: filters.dataInicio || '',
        date_to: filters.dataFim || '',
        status_claim: filters.statusClaim || '',
        claim_type: filters.claimType || '',
        stage: filters.stage || '',
        fulfilled: filters.fulfilled,
        quantity_type: filters.quantityType || '',
        reason_id: filters.reasonId || '',
        resource: filters.resource || ''
      }
    }
  });

  if (apiError) {
    throw apiError;
  }

  return apiResponse;
};

/**
 * Busca detalhes de um reason específico
 */
export const fetchReasonDetail = async (
  integrationAccountId: string,
  reasonId: string
) => {
  const { data: apiResponse, error: apiError } = await supabase.functions.invoke('ml-api-direct', {
    body: {
      action: 'get_reason_detail',
      integration_account_id: integrationAccountId,
      reason_id: reasonId
    }
  });

  if (apiError || !apiResponse?.success) {
    // ⚠️ Silenciar erro se for falta de token - normal em múltiplas contas
    if (apiResponse?.error !== 'Token ML não disponível') {
      logger.warn(`⚠️ Reason ${reasonId} não encontrado na API`, apiError);
    }
    return null;
  }

  return apiResponse?.data || null;
};

/**
 * Busca claims sem filtros (para enriquecimento completo)
 */
export const fetchAllClaims = async (
  accountId: string,
  sellerId: string
) => {
  const { data: apiResponse, error: apiError } = await supabase.functions.invoke('ml-api-direct', {
    body: {
      action: 'get_claims_and_returns',
      integration_account_id: accountId,
      seller_id: sellerId,
      filters: {
        date_from: '',
        date_to: '',
        status_claim: '',
        claim_type: '',
        stage: '',
        fulfilled: undefined,
        quantity_type: '',
        reason_id: '',
        resource: ''
      }
    }
  });

  if (apiError || !apiResponse?.success || !apiResponse?.data) {
    return null;
  }

  return apiResponse.data;
};
