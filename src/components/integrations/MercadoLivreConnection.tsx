// 🎯 MercadoLibre Connection Component
// UI for connecting and managing ML integration

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ShoppingCart, User, Calendar, ExternalLink, Unplug, RefreshCw } from 'lucide-react';
import { mercadoLivreService, type MLAccount } from '@/services/MercadoLivreService';
import { supabase } from '@/integrations/supabase/client';

interface MercadoLivreConnectionProps {
  onOrdersSync?: (accountId: string) => void;
}

export const MercadoLivreConnection: React.FC<MercadoLivreConnectionProps> = ({
  onOrdersSync,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<MLAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Load connected accounts
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const connectedAccounts = await mercadoLivreService.getConnectedAccounts();
      setAccounts(connectedAccounts);
    } catch (error) {
      console.error('Failed to load ML accounts:', error);
      toast.error('Erro ao carregar contas do MercadoLibre');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);

      // Start OAuth via Edge Function that uses ML_REDIRECT_URI (POST)
      const { data, error } = await supabase.functions.invoke('mercadolivre-oauth-start', {
        body: { organization_id: 'current' },
      });

      if (error || !data?.success || !data?.authorization_url) {
        console.error('ML OAuth start failed:', { error, data });
        throw new Error(data?.error || error?.message || 'Falha ao iniciar conexão OAuth');
      }

      const authUrl: string = data.authorization_url as string;

      // Open ML authorization in popup
      const popup = window.open(
        authUrl,
        'ml_oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );
      
      if (!popup) {
        throw new Error('Pop-up bloqueado. Permita pop-ups para continuar.');
      }

      // Listen for OAuth completion messages
      const handleMessage = (event: MessageEvent) => {
        // Accept messages from Supabase edge functions
        if (!event.origin.includes('supabase.co') && event.origin !== window.location.origin) {
          return;
        }

        const successV1 = event.data?.type === 'oauth_success' && event.data?.provider === 'mercadolivre';
        const successLegacy = event.data?.source === 'mercadolivre-oauth' && event.data?.connected === true;
        const errorV1 = event.data?.type === 'oauth_error' && event.data?.provider === 'mercadolivre';

        if (successV1 || successLegacy) {
          popup.close();
          window.removeEventListener('message', handleMessage);
          setIsConnecting(false);
          
          toast.success('Mercado Livre conectado com sucesso!');
          loadAccounts();
          
        } else if (errorV1) {
          popup.close();
          window.removeEventListener('message', handleMessage);
          setIsConnecting(false);
          
          const errorMsg = event.data.error || 'Falha desconhecida';
          
          // Handle specific error types with better user messages
          if (errorMsg.includes('OPERATOR_REQUIRED')) {
            toast.error('Erro: Use uma conta com permissões de administrador no MercadoLibre para realizar integrações.');
          } else if (errorMsg.includes('invalid_grant') || errorMsg.includes('expirado')) {
            toast.error('Código de autorização expirado. Tente conectar novamente.');
          } else {
            toast.error(`Erro na autenticação: ${errorMsg}`);
          }
        }
      };

      window.addEventListener('message', handleMessage);

      // Monitor popup for manual closure
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setIsConnecting(false);
        }
      }, 1000);
    } catch (error) {
      console.error('ML connection failed:', error);
      
      const errorMsg = error instanceof Error ? error.message : 'Falha ao conectar Mercado Livre';
      
      // Handle specific error types
      if (errorMsg.includes('Failed to start OAuth flow')) {
        toast.error('Erro ao iniciar conexão. Verifique sua internet e tente novamente.');
      } else {
        toast.error(errorMsg);
      }
      
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      const success = await mercadoLivreService.disconnect(accountId);
      if (success) {
        toast.success('MercadoLibre desconectado com sucesso');
        await loadAccounts();
      } else {
        toast.error('Falha ao desconectar MercadoLibre');
      }
    } catch (error) {
      console.error('ML disconnect failed:', error);
      toast.error('Erro ao desconectar MercadoLibre');
    }
  };

  const handleSyncOrders = async (accountId: string) => {
    try {
      setIsSyncing(accountId);
      
      const result = await mercadoLivreService.syncOrders(accountId, {
        since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
      });

      if (result.synced > 0) {
        toast.success(`${result.synced} pedidos sincronizados com sucesso`);
        onOrdersSync?.(accountId);
      } else {
        toast.info('Nenhum pedido novo encontrado');
      }

      if (result.errors.length > 0) {
        console.warn('Sync errors:', result.errors);
        toast.error(`${result.errors.length} erros durante a sincronização`);
      }
    } catch (error) {
      console.error('Orders sync failed:', error);
      
      const errorMsg = error instanceof Error ? error.message : 'Erro ao sincronizar pedidos';
      
      // Handle specific sync errors
      if (errorMsg.includes('INSUFFICIENT_PERMISSIONS')) {
        toast.error('Sua conta não tem permissão para acessar pedidos no MercadoLibre.');
      } else if (errorMsg.includes('RATE_LIMIT')) {
        toast.error('Muitas requisições. Aguarde alguns minutos antes de sincronizar novamente.');
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setIsSyncing(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Carregando...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Mercado Livre
        </CardTitle>
        <CardDescription>
          Conecte sua conta do Mercado Livre para sincronizar pedidos automaticamente
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {accounts.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              Nenhuma conta do Mercado Livre conectada
            </p>
            <Button 
              onClick={handleConnect} 
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Conectar Mercado Livre
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <div key={account.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{account.nickname}</span>
                    <Badge variant="outline" className="text-xs">
                      {account.site_id}
                    </Badge>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Conectado
                  </Badge>
                </div>

                {account.email && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {account.email}
                  </p>
                )}

                {account.last_sync && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                    <Calendar className="h-3 w-3" />
                    Última sincronização: {new Date(account.last_sync).toLocaleString('pt-BR')}
                  </div>
                )}

                <Separator className="my-3" />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSyncOrders(account.id)}
                    disabled={isSyncing === account.id}
                    className="flex-1"
                  >
                    {isSyncing === account.id ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sincronizando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sincronizar Pedidos
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect(account.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Unplug className="h-4 w-4 mr-2" />
                    Desconectar
                  </Button>
                </div>

                {account.permalink && (
                  <div className="mt-2">
                    <a
                      href={account.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Ver perfil no Mercado Livre
                    </a>
                  </div>
                )}
              </div>
            ))}

            <Button 
              variant="outline"
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Conectar Outra Conta
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};