// Página completa de histórico - com seletor de colunas
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, RefreshCw, ChevronLeft, ChevronRight, Download, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Componentes simplificados
import { HistoricoSimpleTable } from './HistoricoSimpleTable';
import { HistoricoSimpleFilters } from './HistoricoSimpleFilters';
import { HistoricoSimpleStats } from './HistoricoSimpleStats';
import { HistoricoColumnSelector, defaultColumns, type ColumnConfig } from './HistoricoColumnSelector';
import { HistoricoExportModal } from './HistoricoExportModal';
import { HistoricoImportModal } from './HistoricoImportModal';
import { useHistoricoSimple } from '../hooks/useHistoricoSimple';
import { useHistoricoExport } from '../hooks/useHistoricoExport';
import { useHistoricoRealtime } from '../hooks/useHistoricoRealtime';
import { HistoricoItem } from '../services/HistoricoSimpleService';

export function HistoricoSimplePage() {
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<HistoricoItem | null>(null);
  const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Auto refresh com real-time
  useHistoricoRealtime({ enabled: true });
  
  // Hook de exportação
  const { isExporting, exportData } = useHistoricoExport();

  // Hook principal simplificado
  const {
    data,
    total,
    hasMore,
    stats,
    filters,
    page,
    limit,
    isLoading,
    isFetching,
    hasFilters,
    updateFilters,
    clearFilters,
    goToPage,
    changePageSize,
    refetch,
  } = useHistoricoSimple();

  const handleRowClick = (item: HistoricoItem) => {
    setSelectedItem(item);
    toast({
      title: "Item Selecionado",
      description: `Pedido ${item.numero_pedido} - ${item.nome_cliente || item.nome_completo || 'Cliente'}`
    });
  };

  const handleExport = async (config: any) => {
    await exportData(config, data);
  };

  const handleImportSuccess = () => {
    setImportModalOpen(false);
    refetch();
    toast({
      title: "Importação concluída",
      description: "Dados importados com sucesso. Atualizando lista..."
    });
  };

  const totalPages = Math.ceil(total / limit);
  const canGoPrev = page > 1;
  const canGoNext = hasMore;

  return (
    <main className="container py-6 space-y-6">
      {/* Cabeçalho */}
      <section className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <History className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Histórico de Vendas</h1>
              <p className="text-sm text-muted-foreground">
                Sistema completo com todas as colunas dos pedidos
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportModalOpen(true)}
              disabled={isFetching}
            >
              <Upload className="h-4 w-4" />
              Importar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportModalOpen(true)}
              disabled={isFetching || isExporting || total === 0}
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Exportando...' : 'Exportar'}
            </Button>
            
            <HistoricoColumnSelector
              columns={columns}
              onColumnsChange={setColumns}
            />
            
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
                {total.toLocaleString()} registros
              </div>
              <div className="text-muted-foreground flex items-center gap-2">
                {hasFilters && <Badge variant="secondary">Filtrado</Badge>}
                <Badge variant="outline" className="text-xs">
                  Auto-refresh ativo
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Estatísticas */}
      <HistoricoSimpleStats stats={stats} isLoading={isLoading} />

      {/* Filtros */}
      <HistoricoSimpleFilters
        filters={filters}
        onFiltersChange={updateFilters}
        onClearFilters={clearFilters}
        hasFilters={hasFilters}
      />

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Registros ({total.toLocaleString()})</span>
            
            {/* Controles de paginação no header */}
            <div className="flex items-center gap-2">
              <select
                value={limit}
                onChange={(e) => changePageSize(Number(e.target.value))}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <HistoricoSimpleTable
            data={data}
            columns={columns}
            isLoading={isLoading}
            onRowClick={handleRowClick}
          />
        </CardContent>
      </Card>

      {/* Paginação */}
      {total > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
            ({total} total)
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page - 1)}
              disabled={!canGoPrev || isFetching}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            
            <span className="px-3 py-1 text-sm">
              {page}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page + 1)}
              disabled={!canGoNext || isFetching}
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detalhes do item selecionado (opcional) */}
      {selectedItem && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Detalhes do Pedido</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedItem(null)}
              >
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Pedido:</strong> {selectedItem.numero_pedido}
              </div>
              <div>
                <strong>SKU:</strong> {selectedItem.sku_produto}
              </div>
              <div>
                <strong>Cliente:</strong> {selectedItem.nome_cliente || selectedItem.nome_completo || '-'}
              </div>
              <div>
                <strong>Status:</strong>{' '}
                <Badge variant="outline">{selectedItem.status}</Badge>
              </div>
              <div>
                <strong>Quantidade:</strong> {selectedItem.quantidade}
              </div>
              <div>
                <strong>Valor Total:</strong>{' '}
                {selectedItem.valor_total.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}
              </div>
              {selectedItem.sku_estoque && (
                <div>
                  <strong>SKU Estoque:</strong> {selectedItem.sku_estoque}
                </div>
              )}
              {selectedItem.status_mapeamento && (
                <div>
                  <strong>Status Mapeamento:</strong>{' '}
                  <Badge variant="outline">{selectedItem.status_mapeamento}</Badge>
                </div>
              )}
              {selectedItem.status_baixa && (
                <div>
                  <strong>Status Baixa:</strong>{' '}
                  <Badge variant="outline">{selectedItem.status_baixa}</Badge>
                </div>
              )}
              {selectedItem.total_itens && (
                <div>
                  <strong>Total de Itens:</strong> {selectedItem.total_itens}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modais */}
      <HistoricoExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        totalRecords={total}
        onExport={handleExport}
        isLoading={isFetching}
      />

      <HistoricoImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImportSuccess={handleImportSuccess}
      />
    </main>
  );
}