import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Package, Plus, AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Product {
  id: string;
  sku: string;
  nome: string;
  categoria?: string;
  preco_custo?: number;
  quantidade_atual: number;
  estoque_minimo: number;
  unidade_medida?: string;
}

interface ProductSelectorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectProducts: (products: Array<Product & { quantidade: number }>) => void;
  selectedProducts?: Array<{ product_id: string; quantidade: number }>;
}

// Mock de produtos para demonstração
const mockProducts: Product[] = [
  {
    id: '1',
    sku: 'PROD001',
    nome: 'Produto A',
    categoria: 'Categoria 1',
    preco_custo: 10.50,
    quantidade_atual: 50,
    estoque_minimo: 10,
    unidade_medida: 'UN'
  },
  {
    id: '2',
    sku: 'PROD002',
    nome: 'Produto B',
    categoria: 'Categoria 2',
    preco_custo: 25.00,
    quantidade_atual: 5,
    estoque_minimo: 15,
    unidade_medida: 'UN'
  },
  {
    id: '3',
    sku: 'PROD003',
    nome: 'Produto C',
    categoria: 'Categoria 1',
    preco_custo: 8.75,
    quantidade_atual: 100,
    estoque_minimo: 20,
    unidade_medida: 'KG'
  }
];

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  isOpen,
  onOpenChange,
  onSelectProducts,
  selectedProducts = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [selectedItems, setSelectedItems] = useState<Map<string, { product: Product; quantidade: number }>>(new Map());

  useEffect(() => {
    // Inicializar com produtos já selecionados
    const initialSelected = new Map();
    selectedProducts.forEach(selected => {
      const product = products.find(p => p.id === selected.product_id);
      if (product) {
        initialSelected.set(product.id, { product, quantidade: selected.quantidade });
      }
    });
    setSelectedItems(initialSelected);
  }, [selectedProducts, products]);

  const filteredProducts = products.filter(product =>
    product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProductToggle = (product: Product, checked: boolean) => {
    const newSelected = new Map(selectedItems);
    
    if (checked) {
      newSelected.set(product.id, { product, quantidade: 1 });
    } else {
      newSelected.delete(product.id);
    }
    
    setSelectedItems(newSelected);
  };

  const handleQuantityChange = (productId: string, quantidade: number) => {
    const newSelected = new Map(selectedItems);
    const item = newSelected.get(productId);
    
    if (item && quantidade > 0) {
      newSelected.set(productId, { ...item, quantidade });
      setSelectedItems(newSelected);
    }
  };

  const handleConfirm = () => {
    const selectedProductsWithQuantity = Array.from(selectedItems.values()).map(item => ({
      ...item.product,
      quantidade: item.quantidade
    }));
    
    onSelectProducts(selectedProductsWithQuantity);
    onOpenChange(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStockStatus = (atual: number, minimo: number) => {
    if (atual <= 0) {
      return { label: 'Sem estoque', variant: 'destructive' as const, icon: AlertTriangle };
    }
    if (atual <= minimo) {
      return { label: 'Estoque baixo', variant: 'secondary' as const, icon: AlertTriangle };
    }
    return { label: 'Disponível', variant: 'default' as const, icon: Package };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Selecionar Produtos
            {selectedItems.size > 0 && (
              <Badge variant="secondary">{selectedItems.size} selecionados</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, SKU ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de produtos */}
          <div className="flex-1 overflow-auto border rounded-lg">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="w-12">Sel.</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço Custo</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Qtd.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const isSelected = selectedItems.has(product.id);
                  const selectedItem = selectedItems.get(product.id);
                  const stockStatus = getStockStatus(product.quantidade_atual, product.estoque_minimo);
                  const StatusIcon = stockStatus.icon;

                  return (
                    <TableRow key={product.id} className={isSelected ? "bg-muted/50" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => 
                            handleProductToggle(product, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.unidade_medida || 'UN'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.sku}</Badge>
                      </TableCell>
                      <TableCell>{product.categoria || '-'}</TableCell>
                      <TableCell>
                        {product.preco_custo ? formatCurrency(product.preco_custo) : '-'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.quantidade_atual}</p>
                          <p className="text-xs text-muted-foreground">
                            Mín: {product.estoque_minimo}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={stockStatus.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {stockStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isSelected && (
                          <Input
                            type="number"
                            min="1"
                            value={selectedItem?.quantidade || 1}
                            onChange={(e) => 
                              handleQuantityChange(product.id, parseInt(e.target.value) || 1)
                            }
                            className="w-20"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Resumo dos selecionados */}
          {selectedItems.size > 0 && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <h4 className="font-medium mb-2">Produtos Selecionados ({selectedItems.size})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {Array.from(selectedItems.values()).map(({ product, quantidade }) => (
                  <div key={product.id} className="flex items-center justify-between text-sm p-2 bg-background rounded">
                    <span>{product.nome} ({product.sku})</span>
                    <Badge variant="outline">Qtd: {quantidade}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={selectedItems.size === 0}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar {selectedItems.size} produto{selectedItems.size !== 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};