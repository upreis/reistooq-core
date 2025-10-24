/**
 * ⚖️ MEDIATION SERVICE
 * Gerencia busca de mediações do Mercado Livre
 */

import { fetchMLWithRetry } from '../utils/retryHandler.ts';
import { logger } from '../utils/logger.ts';

export class MediationService {
  /**
   * Buscar mediação (apenas se claim tiver mediation_id)
   */
  async fetchMediationIfExists(
    claim: any,
    claimId: string,
    accessToken: string,
    integrationAccountId: string
  ): Promise<any | null> {
    // ✅ Só buscar se claim tiver mediation_id ou stage = dispute (conforme doc ML)
    const hasMediationId = claim.mediation_id || claim.stage === 'dispute'; // ✅ CORRIGIDO: dispute (não mediation)
    
    if (!hasMediationId) {
      return { has_mediation: false };
    }
    
    const url = `https://api.mercadolibre.com/post-purchase/v1/mediations/${claimId}`;
    
    try {
      const response = await fetchMLWithRetry(url, accessToken, integrationAccountId);
      
      if (response.ok) {
        logger.debug(`Mediação encontrada para claim ${claimId}`);
        return response.json();
      }
      
      if (response.status === 404) {
        logger.debug(`Mediação não disponível para claim ${claimId}`);
      }
      
      return null;
    } catch (error) {
      logger.debug(`Erro ao buscar mediação ${claimId}`, error);
      return null;
    }
  }
}
