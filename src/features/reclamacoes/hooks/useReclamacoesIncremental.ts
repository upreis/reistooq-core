/**
 * 🚀 HOOK DE BUSCA INCREMENTAL DE RECLAMAÇÕES
 * Busca apenas atualizações e novos registros
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface IncrementalFetchOptions {
  selectedAccountIds: string[];
  filters: {
    status?: string;
    type?: string;
    date_from?: string;
    date_to?: string;
  };
}

export function useReclamacoesIncremental() {
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState<string | null>(null);
  const [isLoadingIncremental, setIsLoadingIncremental] = useState(false);
  const { toast } = useToast();
  const processedClaimIds = useRef<Set<string>>(new Set());

  /**
   * Busca apenas claims novos ou atualizados desde o último fetch
   */
  const fetchIncremental = useCallback(async (options: IncrementalFetchOptions) => {
    const { selectedAccountIds, filters } = options;
    
    if (!selectedAccountIds || selectedAccountIds.length === 0) {
      return { newClaims: [], updatedClaims: [] };
    }

    try {
      setIsLoadingIncremental(true);

      // Buscar dados das contas
      const { data: accountsData, error: accountsError } = await supabase
        .from('integration_accounts')
        .select('id, account_identifier, name')
        .in('id', selectedAccountIds);

      if (accountsError || !accountsData || accountsData.length === 0) {
        throw new Error('Não foi possível obter informações das contas');
      }

      const newClaims: any[] = [];
      const updatedClaims: any[] = [];

      for (const account of accountsData) {
        if (!account.account_identifier) continue;

        // 🔍 Buscar apenas registros novos/atualizados
        // Usando offset 0 e limit pequeno para pegar apenas os mais recentes
        const { data, error: functionError } = await supabase.functions.invoke('ml-claims-fetch', {
          body: {
            accountId: account.id,
            sellerId: account.account_identifier,
            filters: {
              status: filters.status,
              type: filters.type,
              date_from: filters.date_from,
              date_to: filters.date_to,
              // 🔥 FILTRO INCREMENTAL: apenas desde último fetch
              last_updated_from: lastFetchTimestamp || undefined
            },
            limit: 50, // Buscar apenas os 50 mais recentes
            offset: 0,
            sort: 'last_updated:desc' // Ordenar por data de atualização
          }
        });

        if (functionError) {
          console.error('[Incremental] Erro na edge function:', functionError);
          continue;
        }

        if (!data?.claims || data.claims.length === 0) {
          continue;
        }

        // Classificar claims em novos ou atualizados
        const claimsWithEmpresa = data.claims.map((claim: any) => ({
          ...claim,
          empresa: account.name || account.account_identifier
        }));

        for (const claim of claimsWithEmpresa) {
          const claimId = claim.claim_id || claim.id;
          
          if (processedClaimIds.current.has(claimId)) {
            // Claim já existe -> é uma atualização
            updatedClaims.push(claim);
          } else {
            // Claim novo
            newClaims.push(claim);
            processedClaimIds.current.add(claimId);
          }
        }
      }

      // Atualizar timestamp do último fetch
      setLastFetchTimestamp(new Date().toISOString());

      if (newClaims.length > 0 || updatedClaims.length > 0) {
        toast({
          title: 'Atualizações encontradas',
          description: `${newClaims.length} novos, ${updatedClaims.length} atualizados`
        });
      }

      return { newClaims, updatedClaims };

    } catch (err: any) {
      console.error('[Incremental] Erro:', err);
      toast({
        variant: 'destructive',
        title: 'Erro na busca incremental',
        description: err.message
      });
      return { newClaims: [], updatedClaims: [] };
    } finally {
      setIsLoadingIncremental(false);
    }
  }, [lastFetchTimestamp, toast]);

  /**
   * Reset para forçar busca completa novamente
   */
  const resetIncremental = useCallback(() => {
    setLastFetchTimestamp(null);
    processedClaimIds.current.clear();
  }, []);

  return {
    fetchIncremental,
    resetIncremental,
    isLoadingIncremental,
    lastFetchTimestamp
  };
}
