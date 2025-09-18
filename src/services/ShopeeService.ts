import { supabase } from '@/integrations/supabase/client';

export interface ShopeeOrdersParams {
  integration_account_id: string;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface ShopeeOrdersResponse {
  success: boolean;
  data?: {
    orders: any[];
    total: number;
    has_more: boolean;
  };
  error?: string;
}

class ShopeeService {
  private static instance: ShopeeService;

  static getInstance(): ShopeeService {
    if (!ShopeeService.instance) {
      ShopeeService.instance = new ShopeeService();
    }
    return ShopeeService.instance;
  }

  /**
   * 🛡️ SEGURO: Buscar pedidos via unified-orders (quando implementado)
   * POR ENQUANTO: Retorna mock para não quebrar nada
   */
  async fetchOrders(params: ShopeeOrdersParams): Promise<ShopeeOrdersResponse> {
    try {
      console.log('🛒 [ShopeeService] MOCK: Preparando busca Shopee:', params);
      
      // TODO: Implementar quando unified-orders suportar Shopee
      // Por enquanto retorna mock para não quebrar
      return {
        success: true,
        data: {
          orders: [],
          total: 0,
          has_more: false
        }
      };

    } catch (error: any) {
      console.error('🛒 [ShopeeService] Erro:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🛡️ SEGURO: Validar credenciais (mock por enquanto)
   */
  async validateAccount(partnerId: string, partnerKey: string, shopId?: string): Promise<boolean> {
    try {
      console.log('🛒 [ShopeeService] MOCK: Validando credenciais');
      
      // TODO: Implementar validação real
      // Por enquanto retorna false para não quebrar
      return false;
    } catch (error) {
      console.error('🛒 [ShopeeService] Erro na validação:', error);
      return false;
    }
  }
}

// Export singleton instance
export const shopeeService = ShopeeService.getInstance();
export default shopeeService;