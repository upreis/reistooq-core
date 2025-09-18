import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useShopeeCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const processShopeeCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('token') || searchParams.get('state');
      const shop_id = searchParams.get('shop_id');

      // Só processa se tiver os parâmetros da Shopee
      if (!code || !state) {
        return;
      }

      console.log('🔄 Detectado callback da Shopee na página principal');

      try {
        toast.loading('Processando autorização da Shopee...');

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
          toast.error(`Erro: ${error.message}`);
          return;
        }

        if (data?.success) {
          console.log('✅ Callback processado com sucesso:', data);
          toast.success('Conta Shopee conectada com sucesso!');
          
          // Limpa os parâmetros da URL e redireciona para integrações
          window.history.replaceState({}, '', window.location.pathname);
          navigate('/configuracoes/integracoes');
        } else {
          console.error('❌ Callback falhou:', data);
          toast.error(data?.error || 'Erro desconhecido na autorização');
        }
      } catch (error) {
        console.error('❌ Erro no processamento:', error);
        toast.error('Erro interno no processamento');
      }
    };

    processShopeeCallback();
  }, [searchParams, navigate]);
};