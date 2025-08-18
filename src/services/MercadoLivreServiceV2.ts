import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Interface para conta ML v2
export interface MLAccountV2 {
  id: string;
  organization_id: string;
  user_id: string;
  ml_user_id: string;
  nickname: string;
  email?: string;
  site_id: string;
  country_id: string;
  is_active: boolean;
  last_sync?: string;
  created_at: string;
  updated_at: string;
}

// Interface para resposta de sincronização
export interface SyncResponse {
  success: boolean;
  synced: number;
  errors: string[];
  total_available: number;
  account_nickname: string;
}

class MercadoLivreServiceV2 {
  private static instance: MercadoLivreServiceV2;

  static getInstance(): MercadoLivreServiceV2 {
    if (!MercadoLivreServiceV2.instance) {
      MercadoLivreServiceV2.instance = new MercadoLivreServiceV2();
    }
    return MercadoLivreServiceV2.instance;
  }

  /**
   * Inicia o fluxo OAuth v2 do MercadoLibre
   */
  async initiateOAuth(): Promise<{ success: boolean; authorization_url?: string; error?: string }> {
    try {
      console.log('[ML Service v2] Iniciando OAuth...');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      const response = await supabase.functions.invoke('mercadolivre-oauth-start-v2', {
        body: { organization_id: 'current' },
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        console.error('[ML Service v2] Erro na function:', response.error);
        return { success: false, error: response.error.message };
      }

      const data = response.data;
      console.log('[ML Service v2] OAuth iniciado:', data);

      return {
        success: data.success,
        authorization_url: data.authorization_url,
        error: data.error
      };

    } catch (error) {
      console.error('[ML Service v2] Erro ao iniciar OAuth:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno'
      };
    }
  }

  /**
   * Obtém as contas MercadoLibre conectadas v2
   */
  async getConnectedAccounts(): Promise<MLAccountV2[]> {
    try {
      console.log('[ML Service v2] Buscando contas conectadas...');

      const { data, error } = await supabase
        .from('ml_accounts_v2')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[ML Service v2] Erro ao buscar contas:', error);
        throw new Error(`Erro ao buscar contas: ${error.message}`);
      }

      console.log('[ML Service v2] Contas encontradas:', data?.length || 0);
      return data || [];

    } catch (error) {
      console.error('[ML Service v2] Erro ao obter contas:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar contas do MercadoLibre",
        variant: "destructive",
      });
      return [];
    }
  }

  /**
   * Sincroniza pedidos de uma conta específica
   */
  async syncOrders(
    accountId: string, 
    options?: { since?: string; until?: string; status?: string }
  ): Promise<SyncResponse> {
    try {
      console.log('[ML Service v2] Sincronizando pedidos:', { accountId, options });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      const response = await supabase.functions.invoke('mercadolivre-orders-v2', {
        body: {
          account_id: accountId,
          since: options?.since,
          until: options?.until,
          status: options?.status
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        console.error('[ML Service v2] Erro na sincronização:', response.error);
        throw new Error(response.error.message);
      }

      const data = response.data;
      console.log('[ML Service v2] Sincronização concluída:', data);

      return {
        success: data.success,
        synced: data.synced,
        errors: data.errors || [],
        total_available: data.total_available,
        account_nickname: data.account_nickname
      };

    } catch (error) {
      console.error('[ML Service v2] Erro na sincronização:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Erro ao sincronizar pedidos'
      );
    }
  }

  /**
   * Desconecta uma conta MercadoLibre
   */
  async disconnect(accountId: string): Promise<boolean> {
    try {
      console.log('[ML Service v2] Desconectando conta:', accountId);

      const { error } = await supabase
        .from('ml_accounts_v2')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('ml_user_id', accountId);

      if (error) {
        console.error('[ML Service v2] Erro ao desconectar:', error);
        throw new Error(`Erro ao desconectar conta: ${error.message}`);
      }

      console.log('[ML Service v2] Conta desconectada com sucesso');
      return true;

    } catch (error) {
      console.error('[ML Service v2] Erro ao desconectar conta:', error);
      toast({
        title: "Erro",
        description: "Falha ao desconectar conta do MercadoLibre",
        variant: "destructive",
      });
      return false;
    }
  }

  /**
   * Verifica o status da conexão
   */
  async getConnectionStatus(): Promise<{
    connected: boolean;
    accounts: MLAccountV2[];
    last_sync?: string;
  }> {
    try {
      const accounts = await this.getConnectedAccounts();
      const connected = accounts.length > 0;
      const lastSync = accounts.length > 0 
        ? accounts.reduce((latest, account) => {
            if (!latest || !account.last_sync) return account.last_sync || undefined;
            if (!account.last_sync) return latest;
            return new Date(account.last_sync) > new Date(latest) 
              ? account.last_sync 
              : latest;
          }, undefined as string | undefined)
        : undefined;

      return {
        connected,
        accounts,
        last_sync: lastSync
      };

    } catch (error) {
      console.error('[ML Service v2] Erro ao verificar status:', error);
      return {
        connected: false,
        accounts: [],
        last_sync: undefined
      };
    }
  }
}

// Exportar instância singleton
export const mercadoLivreServiceV2 = MercadoLivreServiceV2.getInstance();