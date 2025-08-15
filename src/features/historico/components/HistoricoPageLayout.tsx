import React from 'react';
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HistoricoAnalyticsDashboard } from './HistoricoAnalyticsDashboard';
import { HistoricoSearchFilters } from './HistoricoSearchFilters';
import { HistoricoDataTable } from './HistoricoDataTable';
import { HistoricoBulkActions } from './HistoricoBulkActions';
import { HistoricoFileManager } from './HistoricoFileManager';
import { useHistoricoServerPagination } from '../hooks/useHistoricoServerPagination';
import { useHistoricoFilters } from '../hooks/useHistoricoFilters';
import { useHistoricoRealtime } from '../hooks/useHistoricoRealtime';
import { HistoricoAdvancedAnalytics } from './HistoricoAdvancedAnalytics';
import { runSupabaseHealthCheck, isRLSError, getRLSErrorMessage } from '@/debug/supabaseHealth';
import { downloadTemplate } from '../services/historicoQuery';
import { useToast } from '@/hooks/use-toast';
import { History, TrendingUp, Filter, Download, Wifi, WifiOff, AlertCircle } from 'lucide-react';

export const HistoricoPageLayout: React.FC = () => {
  const { toast } = useToast();
  
  // Log de montagem temporário
  React.useEffect(() => { console.debug("mounted: HistoricoPageLayout"); }, []);
  
  // Health check state
  const [healthCheck, setHealthCheck] = React.useState<any>(null);
  const [debugOpen, setDebugOpen] = React.useState(false); // collapsed por padrão
  
  // Run health check on mount
  React.useEffect(() => {
    runSupabaseHealthCheck('historico').then((result) => {
      console.debug('HC result:', result);
      setHealthCheck(result);
    });
  }, []);

  // Hooks para filtros e paginação
  const filtersHook = useHistoricoFilters({
    persistKey: 'historico-vendas-filters',
    debounceMs: 300
  });

  const paginationHook = useHistoricoServerPagination({
    initialFilters: filtersHook.filters,
    initialLimit: 20,
    enableRealtime: false
  });

  // Real-time updates
  const realtimeHook = useHistoricoRealtime({
    enabled: true,
    debounceMs: 1000,
    batchUpdates: true,
    onUpdate: () => {
      // Refresh data when real-time updates are received
      paginationHook.refetch();
    }
  });

  // Sincronizar filtros
  React.useEffect(() => {
    const { isActive, sortBy, sortOrder, ...cleanFilters } = filtersHook.filters;
    paginationHook.updateFilters(cleanFilters);
  }, [filtersHook.filters]);

  const handleBulkAction = React.useCallback(async (action: string, selectedIds: string[]) => {
    try {
      console.log('🔄 Executando ação em lote:', action, selectedIds);
      // Implementar lógica de bulk actions
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
      paginationHook.refetch();
    } catch (error) {
      console.error('❌ Erro na ação em lote:', error);
    }
  }, [paginationHook]);

  const breadcrumbItems = [
    { label: "Dashboard", href: "/" },
    { label: "Histórico de Vendas", href: "/historico" }
  ];

  return (
    <>
      <div data-testid="hv-banner" className="mb-2 rounded bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-amber-200">
        HISTÓRICO — componente correto montado
      </div>
      <DashboardLayout>
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header fixo */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <History className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Histórico de Vendas</h1>
                  <p className="text-sm text-muted-foreground">
                    Análise completa das vendas e métricas de performance
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Real-time status indicator */}
                <div className="flex items-center gap-2">
                  {realtimeHook.isConnected ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <Wifi className="h-4 w-4" />
                      <span className="text-xs">Online</span>
                    </div>
                  ) : realtimeHook.isConnecting ? (
                    <div className="flex items-center gap-1 text-yellow-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      <span className="text-xs">Conectando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-600">
                      <WifiOff className="h-4 w-4" />
                      <span className="text-xs">Offline</span>
                    </div>
                  )}
                  {realtimeHook.updateCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {realtimeHook.updateCount} atualizações
                    </span>
                  )}
                </div>

                <div className="text-right text-sm">
                  <div className="font-medium">
                    {(paginationHook.summary?.totalVendas ?? 0).toLocaleString()} vendas
                  </div>
                  <div className="text-muted-foreground">
                    R$ {(paginationHook.summary?.valorTotalVendas || 0).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 container py-6 space-y-6">
          {/* Debug — Supabase */}
          <Card className="p-4">
            <Collapsible open={debugOpen} onOpenChange={setDebugOpen}>
              <div className="flex items-center justify-between">
                <div className="font-semibold">Debug — Supabase</div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">{debugOpen ? 'Fechar' : 'Debug'}</Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="mt-4 space-y-3">
                <div className="text-sm">
                  Session: {healthCheck?.sessionOk ? 'OK' : 'NULL'} — User: {healthCheck?.user?.email || '—'} ({healthCheck?.user?.id || '—'}) — Org: {healthCheck?.orgId}
                </div>
                <div className="text-sm">
                  ENV: URL={healthCheck?.env?.url} ANON={healthCheck?.env?.anon}
                </div>

                {(healthCheck?.probes || []).some((p: any) => isRLSError(p.code)) && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Acesso negado (RLS). Verifique policies de leitura.
                    </AlertDescription>
                  </Alert>
                )}

                {(healthCheck?.probes || []).some((p: any) => p?.code === 404 || p?.code === '404') && (
                  <Alert>
                    <AlertDescription>
                      Recurso não existe: verifique o nome da tabela/view no frontend ou crie uma view compatível.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tabela</TableHead>
                        <TableHead>OK</TableHead>
                        <TableHead>Count</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Hint</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(healthCheck?.probes || []).map((p: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell>{p.table}</TableCell>
                          <TableCell>{p.ok ? 'Sim' : 'Não'}</TableCell>
                          <TableCell>{p.count ?? '—'}</TableCell>
                          <TableCell>{p.code ?? '—'}</TableCell>
                          <TableCell>{p.message ?? '—'}</TableCell>
                          <TableCell>{p.hint ?? '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
          {/* Dashboard de Analytics */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Analytics</h2>
            </div>
            
            {paginationHook.isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : (
              <HistoricoAnalyticsDashboard 
                summary={paginationHook.summary}
                dateRange={{
                  start: filtersHook.filters.dataInicio,
                  end: filtersHook.filters.dataFim
                }}
              />
            )}
          </Card>

          {/* Filtros Avançados */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Filtros</h2>
              {filtersHook.hasActiveFilters && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {filtersHook.activeFilters.length} ativo{filtersHook.activeFilters.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            <HistoricoSearchFilters
              filters={filtersHook.filters}
              onFiltersChange={filtersHook.updateFilters}
              onClearFilters={filtersHook.clearFilters}
              onDatePreset={filtersHook.applyDatePreset}
              searchTerm={filtersHook.searchTerm}
              onSearchChange={filtersHook.setSearchTerm}
              isSearching={filtersHook.isSearching}
              activeFilters={filtersHook.activeFilters}
            />
          </Card>

          {/* File Management – sempre visível */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Download className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">📂 Gerenciamento de Arquivos</h2>
            </div>
            
            <section data-testid="hv-file-manager">
              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={async () => {
                    try {
                      const csvContent = await downloadTemplate();
                      const blob = new Blob([csvContent], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'template-historico-vendas.csv';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      toast({title:"Template", description:"Download template realizado com sucesso"});
                    } catch (error) {
                      console.error('Erro no download:', error);
                      toast({title:"Erro", description:"Falha ao gerar template", variant: "destructive"});
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  📥 Download Template
                </Button>
                <Button 
                  onClick={() => toast({title:"Importar", description:"Abrir wizard (stub)"})}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  📤 Importar Dados
                </Button>
                <Button 
                  onClick={() => toast({title:"Exportar", description:"Export filtrado (stub)"})}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  📊 Exportar
                </Button>
              </div>
            </section>
          </Card>

          {/* Ações em Lote */}
          <HistoricoBulkActions
            selectedCount={0} // Implementar seleção
            onBulkAction={handleBulkAction}
            isLoading={paginationHook.isLoadingMore}
            totalItems={paginationHook.summary?.totalVendas || 0}
          />

          {/* Tabela de Dados */}
          <Card>
            <HistoricoDataTable
              vendas={paginationHook.vendas}
              pagination={paginationHook.pagination}
              isLoading={paginationHook.isLoading}
              isLoadingMore={paginationHook.isLoadingMore}
              sortBy={paginationHook.sortBy}
              sortOrder={paginationHook.sortOrder}
              onSort={paginationHook.updateSort}
              onPageChange={paginationHook.goToPage}
              onPageSizeChange={paginationHook.changePageSize}
              onRefresh={paginationHook.refetch}
              onBulkAction={handleBulkAction}
            />
          </Card>

          {/* Analytics Avançado */}
          <Card className="p-6">
            <HistoricoAdvancedAnalytics 
              vendas={paginationHook.vendas}
              summary={paginationHook.summary}
              dateRange={{
                start: filtersHook.filters.dataInicio,
                end: filtersHook.filters.dataFim
              }}
            />
          </Card>
        </div>
      </div>
      </DashboardLayout>
    </>
  );
};