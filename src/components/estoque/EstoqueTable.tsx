import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Package,
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  AlertTriangle,
  Upload,
  ArrowUpDown,
  Plus,
  Minus,
} from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MobileTable from "@/components/mobile/MobileTable";
import { ProductDetailsModal } from "./ProductDetailsModal";

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
  const [movementType, setMovementType] = useState<'entrada' | 'saida'>('entrada');
  const [movementQuantity, setMovementQuantity] = useState<number>(0);
  const [movementReason, setMovementReason] = useState("");
  const [imageUploadProduct, setImageUploadProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<Product | null>(null);

  const getStockStatus = (product: Product) => {
    if (product.quantidade_atual === 0) {
      return {
        label: "Sem estoque",
        variant: "destructive" as const,
        color: "bg-red-500",
        icon: AlertTriangle
      };
    } else if (product.quantidade_atual <= product.estoque_minimo) {
      return {
        label: "Estoque baixo",
        variant: "secondary" as const,
        color: "bg-yellow-500",
        icon: AlertTriangle
      };
    } else if (product.quantidade_atual >= product.estoque_maximo) {
      return {
        label: "Estoque alto",
        variant: "outline" as const,
        color: "bg-blue-500",
        icon: Package
      };
    } else {
      return {
        label: "Em estoque",
        variant: "default" as const,
        color: "bg-green-500",
        icon: Package
      };
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price || price === 0) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleMovement = () => {
    if (!selectedProductForMovement || movementQuantity <= 0) return;
    
    onStockMovement(
      selectedProductForMovement.id,
      movementType,
      movementQuantity,
      movementReason
    );
    
    setMovementModalOpen(false);
    setSelectedProductForMovement(null);
    setMovementQuantity(0);
    setMovementReason("");
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortOrder === 'asc' ? "↑" : "↓";
  };

  const allSelected = products.length > 0 && selectedProducts.length === products.length;
  const someSelected = selectedProducts.length > 0 && selectedProducts.length < products.length;

  const columns = [
    {
      key: "sku_interno",
      label: "SKU Interno",
      sortable: true,
      width: "250px",
      render: (value: string, product: Product) => {
        const isParent = parentSkus?.has(product.sku_interno);
        const isChild = product.sku_pai;
        
        // Verificar se é órfão
        const hasParentSku = !!product.sku_pai;
        const isChildFormat = product.sku_interno.split('-').length > 2;
        const isOrphan = hasParentSku && isChild && !isParent;
        
        // Obter status do estoque
        const stockStatus = getStockStatus(product);
        
        return (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              {isParent && (
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-blue-500/10 text-blue-400 border-blue-500/30">
                    PAI
                  </Badge>
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                </div>
              )}
              {isChild && (
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-blue-500/5 text-blue-300 border-blue-500/20">
                    FILHO
                  </Badge>
                  <div className="flex items-center gap-0.5">
                    <div className="w-3 h-[1px] bg-blue-500/50" />
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/70" />
                  </div>
                </div>
              )}
              <div className="font-mono text-[11px] font-semibold">{value}</div>
            </div>
            
            {/* Avisos abaixo do SKU */}
            <div className="flex flex-wrap gap-1 ml-0">
              {isOrphan && (
                <Badge variant="destructive" className="text-[9px] px-1.5 py-0.5">
                  ⚠️ Órfão
                </Badge>
              )}
              {product.quantidade_atual === 0 && (
                <Badge variant="destructive" className="text-[9px] px-1.5 py-0.5 bg-red-500/20 text-red-400 border-red-500/30">
                  Sem estoque
                </Badge>
              )}
              {product.quantidade_atual > 0 && product.quantidade_atual <= product.estoque_minimo && (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  Estoque baixo
                </Badge>
              )}
              {product.quantidade_atual > product.estoque_minimo && product.quantidade_atual <= product.estoque_minimo * 1.5 && (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 bg-orange-500/20 text-orange-400 border-orange-500/30">
                  Crítico
                </Badge>
              )}
            </div>
          </div>
        );
      }
    },
    {
      key: "nome",
      label: "Nome",
      primary: true,
      sortable: true,
      width: "200px",
      render: (value: string, product: Product) => (
        <div className="min-w-0 flex-1">
          <p className="font-medium text-[11px] truncate leading-tight">{product.nome}</p>
        </div>
      )
    },
    {
      key: "quantidade_atual",
      label: "Quantidade Atual",
      sortable: true,
      width: "100px",
      render: (value: number, product: Product) => (
        <div className="text-center text-[11px] font-semibold">{value}</div>
      )
    },
    {
      key: "preco_custo",
      label: "Preço Custo",
      sortable: true,
      width: "100px",
      render: (value: number, product: Product) => {
        // Se é produto PAI e tem dados agregados, mostrar Custo Total
        if (parentSkus?.has(product.sku_interno) && parentAggregatedData?.has(product.sku_interno)) {
          const data = parentAggregatedData.get(product.sku_interno)!;
          return (
            <div className="text-[11px]">
              <div className="text-muted-foreground text-[10px]">Custo Total:</div>
              <div className="font-semibold">{formatPrice(data.custoTotal)}</div>
            </div>
          );
        }
        return (
          <span className="text-[11px]">
            {formatPrice(value)}
          </span>
        );
      }
    },
    {
      key: "preco_venda",
      label: "Preço Venda",
      sortable: true,
      width: "100px",
      render: (value: number, product: Product) => {
        // Se é produto PAI e tem dados agregados, mostrar Venda Total
        if (parentSkus?.has(product.sku_interno) && parentAggregatedData?.has(product.sku_interno)) {
          const data = parentAggregatedData.get(product.sku_interno)!;
          return (
            <div className="text-[11px]">
              <div className="text-muted-foreground text-[10px]">Venda Total:</div>
              <div className="font-semibold">{formatPrice(data.vendaTotal)}</div>
            </div>
          );
        }
        return (
          <span className="text-[11px]">
            {formatPrice(value)}
          </span>
        );
      }
    },
    {
      key: "estoque_minimo",
      label: "Estoque Mínimo",
      sortable: true,
      width: "90px",
      render: (value: number) => (
        <span className="text-[11px] block text-center">
          {value}
        </span>
      )
    },
    {
      key: "estoque_maximo",
      label: "Estoque Máximo",
      sortable: true,
      width: "90px",
      render: (value: number) => (
        <span className="text-[11px] block text-center">
          {value}
        </span>
      )
    },
    {
      key: "url_imagem",
      label: "URL Imagem",
      width: "150px",
      render: (value: string, product: Product) => (
        <div className="text-[10px] font-mono text-muted-foreground truncate max-w-[150px]" title={value}>
          {value || "-"}
        </div>
      )
    },
    {
      key: "descricao",
      label: "Descrição",
      width: "250px",
      render: (value: string) => (
        <span className="text-[11px] block truncate max-w-[250px]" title={value}>
          {value || "-"}
        </span>
      )
    },
    {
      key: "categoria",
      label: "Categoria",
      sortable: true,
      width: "120px",
      render: (value: string) => (
        <span className="text-[11px] block truncate max-w-[120px]" title={value}>
          {value || "-"}
        </span>
      )
    },
    {
      key: "ativo",
      label: "Status",
      sortable: true,
      width: "80px",
      render: (value: boolean) => (
        <Badge 
          variant={value ? "default" : "secondary"} 
          className="text-[10px] px-2 py-0.5"
        >
          {value ? "Ativo" : "Inativo"}
        </Badge>
      )
    },
    {
      key: "sku_pai",
      label: "SKU Pai",
      sortable: true,
      width: "120px",
      render: (value: string) => (
        <span className="text-[11px] font-mono block">
          {value || "-"}
        </span>
      )
    },
    {
      key: "codigo_barras",
      label: "Código EAN",
      sortable: true,
      width: "130px",
      render: (value: string) => (
        <span className="text-[11px] font-mono block truncate">
          {value || "-"}
        </span>
      )
    },
    {
      key: "ncm",
      label: "NCM",
      sortable: true,
      width: "100px",
      render: (value: string) => (
        <span className="text-[11px] font-mono block">
          {value || "-"}
        </span>
      )
    },
    {
      key: "localizacao",
      label: "Localização",
      sortable: true,
      width: "120px",
      render: (value: string) => (
        <span className="text-[11px] block">
          {value || "-"}
        </span>
      )
    },
    {
      key: "peso_bruto_kg",
      label: "Peso Bruto (Kg)",
      sortable: true,
      width: "90px",
      render: (value: number) => (
        <span className="text-[11px] block text-center">
          {value || "-"}
        </span>
      )
    },
    {
      key: "peso_liquido_kg",
      label: "Peso Líquido (Kg)",
      sortable: true,
      width: "90px",
      render: (value: number) => (
        <span className="text-[11px] block text-center">
          {value || "-"}
        </span>
      )
    },
    {
      key: "dimensoes",
      label: "Dimensões (LxAxC)",
      width: "120px",
      render: (_, product: Product) => (
        <span className="text-[10px]">
          {product.largura && product.altura && product.comprimento 
            ? `${product.largura}x${product.altura}x${product.comprimento}`
            : "-"}
        </span>
      )
    },
    {
      key: "numero_volumes",
      label: "Nº Volumes",
      sortable: true,
      width: "80px",
      render: (value: number) => (
        <span className="text-[11px] block text-center">
          {value || "1"}
        </span>
      )
    },
    {
      key: "unidade",
      label: "Unidade",
      sortable: true,
      width: "70px",
      render: (value: string) => (
        <span className="text-[11px] block text-center">
          {value || "UN"}
        </span>
      )
    },
    {
      key: "origem",
      label: "Origem",
      sortable: true,
      width: "70px",
      render: (value: number) => (
        <span className="text-[11px] block text-center">
          {value !== null && value !== undefined ? value : "-"}
        </span>
      )
    },
    {
      key: "sob_encomenda",
      label: "Sob Encomenda",
      sortable: true,
      width: "100px",
      render: (value: boolean) => (
        <Badge 
          variant={value ? "default" : "outline"} 
          className="text-[10px] px-2 py-0.5"
        >
          {value ? "Sim" : "Não"}
        </Badge>
      )
    },
    {
      key: "dias_preparacao",
      label: "Dias Prep.",
      sortable: true,
      width: "80px",
      render: (value: number) => (
        <span className="text-[11px] block text-center">
          {value && value > 0 ? value : "-"}
        </span>
      )
    },
    {
      key: "tipo_embalagem",
      label: "Tipo Embalagem",
      width: "120px",
      render: (value: string) => (
        <span className="text-[11px] block truncate">
          {value || "-"}
        </span>
      )
    },
    {
      key: "codigo_cest",
      label: "Código CEST",
      sortable: true,
      width: "110px",
      render: (value: string) => (
        <span className="text-[10px] font-mono block truncate">
          {value || "-"}
        </span>
      )
    },
    {
      key: "categoria_principal",
      label: "Categoria Principal",
      sortable: true,
      width: "150px",
      render: (value: string) => (
        <span className="text-[11px] block truncate max-w-[150px]" title={value}>
          {value || "-"}
        </span>
      )
    }
  ];

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

      {/* Movement Modal */}
      <Dialog open={movementModalOpen} onOpenChange={setMovementModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Movimentação de Estoque</DialogTitle>
            <DialogDescription>
              Registre entradas, saídas ou ajustes no estoque do produto selecionado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Produto</Label>
              <Input value={selectedProductForMovement?.nome || ""} disabled />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Estoque Atual</Label>
                <Input value={selectedProductForMovement?.quantidade_atual || 0} disabled />
              </div>
              <div>
                <Label>Localização</Label>
                <Input value={selectedProductForMovement?.localizacao || "N/A"} disabled />
              </div>
            </div>
            <div>
              <Label>Tipo de Movimentação</Label>
              <Select value={movementType} onValueChange={(value: 'entrada' | 'saida') => setMovementType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">
                    <div className="flex items-center">
                      <Plus className="w-4 h-4 mr-2 text-green-500" />
                      Entrada (Compra, Devolução, Ajuste +)
                    </div>
                  </SelectItem>
                  <SelectItem value="saida">
                    <div className="flex items-center">
                      <Minus className="w-4 h-4 mr-2 text-red-500" />
                      Saída (Venda, Perda, Ajuste -)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantidade</Label>
              <Input 
                type="number" 
                value={movementQuantity}
                onChange={(e) => setMovementQuantity(Number(e.target.value))}
                min="1"
                max={movementType === 'saida' ? selectedProductForMovement?.quantidade_atual : undefined}
              />
              {movementType === 'saida' && movementQuantity > (selectedProductForMovement?.quantidade_atual || 0) && (
                <p className="text-xs text-destructive mt-1">
                  Quantidade não pode ser maior que o estoque disponível
                </p>
              )}
            </div>
            <div>
              <Label>Motivo</Label>
              <Textarea 
                value={movementReason}
                onChange={(e) => setMovementReason(e.target.value)}
                placeholder="Ex: Compra de fornecedor, Venda para cliente, Ajuste de inventário..."
              />
            </div>
            {selectedProductForMovement && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">Resumo da Movimentação:</p>
                <p className="text-sm text-muted-foreground">
                  Estoque atual: {selectedProductForMovement.quantidade_atual} →{" "}
                  Novo estoque: {
                    movementType === 'entrada' 
                      ? selectedProductForMovement.quantidade_atual + movementQuantity
                      : Math.max(0, selectedProductForMovement.quantidade_atual - movementQuantity)
                  }
                </p>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setMovementModalOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleMovement}
                disabled={!selectedProductForMovement || movementQuantity <= 0}
              >
                Confirmar Movimentação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto "{productToDelete?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (productToDelete) {
                  onDeleteProduct(productToDelete.id);
                  setDeleteDialogOpen(false);
                  setProductToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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