import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { ShoppingBag, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export function ShopeeConnection() {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    partner_id: '',
    partner_key: '',
    shop_id: ''
  });
  const [connected, setConnected] = useState(false);

  const handleConnect = async () => {
    if (!credentials.partner_id || !credentials.partner_key) {
      toast.error('Partner ID e Partner Key são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      // 🛡️ SEGURO: Mock por enquanto - não quebra nada
      console.log('🛒 [ShopeeConnection] MOCK: Simulando conexão');
      
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // TODO: Implementar validação real quando edge functions estiverem prontas
      toast.success('🚧 Shopee configurado (modo desenvolvimento)');
      setConnected(true);

    } catch (error: any) {
      console.error('Erro ao conectar Shopee:', error);
      toast.error('Erro ao conectar com Shopee (desenvolvimento)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          Shopee
        </CardTitle>
        <CardDescription>
          🚧 Conecte sua conta Shopee (em desenvolvimento)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!connected ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="partner_id">Partner ID *</Label>
              <Input
                id="partner_id"
                value={credentials.partner_id}
                onChange={(e) => setCredentials(prev => ({ ...prev, partner_id: e.target.value }))}
                placeholder="Seu Test Partner ID"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partner_key">Partner Key *</Label>
              <Input
                id="partner_key"
                type="password"
                value={credentials.partner_key}
                onChange={(e) => setCredentials(prev => ({ ...prev, partner_key: e.target.value }))}
                placeholder="Sua Test API Partner Key"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shop_id">Shop ID (opcional)</Label>
              <Input
                id="shop_id"
                value={credentials.shop_id}
                onChange={(e) => setCredentials(prev => ({ ...prev, shop_id: e.target.value }))}
                placeholder="ID da sua loja (opcional)"
                disabled={loading}
              />
            </div>

            <Button onClick={handleConnect} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                '🚧 Testar Conexão (Dev)'
              )}
            </Button>
          </>
        ) : (
          <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 font-medium">Shopee configurado (desenvolvimento)!</span>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Redirect URL:</strong> https://reistoq.com.br</p>
          <p>Configure este URL no seu painel Shopee Partner</p>
          <div className="flex items-center gap-2 p-2 bg-orange-50 rounded">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <span className="text-orange-800">Implementação em desenvolvimento</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}