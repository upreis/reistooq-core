import { useState } from "react";
import * as XLSX from 'xlsx';

import { SkuMapList } from "./SkuMapList";
import { SkuMapFilters } from "./SkuMapFilters";
import { SkuMapActions } from "./SkuMapActions";
import { SkuMapForm } from "./SkuMapForm";
import { SkuMapHistory } from "./SkuMapHistory";
import { SavedFiltersManager } from "./SavedFiltersManager";
import { BulkEditModal } from "./BulkEditModal";
import { ImportWizard } from "./import/ImportWizard";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Filter, ArrowLeftRight, Download } from "lucide-react";
import { useSkuFilters } from "@/hooks/useSkuFilters";
import { useSkuMapShortcuts } from "@/hooks/useKeyboardShortcuts";
import { SkuMapping } from "@/types/sku-mapping.types";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileAppShell } from "@/components/mobile/standard/MobileAppShell";
import { useToast } from "@/hooks/use-toast";
import { SkuMappingService } from "@/services/SkuMappingService";

export function SkuMapPage() {
  const { filters, updateFilters, resetFilters } = useSkuFilters();
  const { toast } = useToast();

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [editingItem, setEditingItem] = useState<SkuMapping | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const isMobile = useIsMobile();

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Buscar todos os dados sem paginação
      const response = await SkuMappingService.getSkuMappings({
        ...filters,
        page: 1,
        pageSize: 10000, // Buscar todos
      });

      if (!response.data || response.data.length === 0) {
        toast({
          title: "Nenhum dado para exportar",
          description: "Não há mapeamentos cadastrados",
          variant: "destructive",
        });
        return;
      }

      // Preparar dados para exportação
      const exportData = response.data.map((item: SkuMapping) => ({
        'SKU Pedido': item.sku_pedido || '',
        'SKU Correspondente': item.sku_correspondente || '',
        'SKU Simples': item.sku_simples || '',
        'Quantidade': item.quantidade || 1,
        'Ativo': item.ativo ? 'Sim' : 'Não',
        'Observações': item.observacoes || '',
        'Data Mapeamento': item.data_mapeamento || '',
        'Usuário Mapeamento': item.usuario_mapeamento || '',
        'Motivo Criação': item.motivo_criacao || '',
      }));

      // Criar workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Ajustar largura das colunas
      ws['!cols'] = [
        { wch: 25 }, // SKU Pedido
        { wch: 25 }, // SKU Correspondente
        { wch: 20 }, // SKU Simples
        { wch: 12 }, // Quantidade
        { wch: 8 },  // Ativo
        { wch: 40 }, // Observações
        { wch: 18 }, // Data Mapeamento
        { wch: 20 }, // Usuário
        { wch: 30 }, // Motivo
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'De-Para');
      XLSX.writeFile(wb, `de-para_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: "Exportação concluída",
        description: `${exportData.length} mapeamentos exportados`,
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleEdit = (item: SkuMapping) => {
    setEditingItem(item);
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setEditingItem(null);
  };

  const handleSelectAll = () => {
    // This will be implemented by the list component
  };

  const handleBulkEdit = () => {
    // Bulk edit is handled by the modal
  };

  const handleDelete = () => {
    // Delete selected items
  };

  // Setup keyboard shortcuts
  useSkuMapShortcuts({
    onNew: () => setShowCreateForm(true),
    onSelectAll: handleSelectAll,
    onBulkEdit: handleBulkEdit,
    onDelete: handleDelete,
  });

  // Header actions para mobile - removido, será movido para baixo do header
  const headerActions = undefined;

  const actionButtons = (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={isExporting}
      >
        <Download className="w-4 h-4 mr-2" />
        {isExporting ? 'Exportando...' : 'Exportar'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowImportWizard(true)}
      >
        <Upload className="w-4 h-4 mr-2" />
        Importar
      </Button>
      <Button size="sm" onClick={() => setShowCreateForm(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Novo Mapeamento
      </Button>
    </div>
  );

  const desktopContent = (
    <div className="p-6 space-y-6">
      {/* Filters with Actions */}
      <SkuMapFilters
        filters={filters}
        onFiltersChange={updateFilters}
        onReset={resetFilters}
        actions={actionButtons}
      />

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="flex gap-4">
          <div className="flex-1">
            <SkuMapActions
              selectedItems={selectedItems}
              onClearSelection={() => setSelectedItems([])}
            />
          </div>
          <BulkEditModal
            selectedItems={selectedItems}
            onClose={() => setSelectedItems([])}
            onSuccess={() => setSelectedItems([])}
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <SkuMapList
            filters={filters}
            selectedItems={selectedItems}
            onSelectionChange={setSelectedItems}
            onEdit={handleEdit}
            onFiltersChange={updateFilters}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <SavedFiltersManager
            currentFilters={filters}
            onLoadFilters={updateFilters}
          />
          <SkuMapHistory />
        </div>
      </div>
    </div>
  );

  const breadcrumb = (
    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
      <ArrowLeftRight className="h-4 w-4" />
      <span>/</span>
      <span className="text-primary">De-Para de Produtos</span>
    </div>
  );

  const mobileContent = (
    <div className="space-y-4">
      {/* Mobile Actions - Filtros, Exportar e Novo */}
      <div className="flex items-center gap-2 px-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 px-3 flex-1">
              <Filter className="w-4 h-4 mr-1" />
              Filtros
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <SkuMapFilters
              filters={filters}
              onFiltersChange={updateFilters}
              onReset={resetFilters}
            />
          </PopoverContent>
        </Popover>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 px-3"
          onClick={handleExport}
          disabled={isExporting}
        >
          <Download className="w-4 h-4" />
        </Button>
        <Button onClick={() => setShowCreateForm(true)} size="sm" className="h-9 px-3 flex-1">
          <Plus className="w-4 h-4 mr-1" />
          Novo
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="flex gap-4">
          <div className="flex-1">
            <SkuMapActions
              selectedItems={selectedItems}
              onClearSelection={() => setSelectedItems([])}
            />
          </div>
          <BulkEditModal
            selectedItems={selectedItems}
            onClose={() => setSelectedItems([])}
            onSuccess={() => setSelectedItems([])}
          />
        </div>
      )}

      {/* Main List */}
      <SkuMapList
        filters={filters}
        selectedItems={selectedItems}
        onSelectionChange={setSelectedItems}
        onEdit={handleEdit}
        onFiltersChange={updateFilters}
      />

      {/* Sidebar content for mobile */}
      <div className="space-y-4">
        <SavedFiltersManager
          currentFilters={filters}
          onLoadFilters={updateFilters}
        />
        <SkuMapHistory />
      </div>
    </div>
  );

  return (
    <>
      {isMobile ? (
        <MobileAppShell title="" headerActions={headerActions} breadcrumb={breadcrumb}>
          {mobileContent}
        </MobileAppShell>
      ) : (
        desktopContent
      )}

      {/* Create/Edit Form Dialog */}
      <Dialog 
        open={showCreateForm || !!editingItem} 
        onOpenChange={(open) => !open && handleCloseForm()}
      >
        <DialogContent className="max-w-2xl">
          <SkuMapForm
            initialData={editingItem}
            onSuccess={handleCloseForm}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      {/* Import Wizard Dialog */}
      <Dialog 
        open={showImportWizard} 
        onOpenChange={setShowImportWizard}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <ImportWizard onClose={() => setShowImportWizard(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}