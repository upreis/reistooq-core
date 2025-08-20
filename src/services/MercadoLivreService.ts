import { supabase } from '@/integrations/supabase/client';

export interface MLOrdersParams {
  integration_account_id: string;
  seller_id?: number;
  date_from?: string;
  date_to?: string;
  order_status?: string;
  limit?: number;
  offset?: number;
}

export interface MLOrder {
  id: number;
  date_created: string;
  date_closed?: string;
  last_updated: string;
  status: string;
  status_detail?: string;
  currency_id: string;
  order_items: Array<{
    item: {
      id: string;
      title: string;
      variation_id?: number;
    };
    quantity: number;
    unit_price: number;
    full_unit_price: number;
  }>;
  total_amount: number;
  buyer: {
    id: number;
    nickname: string;
    email?: string;
    phone?: {
      area_code: string;
      number: string;
    };
  };
  seller: {
    id: number;
    nickname: string;
  };
  shipping?: {
    id: number;
    status: string;
    tracking_number?: string;
    tracking_method?: string;
  };
  payments?: Array<{
    id: number;
    status: string;
    transaction_amount: number;
    payment_method_id: string;
  }>;
}

export interface MLOrdersResponse {
  orders: MLOrder[];
  paging: {
    total: number;
    offset: number;
    limit: number;
  };
  seller_id: number;
}

export interface MLAccount {
  id: string;
  name: string;
  account_identifier: string;
  public_auth: any;
  is_active: boolean;
  updated_at: string;
  // Computed properties from public_auth
  nickname: string;
  email?: string;
  site_id: string;
  country_id: string;
  user_id: number;
  last_sync?: string;
  permalink?: string;
}

class MercadoLivreService {
  private static instance: MercadoLivreService;

  static getInstance(): MercadoLivreService {
    if (!MercadoLivreService.instance) {
      MercadoLivreService.instance = new MercadoLivreService();
    }
    return MercadoLivreService.instance;
  }

  /**
   * Inicia o fluxo OAuth do MercadoLibre
   */
  async startOAuth(): Promise<{ success: boolean; authorization_url?: string; error?: string }> {
    try {
      console.log('[ML Service] Starting OAuth flow...');
      
      const { data, error } = await supabase.functions.invoke('mercadolibre-oauth-start', {
        body: { 
          usePkce: true 
        }
      });

      if (error) {
        console.error('[ML Service] OAuth start failed:', error);
        return { success: false, error: error.message || 'Falha ao iniciar OAuth' };
      }

      if (!data.ok) {
        console.error('[ML Service] OAuth start returned error:', data.error);
        return { success: false, error: data.error };
      }

      console.log('[ML Service] OAuth URL generated successfully');
      return { 
        success: true, 
        authorization_url: data.url 
      };

    } catch (e) {
      console.error('[ML Service] OAuth start exception:', e);
      return { 
        success: false, 
        error: 'Erro interno ao iniciar OAuth' 
      };
    }
  }

  /**
   * Abre popup OAuth e gerencia o fluxo
   */
  async initiateOAuth(): Promise<{ success: boolean; integration_account_id?: string; authorization_url?: string; error?: string }> {
    const startResult = await this.startOAuth();
    
    if (!startResult.success || !startResult.authorization_url) {
      return startResult;
    }

    return new Promise((resolve) => {
      const popup = window.open(
        startResult.authorization_url,
        'ml-oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        resolve({ success: false, error: 'Popup bloqueado pelo navegador' });
        return;
      }

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          resolve({ success: false, error: 'OAuth cancelado pelo usuário' });
        }
      }, 1000);

