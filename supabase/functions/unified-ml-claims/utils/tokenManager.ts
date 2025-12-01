/**
 * 🔐 TOKEN MANAGER
 * Gerencia tokens de acesso do Mercado Livre via Supabase
 */

export class TokenManager {
  private readonly supabase: any;
  
  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }
  
  /**
   * Obter token válido do Mercado Livre para uma conta
   */
  async getValidToken(integrationAccountId: string): Promise<{ token: string; sellerId: string }> {
    // Buscar dados da conta
    const { data: account, error: accountError } = await this.supabase
      .from('integration_accounts')
      .select('account_identifier, is_active')
      .eq('id', integrationAccountId)
      .single();

    if (accountError || !account) {
      throw new Error(`Conta não encontrada: ${accountError?.message}`);
    }

    if (!account.is_active) {
      throw new Error(`Conta ${integrationAccountId} está inativa`);
    }

    const sellerId = account.account_identifier;

    // Buscar token da conta
    const { data: secretRow, error: secretError } = await this.supabase
      .from('integration_secrets')
      .select('simple_tokens, use_simple')
      .eq('integration_account_id', integrationAccountId)
      .eq('provider', 'mercadolivre')
      .maybeSingle();

    if (secretError || !secretRow) {
      throw new Error(`Token não encontrado para conta ${integrationAccountId}`);
    }

    let accessToken = '';
    if (secretRow?.use_simple && secretRow?.simple_tokens) {
      try {
        const simpleTokensStr = secretRow.simple_tokens as string;
        if (simpleTokensStr.startsWith('SALT2024::')) {
          const base64Data = simpleTokensStr.replace('SALT2024::', '');
          const jsonStr = atob(base64Data);
          const tokensData = JSON.parse(jsonStr);
          accessToken = tokensData.access_token || '';
        }
      } catch (err) {
        throw new Error(`Erro ao descriptografar token: ${err}`);
      }
    }

    if (!accessToken) {
      throw new Error('Token ML indisponível. Reconecte a integração.');
    }

    return { token: accessToken, sellerId };
  }
}
