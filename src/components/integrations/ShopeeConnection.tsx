import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { ShoppingBag, Loader2, CheckCircle, AlertCircle, ExternalLink, Settings, Save, Unplug } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function ShopeeConnection() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [shopId, setShopId] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [partnerKey, setPartnerKey] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    loadShopeeAccounts();
    loadShopeeConfig();
    handleOAuthCallback();
  }, []);

  const loadShopeeAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('integration_accounts')
        .select('*')
        .eq('provider', 'shopee')
        .eq('is_active', true);

      if (error) throw error;

      setAccounts(data || []);
      console.log(`✅ Contas Shopee carregadas: ${data?.length || 0}`);
    } catch (error) {
      console.error('Erro ao carregar contas Shopee:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadShopeeConfig = async () => {
    // Não carrega mais configurações globais - cada conta terá suas próprias credenciais
    console.log('Configurações Shopee serão específicas por conta');
  };

  const saveShopeeConfig = async () => {
    // Validar todos os campos obrigatórios
    if (!shopId.trim()) {
      toast.error('Shop ID é obrigatório');
      return;
    }
    if (!partnerId.trim()) {
      toast.error('Partner ID é obrigatório');
      return;
    }
    if (!appId.trim()) {
      toast.error('App ID é obrigatório');
      return;
    }
    if (!appSecret.trim()) {
      toast.error('App Secret é obrigatório');
      return;
    }
    if (!partnerKey.trim()) {
      toast.error('Partner Key é obrigatório');
      return;
    }

    setSavingConfig(true);
    try {
      // Primeiro criar a conta de integração
      const { data: newAccount, error: accountError } = await supabase
        .from('integration_accounts')
        .insert({
          provider: 'shopee',
          name: `Shopee - Shop ${shopId}`,
          account_identifier: shopId.trim(),
          public_auth: {
            shop_id: shopId.trim(),
            partner_id: partnerId.trim()
          }
        })
        .select()
        .single();

      if (accountError) throw accountError;

      // Depois salvar as credenciais de forma segura
      const { error: secretError } = await supabase.functions.invoke('integrations-store-secret', {
        body: {
          integration_account_id: newAccount.id,
          provider: 'shopee',
          payload: {
            shop_id: shopId.trim(),
            partner_id: partnerId.trim(),
            app_id: appId.trim(),
            app_secret: appSecret.trim(),
            partner_key: partnerKey.trim()
          }
        }
      });

      if (secretError) throw secretError;

      toast.success('Conta Shopee configurada com sucesso!');
      setShowConfig(false);
      
      // Limpar campos
      setShopId('');
      setPartnerId('');
      setAppId('');
      setAppSecret('');
      setPartnerKey('');
      
      // Recarregar contas
      loadShopeeAccounts();
    } catch (error: any) {
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleOAuthCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state) {
      console.log('🔄 Processando callback OAuth Shopee...');
      
      try {
        const response = await supabase.functions.invoke('shopee-oauth', {
          body: {
            action: 'handle_callback',
            code: code,
            state: state
          }
        });

        if (response.error) throw response.error;

        if (response.data?.success) {
          toast.success('🛍️ Shopee conectado com sucesso!');
          
          // Limpar parâmetros da URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Recarregar contas
          loadShopeeAccounts();
        } else {
          toast.error('Erro ao processar autorização Shopee');
        }
      } catch (error: any) {
        console.error('Erro no callback OAuth:', error);
        toast.error(`Erro: ${error.message}`);
      }
    }
  };

  const handleConnect = async (accountId: string) => {
    setIsConnecting(true);
    
    try {
      console.log(`🚀 Iniciando OAuth Shopee para conta: ${accountId}`);
      
      const response = await supabase.functions.invoke('shopee-oauth', {
        body: {
          action: 'get_auth_url',
          integration_account_id: accountId,
          redirect_uri: `${window.location.origin}${window.location.pathname}`
        }
      });

      if (response.error) throw response.error;
      
      const { auth_url } = response.data;
      
      if (auth_url) {
        toast.success('Redirecionando para autorização Shopee...');
        
        // Salvar contexto para o callback
        localStorage.setItem('shopee_oauth_context', JSON.stringify({
          account_id: accountId,
          timestamp: Date.now()
        }));
        
        // Redirecionar para OAuth Shopee
        window.location.href = auth_url;
      } else {
        throw new Error('URL de autorização não recebida');
      }
      
    } catch (error: any) {
      toast.error(`Erro ao conectar: ${error.message}`);
      console.error('❌ Shopee OAuth error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('integration_accounts')
        .update({ is_active: false })
        .eq('id', accountId);

      if (error) throw error;

      toast.success('Shopee desconectado');
      loadShopeeAccounts();
    } catch (error: any) {
      toast.error(`Erro ao desconectar: ${error.message}`);
    }
  };

  const handleTestConnection = async (accountId: string) => {
    try {
      const response = await supabase.functions.invoke('shopee-validate', {
        body: { integration_account_id: accountId }
      });

      if (response.error) throw response.error;

      if (response.data?.success) {
        toast.success('✅ Conexão Shopee funcionando!');
      } else {
        toast.error('❌ Problema na conexão Shopee');
      }
    } catch (error: any) {
      toast.error(`Erro no teste: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-slate-200 h-10 w-10"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasConnections = accounts.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🛍️ Shopee
          {hasConnections ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              {accounts.length} conta{accounts.length > 1 ? 's' : ''}
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              <AlertCircle className="w-3 h-3 mr-1" />
              Não conectado
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {hasConnections 
            ? '✅ Integração ativa - pedidos sendo importados'
            : 'Configure sua integração com o Shopee'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasConnections ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <Card key={account.id} className="bg-success/5 border-success/20 dark:bg-success/10 dark:border-success/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-success font-medium">{account.name}</span>
                    </div>
                    <Badge variant="default" className="bg-success/10 text-success border-success/20">
                      Conectado
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    {/* Mostrar Shop ID */}
                    <p className="text-muted-foreground">
                      <span className="font-medium">Shop ID:</span> {account.account_identifier}
                    </p>
                    
                    {/* Mostrar ID do usuário se disponível */}
                    {account.public_auth?.user_id && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">ID:</span> {account.public_auth.user_id}
                      </p>
                    )}
                    
                    {/* Mostrar email se disponível */}
                    {account.public_auth?.email && (
                      <p className="text-muted-foreground break-all">
                        <span className="font-medium">Email:</span> {account.public_auth.email}
                      </p>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleConnect(account.id)}
                    className="w-full"
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Autorizar Shopee
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleTestConnection(account.id)}
                    className="w-full"
                  >
                    Testar Conexão
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDisconnect(account.id)}
                    className="w-full"
                  >
                    <Unplug className="w-4 h-4 mr-2" />
                    Desconectar
                  </Button>
                </CardContent>
              </Card>
            ))}
            
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowConfig(!showConfig)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Adicionar Conta
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://seller.shopee.com.br', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Shopee Seller
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                📝 Configure suas credenciais Shopee para conectar uma loja
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowConfig(!showConfig)}
                variant="outline"
                className="flex-1"
              >
                <Settings className="w-4 h-4 mr-2" />
                Adicionar Conta Shopee
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.open('https://seller.shopee.com.br', '_blank')}
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Shopee Seller
              </Button>
            </div>
          </div>
        )}

        {showConfig && (
          <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
            <h3 className="font-medium text-blue-800">Configurar Nova Conta Shopee</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shopId">Shop ID</Label>
                <Input
                  id="shopId"
                  placeholder="Ex: 225917626"
                  value={shopId}
                  onChange={(e) => setShopId(e.target.value)}
                />
                <p className="text-xs text-blue-600">
                  Encontre no Shopee Seller Center
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="partnerId">Partner ID</Label>
                <Input
                  id="partnerId"
                  placeholder="Ex: 1185587"
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value)}
                />
                <p className="text-xs text-blue-600">
                  ID do partner no Open Platform
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="appId">App ID</Label>
                <Input
                  id="appId"
                  placeholder="Ex: 123456"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                />
                <p className="text-xs text-blue-600">
                  ID da aplicação Shopee
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="appSecret">App Secret</Label>
                <Input
                  id="appSecret"
                  type="password"
                  placeholder="Ex: abcd1234..."
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                />
                <p className="text-xs text-blue-600">
                  Secret da aplicação Shopee
                </p>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="partnerKey">Partner Key</Label>
                <Input
                  id="partnerKey"
                  type="password"
                  placeholder="Ex: xyz789..."
                  value={partnerKey}
                  onChange={(e) => setPartnerKey(e.target.value)}
                />
                <p className="text-xs text-blue-600">
                  Chave do partner para autenticação
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={saveShopeeConfig}
                disabled={savingConfig || !shopId.trim() || !partnerId.trim() || !appId.trim() || !appSecret.trim() || !partnerKey.trim()}
                className="flex-1"
              >
                {savingConfig ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar e Configurar
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowConfig(false);
                  setShopId('');
                  setPartnerId('');
                  setAppId('');
                  setAppSecret('');
                  setPartnerKey('');
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}


        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <span className="text-blue-800">✅ API Shopee real implementada</span>
          </div>
          <p>Após autorizar, os pedidos serão importados automaticamente</p>
        </div>
      </CardContent>
    </Card>
  );
}