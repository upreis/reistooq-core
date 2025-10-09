import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Link2, Unlink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProducts, Product } from "@/hooks/useProducts";

interface LinkProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childProduct: Product | null;
  onSuccess?: () => void;
}

export function LinkProductModal({
  open,
  onOpenChange,
  childProduct,
  onSuccess
}: LinkProductModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [availableParents, setAvailableParents] = useState<Product[]>([]);
  const [selectedParent, setSelectedParent] = useState<Product | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const { toast } = useToast();
  const { getProducts, updateProduct } = useProducts();

  useEffect(() => {
    if (open && childProduct) {
      loadPotentialParents();
    }
  }, [open, searchTerm]);

  const loadPotentialParents = async () => {
    try {
      const products = await getProducts({
        search: searchTerm || undefined,
        limit: 50
      });
      setAvailableParents(
        products.filter(p => !p.sku_pai && p.id !== childProduct?.id)
      );
    } catch (error) {
      console.error('Error loading potential parents:', error);
    }
  };

  const handleLink = async () => {
    if (!childProduct || !selectedParent) return;

    setIsLinking(true);
    try {
      await updateProduct(childProduct.id, {
        sku_pai: selectedParent.sku_interno
      });
      
      toast({
        title: "Produto vinculado!",
        description: `${childProduct.nome} foi vinculado ao produto pai ${selectedParent.nome}`,
      });

      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error linking product:', error);
      toast({
        title: "Erro ao vincular produto",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async () => {
    if (!childProduct) return;

    setIsLinking(true);
    try {
      await updateProduct(childProduct.id, {
        sku_pai: null
      });
      
      toast({
        title: "Produto desvinculado!",
        description: `${childProduct.nome} foi desvinculado do produto pai`,
      });

      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error unlinking product:', error);
      toast({
        title: "Erro ao desvincular produto",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setSelectedParent(null);
    onOpenChange(false);
  };

  if (!childProduct) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Gerenciar Vinculação do Produto
          </DialogTitle>
          <DialogDescription>
            {childProduct.sku_pai 
              ? `Produto atualmente vinculado ao SKU: ${childProduct.sku_pai}` 
              : 'Este produto não está vinculado a nenhum produto pai'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do Produto Atual */}
          <div className="p-4 border rounded-lg bg-muted/20">
            <Label className="text-sm font-semibold mb-2 block">Produto Atual</Label>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{childProduct.nome}</span>
                <Badge variant="outline" className="ml-2">
                  {childProduct.sku_interno}
                </Badge>
              </div>
              {childProduct.sku_pai && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleUnlink}
                  disabled={isLinking}
                >
                  <Unlink className="w-4 h-4 mr-2" />
                  Desvincular
                </Button>
              )}
            </div>
          </div>

          {/* Busca de Produto Pai */}
          <div className="space-y-2">
            <Label>Buscar Produto Pai</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite SKU ou nome do produto pai..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Lista de Produtos Pai Disponíveis */}
          {availableParents.length > 0 && (
            <div className="space-y-2">
              <Label>Produtos Pai Disponíveis</Label>
              <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2">
                {availableParents.map((parent) => (
                  <div
                    key={parent.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedParent?.id === parent.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedParent(parent)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{parent.nome}</span>
                        <Badge variant="outline" className="ml-2">
                          {parent.sku_interno}
                        </Badge>
                        {parent.descricao && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {parent.descricao}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          Estoque: {parent.quantidade_atual}
                        </div>
                        {selectedParent?.id === parent.id && (
                          <Badge variant="default" className="mt-1">Selecionado</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchTerm && availableParents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2" />
              <p>Nenhum produto pai encontrado</p>
              <p className="text-sm">Tente buscar por outro termo</p>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          {selectedParent && (
            <Button onClick={handleLink} disabled={isLinking}>
              {isLinking ? "Vinculando..." : "Vincular ao Produto Pai"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
