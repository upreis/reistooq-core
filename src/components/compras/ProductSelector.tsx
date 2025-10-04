import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Package, ShoppingCart, Minus, Plus } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { formatMoney } from "@/lib/format";

interface Product {
  id: string;
  nome: string;
  sku_interno: string;
  preco_custo: number;
  quantidade_atual: number;
  estoque_minimo?: number;
  categoria?: string;
}

interface ProductSelectorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectProducts: (products: any[]) => void;
  selectedProducts?: any[];
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  isOpen,
  onOpenChange,
  onSelectProducts,
  selectedProducts = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<{[key: string]: { product: Product; quantidade: number }}>({});
  const { getProducts } = useProducts();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar produtos do estoque
  useEffect(() => {
    const loadProducts = async () => {
      if (isOpen) {
        setLoading(true);
        try {
          const data = await getProducts({ limit: 1000 });
          setProducts(data);
        } catch (error) {
          console.error("Error loading products:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadProducts();
  }, [isOpen, getProducts]);

  const filteredProducts = products.filter(product =>
    product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku_interno.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProductToggle = (product: Product, checked: boolean) => {
    const newSelected = { ...selectedItems };
    
    if (checked) {
      newSelected[product.id] = { product, quantidade: 1 };
    } else {
      delete newSelected[product.id];
    }
    
    setSelectedItems(newSelected);
  };

  const handleQuantityChange = (productId: string, quantidade: number) => {
    if (quantidade <= 0) return;
    
    const newSelected = { ...selectedItems };
    if (newSelected[productId]) {
      newSelected[productId].quantidade = quantidade;
      setSelectedItems(newSelected);
    }
  };

  const handleConfirm = () => {
    const productsToReturn = Object.values(selectedItems).map(({ product, quantidade }) => ({
      id: product.id,
      nome: product.nome,
      sku_interno: product.sku_interno,
      preco_custo: product.preco_custo,
      quantidade: quantidade
    }));

    onSelectProducts(productsToReturn);
    setSelectedItems({});
    setSearchTerm('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedItems({});
    setSearchTerm('');
    onOpenChange(false);
  };

  // Usando formatMoney de src/lib/format.ts para consistência

  const getStockStatus = (product: Product) => {
    const percentage = (product.quantidade_atual / (product.estoque_minimo || 1)) * 100;
    
    if (percentage <= 100) {
      return { variant: "destructive" as const, label: "Estoque Baixo", icon: Package };
    } else if (percentage <= 200) {
      return { variant: "secondary" as const, label: "Estoque OK", icon: Package };
    } else {
      return { variant: "default" as const, label: "Estoque Alto", icon: Package };
    }
  };

  const selectedCount = Object.keys(selectedItems).length;
  const totalValue = Object.values(selectedItems).reduce(
    (sum, { product, quantidade }) => sum + (product.preco_custo * quantidade),
    0
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Selecionar Produtos
            {selectedCount > 0 && (
              <Badge variant="default" className="ml-2">
                {selectedCount} selecionado(s)
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Barra de pesquisa */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos por nome, SKU ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Resumo da seleção */}
          {selectedCount > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">Resumo da Seleção</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedCount} produto(s) selecionado(s)
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {formatMoney(totalValue)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
            </div>
          )}

          {/* Tabela de produtos */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Selecionar</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead className="w-32">Quantidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const isSelected = !!selectedItems[product.id];
                  const quantidade = selectedItems[product.id]?.quantidade || 1;
                  const stockStatus = getStockStatus(product);
                  const StockIcon = stockStatus.icon;

                  return (
                    <TableRow key={product.id} className={isSelected ? "bg-primary/5" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleProductToggle(product, !!checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.nome}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {product.sku_interno}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {product.categoria || 'Sem categoria'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatMoney(product.preco_custo)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StockIcon className="h-4 w-4" />
                          <span>{product.quantidade_atual}</span>
                          <Badge variant={stockStatus.variant} className="text-xs">
                            {stockStatus.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isSelected ? (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuantityChange(product.id, quantidade - 1)}
                              disabled={quantidade <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              value={quantidade}
                              onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 1)}
                              className="w-16 h-8 text-center"
                              min="1"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuantityChange(product.id, quantidade + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Produtos não encontrados */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
              <p className="text-muted-foreground">
                Tente ajustar sua pesquisa ou verificar se há produtos cadastrados.
              </p>
            </div>
          )}
        </div>

        {/* Botões de ação */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedCount > 0 && (
              <span>
                {selectedCount} produto(s) selecionado(s) • Total: {formatMoney(totalValue)}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={selectedCount === 0}
              className="gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Confirmar Seleção ({selectedCount})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};