// Página completa de histórico - otimizada e simplificada
import '../utils/clearHistoricoCache';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { History, RefreshCw, ChevronLeft, ChevronRight, Download, Upload, CheckSquare, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Componentes
import { HistoricoSimpleTable } from './HistoricoSimpleTable';
import { HistoricoSimpleFilters } from './HistoricoSimpleFilters';
import { HistoricoSimpleStats } from './HistoricoSimpleStats';
import { HISTORICO_COLUMN_DEFINITIONS } from '../config/columns.config';
import { HistoricoExportModal } from './HistoricoExportModal';
import { HistoricoImportModal } from './HistoricoImportModal';
import { HistoricoBulkActions } from './HistoricoBulkActions';
import { useHistoricoVendas } from '../hooks/useHistoricoVendas';
import { useHistoricoExport } from '../hooks/useHistoricoExport';
import { useHistoricoRealtime } from '../hooks/useHistoricoRealtime';
import { useHistoricoSelection } from '../hooks/useHistoricoSelection';
import { HistoricoDeleteService } from '../services/HistoricoDeleteService';
import { HistoricoItem } from '../services/HistoricoSimpleService';

// Configuração de colunas - TODAS VISÍVEIS
const allColumns = HISTORICO_COLUMN_DEFINITIONS.map(def => ({
  key: def.key,
  label: def.label,
  category: def.category,
  visible: true, // SEMPRE VISÍVEL
  width: def.width
}));

export function HistoricoSimplePage() {
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<HistoricoItem | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<HistoricoItem | null>(null);
  const [itemsToDelete, setItemsToDelete] = useState<HistoricoItem[]>([]);

  // Real-time updates
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

  // Dados e paginação
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const { data: response, isLoading, refetch } = useHistoricoVendas(page, pageSize);
  
  const data = response?.data || [];
  const total = response?.total || 0;
  const hasMore = data.length === pageSize;
  
  // Estados computados
  const stats = { totalVendas: total, valorTotal: 0, ticketMedio: 0 };
  const filters = {};
  const hasFilters = false;
  
  // Handlers simplificados
  const updateFilters = () => {};
  const clearFilters = () => {};
  const goToPage = (newPage: number) => setPage(newPage);
  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
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


  // Paginação computada
  const totalPages = Math.ceil(total / pageSize);
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

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
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportModalOpen(true)}
              disabled={isLoading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportModalOpen(true)}
              disabled={isLoading || isExporting || total === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exportando...' : 'Exportar'}
            </Button>
            
            <Button
              variant={isSelectMode ? "default" : "outline"}
              size="sm"
              onClick={toggleSelectMode}
            >
              {isSelectMode ? <CheckSquare className="h-4 w-4 mr-2" /> : <Square className="h-4 w-4 mr-2" />}
              {isSelectMode ? 'Sair' : 'Selecionar'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
          
          <div className="text-right text-sm">
            <div className="font-semibold text-lg">
              {total.toLocaleString()} registros
            </div>
            {hasFilters && (
              <Badge variant="secondary" className="mt-1">Filtrado</Badge>
            )}
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
          isProcessing={isLoading}
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
                value={pageSize}
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
            columns={allColumns}
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
              disabled={!canGoPrev || isLoading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            
            <div className="flex items-center gap-1 px-3 py-1 border rounded text-sm font-medium">
              {page} / {totalPages}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page + 1)}
              disabled={!canGoNext || isLoading}
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
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
              {selectedItem.cpf_cnpj && (
                <div>
                  <strong>CPF/CNPJ:</strong>{' '}
                  <span className="font-mono">{selectedItem.cpf_cnpj}</span>
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
        isLoading={isLoading}
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