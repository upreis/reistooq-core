// Página completa de histórico - com seletor de colunas
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { History, RefreshCw, ChevronLeft, ChevronRight, Download, Upload, CheckSquare, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Componentes simplificados
import { HistoricoSimpleTable } from './HistoricoSimpleTable';
import { HistoricoSimpleFilters } from './HistoricoSimpleFilters';
import { HistoricoSimpleStats } from './HistoricoSimpleStats';
import { HistoricoColumnSelector, defaultColumns, type ColumnConfig } from './HistoricoColumnSelector';
import { HistoricoExportModal } from './HistoricoExportModal';
import { HistoricoImportModal } from './HistoricoImportModal';
import { HistoricoBulkActions } from './HistoricoBulkActions';
import { useHistoricoSimple } from '../hooks/useHistoricoSimple';
import { useHistoricoExport } from '../hooks/useHistoricoExport';
import { useHistoricoRealtime } from '../hooks/useHistoricoRealtime';
import { useHistoricoSelection } from '../hooks/useHistoricoSelection';
import { HistoricoDeleteService } from '../services/HistoricoDeleteService';
import { HistoricoItem } from '../services/HistoricoSimpleService';

export function HistoricoSimplePage() {
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<HistoricoItem | null>(null);
  
  // Persistência de colunas no localStorage
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    try {
      const savedColumns = localStorage.getItem('historico-columns-config');
      if (savedColumns) {
        const parsed = JSON.parse(savedColumns);
        return Array.isArray(parsed) ? parsed : defaultColumns;
      }
    } catch (error) {
      console.error('Erro ao carregar configuração de colunas:', error);
    }
    return defaultColumns;
  });
  
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<HistoricoItem | null>(null);
  const [itemsToDelete, setItemsToDelete] = useState<HistoricoItem[]>([]);

  // Auto refresh com real-time
  useHistoricoRealtime({ enabled: true });
  
  // Hook de exportação
  const { isExporting, exportData } = useHistoricoExport();

  // Hook de seleção múltipla
  const {
    selectedItems,
    isSelectMode,
    toggleSelectMode,
    selectItem,
    selectAll,
    clearSelection,
    isSelected,
    getSelectedItems,
    selectedCount
  } = useHistoricoSelection();

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

  // Salvar configuração de colunas no localStorage
  const handleColumnsChange = (newColumns: ColumnConfig[]) => {
    setColumns(newColumns);
    try {
      localStorage.setItem('historico-columns-config', JSON.stringify(newColumns));
      toast({
        title: "Configuração salva",
        description: "Configuração de colunas salva com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao salvar configuração de colunas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a configuração de colunas.",
        variant: "destructive"
      });
    }
  };

  const handleRowClick = (item: HistoricoItem) => {
    setSelectedItem(item);
    toast({
      title: "Item Selecionado",
      description: `Pedido ${item.numero_pedido} - ${item.cliente_nome || item.nome_completo || 'Cliente'}`
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

  const handleDeleteItem = async (item: HistoricoItem) => {
    setItemToDelete(item);
  };

  const handleDeleteSelected = async () => {
    const selectedItemsList = getSelectedItems(data);
    setItemsToDelete(selectedItemsList);
  };

  const handleExportSelected = async () => {
    const selectedItemsList = getSelectedItems(data);
    const config = {
      format: 'xlsx' as const,
      template: 'commercial' as const,
      includeExamples: false,
      includeFiscalFields: false,
      includeTrackingFields: false,
      includeAdvancedFinancial: false
    };
    await exportData(config, selectedItemsList);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    const success = await HistoricoDeleteService.deleteItem(itemToDelete.id);
    if (success) {
      refetch(); // Atualizar lista após exclusão
    }
    setItemToDelete(null);
  };

  const confirmBulkDelete = async () => {
    if (itemsToDelete.length === 0) return;
    
    let successCount = 0;
    for (const item of itemsToDelete) {
      const success = await HistoricoDeleteService.deleteItem(item.id);
      if (success) successCount++;
    }
    
    if (successCount > 0) {
      refetch();
      clearSelection();
      toast({
        title: "Exclusão concluída",
        description: `${successCount} registros excluídos com sucesso.`
      });
    }
    
    setItemsToDelete([]);
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
              {/* Indicador de versão para debug */}
              <div className="text-xs text-green-600 font-mono bg-green-50 px-2 py-1 rounded">
                ✅ HistoricoSimplePage v2.0 - Seleção Múltipla Ativa
              </div>
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
              onColumnsChange={handleColumnsChange}
            />
            
            <Button
              variant={isSelectMode ? "default" : "outline"}
              size="sm"
              onClick={toggleSelectMode}
            >
              {isSelectMode ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              {isSelectMode ? 'Sair da Seleção' : 'Selecionar'}
            </Button>

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

      {/* Ações em lote */}
      {isSelectMode && (
        <HistoricoBulkActions
          selectedCount={selectedCount}
          selectedItems={getSelectedItems(data)}
          onExportSelected={handleExportSelected}
          onDeleteSelected={handleDeleteSelected}
          onClearSelection={clearSelection}
          onSelectAll={() => selectAll(data)}
          isProcessing={isFetching}
        />
      )}

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
            onDeleteItem={handleDeleteItem}
            isSelectMode={isSelectMode}
            selectedItems={selectedItems}
            onSelectItem={selectItem}
            onSelectAll={() => selectAll(data)}
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
                <strong>Cliente:</strong> {selectedItem.cliente_nome || selectedItem.nome_completo || '-'}
              </div>
              <div>
                <strong>Status:</strong>{' '}
                <Badge variant="outline">{selectedItem.status}</Badge>
              </div>
              <div>
                <strong>Quantidade:</strong> {selectedItem.quantidade_total}
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

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o pedido{' '}
              <strong>{itemToDelete?.numero_pedido}</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação de exclusão em lote */}
      <AlertDialog open={itemsToDelete.length > 0} onOpenChange={() => setItemsToDelete([])}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão em Lote</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{' '}
              <strong>{itemsToDelete.length} registro{itemsToDelete.length > 1 ? 's' : ''}</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}