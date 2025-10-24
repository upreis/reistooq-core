import { useState, useCallback } from 'react';
import { fetchClaimReturns } from '../utils/MLApiClient';
import type { MLReturn } from '../types/returns';

/**
 * 🪝 HOOK: Gerenciar busca de returns de um claim
 */
export function useClaimReturns() {
  const [loading, setLoading] = useState(false);
  const [returns, setReturns] = useState<MLReturn[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buscarReturns = useCallback(async (
    integrationAccountId: string, 
    claimId: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchClaimReturns(integrationAccountId, claimId);
      
      if (response.success) {
        // API retorna um objeto com results ou direto o return
        const returnData = response.data?.results || (response.data ? [response.data] : null);
        setReturns(returnData);
      } else {
        setError(response.error || 'Erro ao buscar returns');
        setReturns(null);
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado');
      setReturns(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const limparReturns = useCallback(() => {
    setReturns(null);
    setError(null);
  }, []);

  return {
    returns,
    loading,
    error,
    buscarReturns,
    limparReturns,
    hasReturns: returns !== null && returns.length > 0
  };
}
