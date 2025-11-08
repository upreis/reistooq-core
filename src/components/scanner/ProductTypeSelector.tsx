import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Package, Layers } from "lucide-react";

interface ProductTypeSelectorProps {
  open: boolean;
  onSelectType: (type: 'parent' | 'child') => void;
  onCancel: () => void;
  barcode: string;
}

export const ProductTypeSelector: React.FC<ProductTypeSelectorProps> = ({
  open,
  onSelectType,
  onCancel,
  barcode,
}) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Produto Não Encontrado</DialogTitle>
          <DialogDescription>
            O código <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{barcode}</code> não existe no estoque.
            <br />
            Escolha o tipo de produto que deseja criar:
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-4">
          <Button
            variant="outline"
            className="h-auto p-6 flex flex-col items-start gap-2 hover:bg-primary/5 hover:border-primary transition-colors"
            onClick={() => onSelectType('parent')}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-lg">Produto PAI</h3>
                <p className="text-sm text-muted-foreground">
                  Produto principal independente
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground pl-14">
              Ideal para produtos únicos ou que serão o produto principal de um grupo
            </p>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-6 flex flex-col items-start gap-2 hover:bg-primary/5 hover:border-primary transition-colors"
            onClick={() => onSelectType('child')}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Layers className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-lg">Produto FILHO</h3>
                <p className="text-sm text-muted-foreground">
                  Variação de um produto pai existente
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground pl-14">
              Ideal para tamanhos, cores ou outras variações de um produto principal
            </p>
          </Button>
        </div>

        <div className="flex justify-end pt-2 border-t">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
