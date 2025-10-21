/**
 * 📋 CLAIMS SERVICE
 * Gerencia busca de claims do Mercado Livre
 */

import { fetchMLWithRetry } from '../utils/retryHandler.ts';
import { logger } from '../utils/logger.ts';

export class ClaimsService {
  /**
   * Buscar claims com paginação
   */
  async fetchClaims(
    sellerId: string,
    filters: any,
    accessToken: string,
    integrationAccountId: string
  ): Promise<any[]> {
    const MAX_CLAIMS = 10000; // ✨ Limite muito alto para pegar todos (ou quase)
    const limit = 50;
    let offset = 0;
    const allClaims: any[] = [];
    
    const params = new URLSearchParams({
      seller_id: sellerId,
      sort: 'date_desc',
      limit: limit.toString()
    });
    
    // Aplicar filtros se fornecidos
    if (filters?.date_from) params.set('date_from', filters.date_from);
    if (filters?.date_to) params.set('date_to', filters.date_to);
    if (filters?.status_claim) params.set('status', filters.status_claim);
    if (filters?.claim_type) params.set('type', filters.claim_type);
    if (filters?.stage) params.set('stage', filters.stage);
    
    logger.debug('Buscando claims com filtros', { sellerId, filters });
    
    // Buscar com paginação
    do {
      params.set('offset', offset.toString());
      const url = `https://api.mercadolibre.com/post-purchase/v1/claims/search?${params.toString()}`;
      
      const response = await fetchMLWithRetry(url, accessToken, integrationAccountId);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token de acesso inválido ou expirado - reconecte a integração');
        }
        if (response.status === 403) {
          throw new Error('Sem permissão para acessar claims');
        }
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.data || !Array.isArray(data.data)) {
        logger.warn('Resposta sem dados válidos, encerrando paginação');
        break;
      }
      
      logger.debug(`Página retornou ${data.data.length} claims (total: ${allClaims.length + data.data.length})`);
      
      allClaims.push(...data.data);
      offset += limit;
      
      // Parar se não há mais dados ou atingiu limite
      if (data.data.length < limit || allClaims.length >= MAX_CLAIMS) {
        break;
      }
    } while (true);
    
    logger.info(`${allClaims.length} claims recebidos da API ML`);
    return allClaims;
  }
  
  /**
   * Buscar detalhes de um claim específico
   */
  async fetchClaimDetail(
    claimId: string,
    accessToken: string,
    integrationAccountId: string
  ): Promise<any> {
    const url = `https://api.mercadolibre.com/post-purchase/v1/claims/${claimId}`;
    const response = await fetchMLWithRetry(url, accessToken, integrationAccountId);
    return response.ok ? response.json() : null;
  }
}
