/**
 * 📋 PÁGINA PRINCIPAL DE RECLAMAÇÕES
 * FASE 1: Estrutura básica com filtros e tabela
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useReclamacoes } from '../hooks/useReclamacoes';
import { ReclamacoesFilters } from '../components/ReclamacoesFilters';
import { ReclamacoesTable } from '../components/ReclamacoesTable';
import { ReclamacoesStats } from '../components/ReclamacoesStats';
import { ReclamacoesExport } from '../components/ReclamacoesExport';
import { ReclamacoesEmptyState } from '../components/ReclamacoesEmptyState';
import { ReclamacoesAccountSelector } from '../components/ReclamacoesAccountSelector';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download } from 'lucide-react';
import { validateMLAccounts } from '@/features/devolucoes/utils/AccountValidator';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

export function ReclamacoesPage() {
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [filters, setFilters] = useState({
    periodo: '7',
    status: '',
    type: '',
    stage: '',
    has_messages: '',
    has_evidences: '',
    date_from: '',
    date_to: ''
  });

  // Buscar contas ML disponíveis
  const { data: mlAccounts, isLoading: loadingAccounts } = useQuery({
    queryKey: ["ml-accounts-reclamacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_accounts")
        .select("id, name, account_identifier, organization_id, is_active, provider")
        .eq("provider", "mercadolivre")
        .eq("is_active", true)
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Auto-selecionar contas usando validação centralizada
  React.useEffect(() => {
    if (mlAccounts && mlAccounts.length > 0 && selectedAccountIds.length === 0) {
      const { accountIds } = validateMLAccounts(mlAccounts, selectedAccountIds);
      if (accountIds.length > 0) {
        setSelectedAccountIds(accountIds);
        logger.debug('Contas auto-selecionadas', { 
          context: 'ReclamacoesPage',
          count: accountIds.length,
          accountIds 
        });
      }
    }
  }, [mlAccounts, selectedAccountIds.length]);

  const {
    reclamacoes,
    isLoading,
    isRefreshing,
    error,
    pagination,
    goToPage,
    changeItemsPerPage,
    refresh
  } = useReclamacoes(filters, selectedAccountIds);

  // Sincronizar claims da API do ML
  const handleSync = async () => {
    if (selectedAccountIds.length === 0) {
      toast.error('Selecione pelo menos uma conta');
      return;
    }

    setIsSyncing(true);
    toast.info('Sincronizando claims do Mercado Livre...', {
      description: 'Isso pode levar alguns minutos'
    });

    try {
      for (const accountId of selectedAccountIds) {
        const account = mlAccounts?.find(a => a.id === accountId);
        if (!account?.account_identifier) continue;

        const { data, error: syncError } = await supabase.functions.invoke('ml-claims-fetch', {
          body: {
            accountId,
            sellerId: account.account_identifier,
            limit: 50,
            offset: 0
          }
        });

        if (syncError) throw syncError;
        
        logger.info('Claims sincronizados', {
          accountId,
          count: data?.count || 0
        });
      }

      toast.success('Sincronização concluída!', {
        description: 'Os dados foram atualizados com sucesso'
      });
      
      // Atualizar a lista
      await refresh();
    } catch (error: any) {
      logger.error('Erro ao sincronizar claims', { error });
      toast.error('Erro na sincronização', {
        description: error.message || 'Erro desconhecido'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Verificar se há erro de integração
  const hasIntegrationError = error?.includes('seller_id') || error?.includes('integração');

  // Loading states
  if (loadingAccounts) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Carregando contas...</p>
        </div>
      </div>
    );
  }

  // Sem contas ML
  if (!mlAccounts || mlAccounts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reclamações</h1>
          <p className="text-muted-foreground">
            Gerencie claims e mediações do Mercado Livre
          </p>
        </div>
        <ReclamacoesEmptyState type="no-integration" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reclamações</h1>
          <p className="text-muted-foreground">
            Gerencie claims e mediações do Mercado Livre
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ReclamacoesExport 
            reclamacoes={reclamacoes} 
            disabled={isLoading || isRefreshing}
          />
          <Button
            onClick={handleSync}
            disabled={isSyncing || selectedAccountIds.length === 0}
            variant="default"
          >
            <Download className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-bounce' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Claims'}
          </Button>
          <Button
            onClick={refresh}
            disabled={isRefreshing || selectedAccountIds.length === 0}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Seletor de Contas */}
      <ReclamacoesAccountSelector
        accounts={mlAccounts}
        selectedIds={selectedAccountIds}
        onSelectionChange={setSelectedAccountIds}
      />

      {/* Stats - só mostrar se tiver dados */}
      {!isLoading && reclamacoes.length > 0 && (
        <ReclamacoesStats reclamacoes={reclamacoes} />
      )}

      {/* Filtros */}
      <Card className="p-6">
        <ReclamacoesFilters
          filters={filters}
          onFiltersChange={setFilters}
        />
      </Card>

      {/* Conteúdo principal */}
      {hasIntegrationError ? (
        <ReclamacoesEmptyState type="no-integration" message={error || undefined} />
      ) : error ? (
        <ReclamacoesEmptyState type="error" message={error} />
      ) : !isLoading && reclamacoes.length === 0 ? (
        <ReclamacoesEmptyState type="no-data" />
      ) : (
        <Card>
          <ReclamacoesTable
            reclamacoes={reclamacoes}
            isLoading={isLoading}
            error={error}
            pagination={pagination}
            onPageChange={goToPage}
            onItemsPerPageChange={changeItemsPerPage}
          />
        </Card>
      )}
    </div>
  );
}
