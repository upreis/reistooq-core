// 🎯 MercadoLibre API Service
// Comprehensive service for ML OAuth and orders integration

import { supabase } from '@/integrations/supabase/client';

export interface MLOrder {
  ml_order_id: string;
  status: string;
  date_created: string;
  date_closed?: string;
  currency_id: string;
  total_amount: number;
  paid_amount: number;
  buyer: {
    id: number;
    nickname: string;
    email?: string;
  };
  seller: {
    id: number;
    nickname: string;
  };
  shipping?: {
    id: string;
    status: string;
    mode: string;
    tracking_number?: string;
    tracking_method?: string;
  };
  order_items: Array<{
    item_id: string;
    title: string;
    quantity: number;
    unit_price: number;
    full_unit_price: number;
  }>;
  payments: Array<{
    id: string;
    status: string;
    payment_method_id: string;
    payment_type: string;
    total_paid_amount: number;
  }>;
  feedback?: any;
  context?: any;
  mediations?: any[];
}

export interface MLOrdersResponse {
  results: MLOrder[];
  paging: {
    total: number;
    offset: number;
    limit: number;
  };
  sort?: string;
  available_sorts?: string[];
  available_filters?: any;
}

export interface MLOrdersParams {
  integration_account_id: string;
  seller_id?: string;
  status?: string;
  since?: string;
  until?: string;
  sort?: 'date_asc' | 'date_desc';
  limit?: number;
  offset?: number;
}

export interface MLAccount {
  id: string;
  nickname: string;
  email?: string;
  site_id: string;
  user_id: number;
  permalink?: string;
  is_connected: boolean;
  last_sync?: string;
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
   * Get valid access token for integration account (with auto-refresh)
   */
  async getValidAccessToken(accountId: string): Promise<string | null> {
    try {
      // Get current token data
      const { data, error } = await supabase.rpc('get_integration_secret_secure', {
        account_id: accountId,
        provider_name: 'mercadolivre',
        requesting_function: 'get_valid_token'
      });

      if (error || !data || data.length === 0 || !data[0]?.access_token) {
        console.error('Failed to get access token:', error);
        return null;
      }

      const tokenData = data[0];

      // Check if token is expired or expires within 5 minutes
      const expiresAt = tokenData.expires_at ? new Date(tokenData.expires_at) : null;
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      if (!expiresAt || expiresAt <= fiveMinutesFromNow) {
        console.log('Token expired or expires soon, attempting refresh...', {
          expires_at: expiresAt?.toISOString(),
          current_time: now.toISOString()
        });

        // Attempt to refresh token
        const refreshResult = await supabase.functions.invoke('mercadolivre-refresh-token', {
          body: { integration_account_id: accountId }
        });

        if (refreshResult.error || !refreshResult.data?.success) {
          console.error('Token refresh failed:', refreshResult.error);
          
          // If refresh token is expired, return null to trigger re-auth
          if (refreshResult.data?.code === 'REFRESH_TOKEN_EXPIRED') {
            return null;
          }
          
          // For other errors, try using current token anyway
          return tokenData.access_token;
        }

        return refreshResult.data.access_token;
      }

      return tokenData.access_token;
    } catch (error) {
      console.error('Error getting valid access token:', error);
      return null;
    }
  }

