import { useState, useEffect } from "react";

import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, MoreVertical, Plus, Package, AlertTriangle, FileSpreadsheet } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProducts, Product } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const ProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const { getProducts, getCategories, deleteProduct } = useProducts();
  const { toast } = useToast();
  const navigate = useNavigate();

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
        limit: 50
      });
      setProducts(data);
    } catch (error) {
      toast({
        title: "Erro ao carregar produtos",
        description: "Não foi possível carregar a lista de produtos.",
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

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      toast({
        title: "Produto removido",
        description: "O produto foi removido com sucesso.",
      });
      loadProducts();
    } catch (error) {
      toast({
        title: "Erro ao remover produto",
        description: "Não foi possível remover o produto.",
        variant: "destructive",
      });
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.quantidade_atual === 0) {
      return {
        label: "Sem estoque",
        variant: "destructive" as const,
        color: "bg-red-500"
      };
    } else if (product.quantidade_atual <= product.estoque_minimo) {
      return {
        label: "Estoque baixo",
        variant: "secondary" as const,
        color: "bg-yellow-500"
      };
    } else {
      return {
        label: "Em estoque",
        variant: "default" as const,
        color: "bg-green-500"
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
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando produtos...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>🏠</span>
          <span>/</span>
          <span className="text-primary">Lista de Produtos</span>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Lista de Produtos
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => navigate("/apps/ecommerce/addproduct")}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Produto
              </Button>
              <Button variant="outline" onClick={() => navigate("/apps/ecommerce/import")}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Importar
              </Button>
            </div>
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
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedCategory 
                    ? "Tente ajustar os filtros de busca"
                    : "Comece adicionando seu primeiro produto"
                  }
                </p>
                <Button onClick={() => navigate("/apps/ecommerce/addproduct")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Produto
                </Button>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 py-3 px-4 bg-muted/50 rounded-lg mb-4 text-xs font-medium overflow-x-auto">
                  <div>SKU</div>
                  <div>Produto</div>
                  <div>Material</div>
                  <div>Cor</div>
                  <div>Preço</div>
                  <div>Peso (g)</div>
                  <div>Dimensões</div>
                  <div>CBM</div>
                  <div>NCM</div>
                  <div>Código Barras</div>
                  <div>Status</div>
                  <div>Ações</div>
                </div>

                {/* Product List */}
                <div className="space-y-3 overflow-x-auto">
                  {products.map((product) => {
                    const stockStatus = getStockStatus(product);
                    return (
                      <div
                        key={product.id}
                        className="grid grid-cols-12 gap-2 py-3 px-4 border rounded-lg hover:bg-muted/30 transition-colors text-xs"
                      >
                        {/* SKU */}
                        <div className="flex items-center">
                          <span className="font-mono font-medium">{product.sku_interno}</span>
                        </div>

                        {/* Produto */}
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-muted rounded flex items-center justify-center overflow-hidden">
                            {product.url_imagem ? (
                              <img 
                                src={product.url_imagem} 
                                alt={product.nome} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.parentElement!.innerHTML = '<Package class="w-4 h-4 text-muted-foreground" />';
                                }}
                              />
                            ) : (
                              <Package className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{product.nome}</p>
                            <p className="text-muted-foreground truncate text-xs">
                              {product.descricao?.substring(0, 30) || "Sem descrição"}
                            </p>
                          </div>
                        </div>

                        {/* Material */}
                        <div className="flex items-center">
                          <span className="truncate">{(product as any).material || "N/A"}</span>
                        </div>

                        {/* Cor */}
                        <div className="flex items-center">
                          <span className="truncate">{(product as any).cor || "N/A"}</span>
                        </div>

                        {/* Preço */}
                        <div className="flex items-center">
                          <span className="font-medium">
                            {formatPrice(product.preco_venda)}
                          </span>
                        </div>

                        {/* Peso */}
                        <div className="flex items-center">
                          <span>{(product as any).peso_unitario_g || "N/A"}g</span>
                        </div>

                        {/* Dimensões */}
                        <div className="flex items-center">
                          <span className="text-xs">
                            {(product as any).comprimento && (product as any).largura && (product as any).altura 
                              ? `${(product as any).comprimento}×${(product as any).largura}×${(product as any).altura}cm`
                              : "N/A"
                            }
                          </span>
                        </div>

                        {/* CBM */}
                        <div className="flex items-center">
                          <span>{(product as any).cbm_cubagem || "N/A"}</span>
                        </div>

                        {/* NCM */}
                        <div className="flex items-center">
                          <span className="font-mono">{(product as any).ncm || "N/A"}</span>
                        </div>

                        {/* Código de Barras */}
                        <div className="flex items-center">
                          <span className="font-mono text-xs">{product.codigo_barras || "N/A"}</span>
                        </div>

                        {/* Status/Estoque */}
                        <div className="flex items-center space-x-1">
                          <Badge
                            variant={stockStatus.variant}
                            className="text-xs px-2 py-0"
                          >
                            <div className={`w-1.5 h-1.5 rounded-full mr-1 ${stockStatus.color}`} />
                            {product.quantidade_atual}
                          </Badge>
                          {product.quantidade_atual <= product.estoque_minimo && (
                            <AlertTriangle className="h-3 w-3 text-yellow-500" />
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <MoreVertical className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => navigate(`/apps/ecommerce/detail/${product.id}`)}
                              >
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => navigate(`/apps/ecommerce/editproduct?id=${product.id}`)}
                              >
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDelete(product.id)}
                              >
                                Remover
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
    </>
  );
};

export default ProductList;