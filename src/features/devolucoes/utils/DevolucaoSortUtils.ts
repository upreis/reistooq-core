/**
 * 🔃 UTILITÁRIOS DE ORDENAÇÃO DE DEVOLUÇÕES
 * Centraliza lógica de sorting para evitar duplicação
 */

import { logger } from '@/utils/logger';

/**
 * Ordena devoluções por data de criação (mais recente primeiro)
 */
export const sortByDataCriacao = (devolucoes: any[]): any[] => {
  logger.info('[ORDENAÇÃO] Ordenando por data_criacao (Data Venda)...');
  
  return devolucoes.sort((a, b) => {
    const dataA = a.data_criacao ? new Date(a.data_criacao).getTime() : 0;
    const dataB = b.data_criacao ? new Date(b.data_criacao).getTime() : 0;
    
    if (logger) {
      logger.info(`[SORT] ${a.order_id}: ${a.data_criacao} vs ${b.order_id}: ${b.data_criacao}`);
    }
    
    return dataB - dataA; // Mais recente primeiro
  });
};

/**
 * Ordena devoluções in-place (modifica o array original)
 */
export const sortInPlace = (devolucoes: any[]): void => {
  devolucoes.sort((a, b) => {
    const dataA = a.data_criacao ? new Date(a.data_criacao).getTime() : 0;
    const dataB = b.data_criacao ? new Date(b.data_criacao).getTime() : 0;
    return dataB - dataA;
  });
};
