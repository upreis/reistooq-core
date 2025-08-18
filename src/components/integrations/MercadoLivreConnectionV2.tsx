import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, Trash2, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { mercadoLivreServiceV2, type MLAccountV2 } from '@/services/MercadoLivreServiceV2';

interface MercadoLivreConnectionV2Props {
  onOrdersSync?: (data: any) => void;
}

export function MercadoLivreConnectionV2({ onOrdersSync }: MercadoLivreConnectionV2Props) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [accounts, setAccounts] = useState<MLAccountV2[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAccounts = async () => {
    try {
      const connectedAccounts = await mercadoLivreServiceV2.getConnectedAccounts();
      setAccounts(connectedAccounts);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleConnect = async () => {
    if (isConnecting) return;

    setIsConnecting(true);
    try {
      const result = await mercadoLivreServiceV2.initiateOAuth();
      
      if (!result.success) {
        toast({
          title: "Erro na conexão",
          description: result.error || "Falha ao iniciar conexão",
          variant: "destructive",
        });
        return;
      }

      if (!result.authorization_url) {
        toast({
          title: "Erro",
          description: "URL de autorização não recebida",
          variant: "destructive",
        });
        return;
      }

      // Abrir popup para autorização
      const popup = window.open(
        result.authorization_url,
        'ml_oauth_v2',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Listener para mensagens do popup
      const messageListener = (event: MessageEvent) => {
        if (event.data?.type === 'oauth_success' && event.data?.provider === 'mercadolivre') {
          toast({
            title: "Sucesso!",
            description: "Conta MercadoLibre conectada com sucesso",
          });
          loadAccounts();
          popup?.close();
          window.removeEventListener('message', messageListener);
        } else if (event.data?.type === 'oauth_error') {
          toast({
            title: "Erro na autenticação",
            description: event.data.error || "Falha na autenticação",
            variant: "destructive",
          });
          popup?.close();
          window.removeEventListener('message', messageListener);
        }
      };

      window.addEventListener('message', messageListener);

      // Cleanup se popup for fechado manualmente
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
        }
      }, 1000);

    } catch (error) {
      console.error('Erro ao conectar:', error);
      toast({
        title: "Erro",
        description: "Falha ao iniciar conexão com MercadoLibre",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSyncOrders = async (accountId: string) => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const result = await mercadoLivreServiceV2.syncOrders(accountId, {
        since: thirtyDaysAgo.toISOString().split('T')[0]
      });

      if (result.success) {
        toast({
          title: "Sincronização concluída",
          description: `${result.synced} pedidos sincronizados`,
        });
        
        if (onOrdersSync) {
          onOrdersSync(result);
        }
        
        loadAccounts(); // Atualizar last_sync
      } else {
        toast({
          title: "Erro na sincronização",
          description: `Erros: ${result.errors.length}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast({
        title: "Erro",
        description: "Falha ao sincronizar pedidos",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Carregando...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            MercadoLibre v2
            <Badge variant="outline">Nova versão</Badge>
          </CardTitle>
          <CardDescription>
            Conecte sua conta do MercadoLibre para sincronizar pedidos automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Nenhuma conta conectada
              </p>
              <Button 
                onClick={handleConnect} 
                disabled={isConnecting}
                className="w-full sm:w-auto"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Conectar MercadoLibre
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div key={account.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{account.nickname}</h4>
                      <p className="text-sm text-muted-foreground">
                        {account.site_id} • {account.email}
                      </p>
                      {account.last_sync && (
                        <p className="text-xs text-muted-foreground">
                          Última sincronização: {new Date(account.last_sync).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncOrders(account.ml_user_id)}
                        disabled={isSyncing}
                      >
                        {isSyncing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        Sincronizar
                      </Button>
                    </div>
                  </div>
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
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Conectar outra conta
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}