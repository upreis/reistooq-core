import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ShoppingCart, User, RefreshCw, Unlink, ExternalLink } from 'lucide-react';

interface MLAccount {
  id: string;
  name: string;
  account_identifier: string;
  public_auth: any;
  is_active: boolean;
  created_at: string;
}

interface MLOrder {
  id: number;
  status: string;
  date_created: string;
  total_amount: number;
  buyer: {
    nickname: string;
  };
}

export function MercadoLivreSimple() {
  const [accounts, setAccounts] = useState<MLAccount[]>([]);
  const [orders, setOrders] = useState<MLOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

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
      setAccounts((data || []) as MLAccount[]);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      toast.error('Erro ao carregar contas do MercadoLibre');
    } finally {
      setLoading(false);
    }
  };

  const connectAccount = async () => {
    try {
      setConnecting(true);
      
      // Usar supabase.functions.invoke em vez de fetch direto para evitar CORS
      const { data, error } = await supabase.functions.invoke('mercadolibre-oauth-start', {
        body: {}
      });

      if (error) throw new Error(error.message || 'Erro ao iniciar OAuth');
      if (!data?.success || !data?.authorization_url) {
        throw new Error(data?.error || 'URL de autorização não retornada');
      }

      const popup = window.open(
        data.authorization_url,
        'ml-oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Popup bloqueado');
      }

      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'oauth_success') {
          popup.close();
          window.removeEventListener('message', handleMessage);
          toast.success('MercadoLibre conectado com sucesso!');
          loadAccounts();
        } else if (event.data?.type === 'oauth_error') {
          popup.close();
          window.removeEventListener('message', handleMessage);
          toast.error(`Erro: ${event.data.error}`);
        }
      };

      window.addEventListener('message', handleMessage);

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
        }
      }, 1000);

    } catch (error) {
      console.error('Erro ao conectar:', error);
      toast.error('Erro ao conectar com MercadoLibre');
    } finally {
      setConnecting(false);
    }
  };

  const disconnectAccount = async (accountId: string) => {
    if (!confirm('Desconectar esta conta?')) return;

    try {
      const { error } = await supabase
        .from('integration_accounts')
        .update({ is_active: false })
        .eq('id', accountId);

      if (error) throw error;
      toast.success('Conta desconectada');
      loadAccounts();
    } catch (error) {
      toast.error('Erro ao desconectar');
    }
  };

  const loadOrders = async (accountId: string) => {
    try {
      setLoadingOrders(true);
      setSelectedAccount(accountId);

      // Usar supabase.functions.invoke em vez de fetch direto
      const { data, error } = await supabase.functions.invoke('unified-orders', {
        body: { 
          integration_account_id: accountId, 
          limit: 20 
        }
      });

      if (error) throw new Error(error.message || 'Erro ao buscar pedidos');
      if (!data?.ok) throw new Error(data?.error || 'Erro ao buscar pedidos');

      setOrders(data.orders || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-yellow-500" />
            MercadoLibre - Versão Simplificada
          </CardTitle>
          <CardDescription>
            Conecte e gerencie suas contas do MercadoLibre de forma simples
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {accounts.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhuma conta conectada
              </p>
              <Button onClick={connectAccount} disabled={connecting}>
                {connecting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Conectar MercadoLibre
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {accounts.map((account) => (
                  <div key={account.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{account.public_auth?.nickname || account.name}</span>
                        <Badge variant="default">Ativa</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadOrders(account.id)}
                          disabled={loadingOrders}
                        >
                          {loadingOrders && selectedAccount === account.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <ShoppingCart className="h-3 w-3" />
                          )}
                          Pedidos
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => disconnectAccount(account.id)}
                        >
                          <Unlink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Site: {account.public_auth?.site_id || 'MLB'}</p>
                      <p>ID: {account.public_auth?.user_id || account.account_identifier}</p>
                      {account.public_auth?.email && <p>Email: {account.public_auth.email}</p>}
                    </div>
                  </div>
                ))}
              </div>
              
              <Button variant="outline" onClick={connectAccount} disabled={connecting}>
                {connecting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                <ExternalLink className="mr-2 h-4 w-4" />
                Conectar Outra Conta
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {orders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Recentes</CardTitle>
            <CardDescription>
              Últimos 20 pedidos da conta selecionada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">#{order.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.buyer.nickname} • {new Date(order.date_created).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">R$ {order.total_amount?.toFixed(2)}</p>
                    <Badge variant="secondary">{order.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}