// 🎯 MercadoLibre Connection Component
// UI for connecting and managing ML integration

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ShoppingCart, User, Calendar, ExternalLink, Unplug, RefreshCw, Copy } from 'lucide-react';
import { mercadoLivreService, type MLAccount } from '@/services/MercadoLivreService';
import { supabase } from '@/integrations/supabase/client';
import { PermissionFixButton } from './PermissionFixButton';
import MeliOrders from '@/components/MeliOrders';


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
  const [testingFunctions, setTestingFunctions] = useState(false);
  const [manualAuthUrl, setManualAuthUrl] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const pollRef = useRef<number | null>(null);
  const pollTimeoutRef = useRef<number | null>(null);

  // Load session and accounts
  useEffect(() => {
    // Ensure organization exists and get session
    const initializeUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        if (session?.user) {
          console.info('[ML Connection] Ensuring organization for user:', session.user.id);
          const { data: orgResult, error } = await supabase.rpc('ensure_current_org');
          
          if (error || !(orgResult as any)?.success) {
            console.error('[ML Connection] Failed to ensure organization:', error, orgResult);
            toast.error('Erro ao verificar organização do usuário');
            return;
          }
          
          console.info('[ML Connection] Organization ensured:', (orgResult as any).organization_id);
          loadAccounts();
        }
      } catch (error) {
        console.error('[ML Connection] Initialization error:', error);
      }
    };

    initializeUser();
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


  // Fallback: polling quando popup é bloqueado
  const startPollingForConnection = () => {
    try {
      if (pollRef.current) window.clearInterval(pollRef.current);
      if (pollTimeoutRef.current) window.clearTimeout(pollTimeoutRef.current);
    } catch {}

    pollRef.current = window.setInterval(async () => {
      try {
        const connectedAccounts = await mercadoLivreService.getConnectedAccounts();
        if (connectedAccounts.length > 0) {
          setAccounts(connectedAccounts);
          setIsConnecting(false);
          setManualAuthUrl(null);
          if (pollRef.current) window.clearInterval(pollRef.current);
          if (pollTimeoutRef.current) window.clearTimeout(pollTimeoutRef.current);
          toast.success('✅ Conta Mercado Livre conectada!');
        }
      } catch {
        // ignore
      }
    }, 2000);

    // timeout em 5 minutos
    pollTimeoutRef.current = window.setTimeout(() => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    }, 300000);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      if (pollTimeoutRef.current) window.clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  const handleCopyUrl = async () => {
    if (!manualAuthUrl) return;
    try {
      await navigator.clipboard.writeText(manualAuthUrl);
      toast.success('URL copiada para a área de transferência');
    } catch {
      toast.error('Não foi possível copiar automaticamente');
    }
  };

  const handleOpenManual = () => {
    if (!manualAuthUrl) return;
    // Tentativa de abrir (pode ser bloqueado pelo sandbox)
    window.open(manualAuthUrl, '_blank', 'noopener,noreferrer');
  };

  const handleConnect = async () => {
    if (!session?.user) {
      toast.error('Você precisa estar logado para conectar uma conta do Mercado Livre');
      return;
    }

    try {
      setIsConnecting(true);
      console.info('[ML Connection] Starting OAuth flow...');

      // invoke: POST + Bearer automático
      const { data, error } = await supabase.functions.invoke('mercadolibre-oauth-start', {
        body: {}, // nada necessário
      });

      if (error) throw error;
      const authUrl: string | undefined = data?.authorization_url ?? data?.url;
      if (!authUrl) throw new Error('Start não retornou a URL de autorização');

      // tenta abrir popup
      const popup = window.open(
        authUrl,
        'ml-oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // se popup bloqueado → fallback com link manual + polling
      if (!popup) {
        toast.warning('Pop-up bloqueado pelo navegador. Use o link manual para concluir a conexão.');
        setManualAuthUrl(authUrl);
        startPollingForConnection();
        setIsConnecting(false);
        return;
      }

      // listener único por tentativa
      const handleMessage = (event: MessageEvent) => {
        // dica: se quiser, filtre por origem do seu projeto Supabase:
        // if (!String(event.origin).includes('.supabase.co')) return;
        const d = event.data;
        if (!d || d.provider !== 'mercadolivre') return;

        window.removeEventListener('message', handleMessage);
        try { popup.close(); } catch {}

        if (d.type === 'oauth_success') {
          setIsConnecting(false);
          toast.success('Mercado Livre conectado com sucesso!');
          loadAccounts();
        } else if (d.type === 'oauth_error') {
          setIsConnecting(false);
          const msg = d.error || 'Erro desconhecido';
          if (msg.includes('OPERATOR_REQUIRED')) {
            toast.error('Use uma conta ADMIN no Mercado Livre para integrar.');
          } else if (msg.includes('invalid_grant') || msg.includes('expirado')) {
            toast.error('Código expirado. Tente conectar novamente.');
          } else {
            toast.error(`Erro na autenticação: ${msg}`);
          }
        }
      };

      window.addEventListener('message', handleMessage);

      // cleanup se o usuário fechar o popup
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setIsConnecting(false);
        }
      }, 1000);
    } catch (err: any) {
      console.error('ML connection failed:', err);
      toast.error(err?.message || 'Falha ao conectar Mercado Livre');
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

  const testEdgeFunctions = async () => {
    try {
      setTestingFunctions(true);
      
      // 1. Test mercadolibre-oauth-callback (OAuth callback)
      const smoothResponse = await fetch("https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/mercadolibre-oauth-callback?code=TEST&state=TEST");
      const smoothText = await smoothResponse.text();
      
      if (!smoothText.includes("Missing code or state") && !smoothText.includes("Invalid or expired state")) {
        toast.error("❌ mercadolibre-oauth-callback não está respondendo corretamente");
        return;
      }
      
      // 2. Test mercadolibre-oauth-start (OAuth start) - requires auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("❌ Usuário não autenticado para testar mercadolibre-oauth-start");
        return;
      }
      
      const hyperResponse = await fetch("https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/mercadolibre-oauth-start", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ usePkce: true })
      });
      
      const hyperData = await hyperResponse.json();
      const hyperAuthUrl: string | undefined = hyperData.url || hyperData.authorization_url;
      
      if (!hyperData.ok || !hyperAuthUrl || !hyperAuthUrl.startsWith("https://auth.mercadolivre.com.br/authorization")) {
        toast.error("❌ mercadolibre-oauth-start não está gerando URL válida");
        console.error("mercadolibre-oauth-start response:", hyperData);
        return;
      }
      
      // 3. Test other functions availability via authenticated POST (expecting validation error)
      const functions = ['mercadolibre-token-refresh', 'unified-orders'];
      for (const func of functions) {
        const response = await fetch(`https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/${func}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ ping: true })
        });
        // Consider 200/400/405 as "alive" (function exists and responded)
        if (![200, 400, 405].includes(response.status)) {
          toast.error(`❌ ${func} retornou status inesperado: ${response.status}`);
          return;
        }
      }
      
      toast.success("✅ Todas as Edge Functions estão funcionando corretamente!");
      
    } catch (error) {
      console.error("Edge Functions test failed:", error);
      toast.error(`❌ Erro ao testar funções: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setTestingFunctions(false);
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
            
            {/* Botão de teste das Edge Functions */}
            <div className="space-y-2 mb-4">
              <Button 
                variant="outline"
                onClick={testEdgeFunctions} 
                disabled={testingFunctions}
                className="w-full"
              >
                {testingFunctions ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testando funções...
                  </>
                ) : (
                  <>
                    🧪 Testar Edge Functions
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                Testa se as funções mercadolibre-oauth-start, mercadolibre-oauth-callback, mercadolibre-token-refresh e mercadolibre-orders estão funcionando
              </p>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={handleConnect} 
                disabled={isConnecting || !session?.user}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : !session?.user ? (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Faça login para conectar
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Conectar Mercado Livre
                  </>
                )}
              </Button>
              
              {session?.user && (
                <PermissionFixButton />
              )}
            </div>
            
            {!session?.user && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                É necessário estar logado para conectar integrações
              </p>
            )}

            {manualAuthUrl && (
              <div className="mt-4 border rounded p-3 text-left">
                <p className="text-sm text-muted-foreground mb-2">
                  Pop-up bloqueado pelo navegador. Use o link abaixo para concluir a autenticação no Mercado Livre. A conexão será detectada automaticamente.
                </p>
                <div className="flex flex-col gap-2">
                  <code className="text-xs break-all bg-muted/40 p-2 rounded">{manualAuthUrl}</code>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleOpenManual}>
                      <ExternalLink className="h-3 w-3 mr-1" /> Abrir link
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                      <Copy className="h-3 w-3 mr-1" /> Copiar URL
                    </Button>
                  </div>
                </div>
              </div>
            )}

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

            <Separator className="my-4" />
            
            <div>
              <h4 className="font-medium mb-3">Pedidos Recentes</h4>
              <MeliOrders integrationAccountId={accounts[0]?.id} />
            </div>

            <Button 
              variant="outline"
              onClick={handleConnect}
              disabled={isConnecting || !session?.user}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : !session?.user ? (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Faça login para conectar outra conta
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