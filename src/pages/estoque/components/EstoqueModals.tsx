import { ProductModal } from "@/components/estoque/ProductModal";
import { CreateParentProductModal } from "@/components/estoque/CreateParentProductModal";
import { CreateChildProductModal } from "@/components/estoque/CreateChildProductModal";
import { LinkChildToParentModal } from "@/components/estoque/LinkChildToParentModal";
import { BulkPriceUpdateModal } from "@/components/estoque/BulkPriceUpdateModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Package } from "lucide-react";
import { Product } from "@/hooks/useProducts";

interface EstoqueModalsProps {
  // Product Modal
  editModalOpen: boolean;
  setEditModalOpen: (open: boolean) => void;
  editingProduct: Product | null;
  setEditingProduct: (product: Product | null) => void;
  onEditSuccess: () => void;
  
  // Parent Product Modal
  parentProductModalOpen: boolean;
  setParentProductModalOpen: (open: boolean) => void;
  editingParentProduct: Product | null;
  setEditingParentProduct: (product: Product | null) => void;
  onParentProductSuccess: () => void;
  
  // Child Product Modal
  childProductModalOpen: boolean;
  setChildProductModalOpen: (open: boolean) => void;
  onChildProductSuccess: () => void;
  
  // Link Child Modal
  linkChildModalOpen: boolean;
  setLinkChildModalOpen: (open: boolean) => void;
  selectedProducts: string[];
  allProducts: Product[];
  onLinkSuccess: () => void;
  
  // Bulk Price Modal
  bulkPriceModalOpen: boolean;
  setBulkPriceModalOpen: (open: boolean) => void;
  onBulkPriceSuccess: () => void;
  
  // Delete Confirm Dialog
  deleteConfirmOpen: boolean;
  setDeleteConfirmOpen: (open: boolean) => void;
  deleteErrors: {
    failedProducts: string[];
    errorMessage: string;
  } | null;
  setDeleteErrors: (errors: any) => void;
  
  // Scanner
  scannedBarcode?: string;
}

export function EstoqueModals({
  editModalOpen,
  setEditModalOpen,
  editingProduct,
  setEditingProduct,
  onEditSuccess,
  parentProductModalOpen,
  setParentProductModalOpen,
  editingParentProduct,
  setEditingParentProduct,
  onParentProductSuccess,
  childProductModalOpen,
  setChildProductModalOpen,
  onChildProductSuccess,
  linkChildModalOpen,
  setLinkChildModalOpen,
  selectedProducts,
  allProducts,
  onLinkSuccess,
  bulkPriceModalOpen,
  setBulkPriceModalOpen,
  onBulkPriceSuccess,
  deleteConfirmOpen,
  setDeleteConfirmOpen,
  deleteErrors,
  setDeleteErrors,
  scannedBarcode
}: EstoqueModalsProps) {
  return (
    <>
      <ProductModal
        open={editModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditModalOpen(false);
            setEditingProduct(null);
          }
        }}
        product={editingProduct}
        onSuccess={onEditSuccess}
      />
      
      <CreateParentProductModal
        open={parentProductModalOpen}
        onOpenChange={(open) => {
          setParentProductModalOpen(open);
          if (!open) {
            setEditingParentProduct(null);
          }
        }}
        editProduct={editingParentProduct}
        onSuccess={onParentProductSuccess}
        initialBarcode={!editingParentProduct ? scannedBarcode : undefined}
      />

      <CreateChildProductModal
        open={childProductModalOpen}
        onOpenChange={setChildProductModalOpen}
        onSuccess={onChildProductSuccess}
        initialBarcode={scannedBarcode}
      />

      <LinkChildToParentModal
        open={linkChildModalOpen}
        onOpenChange={setLinkChildModalOpen}
        selectedProducts={selectedProducts}
        allProducts={allProducts}
        onSuccess={onLinkSuccess}
      />

      <BulkPriceUpdateModal
        open={bulkPriceModalOpen}
        onOpenChange={setBulkPriceModalOpen}
        selectedProductIds={selectedProducts}
        products={allProducts}
        onSuccess={onBulkPriceSuccess}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Exclusão Bloqueada - Componente em Uso
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-sm">
                <p className="text-foreground font-medium">
                  {deleteErrors?.failedProducts.length === 1 ? 'O produto não pode ser excluído:' : 'Os seguintes produtos não podem ser excluídos:'}
                </p>
                
                <div className="bg-muted p-4 rounded-lg space-y-2 max-h-40 overflow-y-auto">
                  {deleteErrors?.failedProducts.map((product, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{product}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
                  <p className="text-destructive font-medium mb-2">Motivo:</p>
                  <p className="text-foreground">
                    {deleteErrors?.errorMessage || 'Este componente está sendo usado em composições.'}
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                  <p className="text-foreground font-medium mb-2">
                    🔒 Para excluir {deleteErrors?.failedProducts.length === 1 ? 'este produto' : 'estes produtos'}:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-foreground">
                    <li>Acesse a aba <strong>Composições</strong></li>
                    <li>Remova {deleteErrors?.failedProducts.length === 1 ? 'o produto' : 'os produtos'} das composições onde {deleteErrors?.failedProducts.length === 1 ? 'está sendo usado' : 'estão sendo usados'}</li>
                    <li>Ou substitua por outro componente</li>
                    <li>Depois volte aqui e tente excluir novamente</li>
                  </ol>
                </div>

                <p className="text-muted-foreground italic">
                  A exclusão forçada não é permitida para garantir a integridade das composições cadastradas no sistema.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteErrors(null)}>
              Entendi
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
