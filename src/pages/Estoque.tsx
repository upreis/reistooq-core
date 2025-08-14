import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Plus,
  Minus,
  Edit,
  BarChart3
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useProducts, Product } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";

interface StockMovement {
  id: string;
  produto_id: string;
  tipo_movimentacao: 'entrada' | 'saida';
  quantidade_anterior: number;
  quantidade_nova: number;
  quantidade_movimentada: number;
  motivo: string;
  created_at: string;
}

const Estoque = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [movementType, setMovementType] = useState<'entrada' | 'saida'>('entrada');
  const [movementQuantity, setMovementQuantity] = useState<number>(0);
  const [movementReason, setMovementReason] = useState("");
  
  const { getProducts, getCategories, updateProduct } = useProducts();
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts({
        search: searchTerm || undefined,
        categoria: selectedCategory === "all" ? undefined : selectedCategory,
        limit: 100
      });
      setProducts(data);
    } catch (error) {
      toast({
        title: "Erro ao carregar produtos",
        description: "Não foi possível carregar o estoque.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const handleSearch = () => {
    loadProducts();
  };

  const handleStockMovement = async () => {
    if (!selectedProduct || movementQuantity <= 0) {
      toast({
        title: "Erro",
        description: "Selecione um produto e informe uma quantidade válida.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newQuantity = movementType === 'entrada' 
        ? selectedProduct.quantidade_atual + movementQuantity
        : selectedProduct.quantidade_atual - movementQuantity;

      if (newQuantity < 0) {
        toast({
          title: "Erro",
          description: "Quantidade em estoque não pode ser negativa.",
          variant: "destructive",
        });
        return;
      }

      await updateProduct(selectedProduct.id, {
        quantidade_atual: newQuantity
      });

      toast({
        title: "Movimentação realizada",
        description: `${movementType === 'entrada' ? 'Entrada' : 'Saída'} de ${movementQuantity} unidades realizada com sucesso.`,
      });

      setSelectedProduct(null);
      setMovementQuantity(0);
      setMovementReason("");
      loadProducts();
    } catch (error) {
      toast({
        title: "Erro na movimentação",
        description: "Não foi possível realizar a movimentação de estoque.",
        variant: "destructive",
      });
    }
  };

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
    if (!price) return "N/A";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando estoque...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>🏠</span>
          <span>/</span>
          <span className="text-primary">Gestão de Estoque</span>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total de Produtos</p>
                  <p className="text-2xl font-bold">{products.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Estoque Baixo</p>
                  <p className="text-2xl font-bold">
                    {products.filter(p => p.quantidade_atual <= p.estoque_minimo && p.quantidade_atual > 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Sem Estoque</p>
                  <p className="text-2xl font-bold">
                    {products.filter(p => p.quantidade_atual === 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold">
                    {formatPrice(products.reduce((total, p) => total + (p.quantidade_atual * (p.preco_custo || 0)), 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Controle de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search and Filter */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Buscar produtos..." 
                  className="pl-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleSearch}>
                <Filter className="w-4 h-4 mr-2" />
                Filtrar
              </Button>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
                <p className="text-muted-foreground">
                  {searchTerm || selectedCategory 
                    ? "Tente ajustar os filtros de busca"
                    : "Cadastre produtos para gerenciar o estoque"
                  }
                </p>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="grid grid-cols-8 gap-4 py-3 px-4 bg-muted/50 rounded-lg mb-4 text-sm font-medium">
                  <div>Produto</div>
                  <div>SKU</div>
                  <div>Categoria</div>
                  <div>Estoque Atual</div>
                  <div>Mínimo</div>
                  <div>Máximo</div>
                  <div>Status</div>
                  <div>Ações</div>
                </div>

                {/* Product List */}
                <div className="space-y-3">
                  {products.map((product) => {
                    const stockStatus = getStockStatus(product);
                    const StockIcon = stockStatus.icon;
                    
                    return (
                      <div
                        key={product.id}
                        className="grid grid-cols-8 gap-4 py-4 px-4 border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        {/* Product */}
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                            {product.url_imagem ? (
                              <img 
                                src={product.url_imagem} 
                                alt={product.nome} 
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{product.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatPrice(product.preco_custo)}
                            </p>
                          </div>
                        </div>

                        {/* SKU */}
                        <div className="flex items-center">
                          <span className="text-sm font-mono">{product.sku_interno}</span>
                        </div>

                        {/* Category */}
                        <div className="flex items-center">
                          <span className="text-sm">{product.categoria || "N/A"}</span>
                        </div>

                        {/* Current Stock */}
                        <div className="flex items-center">
                          <span className="text-sm font-bold">{product.quantidade_atual}</span>
                        </div>

                        {/* Minimum */}
                        <div className="flex items-center">
                          <span className="text-sm">{product.estoque_minimo}</span>
                        </div>

                        {/* Maximum */}
                        <div className="flex items-center">
                          <span className="text-sm">{product.estoque_maximo}</span>
                        </div>

                        {/* Status */}
                        <div className="flex items-center">
                          <Badge variant={stockStatus.variant} className="text-xs">
                            <StockIcon className="w-3 h-3 mr-1" />
                            {stockStatus.label}
                          </Badge>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedProduct(product)}
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Movimentar
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Movimentação de Estoque</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Produto</Label>
                                  <Input value={selectedProduct?.nome || ""} disabled />
                                </div>
                                <div>
                                  <Label>Estoque Atual</Label>
                                  <Input value={selectedProduct?.quantidade_atual || 0} disabled />
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
                                          Entrada
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="saida">
                                        <div className="flex items-center">
                                          <Minus className="w-4 h-4 mr-2 text-red-500" />
                                          Saída
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
                                  />
                                </div>
                                <div>
                                  <Label>Motivo (Opcional)</Label>
                                  <Input 
                                    value={movementReason}
                                    onChange={(e) => setMovementReason(e.target.value)}
                                    placeholder="Ex: Compra, Venda, Ajuste..."
                                  />
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline" onClick={() => setSelectedProduct(null)}>
                                    Cancelar
                                  </Button>
                                  <Button onClick={handleStockMovement}>
                                    Confirmar Movimentação
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Estoque;