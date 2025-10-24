/**
 * 🏷️ REASONS SERVICE
 * Gerencia busca de reasons detalhados do Mercado Livre
 */

import { fetchMLWithRetry } from '../utils/retryHandler.ts';
import { logger } from '../utils/logger.ts';

export class ReasonsService {
  /**
   * Buscar detalhes completos de um reason usando a API oficial
   * GET /post-purchase/v1/claims/reasons/{reason_id}
   */
  async fetchReasonDetails(
    reasonId: string,
    accessToken: string,
    integrationAccountId: string
  ): Promise<any | null> {
    if (!reasonId) {
      return null;
    }

    const url = `https://api.mercadolibre.com/post-purchase/v1/claims/reasons/${reasonId}`;
    
    try {
      const response = await fetchMLWithRetry(url, accessToken, integrationAccountId);
      
      if (!response.ok) {
        if (response.status === 404) {
          logger.debug(`Reason ${reasonId} não encontrado (404)`);
          return null;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      logger.debug(`✅ Reason ${reasonId} carregado com sucesso`, {
        id: data.id,
        name: data.name,
        flow: data.flow,
        detail: data.detail
      });
      
      return {
        reason_id: data.id,
        reason_name: data.name,
        reason_detail: data.detail,
        reason_flow: data.flow,
        reason_category: data.filter?.group?.[0] || null,
        reason_position: data.position,
        reason_status: data.status,
        reason_parent_id: data.parent_id,
        reason_children_title: data.children_title,
        reason_site_ids: data.filter?.site_id || [],
        reason_settings: {
          allowed_flows: data.settings?.allowed_flows || [],
          expected_resolutions: data.settings?.expected_resolutions || [],
          rules_engine_triage: data.settings?.rules_engine_triage || []
        },
        reason_date_created: data.date_created,
        reason_last_updated: data.last_updated,
        raw_reason_data: data
      };
      
    } catch (error) {
      logger.warn(`Erro ao buscar reason ${reasonId}:`, error);
      return null;
    }
  }

  /**
   * Buscar múltiplos reasons em paralelo
   */
  async fetchMultipleReasons(
    reasonIds: string[],
    accessToken: string,
    integrationAccountId: string
  ): Promise<Map<string, any>> {
    const reasonsMap = new Map<string, any>();
    
    if (reasonIds.length === 0) {
      return reasonsMap;
    }
    
    // Remover duplicatas
    const uniqueReasonIds = [...new Set(reasonIds)];
    logger.debug(`Buscando ${uniqueReasonIds.length} reasons únicos da API ML`);
    
    // Buscar em paralelo (mas com limite para não sobrecarregar)
    const BATCH_SIZE = 10;
    for (let i = 0; i < uniqueReasonIds.length; i += BATCH_SIZE) {
      const batch = uniqueReasonIds.slice(i, i + BATCH_SIZE);
      const promises = batch.map(reasonId => 
        this.fetchReasonDetails(reasonId, accessToken, integrationAccountId)
      );
      
      const results = await Promise.all(promises);
      results.forEach((data, index) => {
        if (data) {
          reasonsMap.set(batch[index], data);
        }
      });
    }
    
    logger.info(`${reasonsMap.size} reasons carregados com sucesso da API`);
    return reasonsMap;
  }
}
