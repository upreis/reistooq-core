import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SkuMapList } from "./SkuMapList";
import { SkuMapFilters } from "./SkuMapFilters";
import { SkuMapActions } from "./SkuMapActions";
import { SkuMapForm } from "./SkuMapForm";
import { SkuMapStats } from "./SkuMapStats";
import { ImportWizard } from "./import/ImportWizard";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { useSkuFilters } from "@/hooks/useSkuFilters";
import { SkuMapping } from "@/types/sku-mapping.types";

export function SkuMapPage() {
  const { filters, updateFilters, resetFilters } = useSkuFilters();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [editingItem, setEditingItem] = useState<SkuMapping | null>(null);

  const handleEdit = (item: SkuMapping) => {
    setEditingItem(item);
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setEditingItem(null);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">De-Para de Produtos</h1>
            <p className="text-muted-foreground">
              Mapeie produtos entre diferentes plataformas
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowImportWizard(true)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Mapeamento
            </Button>
          </div>
        </div>

        {/* Stats */}
        <SkuMapStats />

        {/* Filters */}
        <SkuMapFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onReset={resetFilters}
        />

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <SkuMapActions
            selectedItems={selectedItems}
            onClearSelection={() => setSelectedItems([])}
          />
        )}

        {/* List */}
        <SkuMapList
          filters={filters}
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
          onEdit={handleEdit}
          onFiltersChange={updateFilters}
        />

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
    </DashboardLayout>
  );
}