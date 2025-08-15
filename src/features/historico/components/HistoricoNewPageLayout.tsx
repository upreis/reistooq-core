// Layout refatorado com arquitetura modular
import React, { useState } from 'react';
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { History, TrendingUp, Filter, Download, RefreshCw } from 'lucide-react';

// Componentes modularizados
import { HistoricoVirtualTable } from './HistoricoVirtualTable';
import { HistoricoSmartFilters } from './HistoricoSmartFilters';
import { HistoricoAdvancedDashboard } from './HistoricoAdvancedDashboard';
import { useHistoricoServerPagination } from '../hooks/useHistoricoServerPagination';
import { HistoricoVenda } from '../types/historicoTypes';

export function HistoricoNewPageLayout() {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedVenda, setSelectedVenda] = useState<HistoricoVenda | null>(null);

  // Hook principal com server pagination
  const {
    vendas,
    pagination,
    summary,
    filters,
    isLoading,
    isFetching,
    hasFilters,
    updateFilters,
    clearFilters,
    updateSort,
    goToPage,
    changePageSize,
    refetch
  } = useHistoricoServerPagination({
    initialLimit: 50,
    enableRealtime: false
  });

  const handleRowClick = (venda: HistoricoVenda) => {
    setSelectedVenda(venda);
    toast({
      title: "Venda Selecionada",
      description: `Pedido ${venda.numero_pedido} - ${venda.cliente_nome}`
    });
  };

  const handleBulkAction = async (action: string, ids: string[]) => {
    try {
      console.log(`Executando ação: ${action} para ${ids.length} itens`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSelectedIds(new Set());
      refetch();
      toast({
        title: "Ação Executada",
        description: `${action} realizada com sucesso para ${ids.length} itens`
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao executar ação",
        variant: "destructive"
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b">
          <div className="container py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <History className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Histórico de Vendas</h1>
                  <p className="text-sm text-muted-foreground">
                    Sistema modular refatorado com performance otimizada
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isFetching}
                >
                  <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                
                <div className="text-right text-sm">
                  <div className="font-medium">
                    {(summary?.totalVendas ?? 0).toLocaleString()} vendas
                  </div>
                  <div className="text-muted-foreground">
                    R$ {(summary?.valorTotalVendas || 0).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 container py-6 space-y-6">
          {/* Dashboard Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Analytics Avançado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HistoricoAdvancedDashboard
                summary={summary}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>

          {/* Filtros Inteligentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros Avançados
                {hasFilters && (
                  <Badge variant="secondary" className="ml-2">
                    Ativos
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HistoricoSmartFilters
                filters={filters}
                onFiltersChange={updateFilters}
                onClearFilters={clearFilters}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>

          {/* Ações em Lote */}
          {selectedIds.size > 0 && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedIds.size} itens selecionados
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkAction('delete', Array.from(selectedIds))}
                    >
                      Excluir
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkAction('export', Array.from(selectedIds))}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Exportar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedIds(new Set())}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabela Virtualizada */}
          <Card>
            <CardHeader>
              <CardTitle>
                Vendas ({(pagination?.total ?? 0).toLocaleString()})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <HistoricoVirtualTable
                data={vendas}
                isLoading={isLoading}
                onRowClick={handleRowClick}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                height={600}
              />
            </CardContent>
          </Card>

          {/* Paginação */}
          {pagination && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Página {pagination.page} de {pagination.totalPages}
                ({pagination.total} total)
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage || isFetching}
                >
                  Anterior
                </Button>
                
                <select
                  value={pagination.limit}
                  onChange={(e) => changePageSize(Number(e.target.value))}
                  className="px-3 py-1 border rounded text-sm"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={!pagination.hasNextPage || isFetching}
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}