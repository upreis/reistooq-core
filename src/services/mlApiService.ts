import { supabase } from '@/integrations/supabase/client';

const ML_BASE_URL = 'https://api.mercadolibre.com';

export class MLApiService {
  private accessToken: string;

  constructor() {
    // Token fixo temporário - SUBSTITUA PELO SEU TOKEN REAL
    this.accessToken = 'APP_USR-YOUR_REAL_TOKEN_HERE';
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
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
      throw new Error(`ML API Error: ${response.status} - ${response.statusText}`);
    }

    return response.json();
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

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  getAccessToken(): string {
    return this.accessToken;
  }

  hasValidToken(): boolean {
    return !!this.accessToken && this.accessToken.length > 0 && this.accessToken !== 'APP_USR-YOUR_REAL_TOKEN_HERE';
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

  // Métodos para buscar dados completos do claim
  async getClaim(claimId: string) {
    try {
      return await this.makeRequest(`/post-purchase/v1/claims/${claimId}`);
    } catch (error) {
      console.warn(`Erro ao buscar claim ${claimId}:`, error);
      return null;
    }
  }

  async getClaimMessages(packId: string, sellerId: string) {
    try {
      return await this.makeRequest(`/messages/packs/${packId}/sellers/${sellerId}?tag=post_sale`);
    } catch (error) {
      console.warn(`Erro ao buscar mensagens do claim para pack ${packId}:`, error);
      return null;
    }
  }

  async getMediationDetails(mediationId: string) {
    try {
      return await this.makeRequest(`/post-purchase/v1/mediations/${mediationId}`);
    } catch (error) {
      console.warn(`Erro ao buscar detalhes da mediação ${mediationId}:`, error);
      return null;
    }
  }

  async getClaimAttachments(claimId: string) {
    try {
      return await this.makeRequest(`/post-purchase/v1/claims/${claimId}/attachments`);
    } catch (error) {
      console.warn(`Erro ao buscar anexos do claim ${claimId}:`, error);
      return null;
    }
  }

  // Novos métodos para enriquecimento de dados conforme estratégia do PDF
  async getClaimReturnsV2(claimId: string) {
    try {
      return await this.makeRequest(`/post-purchase/v2/claims/${claimId}/returns`);
    } catch (error) {
      console.warn(`Erro ao buscar returns v2 para claim ${claimId}:`, error);
      return null;
    }
  }

  async getClaimReturnsV1(claimId: string) {
    try {
      return await this.makeRequest(`/post-purchase/v1/claims/${claimId}/returns`);
    } catch (error) {
      console.warn(`Erro ao buscar returns v1 para claim ${claimId}:`, error);
      return null;
    }
  }

  async getReturnReviews(returnId: string) {
    try {
      return await this.makeRequest(`/post-purchase/v1/returns/${returnId}/reviews`);
    } catch (error) {
      console.warn(`Erro ao buscar reviews do return ${returnId}:`, error);
      return null;
    }
  }

  // Métodos de compatibilidade
  clearToken(): void {
    this.accessToken = 'APP_USR-YOUR_REAL_TOKEN_HERE';
  }

  async initialize(): Promise<void> {
    // Método vazio para compatibilidade
    return Promise.resolve();
  }
}