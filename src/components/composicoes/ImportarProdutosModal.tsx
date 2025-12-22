import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Package, Plus } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format";

interface ImportarProdutosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportar: (produtoIds: string[]) => void;
  isImporting: boolean;
}

export function ImportarProdutosModal({
  open,
  onOpenChange,
  onImportar,
  isImporting
}: ImportarProdutosModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const { getProducts } = useProducts();
  const [produtosEstoque, setProdutosEstoque] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar produtos do estoque
  useEffect(() => {
    const carregarProdutos = async () => {
      try {
        setIsLoading(true);
        const produtos = await getProducts();
        setProdutosEstoque(produtos);
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      carregarProdutos();
    }
  }, [open, getProducts]);

  // Filtrar produtos do estoque
  const produtosFiltrados = produtosEstoque.filter(produto => 
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.sku_interno.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedIds.length === produtosFiltrados.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(produtosFiltrados.map(p => p.id));
    }
  };

  const handleSelectProduto = (produtoId: string) => {
    setSelectedIds(prev =>
      prev.includes(produtoId)
        ? prev.filter(id => id !== produtoId)
        : [...prev, produtoId]
    );
  };

  const handleImportar = () => {
    if (selectedIds.length > 0) {
      onImportar(selectedIds);
      setSelectedIds([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Importar Produtos do Controle de Estoque
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
          {/* Busca */}
          <div className="relative flex-shrink-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Cabeçalho com seleção */}
          <div className="flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedIds.length === produtosFiltrados.length && produtosFiltrados.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm">
                Selecionar todos ({produtosFiltrados.length} produtos)
              </span>
            </div>
            <Badge variant="outline">
              {selectedIds.length} selecionados
            </Badge>
          </div>

          {/* Lista de produtos */}
          <ScrollArea className="flex-1 min-h-0 border rounded-lg">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Carregando produtos...
              </div>
            ) : produtosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nenhum produto encontrado
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {produtosFiltrados.map(produto => (
                  <div
                    key={produto.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedIds.includes(produto.id)}
                      onCheckedChange={() => handleSelectProduto(produto.id)}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{produto.nome}</h4>
                        <Badge variant="outline" className="font-mono text-xs">
                          {produto.sku_interno}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {produto.preco_venda && (
                          <span>Preço: {formatMoney(produto.preco_venda)}</span>
                        )}
                        <span>Estoque: {produto.quantidade_atual}</span>
                        {produto.categoria && (
                          <span>Categoria: {produto.categoria}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Ações */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedIds.length > 0 && (
                <span>{selectedIds.length} produtos serão importados</span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleImportar}
                disabled={selectedIds.length === 0 || isImporting}
                className="gap-2"
              >
                {isImporting ? (
                  "Importando..."
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Importar ({selectedIds.length})
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}