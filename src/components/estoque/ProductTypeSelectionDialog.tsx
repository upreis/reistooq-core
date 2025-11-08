import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Package, Layers } from "lucide-react";

interface ProductTypeSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectParent: () => void;
  onSelectChild: () => void;
  scannedCode: string;
}

export function ProductTypeSelectionDialog({
  open,
  onOpenChange,
  onSelectParent,
  onSelectChild,
  scannedCode,
}: ProductTypeSelectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Produto não encontrado</DialogTitle>
          <DialogDescription>
            O código <strong>{scannedCode}</strong> não existe no estoque.
            <br />
            Escolha o tipo de produto que deseja criar:
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Button
            onClick={onSelectParent}
            variant="outline"
            className="h-auto flex-col gap-3 py-6"
          >
            <Package className="w-12 h-12 text-primary" />
            <div className="text-center">
              <div className="font-semibold text-lg mb-1">Produto PAI</div>
              <div className="text-sm text-muted-foreground">
                Produto base que pode ter variações (cores, tamanhos, etc)
              </div>
            </div>
          </Button>

          <Button
            onClick={onSelectChild}
            variant="outline"
            className="h-auto flex-col gap-3 py-6"
          >
            <Layers className="w-12 h-12 text-secondary" />
            <div className="text-center">
              <div className="font-semibold text-lg mb-1">Produto FILHO</div>
              <div className="text-sm text-muted-foreground">
                Variação de um produto PAI (ex: Camiseta Azul M)
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