  /**
   * Initiate MercadoLibre OAuth flow
   */
  async initiateOAuth(): Promise<{ success: boolean; authorization_url?: string; error?: string }> {
    try {
      // We must call this function with GET and a valid JWT
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Usuário não autenticado');
      }

      const fnUrl = 'https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/mercadolivre-oauth?action=auth-url';
      const res = await fetch(fnUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'x-app-origin': window.location.origin,
        },
      });

      const json = await res.json().catch(() => ({} as any));
      if (!res.ok || !json?.url) {
        const errMsg = json?.error || 'Failed to get authorization URL';
        throw new Error(errMsg);
      }

      return {
        success: true,
        authorization_url: json.url as string,
      };
    } catch (error) {
      console.error('ML OAuth initiation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OAuth initiation failed',
      };
    }
  }

  /**
   * Get connected ML accounts for current organization
   */
  async getConnectedAccounts(): Promise<MLAccount[]> {
    try {
      const { data, error } = await supabase
        .from('integration_accounts')
        .select(`
          id,
          name,
          account_identifier,
          public_auth,
          is_active,
          updated_at
        `)
        .eq('provider', 'mercadolivre')
        .eq('is_active', true);

      if (error) {
        throw new Error(`Failed to get ML accounts: ${error.message}`);
      }

      return (data || []).map((account) => {
        const publicAuth = account.public_auth as any; // Type assertion for JSON field
        return {
          id: account.id,
          nickname: publicAuth?.nickname || account.name,
          email: publicAuth?.email,
          site_id: publicAuth?.site_id || 'MLB',
          user_id: parseInt(account.account_identifier),
          permalink: publicAuth?.permalink,
          is_connected: account.is_active,
          last_sync: account.updated_at,
        };
      });
    } catch (error) {
      console.error('Failed to get ML accounts:', error);
      throw error;
    }
  }

  /**
   * Fetch orders from MercadoLibre for a specific account
   */
  async getOrders(params: MLOrdersParams): Promise<MLOrdersResponse> {
    try {
      if (!params.integration_account_id) {
        throw new Error('Integration account ID is required');
      }

      console.log('Fetching ML orders:', {
        account_id: params.integration_account_id,
        since: params.since,
        until: params.until,
        limit: params.limit,
      });

      const { data, error } = await supabase.functions.invoke('mercadolivre-orders-proxy', {
        body: params,
      });

      if (error || !data.success) {
        const errorMsg = data?.error || error?.message || 'Failed to fetch orders from MercadoLibre';
        
        // Handle specific error types
        if (errorMsg.includes('INSUFFICIENT_PERMISSIONS')) {
          throw new Error('Sua conta não tem permissão para acessar pedidos. Verifique se é uma conta de vendedor ativa no MercadoLibre.');
        }
        
        if (errorMsg.includes('RATE_LIMIT')) {
          throw new Error('Muitas requisições ao MercadoLibre. Tente novamente em alguns minutos.');
        }
        
        throw new Error(errorMsg);
      }

      console.log('ML orders fetched successfully:', {
        total_orders: data.data?.paging?.total || 0,
        returned_orders: data.data?.results?.length || 0,
      });

      return data.data;
    } catch (error) {
      console.error('Failed to fetch ML orders:', error);
      throw error;
    }
  }

  /**
   * Sync orders from ML to local database
   */
  async syncOrders(accountId: string, options?: {
    since?: string;
    until?: string;
    status?: string;
  }): Promise<{ synced: number; errors: string[] }> {
    try {
      // Get orders from ML
      const ordersResponse = await this.getOrders({
        integration_account_id: accountId,
        since: options?.since,
        until: options?.until,
        status: options?.status,
        limit: 50, // Process in batches
      });

      const errors: string[] = [];
      let synced = 0;

      // Process each order
      for (const order of ordersResponse.results) {
        try {
          // Convert ML order to our format
          const orderItems = order.order_items.map((item) => ({
            numero_pedido: order.ml_order_id,
            sku: item.item_id,
            descricao: item.title,
            quantidade: item.quantity,
            valor_unitario: item.unit_price,
            valor_total: item.unit_price * item.quantity,
            pedido_id: order.ml_order_id,
          }));

          // Insert/update order
          const { error: orderError } = await supabase
            .from('pedidos')
            .upsert({
              id: order.ml_order_id,
              numero: order.ml_order_id,
              integration_account_id: accountId,
              nome_cliente: order.buyer.nickname,
              cpf_cnpj: '', // Not available in ML orders
              situacao: order.status,
              data_pedido: new Date(order.date_created).toISOString().split('T')[0],
              valor_total: order.total_amount,
              valor_frete: 0, // Calculate from shipping if needed
              valor_desconto: order.total_amount - order.paid_amount,
              obs: `MercadoLibre Order - Status: ${order.status}`,
              codigo_rastreamento: order.shipping?.tracking_number,
              empresa: 'MercadoLibre',
              numero_ecommerce: order.ml_order_id,
            }, {
              onConflict: 'id',
            });

          if (orderError) {
            errors.push(`Failed to sync order ${order.ml_order_id}: ${orderError.message}`);
            continue;
          }

          // Insert order items
          for (const item of orderItems) {
            const { error: itemError } = await supabase
              .from('itens_pedidos')
              .upsert(item, {
                onConflict: 'pedido_id,sku',
              });

            if (itemError) {
              errors.push(`Failed to sync item ${item.sku} for order ${order.ml_order_id}: ${itemError.message}`);
            }
          }

          synced++;
        } catch (itemError) {
          errors.push(`Failed to process order ${order.ml_order_id}: ${itemError instanceof Error ? itemError.message : 'Unknown error'}`);
        }
      }

      return { synced, errors };
    } catch (error) {
      console.error('ML orders sync failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect MercadoLibre account
   */
  async disconnect(accountId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('integration_accounts')
        .update({ is_active: false })
        .eq('id', accountId)
        .eq('provider', 'mercadolivre');

      if (error) {
        throw new Error(`Failed to disconnect ML account: ${error.message}`);
      }

      // Also clear the stored tokens
      await supabase
        .from('integration_secrets')
        .delete()
        .eq('integration_account_id', accountId)
        .eq('provider', 'mercadolivre');

      return true;
    } catch (error) {
      console.error('Failed to disconnect ML account:', error);
      return false;
    }
  }

  /**
   * Get account connection status
   */
  async getConnectionStatus(accountId?: string): Promise<{
    connected: boolean;
    accounts: MLAccount[];
    last_sync?: string;
  }> {
    try {
      const accounts = await this.getConnectedAccounts();
      
      return {
        connected: accounts.length > 0,
        accounts,
        last_sync: accounts[0]?.last_sync,
      };
    } catch (error) {
      console.error('Failed to get ML connection status:', error);
      return {
        connected: false,
        accounts: [],
      };
    }
  }
}

export const mercadoLivreService = MercadoLivreService.getInstance();
export default mercadoLivreService;