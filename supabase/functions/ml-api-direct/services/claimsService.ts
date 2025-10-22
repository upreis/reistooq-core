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
    const limit = 100; // Máximo permitido pela API do ML
    const DAYS_PER_CHUNK = 1; // ⚡ Reduzido para 1 dia para maximizar resultados
    
    // ✅ SEMPRE USAR MÉTODO NORMAL - Sem chunking por data
    // Buscar TODOS os claims disponíveis sem limitação de período
    return this.fetchClaimsNormal(sellerId, filters, accessToken, integrationAccountId);
    
    // Calcular intervalos de datas
    const dateFrom = new Date(filters.date_from);
    const dateTo = new Date(filters.date_to);
    const diffDays = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
    
    // Se período é menor que DAYS_PER_CHUNK dias, usar método normal
    if (diffDays <= DAYS_PER_CHUNK) {
      return this.fetchClaimsNormal(sellerId, filters, accessToken, integrationAccountId);
    }
    
    const startTime = Date.now();
    logger.info(`⏱️  Iniciando busca de ${diffDays} dias - dividindo em chunks de ${DAYS_PER_CHUNK} dia(s)`);
    
    // Dividir em intervalos menores
    const allClaims: any[] = [];
    const claimIds = new Set<string>(); // Para evitar duplicatas
    let currentDate = new Date(dateFrom);
    let chunkNumber = 0;
    const totalChunks = Math.ceil(diffDays / DAYS_PER_CHUNK);
    
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
      
      const chunkStartTime = Date.now();
      logger.info(`\n📦 Chunk ${chunkNumber}/${totalChunks}: ${chunkFilters.date_from} → ${chunkFilters.date_to}`);
      
      // Delay entre chunks para evitar rate limit
      if (chunkNumber > 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      const chunkClaims = await this.fetchClaimsNormal(sellerId, chunkFilters, accessToken, integrationAccountId);
      const chunkDuration = ((Date.now() - chunkStartTime) / 1000).toFixed(2);
      
      // Adicionar apenas claims únicos
      let newClaims = 0;
      for (const claim of chunkClaims) {
        if (!claimIds.has(claim.id)) {
          claimIds.add(claim.id);
          allClaims.push(claim);
          newClaims++;
        }
      }
      
      logger.info(`   ✓ ${newClaims} novos | ${chunkClaims.length} total chunk | ${allClaims.length} acumulado | ⏱️ ${chunkDuration}s`);
      
      // Se o chunk retornou menos que o esperado, pode ser que não haja mais dados
      if (chunkClaims.length === 0) {
        logger.info(`   ⚠️  Chunk vazio - continuando para próximo intervalo`);
      }
      
      // Log de progresso a cada 10 chunks
      if (chunkNumber % 10 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const estimatedTotal = (elapsed / chunkNumber) * totalChunks;
        logger.info(`\n📊 Progresso: ${chunkNumber}/${totalChunks} chunks | ${allClaims.length} claims | ⏱️ ${elapsed}s/${estimatedTotal.toFixed(1)}s estimado\n`);
      }
      
      currentDate = new Date(actualEnd);
      currentDate.setDate(currentDate.getDate() + 1); // Próximo dia após o fim do chunk
    }
    
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`\n${'='.repeat(70)}`);
    logger.info(`✅ FINALIZADO: ${allClaims.length} claims únicos | ${chunkNumber} chunks | ⏱️ ${totalDuration}s`);
    logger.info(`${'='.repeat(70)}\n`);
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
    const limit = 100; // ⚡ TESTE: Voltando para 100 para diagnóstico
    let offset = 0;
    const allClaims: any[] = [];
    
    // 🔍 DIAGNÓSTICO: Verificar configuração
    logger.info(`⚙️ CONFIGURAÇÃO DE PAGINAÇÃO:`, {
      limit,
      MAX_CLAIMS,
      method: 'fetchClaimsNormal'
    });
    
    const params = new URLSearchParams({
      seller_id: sellerId,
      sort: 'date_desc',
      limit: limit.toString()
    });
    
    // ✅ FILTROS DE DATA RESTAURADOS
    if (filters?.date_from) params.set('date_created.from', filters.date_from);
    if (filters?.date_to) params.set('date_created.to', filters.date_to);
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
      
      // 🔍 DIAGNÓSTICO DETALHADO DA RESPOSTA DA API
      const pagingInfo = data.paging || {};
      logger.info(`🔍 RESPONSE DETALHADO:`, {
        solicitado: limit,
        recebido: data.data?.length || 0,
        total_disponivel: pagingInfo.total,
        offset_atual: pagingInfo.offset,
        limit_usado: pagingInfo.limit,
        tem_mais: data.data?.length === limit
      });
      
      // 📊 HEADERS DA RESPOSTA (Rate Limiting)
      const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
      const rateLimitReset = response.headers.get('x-ratelimit-reset');
      if (rateLimitRemaining || rateLimitReset) {
        logger.info(`📊 RATE LIMIT:`, {
          remaining: rateLimitRemaining,
          reset: rateLimitReset,
          contentLength: response.headers.get('content-length')
        });
      }
      
      if (!data.data || !Array.isArray(data.data)) {
        logger.warn('Resposta sem dados válidos, encerrando paginação');
        break;
      }
      
      allClaims.push(...data.data);
      logger.success(`✅ Lote: ${data.data.length} claims | Total: ${allClaims.length}/${pagingInfo.total || '?'}`);
      
      // Parar se não há mais dados ou atingiu limite
      if (data.data.length < limit || allClaims.length >= MAX_CLAIMS) {
        logger.info(`🏁 API ML indica que não há mais dados (retornou ${data.data.length}/${limit})`);
        break;
      }
      
      offset += limit;
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
  
  /**
   * Buscar TODOS os claims disponíveis (com paginação automática)
   */
  async fetchAllClaimsComplete(
    sellerId: string,
    filters: any,
    accessToken: string,
    integrationAccountId: string
  ): Promise<any[]> {
    const MAX_TOTAL_CLAIMS = 10000;
    const BATCH_SIZE = 50;
    const allClaims: any[] = [];
    let offset = 0;
    let consecutiveEmptyBatches = 0;
    
    logger.info(`🚀 Iniciando busca COMPLETA de claims para seller ${sellerId}`);
    
    while (allClaims.length < MAX_TOTAL_CLAIMS && consecutiveEmptyBatches < 3) {
      const batchFilters = { ...filters, offset, limit: BATCH_SIZE };
      
      logger.info(`📄 Buscando lote ${Math.floor(offset/BATCH_SIZE) + 1}: offset=${offset}, limit=${BATCH_SIZE}`);
      
      const batch = await this.fetchClaimsNormal(sellerId, batchFilters, accessToken, integrationAccountId);
      
      if (batch.length === 0) {
        consecutiveEmptyBatches++;
        logger.warn(`⚠️ Lote vazio (${consecutiveEmptyBatches}/3)`);
      } else {
        consecutiveEmptyBatches = 0;
        allClaims.push(...batch);
        logger.success(`✅ +${batch.length} claims | Total: ${allClaims.length}`);
      }
      
      offset += BATCH_SIZE;
      
      // Se retornou menos que o esperado, provavelmente acabaram
      if (batch.length < BATCH_SIZE) {
        logger.info(`🏁 Fim dos dados: última página retornou ${batch.length} claims`);
        break;
      }
    }
    
    logger.success(`🎯 BUSCA COMPLETA FINALIZADA: ${allClaims.length} claims encontrados`);
    return allClaims;
  }
}
