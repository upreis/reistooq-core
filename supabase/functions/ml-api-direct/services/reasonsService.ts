/**
 * 🏷️ REASONS SERVICE
 * Gerencia busca de reasons detalhados do Mercado Livre
 */

import { fetchMLWithRetry } from '../utils/retryHandler.ts';
import { logger } from '../utils/logger.ts';

export class ReasonsService {
  // Cache de reasons (em memória)
  private cache = new Map<string, any>();

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
   * Buscar múltiplos reasons em paralelo (com cache)
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
    
    // Separar IDs que precisam ser buscados vs os que estão em cache
    const idsParaBuscar: string[] = [];
    const idsEmCache: string[] = [];
    
    for (const reasonId of uniqueReasonIds) {
      if (this.cache.has(reasonId)) {
        idsEmCache.push(reasonId);
        
        // ✅ ADICIONAR DADOS DO CACHE AO MAP DE RETORNO
        const cachedData = this.cache.get(reasonId);
        if (cachedData) {
          reasonsMap.set(reasonId, cachedData);
        }
      } else {
        idsParaBuscar.push(reasonId);
      }
    }
    
    console.log(`🔥 ${uniqueReasonIds.length} reasons únicos | ${idsParaBuscar.length} para buscar | ${idsEmCache.length} em cache`);
    
    // Buscar apenas os que NÃO estão em cache
    if (idsParaBuscar.length > 0) {
      const BATCH_SIZE = 10;
      for (let i = 0; i < idsParaBuscar.length; i += BATCH_SIZE) {
        const batch = idsParaBuscar.slice(i, i + BATCH_SIZE);
        const promises = batch.map(reasonId => 
          this.fetchReasonDetails(reasonId, accessToken, integrationAccountId)
        );
        
        const results = await Promise.all(promises);
        results.forEach((data, index) => {
          if (data) {
            const reasonId = batch[index];
            // Adicionar ao cache
            this.cache.set(reasonId, data);
            // Adicionar ao Map de retorno
            reasonsMap.set(reasonId, data);
          }
        });
      }
    }
    
    console.log(`✅ Busca concluída: ${idsParaBuscar.length} novos + ${idsEmCache.length} do cache`);
    
    return reasonsMap;
  }
}
