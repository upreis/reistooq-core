/**
 * 📋 PÁGINA DE RECLAMAÇÕES COM AUTO-REFRESH E ANÁLISE
 * Sistema completo com tabs, highlights e detecção automática de mudanças
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAutoRefreshDevolucoes } from '../hooks/useAutoRefreshDevolucoes';
import { StatusAnalise } from '../types/devolucao-analise.types';
import { ReclamacoesFilterBar } from '../components/ReclamacoesFilterBar';
import { ReclamacoesFilters } from '../components/ReclamacoesFilters';
import { DevolucaoTableRowEnhanced } from '../components/DevolucaoTableRowEnhanced';
import { ReclamacoesEmptyState } from '../components/ReclamacoesEmptyState';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw, ChevronDown, X, Search, Clock, CheckCircle2 } from 'lucide-react';
import { validateMLAccounts } from '@/features/devolucoes/utils/AccountValidator';
import { logger } from '@/utils/logger';
import { MLOrdersNav } from '@/features/ml/components/MLOrdersNav';
import { OMSNav } from '@/features/oms/components/OMSNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { toast } from 'sonner';

export function ReclamacoesPage() {
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  
  const [filters, setFilters] = useState({
    periodo: '60',
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

  // Hook de auto-refresh com React Query
  const {
    devolucoesAtivas,
    devolucoesHistorico,
    isLoadingAtivas,
    isLoadingHistorico,
    errorAtivas,
    errorHistorico,
    refetchAtivas,
    refetchHistorico,
    refetchAll
  } = useAutoRefreshDevolucoes({
    accountIds: selectedAccountIds,
    autoRefreshEnabled,
    refreshIntervalMs: 30000
  });

  // Handler para mudança de status
  const handleStatusChange = async (devolucaoId: string, newStatus: StatusAnalise) => {
    try {
      // Verificar autenticação
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast.error('Você precisa estar autenticado para alterar o status');
        return;
      }

      const { error } = await supabase
        .from('devolucoes_avancadas')
        .update({
          status_analise: newStatus,
          data_status_analise: new Date().toISOString(),
          usuario_status_analise: user.id
        })
        .eq('id', devolucaoId);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        throw error;
      }

      toast.success('Status atualizado com sucesso');
      
      // Refetch para atualizar a lista
      refetchAll();
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast.error(error?.message || 'Erro ao atualizar status');
    }
  };

  const hasActiveAdvancedFilters = filters.status !== '' || 
                                   filters.type !== '' ||
                                   filters.stage !== '' ||
                                   filters.has_messages !== '' ||
                                   filters.has_evidences !== '';

  const clearAdvancedFilters = () => {
    setFilters({
      ...filters,
      status: '',
      type: '',
      stage: '',
      has_messages: '',
      has_evidences: ''
    });
  };

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
      <ErrorBoundary>
        <div className="space-y-6">
          {/* Breadcrumb principal */}
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>📦</span>
            <span>/</span>
            <span className="text-primary">Vendas</span>
          </div>

          {/* Navigation tabs principais */}
          <OMSNav />

          {/* Sub-navegação de Pedidos */}
          <MLOrdersNav />

          <div>
            <h1 className="text-3xl font-bold">Reclamações</h1>
            <p className="text-muted-foreground">
              Gerencie claims e mediações do Mercado Livre
            </p>
          </div>
          <ReclamacoesEmptyState type="no-integration" />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Breadcrumb principal */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>📦</span>
          <span>/</span>
          <span className="text-primary">Vendas</span>
        </div>

        {/* Navigation tabs principais */}
        <OMSNav />

        {/* Sub-navegação de Pedidos */}
        <MLOrdersNav />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reclamações</h1>
            <p className="text-muted-foreground">
              Gerencie claims e mediações com auto-refresh e highlights
            </p>
          </div>
        </div>

        {/* Barra de Filtros Compacta */}
        <Card className="p-6">
          <ReclamacoesFilterBar
            accounts={mlAccounts}
            selectedAccountIds={selectedAccountIds}
            onAccountsChange={setSelectedAccountIds}
            periodo={filters.periodo}
            onPeriodoChange={(periodo) => setFilters({ ...filters, periodo })}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />

          {/* Botão Filtros Avançados */}
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
              {showAdvancedFilters ? 'Ocultar' : 'Mostrar'} filtros avançados
            </Button>

            {hasActiveAdvancedFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAdvancedFilters}
              >
                <X className="h-4 w-4 mr-2" />
                Limpar filtros avançados
              </Button>
            )}
          </div>

          {/* Filtros Avançados */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t">
              <ReclamacoesFilters
                filters={filters}
                onFiltersChange={setFilters}
              />
            </div>
          )}

          {/* Botão Buscar */}
          <div className="mt-4 flex justify-end gap-2">
            <Button
              onClick={refetchAll}
              disabled={isLoadingAtivas || isLoadingHistorico || selectedAccountIds.length === 0}
              size="lg"
              className="min-w-40"
            >
              {isLoadingAtivas || isLoadingHistorico ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar e Atualizar
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Controles de Auto-refresh e Legenda */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Auto-refresh toggle */}
              <div className="flex items-center gap-2">
                <Switch
                  id="auto-refresh"
                  checked={autoRefreshEnabled}
                  onCheckedChange={setAutoRefreshEnabled}
                />
                <Label htmlFor="auto-refresh" className="cursor-pointer">
                  Auto-atualização (30s)
                </Label>
              </div>

              {/* Refresh manual */}
              <Button
                variant="outline"
                size="sm"
                onClick={refetchAll}
                disabled={isLoadingAtivas || isLoadingHistorico}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${
                    isLoadingAtivas || isLoadingHistorico ? 'animate-spin' : ''
                  }`}
                />
                Atualizar
              </Button>
            </div>

            {/* Legenda de cores */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-green-100 dark:bg-green-900/30 border border-green-500" />
                <span className="text-muted-foreground">Hoje</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-green-50 dark:bg-green-900/20 border border-green-400" />
                <span className="text-muted-foreground">1-2 dias</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-400" />
                <span className="text-muted-foreground">3-5 dias</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs: Ativas / Histórico */}
        <Tabs defaultValue="ativas" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="ativas" className="gap-2">
              <Clock className="h-4 w-4" />
              Ativas
              <Badge variant="secondary">{devolucoesAtivas.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Histórico
              <Badge variant="secondary">{devolucoesHistorico.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Ativas */}
          <TabsContent value="ativas" className="mt-6">
            <Card>
              {errorAtivas ? (
                <div className="p-8 text-center text-red-500">
                  Erro ao carregar reclamações ativas: {errorAtivas.message}
                </div>
              ) : isLoadingAtivas ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Carregando reclamações ativas...
                  </p>
                </div>
              ) : devolucoesAtivas.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhuma reclamação ativa encontrada
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Análise</TableHead>
                      <TableHead>Ordem</TableHead>
                      <TableHead>Conta</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Rastreamento</TableHead>
                      <TableHead>Atualização</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devolucoesAtivas.map((devolucao) => (
                      <DevolucaoTableRowEnhanced
                        key={devolucao.id}
                        devolucao={devolucao}
                        onStatusChange={handleStatusChange}
                        showAccount={true}
                      />
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          {/* Tab: Histórico */}
          <TabsContent value="historico" className="mt-6">
            <Card>
              {errorHistorico ? (
                <div className="p-8 text-center text-red-500">
                  Erro ao carregar histórico: {errorHistorico.message}
                </div>
              ) : isLoadingHistorico ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Carregando histórico...
                  </p>
                </div>
              ) : devolucoesHistorico.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhuma reclamação no histórico
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Análise</TableHead>
                      <TableHead>Ordem</TableHead>
                      <TableHead>Conta</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Rastreamento</TableHead>
                      <TableHead>Atualização</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devolucoesHistorico.map((devolucao) => (
                      <DevolucaoTableRowEnhanced
                        key={devolucao.id}
                        devolucao={devolucao}
                        onStatusChange={handleStatusChange}
                        showAccount={true}
                      />
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
}
