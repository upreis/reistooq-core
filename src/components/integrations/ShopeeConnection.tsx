import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { ShoppingBag, Loader2, CheckCircle, AlertCircle, ExternalLink, Settings, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function ShopeeConnection() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [shopId, setShopId] = useState('');
  const [partnerId, setPartnerId] = useState('');
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
    try {
      const { data } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'shopee_partner_id')
        .single();

      if (data?.valor) {
        setPartnerId(data.valor);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração Shopee:', error);
    }
  };

  const saveShopeeConfig = async () => {
    if (!partnerId.trim()) {
      toast.error('Partner ID é obrigatório');
      return;
    }

    setSavingConfig(true);
    try {
      const { error } = await supabase
        .from('configuracoes')
        .upsert({
          chave: 'shopee_partner_id',
          valor: partnerId.trim(),
          tipo: 'string',
          descricao: 'Partner ID da Shopee para autenticação OAuth'
        });

      if (error) throw error;

      toast.success('Configuração Shopee salva com sucesso!');
      setShowConfig(false);
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

  const handleConnect = async () => {
    if (!shopId.trim()) {
      toast.error('Por favor, informe o Shop ID');
      return;
    }

    if (!partnerId.trim()) {
      toast.error('Configure o Partner ID da Shopee primeiro');
      setShowConfig(true);
      return;
    }

    setIsConnecting(true);
    
    try {
      console.log(`🚀 Iniciando OAuth Shopee para Shop ID: ${shopId}`);
      
      const response = await supabase.functions.invoke('shopee-oauth', {
        body: {
          action: 'get_auth_url',
          shop_id: shopId.trim(),
          redirect_uri: `${window.location.origin}${window.location.pathname}`
        }
      });

      if (response.error) throw response.error;
      
      const { auth_url } = response.data;
      
      if (auth_url) {
        toast.success('Redirecionando para autorização Shopee...');
        
        // Salvar contexto para o callback
        localStorage.setItem('shopee_oauth_context', JSON.stringify({
          shop_id: shopId,
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
          <div className="space-y-3">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div>
                    <span className="text-green-800 text-sm font-medium">
                      {account.name}
                    </span>
                    <p className="text-green-600 text-xs">
                      Shop ID: {account.account_identifier}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleTestConnection(account.id)}
                  >
                    Testar
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDisconnect(account.id)}
                  >
                    Desconectar
                  </Button>
                </div>
              </div>
            ))}
            
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowSetup(!showSetup)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Adicionar Conta
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowConfig(!showConfig)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Configuração
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
            {!partnerId && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Configure o Partner ID da Shopee primeiro
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowConfig(!showConfig)}
                variant="outline"
                className="flex-1"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurar Shopee
              </Button>
              <Button 
                onClick={() => setShowSetup(!showSetup)}
                variant="outline"
                className="flex-1"
                disabled={!partnerId}
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Conectar Loja
              </Button>
            </div>
          </div>
        )}

        {showConfig && (
          <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
            <div className="space-y-2">
              <Label htmlFor="partnerId">Partner ID da Shopee</Label>
              <Input
                id="partnerId"
                placeholder="Ex: 1185587"
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
              />
              <p className="text-sm text-blue-600">
                Encontre seu Partner ID no painel Shopee Open Platform
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={saveShopeeConfig}
                disabled={savingConfig || !partnerId.trim()}
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
                    Salvar Configuração
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowConfig(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {showSetup && (
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <div className="space-y-2">
              <Label htmlFor="shopId">Shop ID do Shopee</Label>
              <Input
                id="shopId"
                placeholder="Ex: 225917626"
                value={shopId}
                onChange={(e) => setShopId(e.target.value)}
              />
              <p className="text-sm text-gray-600">
                Encontre seu Shop ID no painel do Shopee Seller Center
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleConnect}
                disabled={isConnecting || !shopId.trim() || !partnerId}
                className="flex-1"
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
                onClick={() => setShowSetup(false)}
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