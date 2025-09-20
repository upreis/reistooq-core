// 🔄 Página de callback da Shopee - Processa autorização
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function ShopeeCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processando autorização da Shopee...');
  const [shopId, setShopId] = useState<string>('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('token'); // Shopee usa 'token' como state
        const shop_id = searchParams.get('shop_id');

        console.log('🔄 Processando callback Shopee:', { code: code?.substring(0, 10), state, shop_id });

        if (!code || !state) {
          setStatus('error');
          setMessage('Parâmetros de autorização inválidos');
          return;
        }

        // Chamar função para processar callback
        const { data, error } = await supabase.functions.invoke('shopee-oauth', {
          body: {
            action: 'handle_callback',
            code: code,
            state: state,
            shop_id: shop_id
          }
        });

        if (error) {
          console.error('❌ Erro no callback:', error);
          setStatus('error');
          setMessage(`Erro: ${error.message}`);
          return;
        }

        if (data?.success) {
          console.log('✅ Callback processado com sucesso:', data);
          setStatus('success');
          setMessage('Conta Shopee conectada com sucesso!');
          setShopId(data.shop_id || shop_id || '');
          
          // Tentar sincronizar pedidos automaticamente após conectar
          try {
            await supabase.functions.invoke('shopee-orders', {
              body: {
                integration_account_id: data.integration_account_id,
                action: 'sync_orders'
              }
            });
            console.log('✅ Sincronização inicial de pedidos Shopee iniciada');
          } catch (syncError) {
            console.warn('⚠️ Erro na sincronização inicial:', syncError);
            // Não falha o callback por causa da sincronização
          }
        } else {
          console.error('❌ Callback falhou:', data);
          setStatus('error');
          setMessage(data?.error || 'Erro desconhecido na autorização');
        }
      } catch (error) {
        console.error('❌ Erro no processamento:', error);
        setStatus('error');
        setMessage('Erro interno no processamento');
      }
    };

    processCallback();
  }, [searchParams]);

  const handleContinue = () => {
    navigate('/configuracoes/integracoes');
  };

  const handleRetry = () => {
    navigate('/configuracoes/integracoes');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'processing' && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
            {status === 'success' && <CheckCircle className="h-6 w-6 text-green-500" />}
            {status === 'error' && <XCircle className="h-6 w-6 text-red-500" />}
            Autorização Shopee
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            {message}
          </p>
          
          {shopId && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-800">
                Shop ID: {shopId}
              </p>
            </div>
          )}

          <div className="space-y-2">
            {status === 'success' && (
              <Button onClick={handleContinue} className="w-full">
                Continuar para Integrações
              </Button>
            )}
            
            {status === 'error' && (
              <Button onClick={handleRetry} variant="outline" className="w-full">
                Voltar para Integrações
              </Button>
            )}
            
            {status === 'processing' && (
              <p className="text-xs text-muted-foreground">
                Aguarde enquanto processamos sua autorização...
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}