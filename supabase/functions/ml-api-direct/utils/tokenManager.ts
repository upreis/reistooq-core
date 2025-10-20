/**
 * 🔐 TOKEN MANAGER
 * Gerencia tokens de acesso do Mercado Livre
 */

export class TokenManager {
  private readonly INTERNAL_TOKEN: string;
  private readonly SUPABASE_URL: string;
  private readonly ANON_KEY: string;
  
  constructor() {
    this.INTERNAL_TOKEN = Deno.env.get("INTERNAL_SHARED_TOKEN") || "internal-shared-token";
    this.SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    this.ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  }
  
  /**
   * Obter token válido do Mercado Livre
   */
  async getValidToken(integrationAccountId: string): Promise<string> {
    const secretUrl = `${this.SUPABASE_URL}/functions/v1/integrations-get-secret`;
    const secretResponse = await fetch(secretUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.ANON_KEY}`,
        'x-internal-call': 'true',
        'x-internal-token': this.INTERNAL_TOKEN
      },
      body: JSON.stringify({
        integration_account_id: integrationAccountId,
        provider: 'mercadolivre'
      })
    });
    
    if (!secretResponse.ok) {
      const errorText = await secretResponse.text();
      throw new Error(`Token ML não disponível (${secretResponse.status}): ${errorText}`);
    }
    
    const tokenData = await secretResponse.json();
    
    if (!tokenData?.found || !tokenData?.secret?.access_token) {
      throw new Error('Token ML não encontrado na resposta. Reconecte a integração.');
    }
    
    return tokenData.secret.access_token;
  }
}
