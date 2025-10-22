/**
 * 📋 CLAIMS SERVICE
 * Gerencia busca de claims do Mercado Livre
 */

import { fetchMLWithRetry } from '../utils/retryHandler.ts';
import { logger } from '../utils/logger.ts';

export class ClaimsService {
  /**
   * Buscar claims com paginação e divisão de intervalos de datas
   */
  async fetchClaims(
    sellerId: string,
    filters: any,
    accessToken: string,
    integrationAccountId: string
  ): Promise<any[]> {
    const MAX_CLAIMS = 10000;
    const limit = 50;
    const DAYS_PER_CHUNK = 3; // Dividir em intervalos de 3 dias para contornar limite de offset
    
    // Se não há filtro de data ou o período é curto, usar método normal
    if (!filters?.date_from || !filters?.date_to) {
      return this.fetchClaimsNormal(sellerId, filters, accessToken, integrationAccountId);
    }
    
    // Calcular intervalos de datas
    const dateFrom = new Date(filters.date_from);
    const dateTo = new Date(filters.date_to);
    const diffDays = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
    
    // Se período é menor que DAYS_PER_CHUNK dias, usar método normal
    if (diffDays <= DAYS_PER_CHUNK) {
      return this.fetchClaimsNormal(sellerId, filters, accessToken, integrationAccountId);
    }
    
    logger.info(`Período de ${diffDays} dias detectado - dividindo em chunks de ${DAYS_PER_CHUNK} dias`);
    
    // Dividir em intervalos menores
    const allClaims: any[] = [];
    const claimIds = new Set<string>(); // Para evitar duplicatas
    let currentDate = new Date(dateFrom);
    let chunkNumber = 0;
    
    while (currentDate < dateTo && allClaims.length < MAX_CLAIMS) {
      chunkNumber++;
      const chunkEnd = new Date(currentDate);
      chunkEnd.setDate(chunkEnd.getDate() + DAYS_PER_CHUNK);
      
      const actualEnd = chunkEnd > dateTo ? dateTo : chunkEnd;
      
      const chunkFilters = {
        ...filters,
        date_from: currentDate.toISOString().split('T')[0],
        date_to: actualEnd.toISOString().split('T')[0]
      };
      
      logger.info(`Chunk ${chunkNumber}: ${chunkFilters.date_from} a ${chunkFilters.date_to}`);
      
      // Delay entre chunks para evitar rate limit
      if (chunkNumber > 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const chunkClaims = await this.fetchClaimsNormal(sellerId, chunkFilters, accessToken, integrationAccountId);
      
      // Adicionar apenas claims únicos
      let newClaims = 0;
      for (const claim of chunkClaims) {
        if (!claimIds.has(claim.id)) {
          claimIds.add(claim.id);
          allClaims.push(claim);
          newClaims++;
        }
      }
      
      logger.info(`Chunk ${chunkNumber}: ${newClaims} claims novos (${chunkClaims.length} total do chunk, ${allClaims.length} acumulado)`);
      
      // Se o chunk retornou menos que o esperado, pode ser que não haja mais dados
      if (chunkClaims.length === 0) {
        logger.info(`Chunk ${chunkNumber} vazio - pulando para próximo intervalo`);
      }
      
      currentDate = new Date(actualEnd);
      currentDate.setDate(currentDate.getDate() + 1); // Próximo dia após o fim do chunk
    }
    
    logger.info(`✅ Total de ${allClaims.length} claims únicos recebidos em ${chunkNumber} chunks`);
    return allClaims;
  }
  
  /**
   * Buscar claims com paginação simples (método original)
   */
  private async fetchClaimsNormal(
    sellerId: string,
    filters: any,
    accessToken: string,
    integrationAccountId: string
  ): Promise<any[]> {
    const MAX_CLAIMS = 10000;
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
