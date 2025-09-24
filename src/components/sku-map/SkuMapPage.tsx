import { useState } from "react";

import { SkuMapList } from "./SkuMapList";
import { SkuMapFilters } from "./SkuMapFilters";
import { SkuMapActions } from "./SkuMapActions";
import { SkuMapForm } from "./SkuMapForm";
import { SkuMapStats } from "./SkuMapStats";
import { SkuMapHistory } from "./SkuMapHistory";
import { SavedFiltersManager } from "./SavedFiltersManager";
import { BulkEditModal } from "./BulkEditModal";
import { ImportWizard } from "./import/ImportWizard";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Filter } from "lucide-react";
import { useSkuFilters } from "@/hooks/useSkuFilters";
import { useSkuMapShortcuts } from "@/hooks/useKeyboardShortcuts";
import { SkuMapping } from "@/types/sku-mapping.types";
import { useIsMobile } from "@/hooks/use-mobile";

export function SkuMapPage() {
  const { filters, updateFilters, resetFilters } = useSkuFilters();

  const handleStatsFilterClick = (filterType: 'all' | 'ativos' | 'pendentes' | 'completos') => {
    if (filterType === 'all') {
      updateFilters({ status: "todos", preenchimento: "todos" });
    } else if (filterType === 'ativos') {
      updateFilters({ status: 'ativos', preenchimento: "todos" });
    } else if (filterType === 'pendentes') {
      updateFilters({ status: "todos", preenchimento: 'pendentes' });
    } else if (filterType === 'completos') {
      updateFilters({ status: "todos", preenchimento: 'completos' });
    }
  };
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [editingItem, setEditingItem] = useState<SkuMapping | null>(null);
  const isMobile = useIsMobile();

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {!isMobile && (
          <div>
            <h1 className="text-3xl font-bold">De-Para de Produtos</h1>
            <p className="text-muted-foreground">
              Mapeie produtos entre diferentes plataformas
            </p>
          </div>
        )}
        <div className={`flex gap-2 ${isMobile ? 'w-full justify-end' : ''}`}>
          {!isMobile && (
            <Button
              variant="outline"
              onClick={() => setShowImportWizard(true)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
          )}
          {isMobile && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-[0.4]"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filtros
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <SkuMapFilters
                    filters={filters}
                    onFiltersChange={updateFilters}
                    onReset={resetFilters}
                  />
                </PopoverContent>
              </Popover>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="flex-[0.6]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Mapeamento
              </Button>
            </>
          )}
          {!isMobile && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Mapeamento
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <SkuMapStats onFilterClick={isMobile ? handleStatsFilterClick : undefined} />

      {/* Filters - Hidden on mobile */}
      {!isMobile && (
        <SkuMapFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onReset={resetFilters}
        />
      )}

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
          {/* List */}
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
          {/* Saved Filters */}
          <SavedFiltersManager
            currentFilters={filters}
            onLoadFilters={updateFilters}
          />

          {/* History */}
          <SkuMapHistory />
        </div>
      </div>

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
    </div>
  );
}