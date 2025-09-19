import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { ShoppingBag, Loader2, CheckCircle, AlertCircle, ExternalLink, Settings, Save, Unplug, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function ShopeeConnection() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [shopId, setShopId] = useState('225917626');
  const [partnerId, setPartnerId] = useState('1185587');
  const [accessToken, setAccessToken] = useState('4d6d4a70485346456855a64b426e496c');
  const [environment, setEnvironment] = useState('test');
  const [apiDomain, setApiDomain] = useState('https://openplatform.sandbox.test-stable.shopee.sg');
  const [showSetup, setShowSetup] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [showToken, setShowToken] = useState(false);

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

  const clearFormFields = () => {
    setShopId('225917626');
    setPartnerId('1185587');
    setAccessToken('4d6d4a70485346456855a64b426e496c');
    setEnvironment('test');
    setApiDomain('https://openplatform.sandbox.test-stable.shopee.sg');
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
    if (!accessToken.trim()) {
      toast.error('Access Token é obrigatório');
      return;
    }
    if (!environment.trim()) {
      toast.error('Environment é obrigatório');
      return;
    }
    if (!apiDomain.trim()) {
      toast.error('API Domain é obrigatório');
      return;
    }

    setSavingConfig(true);
    try {
      // Garantir que temos a organização
      const { data: orgData } = await supabase.rpc('ensure_current_org');
      const orgId = (orgData as any)?.organization_id;
      
      if (!orgId) {
        throw new Error('Organização não encontrada');
      }

      // Verificar se já existe uma conta com esse Shop ID
      const { data: existingAccount } = await supabase
        .from('integration_accounts')
        .select('*')
        .eq('provider', 'shopee')
        .eq('account_identifier', shopId.trim())
        .eq('organization_id', orgId)
        .single();

      let accountId: string;

      if (existingAccount) {
        // Atualizar conta existente
        const { data: updatedAccount, error: updateError } = await supabase
          .from('integration_accounts')
          .update({
            name: `Shopee - Shop ${shopId}`,
            public_auth: {
              shop_id: shopId.trim(),
              partner_id: partnerId.trim()
            },
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAccount.id)
          .select()
          .single();

        if (updateError) throw updateError;
        accountId = updatedAccount.id;
      } else {
        // Criar nova conta
        const { data: newAccount, error: accountError } = await supabase
          .from('integration_accounts')
          .insert({
            provider: 'shopee',
            name: `Shopee - Shop ${shopId}`,
            account_identifier: shopId.trim(),
            organization_id: orgId,
            public_auth: {
              shop_id: shopId.trim(),
              partner_id: partnerId.trim()
            }
          })
          .select()
          .single();

        if (accountError) throw accountError;
        accountId = newAccount.id;
      }

      // Depois salvar as credenciais de forma segura
      const { error: secretError } = await supabase.functions.invoke('integrations-store-secret', {
        body: {
          integration_account_id: accountId,
          provider: 'shopee',
          payload: {
            shop_id: shopId.trim(),
            partner_id: partnerId.trim(),
            access_token: accessToken.trim(),
            environment: environment.trim(),
            api_domain: apiDomain.trim()
          }
        }
      });

      if (secretError) throw secretError;

      toast.success(existingAccount ? 'Conta Shopee atualizada com sucesso!' : 'Conta Shopee configurada com sucesso!');
      setShowConfigModal(false);
      
      // Limpar campos
      clearFormFields();
      
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
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              Shopee
            </div>
            <span className="text-sm px-2 py-1 bg-muted rounded-full">disconnected</span>
          </CardTitle>
          <CardDescription>
            Marketplace de vendas online
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasConnections = accounts.length > 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              Shopee
            </div>
            <span className="text-xs px-2 py-1 bg-muted rounded-full">
              {hasConnections ? 'connected' : 'disconnected'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground mb-3">Marketplace de vendas online</p>
          
          {!hasConnections ? (
            <>
              <Button 
                onClick={() => setShowConfigModal(true)}
                className="w-full mb-2"
                size="sm"
              >
                <Settings className="w-4 h-4 mr-2" />
                Conectar
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                >
                  🧪 Testar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfigModal(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Config
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button 
                onClick={() => accounts.length > 0 && handleConnect(accounts[0].id)}
                className="w-full mb-2"
                disabled={isConnecting}
                size="sm"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    ⚡ Conectar via OAuth
                  </>
                )}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => accounts.length > 0 && handleTestConnection(accounts[0].id)}
                >
                  🧪 Testar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfigModal(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Config
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Configuração */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="max-w-2xl bg-background border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              🛍️ CONFIGURAR: Integração Shopee com dados obtidos
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Configure as credenciais da sua conta Shopee para autenticação e busca de pedidos na página /pedidos.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="modal-partnerId">Partner ID</Label>
              <Input
                id="modal-partnerId"
                placeholder="Ex: 1185587"
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                ID do partner no Open Platform
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="modal-shopId">Shop ID</Label>
              <Input
                id="modal-shopId"
                placeholder="Ex: 225917626"
                value={shopId}
                onChange={(e) => setShopId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Encontre no Shopee Seller Center
              </p>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="modal-accessToken">Access Token</Label>
              <div className="relative">
                <Input
                  id="modal-accessToken"
                  type={showToken ? "text" : "password"}
                  placeholder="Ex: 4d6d4a70485346456855a64b426e496c"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Token de acesso para API do Shopee
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="modal-environment">Environment</Label>
              <Input
                id="modal-environment"
                placeholder="Ex: test"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Ambiente (test/production)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="modal-apiDomain">API Domain</Label>
              <Input
                id="modal-apiDomain"
                placeholder="Ex: https://openplatform.sandbox.test-stable.shopee.sg"
                value={apiDomain}
                onChange={(e) => setApiDomain(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Domínio da API Shopee
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowConfigModal(false);
                clearFormFields();
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={saveShopeeConfig}
              disabled={savingConfig || !shopId.trim() || !partnerId.trim() || !accessToken.trim() || !environment.trim() || !apiDomain.trim()}
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}