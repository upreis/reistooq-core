import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { translateCancelReason } from '@/lib/translations';
import { useDevolucoes } from '@/features/devolucoes/hooks/useDevolucoes';
import TimelineVisualization from '@/components/ml/TimelineVisualization';
import { useDevolucoesDemostracao } from '@/features/devolucoes/hooks/useDevolucoesDemostracao';
import { useDevolucaoAnalytics } from '@/features/devolucoes/hooks/useDevolucaoAnalytics';
import { useDevolucaoExportacao } from '@/features/devolucoes/hooks/useDevolucaoExportacao';
import { useDevolucoesFase2 } from '@/features/devolucoes/hooks/useDevolucoesFase2';
import { useDevolucoesBusca } from '@/features/devolucoes/hooks/useDevolucoesBusca';
import DevolucaoAnalyticsDashboard from '@/features/devolucoes/components/DevolucaoAnalyticsDashboard';
import DevolucaoExportDialog from '@/features/devolucoes/components/DevolucaoExportDialog';
import { auditarLoteIndicadores, debugIndicadores } from '@/dev/auditIndicadoresDevoluções';
import { rodarAuditoriaCompleta } from '@/dev/auditoriaCompleta';
import { supabase } from '@/integrations/supabase/client';

// ✨ Componentes modulares
import { DevolucaoStatsCards } from '@/components/ml/devolucao/DevolucaoStatsCards';
import { DevolucaoFilters } from '@/components/ml/devolucao/DevolucaoFilters';
import { DevolucaoToolbar } from '@/components/ml/devolucao/DevolucaoToolbar';
import { DevolucaoDetailsModal } from '@/components/ml/devolucao/DevolucaoDetailsModal';
import { DevolucaoPagination } from '@/components/ml/devolucao/DevolucaoPagination';
import { DevolucaoTable } from '@/components/ml/devolucao/DevolucaoTable';

// ✨ Utilities de extração
import { 
  extractCancelReason, 
  extractDetailedReason, 
  extractMessageText,
  extractLastMessageText,
  formatCurrency,
  formatDate
} from '@/features/devolucoes/utils/extractDevolucaoData';

// ✨ Tipos
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

import { 
  RefreshCw, 
  Download, 
  Filter, 
  Eye, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign,
  Loader2,
  FileText,
  CheckSquare,
  Search,
  Wrench,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
  FileDown,
  Calendar,
  MessageCircle,
  Truck,
  Calculator,
  Zap
} from 'lucide-react';


interface MLAccount {
  id: string;
  name: string;
  account_identifier: string;
  organization_id: string;
  is_active: boolean;
}

interface DevolucaoAvancadasTabProps {
  mlAccounts: MLAccount[];
  selectedAccountId?: string;
  refetch: () => Promise<void>;
  existingDevolucoes: DevolucaoAvancada[];
}

