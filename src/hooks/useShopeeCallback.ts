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
        toast.loading('Obtendo access token da Shopee...');

        // Primeiro, obter o partner_id das configurações
        const { data: configs } = await supabase
          .from('configuracoes')
          .select('valor')
          .eq('chave', 'shopee_partner_id')
          .single();

        const partner_id = configs?.valor;
        
        if (!partner_id) {
          toast.error('Partner ID da Shopee não configurado. Configure nas integrações.');
          return;
        }

        // Trocar o code pelo access_token
        const { data, error } = await supabase.functions.invoke('shopee-get-token', {
          body: {
            code: code,
            shop_id: shop_id,
            partner_id: partner_id
          }
        });

        if (error) {
          console.error('❌ Erro na troca do token:', error);
          toast.error(`Erro: ${error.message}`);
          return;
        }

        if (data?.success) {
          console.log('✅ Access token obtido com sucesso:', data);
          toast.success('Conta Shopee conectada com sucesso!');
          
          // Aqui você pode salvar o access_token no banco de dados
          // Por exemplo, na tabela integration_secrets
          
          // Limpa os parâmetros da URL e redireciona para integrações
          window.history.replaceState({}, '', window.location.pathname);
          navigate('/configuracoes/integracoes');
        } else {
          console.error('❌ Falha na obtenção do token:', data);
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