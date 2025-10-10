import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Link, Unlink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProducts, Product } from "@/hooks/useProducts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LinkChildToParentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: string[];
  allProducts: Product[];
  onSuccess?: () => void;
}

export function LinkChildToParentModal({ 
  open, 
  onOpenChange, 
  selectedProducts,
  allProducts,
  onSuccess 
}: LinkChildToParentModalProps) {
  const [selectedParent, setSelectedParent] = useState<string>('');
  const [isLinking, setIsLinking] = useState(false);
  const { toast } = useToast();
  const { updateProduct } = useProducts();

  // Verificar se algum produto selecionado já tem pai
  const selectedProductsData = allProducts.filter(p => selectedProducts.includes(p.id));
  const hasProductsWithParent = selectedProductsData.some(p => p.sku_pai);
  const allHaveParent = selectedProductsData.length > 0 && selectedProductsData.every(p => p.sku_pai);

  // Filtrar apenas produtos marcados explicitamente como PAI
  const availableParents = allProducts.filter(p => 
    p.eh_produto_pai === true && p.ativo && !selectedProducts.includes(p.id)
  );

  const handleLink = async () => {
    if (!selectedParent) {
      toast({
        title: "SKU Pai não selecionado",
        description: "Por favor, selecione um produto pai.",
        variant: "destructive",
      });
      return;
    }

    const parentProduct = allProducts.find(p => p.id === selectedParent);
    if (!parentProduct) {
      toast({
        title: "Produto pai não encontrado",
        description: "O produto pai selecionado não foi encontrado.",
        variant: "destructive",
      });
      return;
    }

    setIsLinking(true);
    try {
      // Atualizar todos os produtos selecionados com o sku_pai
      await Promise.all(
        selectedProducts.map(productId => 
          updateProduct(productId, { sku_pai: parentProduct.sku_interno })
        )
      );
      
      toast({
        title: "Produtos vinculados!",
        description: `${selectedProducts.length} produto(s) vinculado(s) ao SKU Pai "${parentProduct.sku_interno}".`,
      });

      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao vincular produtos:', error);
      toast({
        title: "Erro ao vincular produtos",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async () => {
    setIsLinking(true);
    try {
      // Remover sku_pai de todos os produtos selecionados
      await Promise.all(
        selectedProducts.map(productId => 
          updateProduct(productId, { sku_pai: null })
        )
      );
      
      toast({
        title: "Produtos desvinculados!",
        description: `${selectedProducts.length} produto(s) desvinculado(s) do pai.`,
      });

      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao desvincular produtos:', error);
      toast({
        title: "Erro ao desvincular produtos",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
    }
  };

  const handleClose = () => {
    setSelectedParent('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            {hasProductsWithParent ? 'Gerenciar Vinculação' : 'Vincular a SKU Pai'}
          </DialogTitle>
          <DialogDescription>
            {hasProductsWithParent 
              ? `Gerencie a vinculação de ${selectedProducts.length} produto(s). ${allHaveParent ? 'Todos já possuem pai.' : 'Alguns já possuem pai.'}`
              : `Vincule ${selectedProducts.length} produto(s) selecionado(s) a um produto pai para organizar o estoque.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {hasProductsWithParent && (
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Produtos com pai atribuído:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {selectedProductsData.filter(p => p.sku_pai).map(p => (
                  <li key={p.id}>
                    {p.sku_interno} → {p.sku_pai}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!allHaveParent && (
            <div className="space-y-2">
              <Label htmlFor="parent-select">Selecione o SKU Pai *</Label>
              <Select value={selectedParent} onValueChange={setSelectedParent}>
                <SelectTrigger id="parent-select">
                  <SelectValue placeholder="Escolha um produto pai..." />
                </SelectTrigger>
                <SelectContent>
                  {availableParents.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      Nenhum produto pai disponível. Crie um produto pai primeiro.
                    </div>
                  ) : (
                    availableParents.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.sku_interno} - {product.nome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            
            {hasProductsWithParent && (
              <Button
                variant="destructive"
                onClick={handleUnlink}
                disabled={isLinking}
              >
                <Unlink className="w-4 h-4 mr-2" />
                {isLinking ? "Desvinculando..." : "Desvincular do Pai"}
              </Button>
            )}
            
            {!allHaveParent && (
              <Button
                onClick={handleLink}
                disabled={isLinking || !selectedParent}
              >
                <Link className="w-4 h-4 mr-2" />
                {isLinking ? "Vinculando..." : "Vincular Produtos"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
