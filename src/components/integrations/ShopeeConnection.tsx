import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  const [showConfigModal, setShowConfigModal] = useState(false);
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

  const clearFormFields = () => {
    setShopId('');
    setPartnerId('');
    setAppId('');
    setAppSecret('');
    setPartnerKey('');
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
              🛍️ Configurar Nova Conta Shopee
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Configure as credenciais da sua conta Shopee para autenticação e importação de pedidos.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="modal-appId">App ID</Label>
              <Input
                id="modal-appId"
                placeholder="Ex: 123456"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                ID da aplicação Shopee
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="modal-appSecret">App Secret</Label>
              <Input
                id="modal-appSecret"
                type="password"
                placeholder="Ex: abcd1234..."
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Secret da aplicação Shopee
              </p>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="modal-partnerKey">Partner Key</Label>
              <Input
                id="modal-partnerKey"
                type="password"
                placeholder="Ex: xyz789..."
                value={partnerKey}
                onChange={(e) => setPartnerKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Chave do partner para autenticação
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
              disabled={savingConfig || !shopId.trim() || !partnerId.trim() || !appId.trim() || !appSecret.trim() || !partnerKey.trim()}
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