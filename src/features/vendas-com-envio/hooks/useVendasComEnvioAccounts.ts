/**
 * 📦 VENDAS COM ENVIO - Hook de Contas ML
 * Busca contas de integração ativas do Mercado Livre
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MLAccount {
  id: string;
  nome_conta: string;
  account_identifier: string;
}

export function useVendasComEnvioAccounts() {
  const [accounts, setAccounts] = useState<MLAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setIsLoading(true);
        
        const { data, error: queryError } = await supabase
          .from('integration_accounts')
          .select('id, name, account_identifier')
          .eq('provider', 'mercadolivre')
          .eq('is_active', true);

        if (queryError) {
          throw queryError;
        }

        // Mapear para interface esperada
        const mappedAccounts: MLAccount[] = (data || []).map((acc: any) => ({
          id: acc.id,
          nome_conta: acc.name || acc.account_identifier || 'Conta ML',
          account_identifier: acc.account_identifier,
        }));

        setAccounts(mappedAccounts);
        setError(null);
      } catch (err) {
        console.error('[useVendasComEnvioAccounts] Erro:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar contas');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  return { accounts, isLoading, error };
}