      const messageHandler = (event: MessageEvent) => {
        if (event.data?.type === 'oauth_success' && event.data?.provider === 'mercadolivre') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          popup.close();
          resolve({ 
            success: true, 
            integration_account_id: event.data.integration_account_id,
            authorization_url: startResult.authorization_url
          });
        } else if (event.data?.type === 'oauth_error' && event.data?.provider === 'mercadolivre') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          popup.close();
          resolve({ 
            success: false, 
            error: event.data.error || 'Erro durante OAuth' 
          });
        }
      };

      window.addEventListener('message', messageHandler);
    });
  }

  /**
   * Renova o token de acesso
   */
  async refreshToken(integration_account_id: string): Promise<{ success: boolean; access_token?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('mercadolibre-token-refresh', {
        body: { integration_account_id }
      });

      if (error || !data.ok) {
        return { success: false, error: data?.error || 'Falha ao renovar token' };
      }

      return { 
        success: true, 
        access_token: data.access_token 
      };
    } catch (e) {
      return { 
        success: false, 
        error: 'Erro interno ao renovar token' 
      };
    }
  }

  /**
   * Busca pedidos do vendedor
   */
  async fetchOrders(params: MLOrdersParams): Promise<{ success: boolean; data?: MLOrdersResponse; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('mercadolibre-orders', {
        body: params
      });

      if (error || !data.ok) {
        return { success: false, error: data?.error || 'Falha ao buscar pedidos' };
      }

      return { 
        success: true, 
        data: {
          orders: data.orders,
          paging: data.paging,
          seller_id: data.seller_id,
        }
      };
    } catch (e) {
      return { 
        success: false, 
        error: 'Erro interno ao buscar pedidos' 
      };
    }
  }

  /**
   * Busca contas conectadas
   */
  async getConnectedAccounts(): Promise<MLAccount[]> {
    try {
      const { data, error } = await supabase
        .from('integration_accounts')
        .select('id, name, account_identifier, public_auth, is_active, updated_at')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true);

      if (error) {
        console.error('[ML Service] Failed to fetch accounts:', error);
        return [];
      }

      return (data || []).map(account => {
        const auth = account.public_auth as any; // Cast to handle Json type
        return {
          ...account,
          nickname: auth?.nickname || account.name || 'Usuário ML',
          email: auth?.email,
          site_id: auth?.site_id || 'MLB',
          country_id: auth?.country_id || 'BR',
          user_id: auth?.user_id || 0,
          last_sync: account.updated_at,
          permalink: auth?.permalink
        };
      });
    } catch (e) {
      console.error('[ML Service] Exception fetching accounts:', e);
      return [];
    }
  }

  /**
   * Desconecta uma conta
   */
  async disconnect(accountId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('integration_accounts')
        .update({ is_active: false })
        .eq('id', accountId)
        .eq('provider', 'mercadolivre');

      return !error;
    } catch (e) {
      return false;
    }
  }

  /**
   * Sincroniza pedidos de uma conta
   */
  async syncOrders(accountId: string, options: { since?: string } = {}): Promise<{ synced: number; errors: string[] }> {
    try {
      const result = await this.fetchOrders({
        integration_account_id: accountId,
        date_from: options.since,
        limit: 50
      });

      if (!result.success || !result.data) {
        return { synced: 0, errors: [result.error || 'Falha ao buscar pedidos'] };
      }

      // For now, just return the count of orders found
      // In a real implementation, you would save these to your database
      return {
        synced: result.data.orders.length,
        errors: []
      };
    } catch (error) {
      return {
        synced: 0,
        errors: [error instanceof Error ? error.message : 'Erro desconhecido']
      };
    }
  }

  /**
   * Verifica status da conexão
   */
  async getConnectionStatus(): Promise<{ 
    connected: boolean; 
    accounts: MLAccount[]; 
    last_sync?: string;
  }> {
    const accounts = await this.getConnectedAccounts();
    
    return {
      connected: accounts.length > 0,
      accounts,
      last_sync: accounts[0]?.updated_at,
    };
  }
}

// Export singleton instance
export const mercadoLivreService = MercadoLivreService.getInstance();
export default mercadoLivreService;