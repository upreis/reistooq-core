/**
 * 💾 SERVIÇO DE CACHE DE REASONS
 * Centraliza gerenciamento de cache para evitar duplicação
 */

import { logger } from '@/utils/logger';

const CACHE_TTL = 1000 * 60 * 30; // 30 minutos

export interface CacheStats {
  hits: number;
  misses: number;
  lastUpdate: string;
}

export class DevolucaoCacheService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private stats: CacheStats = { hits: 0, misses: 0, lastUpdate: '' };

  /**
   * Obtém um item do cache
   */
  get(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      this.stats.hits++;
      logger.info(`💾 Cache hit para ${key}`);
      return cached.data;
    }
    
    this.stats.misses++;
    return null;
  }

  /**
   * Salva um item no cache
   */
  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    this.stats.lastUpdate = new Date().toISOString();
    logger.info(`💾 Cache atualizado: ${key}`);
  }

  /**
   * Verifica se um item está no cache e é válido
   */
  has(key: string): boolean {
    const cached = this.cache.get(key);
    return !!(cached && (Date.now() - cached.timestamp) < CACHE_TTL);
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, lastUpdate: '' };
    logger.info('🧹 Cache limpo');
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Atualiza contadores de estatísticas
   */
  updateStats(callback: (stats: CacheStats) => CacheStats): void {
    this.stats = callback(this.stats);
  }
}

// Exportar instância singleton
export const reasonsCacheService = new DevolucaoCacheService();
