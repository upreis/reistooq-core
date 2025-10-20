/**
 * 📦 ORDERS SERVICE
 * Gerencia busca de pedidos do Mercado Livre
 */

import { fetchMLWithRetry } from '../utils/retryHandler.ts';
import { logger } from '../utils/logger.ts';

export class OrdersService {
  /**
   * Buscar detalhes de um pedido
   */
  async fetchOrderDetail(
    orderId: string,
    accessToken: string,
    integrationAccountId: string
  ): Promise<any | null> {
    const url = `https://api.mercadolibre.com/orders/${orderId}`;
    const response = await fetchMLWithRetry(url, accessToken, integrationAccountId);
    
    // ✅ Tratamento específico para 404
    if (response.status === 404) {
      logger.warn(`Pedido ${orderId} não encontrado (404)`);
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status} ao buscar pedido ${orderId}`);
    }
    
    return response.json();
  }
}
