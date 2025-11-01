import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Package,
  MoreVertical,
  Edit,
  Trash2,
  ArrowUpDown,
} from "lucide-react";
import { Product } from "@/hooks/useProducts";
import MobileTable from "@/components/mobile/MobileTable";
import { ProductDetailsModal } from "./ProductDetailsModal";
import { StockMovementModal } from "@/features/estoque/components/modals/StockMovementModal";
import { DeleteConfirmModal } from "@/features/estoque/components/modals/DeleteConfirmModal";
import { getEstoqueTableColumns } from "@/features/estoque/components/table/EstoqueTableColumns";

interface EstoqueTableProps {
  products: Product[];
  selectedProducts: string[];
  onSelectProduct: (productId: string) => void;
  onSelectAll: (selected: boolean) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onStockMovement: (productId: string, type: 'entrada' | 'saida', quantity: number, reason?: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  rowClassName?: string; // Nova prop para classes customizadas
  parentSkus?: Set<string>; // SKUs dos produtos PAI para estilo diferenciado
  parentAggregatedData?: Map<string, { custoTotal: number; vendaTotal: number }>; // Dados agregados dos produtos PAI
}

export function EstoqueTable({
  products,
  selectedProducts,
  onSelectProduct,
  onSelectAll,
  onEditProduct,
  onDeleteProduct,
  onStockMovement,
  sortBy,
  sortOrder,
  onSort,
  rowClassName,
  parentSkus,
  parentAggregatedData,
}: EstoqueTableProps) {
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [selectedProductForMovement, setSelectedProductForMovement] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<Product | null>(null);

  const handleStockMovement = (productId: string, type: 'entrada' | 'saida', quantity: number, reason?: string) => {
    onStockMovement(productId, type, quantity, reason);
  };

  const handleDeleteConfirm = (productId: string) => {
    onDeleteProduct(productId);
  };

  const allSelected = products.length > 0 && selectedProducts.length === products.length;
  const someSelected = selectedProducts.length > 0 && selectedProducts.length < products.length;

  // 📋 Obter definições de colunas com contexto
  const columns = getEstoqueTableColumns({ parentSkus, parentAggregatedData });

  const actions = [
    {
      label: "Movimentar",
      onClick: (product: Product) => {
        setSelectedProductForMovement(product);
        setMovementModalOpen(true);
      },
      icon: <Package className="w-4 h-4" />,
      variant: "outline" as const
    },
    {
      label: "Editar",
      onClick: onEditProduct,
      icon: <Edit className="w-4 h-4" />,
      variant: "outline" as const
    },
    {
      label: "Excluir",
      onClick: (product: Product) => {
        setProductToDelete(product);
        setDeleteDialogOpen(true);
      },
      icon: <Trash2 className="w-4 h-4" />,
      variant: "destructive" as const
    }
  ];

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
        <p className="text-muted-foreground">
          Cadastre produtos para gerenciar o estoque
        </p>
      </div>
    );
  }

  // Função para determinar o estilo da linha baseado no produto
  const getRowClassName = (product: Product, index: number) => {
    // Se é um produto PAI, aplicar cor de seleção permanente (dourado/amarelo)
    if (parentSkus?.has(product.sku_interno)) {
      return "border-yellow-700/50 bg-yellow-900/20 hover:bg-yellow-900/30";
    }
    
    // Se foi passado um rowClassName customizado, usar ele
    if (rowClassName) {
      return rowClassName;
    }
    
    // Estilo padrão alternado
    return index % 2 === 0 
      ? "border-gray-700 bg-[hsl(213_48%_10%)] hover:bg-[hsl(213_48%_12%)]" 
      : "border-gray-700 bg-[hsl(213_48%_18%)] hover:bg-[hsl(213_48%_20%)]";
  };

  return (
    <>
      <MobileTable
        data={products}
        columns={columns}
        selectedItems={selectedProducts}
        onSelectItem={onSelectProduct}
        onSelectAll={onSelectAll}
        keyField="id"
        actions={actions}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={onSort}
        emptyMessage="Nenhum produto encontrado. Cadastre produtos para gerenciar o estoque."
        onRowClick={(product: Product) => {
          setSelectedProductForDetails(product);
          setDetailsModalOpen(true);
        }}
        getRowClassName={getRowClassName}
      />

      {/* Stock Movement Modal */}
      <StockMovementModal
        open={movementModalOpen}
        onOpenChange={setMovementModalOpen}
        product={selectedProductForMovement}
        onConfirm={handleStockMovement}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        product={productToDelete}
        onConfirm={handleDeleteConfirm}
      />

      {/* Product Details Modal */}
      <ProductDetailsModal
        product={selectedProductForDetails}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        onEditProduct={(product) => {
          setDetailsModalOpen(false);
          onEditProduct(product);
        }}
      />
    </>
  );
}