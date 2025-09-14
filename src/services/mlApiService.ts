import { supabase } from '@/integrations/supabase/client';

const ML_BASE_URL = 'https://api.mercadolibre.com';

export class MLApiService {
  private accessToken: string;
  private integrationAccountId: string | null;

  constructor() {
    this.accessToken = '';
    this.integrationAccountId = null;
  }

  async initialize(integrationAccountId?: string) {
    if (integrationAccountId) {
      this.integrationAccountId = integrationAccountId;
      await this.loadTokenFromIntegration(integrationAccountId);
    } else {
      // Buscar primeira conta ativa do ML
      await this.loadDefaultAccount();
    }
  }

  private async loadDefaultAccount() {
    try {
      const { data: accounts, error } = await supabase
        .from('integration_accounts')
        .select('id, name, account_identifier')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true)
        .limit(1);

      if (error || !accounts || accounts.length === 0) {
        console.warn('Nenhuma conta ML ativa encontrada');
        return;
      }

      this.integrationAccountId = accounts[0].id;
      await this.loadTokenFromIntegration(accounts[0].id);
    } catch (error) {
      console.error('Erro ao carregar conta padrão ML:', error);
    }
  }

  private async loadTokenFromIntegration(integrationAccountId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('integrations-get-secret', {
        body: { 
          integration_account_id: integrationAccountId,
          provider: 'mercadolivre' 
        }
      });

      if (error || !data?.ok) {
        console.warn('Erro ao buscar token ML:', error || data?.error);
        return;
      }

      if (data.secret?.access_token) {
        this.accessToken = data.secret.access_token;
      }
    } catch (error) {
      console.error('Erro ao carregar token da integração:', error);
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    // Se não temos token, tentar carregar
    if (!this.accessToken && this.integrationAccountId) {
      await this.loadTokenFromIntegration(this.integrationAccountId);
    }

    const url = `${ML_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      // Se 401, tentar refresh do token
      if (response.status === 401 && this.integrationAccountId) {
        await this.refreshToken();
        // Retry uma vez
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });
        
        if (!retryResponse.ok) {
          throw new Error(`ML API Error: ${retryResponse.status} - ${retryResponse.statusText}`);
        }
        
        return retryResponse.json();
      }
      
      throw new Error(`ML API Error: ${response.status} - ${response.statusText}`);
    }

    return response.json();
  }

  private async refreshToken() {
    if (!this.integrationAccountId) return;

    try {
      const { error } = await supabase.functions.invoke('mercadolibre-token-refresh', {
        body: { integration_account_id: this.integrationAccountId }
      });
      
      if (!error) {
        await this.loadTokenFromIntegration(this.integrationAccountId);
      }
    } catch (error) {
      console.error('Erro ao fazer refresh do token ML:', error);
    }
  }

  async getUserInfo() {
    return this.makeRequest('/users/me');
  }

  async searchClaims(sellerId: string, limit: number = 50) {
    return this.makeRequest(`/post-purchase/v1/claims/search?seller_id=${sellerId}&limit=${limit}`);
  }

  async getOrder(orderId: string) {
    return this.makeRequest(`/orders/${orderId}`);
  }

  async getClaimReturns(claimId: string) {
    try {
      return await this.makeRequest(`/post-purchase/v2/claims/${claimId}/returns`);
    } catch (error) {
      console.warn(`Erro ao buscar returns para claim ${claimId}:`, error);
      return null;
    }
  }

  async getMessages(packId: string, sellerId: string) {
    try {
      return await this.makeRequest(`/messages/packs/${packId}/sellers/${sellerId}?tag=post_sale`);
    } catch (error) {
      console.warn(`Erro ao buscar mensagens para pack ${packId}:`, error);
      return null;
    }
  }

  setIntegrationAccount(integrationAccountId: string) {
    this.integrationAccountId = integrationAccountId;
    this.loadTokenFromIntegration(integrationAccountId);
  }

  getAccessToken(): string {
    return this.accessToken;
  }

  getIntegrationAccountId(): string | null {
    return this.integrationAccountId;
  }

  hasValidToken(): boolean {
    return !!this.accessToken && this.accessToken.length > 0;
  }

  async validateToken(): Promise<boolean> {
    if (!this.hasValidToken()) {
      return false;
    }
    
    try {
      await this.getUserInfo();
      return true;
    } catch (error) {
      console.error('Token inválido:', error);
      return false;
    }
  }

  // Mantém compatibilidade com implementação manual
  setAccessToken(token: string) {
    this.accessToken = token;
  }

  clearToken(): void {
    this.accessToken = '';
    this.integrationAccountId = null;
  }
}