const DevolucaoAvancadasTab: React.FC<DevolucaoAvancadasTabProps> = ({
  mlAccounts,
  selectedAccountId,
  refetch,
  existingDevolucoes
}) => {
  const [selectedDevolucao, setSelectedDevolucao] = React.useState<DevolucaoAvancada | null>(null);
  const [showDetails, setShowDetails] = React.useState(false);
  const [showExportDialog, setShowExportDialog] = React.useState(false);

  // Hook principal consolidado com otimizações
  const {
    devolucoes,
    devolucoesFiltradas,
    stats,
    loading,
    currentPage,
    totalPages,
    showAnalytics,
    filters,
    advancedFilters,
    performanceSettings,
    updateFilters,
    updateAdvancedFilters,
    clearFilters,
    buscarComFiltros,
    setCurrentPage,
    toggleAnalytics,
    hasPersistedData,
    autoRefresh,
    lazyLoading
  } = useDevolucoes(mlAccounts, selectedAccountId);

  // Analytics e exportação
  const analytics = useDevolucaoAnalytics(devolucoesFiltradas);
  const exportacao = useDevolucaoExportacao();

  // 🔍 HOOK DE BUSCA AVANÇADA
  const devolucoesBusca = useDevolucoesBusca();
  
  // 🔄 SINCRONIZAÇÃO COM ML
  const [isSyncing, setIsSyncing] = React.useState(false);
  
  const sincronizarDadosML = async () => {
    if (!selectedAccountId) {
      toast.error('Selecione uma conta ML primeiro');
      return;
    }
    
    setIsSyncing(true);
    toast.info('🚀 Iniciando enriquecimento com dados do Mercado Livre...');
    
    try {
      const { data, error } = await supabase.functions.invoke('devolucoes-avancadas-sync', {
        body: {
          action: 'enrich_existing_data',
          integration_account_id: selectedAccountId,
          limit: 50 // Processar 50 devoluções por vez
        }
      });
      
      if (error) throw error;
      
      if (data?.success) {
        toast.success(`✅ ${data.enriched_count} devoluções enriquecidas com sucesso!`);
        await refetch(); // Recarregar dados
      } else {
        toast.error(`Erro: ${data?.error || 'Falha na sincronização'}`);
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast.error('Erro ao sincronizar com Mercado Livre');
    } finally {
      setIsSyncing(false);
    }
  };

  // 🚀 FASE 2: HOOK PARA AS 42 NOVAS COLUNAS
  const fase2 = useDevolucoesFase2({
    integration_account_id: mlAccounts?.[0]?.id || '',
    auto_enrich: false, // Desabilitado por padrão para não interferir no sistema atual
    batch_size: 25,
    enable_real_time: false
  });

  // ✨ Usar utilities de extração (removendo funções duplicadas)
  const getMotivoCancelamento = useCallback((dev: DevolucaoAvancada) => extractCancelReason(dev), []);
  const getTextoMotivoDetalhado = useCallback((dev: DevolucaoAvancada) => extractDetailedReason(dev), []);
  const getTextoMensagens = useCallback((dev: DevolucaoAvancada) => extractMessageText(dev), []);
  const getUltimaMensagemTexto = useCallback((dev: DevolucaoAvancada) => extractLastMessageText(dev), []);

  // Tempo real para demonstração - corrigir dependências
  useDevolucoesDemostracao(
    advancedFilters.buscarEmTempoReal,
    useCallback((payload) => {
      // Atualização automática será implementada se necessário
    }, [])
  );

  const exportarCSV = useCallback(() => {
    if (!devolucoesFiltradas.length) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const headers = [
      'ID Claim',
      'ID Pedido',
      'SKU',
      'Produto',
      'Quantidade',
      'Valor Reclamado',
      'Status Claim',
      'Estágio',
      'Tipo',
      'Data da Venda',
      'Data Fechamento',
      'Última Atualização',
      'Número Mensagens',
      'Mensagens Não Lidas',
      'Dias Restantes Ação',
      'Código Rastreamento',
      'Transportadora',
      'Anexos Count',
      'Em Mediação',
      'Nível Prioridade',
      'Método Resolução'
    ];

    const csvData = devolucoesFiltradas.map(dev => [
      dev.claim_id || '',
      dev.order_id || '',
      dev.sku || '',
      dev.produto_titulo || '',
      dev.quantidade || '',
      dev.valor_retido || '',
      dev.status_devolucao || '',
      'N/A',
      dev.tipo_claim || 'N/A',
      dev.data_criacao ? (() => { try { return new Date(dev.data_criacao).toLocaleDateString(); } catch { return dev.data_criacao; } })() : '',
      'N/A',
      dev.updated_at ? (() => { try { return new Date(dev.updated_at).toLocaleDateString(); } catch { return dev.updated_at; } })() : '',
      dev.numero_interacoes || 0,
      dev.mensagens_nao_lidas || 0,
      dev.dias_restantes_acao || '',
      dev.codigo_rastreamento || '',
      dev.transportadora || '',
      dev.anexos_count || 0,
      dev.em_mediacao ? 'Sim' : 'Não',
      dev.nivel_prioridade || '',
      dev.metodo_resolucao || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `devolucoes_ml_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Arquivo CSV exportado com sucesso!');
  }, [devolucoesFiltradas]);

  return (
    <div className="space-y-6">
      {/* Header com estatísticas melhoradas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total</p>
                <p className="text-2xl font-bold dark:text-white">{stats.total}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {performanceSettings.enableLazyLoading && `${stats.visible} visíveis`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pendentes</p>
                <p className="text-2xl font-bold dark:text-white">{stats.pendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Concluídas</p>
                <p className="text-2xl font-bold dark:text-white">{stats.concluidas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Canceladas</p>
                <p className="text-2xl font-bold dark:text-white">{stats.canceladas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Wrench className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">API ML</p>
                <p className="text-2xl font-bold dark:text-white">{stats.totalLoaded}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Dados em tempo real</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de ação */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            type="button"
            onClick={buscarComFiltros}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Buscar da API ML
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">

          {/* Auto Refresh Control - Enhanced */}
          <div className="flex items-center gap-2">
            <Button
              variant={advancedFilters.autoRefreshEnabled ? "default" : "outline"}
              onClick={() => updateAdvancedFilters({ autoRefreshEnabled: !advancedFilters.autoRefreshEnabled })}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${advancedFilters.autoRefreshEnabled ? 'animate-spin' : ''}`} />
              Auto-refresh
            </Button>
            
            {/* Minutos Input */}
            <Input
              type="number"
              min="1"
              max="1440"
              value={advancedFilters.autoRefreshEnabled ? Math.floor(advancedFilters.autoRefreshInterval / 60) : ""}
              onChange={(e) => {
                const minutes = parseInt(e.target.value) || 0;
                const seconds = minutes * 60;
                updateAdvancedFilters({
                  autoRefreshEnabled: minutes > 0,
                  autoRefreshInterval: seconds > 0 ? seconds : 3600
                });
              }}
              placeholder="Minutos"
              className="w-20 text-sm"
            />
            <span className="text-sm text-muted-foreground">min</span>
            
            {/* Desativar Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateAdvancedFilters({ autoRefreshEnabled: false })}
              disabled={!advancedFilters.autoRefreshEnabled}
            >
              Desativar
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            onClick={exportarCSV}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* FILTROS E FERRAMENTAS DE ANÁLISE */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-foreground">
              <Filter className="w-5 h-5" />
              <span className="font-medium">Filtros e Ferramentas de Análise</span>
            </div>
          </div>
          
          {/* Linha de filtros horizontais */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Campo de busca */}
            <div className="flex items-center relative min-w-[250px]">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por Order ID, comprador..."
                value={advancedFilters.searchTerm || ''}
                onChange={(e) => updateAdvancedFilters({
                  searchTerm: e.target.value
                })}
                className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-ring"
              />
            </div>

            {/* Status */}
            <Select 
              value={advancedFilters.statusClaim || ''} 
              onValueChange={(value) => updateAdvancedFilters({
                statusClaim: value
              })}
            >
              <SelectTrigger className="w-[160px] bg-background border-border text-foreground">
                <SelectValue placeholder="Todos os Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="">Todos os Status</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="with_claims">Com Claims</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
              </SelectContent>
            </Select>

            {/* Contas ML - Seleção múltipla */}
            <div className="relative">
              <Select 
                value={advancedFilters.contasSelecionadas.length === 0 ? "nenhuma" : 
                       advancedFilters.contasSelecionadas.length === mlAccounts?.length ? "todas" : "multiplas"}
                onValueChange={() => {}} // Controlado via menu customizado
              >
                <SelectTrigger className="min-w-[200px] bg-background border-border text-foreground">
                  <SelectValue>
                    {advancedFilters.contasSelecionadas.length === 0 ? "Nenhuma conta" :
                     advancedFilters.contasSelecionadas.length === mlAccounts?.length ? "Todas as contas" :
                     `${advancedFilters.contasSelecionadas.length} conta${advancedFilters.contasSelecionadas.length > 1 ? 's' : ''} selecionada${advancedFilters.contasSelecionadas.length > 1 ? 's' : ''}`}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-popover border-border min-w-[300px] z-50">
                  <div className="p-2">
                    <div className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                      <input
                        type="checkbox"
                        id="todas-contas"
                        checked={advancedFilters.contasSelecionadas.length === mlAccounts?.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateAdvancedFilters({
                              contasSelecionadas: mlAccounts?.map(acc => acc.id) || []
                            });
                          } else {
                            updateAdvancedFilters({
                              contasSelecionadas: []
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <label htmlFor="todas-contas" className="text-sm text-foreground font-medium cursor-pointer">
                        Todas as contas
                      </label>
                    </div>
                    <div className="h-px bg-border my-2"></div>
                    {mlAccounts?.map((account) => (
                      <div key={account.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                        <input
                          type="checkbox"
                          id={`conta-${account.id}`}
                          checked={advancedFilters.contasSelecionadas.includes(account.id)}
                          onChange={(e) => {
                            const currentAccounts = advancedFilters.contasSelecionadas;
                            const newAccounts = e.target.checked
                              ? [...currentAccounts, account.id]
                              : currentAccounts.filter(id => id !== account.id);
                            
                            updateAdvancedFilters({
                              contasSelecionadas: newAccounts
                            });
                          }}
                          className="rounded"
                        />
                        <label htmlFor={`conta-${account.id}`} className="text-sm text-foreground cursor-pointer">
                          {account.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>

            {/* Data Início */}
            <Input
              type="date"
              value={advancedFilters.dataInicio || ''}
              onChange={(e) => updateAdvancedFilters({
                dataInicio: e.target.value
              })}
              className="w-[140px] bg-background border-border text-foreground [&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:invert-0"
            />

            {/* Data Fim */}
            <Input
              type="date"
              value={advancedFilters.dataFim || ''}
              onChange={(e) => updateAdvancedFilters({
                dataFim: e.target.value
              })}
              className="w-[140px] bg-background border-border text-foreground [&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:invert-0"
            />

            {/* Botão Atualizar */}
            <Button 
              onClick={buscarComFiltros}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Atualizar
            </Button>

            {/* Botão Análise API */}
            <Button 
              variant="outline"
              onClick={toggleAnalytics}
              className="border-border text-foreground hover:bg-muted flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Análise API
            </Button>

            {/* 🚀 BOTÃO DE SINCRONIZAÇÃO COM ML - ENRIQUECER 87 COLUNAS */}
            <Button
              variant="default"
              onClick={sincronizarDadosML}
              disabled={isSyncing || loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex items-center gap-2"
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {isSyncing ? 'Sincronizando ML...' : '⚡ Enriquecer com ML'}
            </Button>

            <Button
              variant="outline"
              onClick={() => fase2.fetchAdvancedMetrics()}
              disabled={fase2.loading}
              className="border-green-500 text-green-600 hover:bg-green-50 flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Métricas Avançadas
            </Button>

            {/* 🔍 BOTÃO AUDITORIA COMPLETA - FIXO E VISÍVEL */}
            <Button
              variant="outline"
              onClick={() => {
                if (devolucoesFiltradas.length === 0) {
                  toast.error('Nenhuma devolução para auditar. Faça uma busca primeiro.');
                  return;
                }
                
                const auditoriaCompleta = rodarAuditoriaCompleta(devolucoesFiltradas);
                toast.success(`🔍 Auditoria completa! ${auditoriaCompleta.problemas_identificados.length} problemas identificados. Veja o console para detalhes.`);
              }}
              className="bg-red-500 text-white hover:bg-red-600 flex items-center gap-2 px-4 py-2"
            >
              <Wrench className="h-4 w-4" />
              🔍 Auditoria Completa
            </Button>

          </div>

        </CardContent>
      </Card>

        {/* Lista de devoluções - Cards ou Tabela */}
        <Card>
          <CardHeader>
            <CardTitle>Devoluções Encontradas ({devolucoesFiltradas.length})</CardTitle>
            {hasPersistedData && (
              <CardDescription>
                🔄 Dados restaurados do cache. Use os botões de sincronização para atualizar.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin dark:text-white" />
              </div>
            ) : devolucoes.length === 0 ? (
              <div className="text-center p-8">
                <Package className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Nenhuma devolução encontrada</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Use os filtros para buscar da API ML
                </p>
              </div>
            ) : (
              /* ✨ TABELA MODULARIZADA */
              <DevolucaoTable
                devolucoes={devolucoesFiltradas}
                onViewDetails={(dev) => {
                  setSelectedDevolucao(dev);
                  setShowDetails(true);
                }}
              />
            )}
          </CardContent>
        </Card>

      {/* Paginação */}
      <DevolucaoPagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modal de detalhes - componente modular */}
      <DevolucaoDetailsModal 
        open={showDetails}
        onOpenChange={setShowDetails}
        devolucao={selectedDevolucao}
      />
    </div>
  );
};

export default DevolucaoAvancadasTab;