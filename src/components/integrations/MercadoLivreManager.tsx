import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  ShoppingCart, 
  User, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Unlink,
  ExternalLink 
} from 'lucide-react';

interface MLAccount {
  id: string;
  name: string;
  account_identifier: string;
  public_auth: {
    user_id: number;
    nickname: string;
    email?: string;
    site_id: string;
    country_id?: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface MercadoLivreManagerProps {
  onAccountsUpdate?: (accounts: MLAccount[]) => void;
}

export function MercadoLivreManager({ onAccountsUpdate }: MercadoLivreManagerProps) {
  const [accounts, setAccounts] = useState<MLAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  // Carregar contas conectadas
  const loadAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('integration_accounts')
        .select('*')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mlAccounts = (data || []) as unknown as MLAccount[];
      setAccounts(mlAccounts);
      onAccountsUpdate?.(mlAccounts);
    } catch (error) {
      console.error('Erro ao carregar contas ML:', error);
      toast.error('Erro ao carregar contas do MercadoLibre');
    } finally {
      setLoading(false);
    }
  };

  // Conectar nova conta
  const handleConnect = async () => {
    try {
      setConnecting(true);
      
      // Iniciar fluxo OAuth
      const { data, error } = await supabase.functions.invoke('hyper-function', {
        body: { organization_id: 'current' }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Abrir popup para autorização
      const rawUrl: string = data.authorization_url as string;
      const authUrl = rawUrl
        .replace('auth.mercadolibre.com/authorization', 'auth.mercadolivre.com.br/authorization')
        .replace('auth.mercadolibre.com.ar/authorization', 'auth.mercadolivre.com.br/authorization')
        .replace('auth.mercadolibre.com.br/authorization', 'auth.mercadolivre.com.br/authorization');

      const popup = window.open(
        authUrl,
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Popup bloqueado. Permita popups para este site.');
      }

      // Escutar mensagens do popup
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'ML_AUTH_SUCCESS') {
          popup.close();
          toast.success('Conta MercadoLibre conectada com sucesso!');
          loadAccounts();
          window.removeEventListener('message', handleMessage);
        } else if (event.data.type === 'ML_AUTH_ERROR') {
          popup.close();
          console.error('Erro OAuth ML:', event.data.error);
          toast.error(`Erro na conexão: ${event.data.error}`);
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);

      // Cleanup se popup for fechado manualmente
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setConnecting(false);
        }
      }, 1000);

    } catch (error) {
      console.error('Erro ao conectar ML:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao conectar com MercadoLibre');
    } finally {
      setConnecting(false);
    }
  };

  // Desconectar conta
  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Tem certeza que deseja desconectar esta conta do MercadoLibre?')) return;

    try {
      const { error } = await supabase
        .from('integration_accounts')
        .update({ is_active: false })
        .eq('id', accountId);

      if (error) throw error;

      toast.success('Conta desconectada com sucesso');
      loadAccounts();
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      toast.error('Erro ao desconectar conta');
    }
  };

  // Testar/renovar token
  const handleRefreshToken = async (accountId: string) => {
    try {
      setRefreshing(accountId);
      
      const { data, error } = await supabase.functions.invoke('smart-responder', {
        body: { integration_account_id: accountId }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast.success('Token renovado com sucesso');
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao renovar token');
    } finally {
      setRefreshing(null);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            MercadoLibre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-yellow-500" />
          MercadoLibre
        </CardTitle>
        <CardDescription>
          Conecte suas contas do MercadoLibre para sincronizar pedidos automaticamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {accounts.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Nenhuma conta MercadoLibre conectada
            </p>
            <Button 
              onClick={handleConnect}
              disabled={connecting}
              className="w-full"
            >
              {connecting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Conectar MercadoLibre
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {accounts.map((account) => (
                <div key={account.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{account.public_auth.nickname}</span>
                      </div>
                      <Badge variant={account.is_active ? "default" : "secondary"}>
                        {account.is_active ? (
                          <><CheckCircle className="mr-1 h-3 w-3" /> Ativa</>
                        ) : (
                          <><XCircle className="mr-1 h-3 w-3" /> Inativa</>
                        )}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRefreshToken(account.id)}
                        disabled={refreshing === account.id}
                      >
                        {refreshing === account.id ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(account.id)}
                      >
                        <Unlink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Site:</span> {account.public_auth.site_id}
                    </div>
                    <div>
                      <span className="font-medium">ID:</span> {account.public_auth.user_id}
                    </div>
                    {account.public_auth.email && (
                      <div className="col-span-2">
                        <span className="font-medium">Email:</span> {account.public_auth.email}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Conectada em {new Date(account.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <Button 
              variant="outline"
              onClick={handleConnect}
              disabled={connecting}
              className="w-full"
            >
              {connecting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              <ExternalLink className="mr-2 h-4 w-4" />
              Conectar Outra Conta
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}