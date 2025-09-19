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
   * 🛒 Buscar pedidos via edge function shopee-orders
   */
  async fetchOrders(params: ShopeeOrdersParams): Promise<ShopeeOrdersResponse> {
    try {
      console.log('🛒 [ShopeeService] Buscando pedidos Shopee:', params);
      
      const { data, error } = await supabase.functions.invoke('shopee-orders', {
        body: {
          integration_account_id: params.integration_account_id,
          page: params.page || 1,
          page_size: params.pageSize || 50,
          order_status: params.status,
          date_from: params.date_from,
          date_to: params.date_to
        }
      });

      if (error) {
        console.error('🛒 [ShopeeService] Erro na API:', error);
        return { success: false, error: error.message };
      }

      console.log('🛒 [ShopeeService] Pedidos encontrados:', data?.orders?.length || 0);
      
      return {
        success: true,
        data: {
          orders: data?.orders || [],
          total: data?.total || 0,
          has_more: data?.has_more || false
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