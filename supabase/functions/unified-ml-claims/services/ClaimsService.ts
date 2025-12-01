/**
 * 📋 CLAIMS SERVICE
 * Busca claims diretamente da API do Mercado Livre
 */

import { logger } from '../utils/logger.ts';
import { fetchMLWithRetry } from '../utils/retryHandler.ts';

export class ClaimsService {
  /**
   * Buscar todos os claims de um seller com paginação
   */
  async fetchAllClaims(
    sellerId: string,
    accessToken: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<any[]> {
    logger.progress(`📡 Buscando claims para seller ${sellerId}...`);
    
    let allClaims: any[] = [];
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
      const params = new URLSearchParams({
        player_role: 'respondent',
        player_user_id: sellerId,
        limit: limit.toString(),
        offset: offset.toString(),
        sort: 'date_created:desc'
      });

      // Adicionar filtros de data na URL (crítico para buscar período correto)
      if (dateFrom) {
        params.append('date_created.from', dateFrom);
      }
      if (dateTo) {
        params.append('date_created.to', dateTo);
      }

      const claimsUrl = `https://api.mercadolibre.com/post-purchase/v1/claims/search?${params}`;
      
      logger.debug(`📄 Página offset=${offset}, periodo: ${dateFrom || 'início'} até ${dateTo || 'agora'}`);

      const response = await fetchMLWithRetry(claimsUrl, accessToken);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`API error (${response.status}):`, errorText);
        throw new Error(`ML API error: ${response.status}`);
      }

      const data = await response.json();
      const claims = data.data || [];
      
      logger.info(`✅ Página offset=${offset}: ${claims.length} claims`);

      if (claims.length === 0) {
        hasMore = false;
      } else {
        allClaims.push(...claims);
        offset += limit;
        
        if (claims.length < limit) {
          hasMore = false;
        }
      }
    }

    logger.success(`Total de claims buscados: ${allClaims.length}`);

    // ✅ FASE 1 FIX: Remover filtro redundante de data
    // A API ML já filtra corretamente via parâmetros date_created.from/to na URL
    // Filtro adicional aqui é redundante e pode descartar claims válidos
    
    return allClaims;
  }

  /**
   * Enriquecer claim com dados básicos adicionais (sem full enrichment)
   */
  async enrichClaimBasic(claim: any, accessToken: string): Promise<any> {
    // Por enquanto, retornar claim como está
    // Full enrichment (order_data, messages, product_info) pode ser adicionado depois
    return claim;
  }
}
