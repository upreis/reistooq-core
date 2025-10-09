import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
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
import { 
  Package, 
  Trash2, 
  Eye, 
  EyeOff, 
  DollarSign,
  Tag,
  MoreVertical
} from "lucide-react";
import { Product } from "@/hooks/useProducts";

interface BulkActionsProps {
  selectedProducts: string[];
  products: Product[];
  onBulkStatusChange: (productIds: string[], active: boolean) => void;
  onBulkDelete: (productIds: string[]) => void;
  onBulkPriceUpdate: (productIds: string[]) => void;
  onBulkCategoryUpdate: (productIds: string[]) => void;
  onClearSelection: () => void;
}

export function BulkActions({
  selectedProducts,
  products,
  onBulkStatusChange,
  onBulkDelete,
  onBulkPriceUpdate,
  onBulkCategoryUpdate,
  onClearSelection
}: BulkActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (selectedProducts.length === 0) return null;

  const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));
  const activeCount = selectedProductsData.filter(p => p.ativo).length;
  const inactiveCount = selectedProductsData.length - activeCount;
  const childrenCount = selectedProductsData.filter(p => p.sku_pai).length;
  const parentsCount = selectedProductsData.filter(p => 
    !p.sku_pai && products.some(child => child.sku_pai === p.sku_interno)
  ).length;

  return (
    <>
      <div className="flex items-center gap-2 p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          <span className="font-medium">
            {selectedProducts.length} produto{selectedProducts.length > 1 ? 's' : ''} selecionado{selectedProducts.length > 1 ? 's' : ''}
          </span>
          <Badge variant="outline" className="text-xs">
            {activeCount} ativo{activeCount !== 1 ? 's' : ''} • {inactiveCount} inativo{inactiveCount !== 1 ? 's' : ''}
          </Badge>
          {childrenCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {childrenCount} filho{childrenCount > 1 ? 's' : ''}
            </Badge>
          )}
          {parentsCount > 0 && (
            <Badge variant="default" className="text-xs">
              {parentsCount} pai{parentsCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {inactiveCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkStatusChange(selectedProducts, true)}
              className="border-green-500 text-green-600 hover:bg-green-50"
            >
              <Eye className="w-4 h-4 mr-2" />
              Ativar ({inactiveCount})
            </Button>
          )}

          {activeCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkStatusChange(selectedProducts, false)}
              className="border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              <EyeOff className="w-4 h-4 mr-2" />
              Desativar ({activeCount})
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="w-4 h-4 mr-2" />
                Mais Ações
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => onBulkPriceUpdate(selectedProducts)}>
                <DollarSign className="w-4 h-4 mr-2" />
                Atualizar Preços em Massa
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => onBulkCategoryUpdate(selectedProducts)}>
                <Tag className="w-4 h-4 mr-2" />
                Atualizar Categorias em Massa
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem 
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Selecionados
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
          >
            Limpar Seleção
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão em Massa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedProducts.length} produto{selectedProducts.length > 1 ? 's' : ''}?
              Esta ação não pode ser desfeita.
              
              {parentsCount > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                  <strong>Atenção:</strong> {parentsCount} produto{parentsCount > 1 ? 's' : ''} pai será{parentsCount > 1 ? 'ão' : ''} excluído{parentsCount > 1 ? 's' : ''}. 
                  Seus produtos filhos ficarão órfãos.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onBulkDelete(selectedProducts);
                setDeleteDialogOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir {selectedProducts.length} Produto{selectedProducts.length > 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
