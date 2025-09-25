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
                {/* Scrollable Table Container */}
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full min-w-[2400px] text-xs">
                    {/* Table Header */}
                    <thead className="bg-muted/50 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">SKU</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[300px] max-w-[400px]">Produto</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[120px]">Imagem</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[100px]">Material</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">Cor</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[120px]">Descrição</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[100px]">Package</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">Preço</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[60px]">Unit</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">PCS/CTN</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">Quantidade</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">Peso (g)</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">Peso Cx</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">Comp.</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">Larg.</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">Alt.</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">CBM</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[100px]">NCM</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[100px]">Código Barras</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">Status</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">Ações</th>
                      </tr>
                    </thead>

                    {/* Table Body */}
                    <tbody>
                      {products.map((product, index) => {
                        const stockStatus = getStockStatus(product);
                        return (
                          <tr
                            key={product.id}
                            className={`border-b hover:bg-muted/30 transition-colors ${
                              index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                            }`}
                          >
                            {/* SKU */}
                            <td className="px-3 py-3">
                              <span className="font-mono font-medium">{product.sku_interno}</span>
                            </td>

                            {/* Produto */}
                            <td className="px-3 py-3 min-w-[300px] max-w-[400px]">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-muted rounded flex items-center justify-center overflow-hidden shrink-0">
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
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium truncate text-sm" title={product.nome}>
                                    {product.nome.length > 150 ? `${product.nome.substring(0, 150)}...` : product.nome}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Imagem */}
                            <td className="px-3 py-3">
                              {product.url_imagem ? 
                                <Badge variant="secondary" className="text-xs">Sim</Badge> : 
                                <Badge variant="outline" className="text-xs">Não</Badge>
                              }
                            </td>

                            {/* Material */}
                            <td className="px-3 py-3">
                              <span className="truncate">{(product as any).material || "N/A"}</span>
                            </td>

                            {/* Cor */}
                            <td className="px-3 py-3">
                              <span className="truncate">{(product as any).cor || "N/A"}</span>
                            </td>

                            {/* Descrição */}
                            <td className="px-3 py-3">
                              <span className="truncate">
                                {product.descricao?.substring(0, 20) || "Sem descrição"}
                              </span>
                            </td>

                            {/* Package */}
                            <td className="px-3 py-3">
                              <span className="truncate">{(product as any).package_info || "N/A"}</span>
                            </td>

                            {/* Preço */}
                            <td className="px-3 py-3">
                              <span className="font-medium">
                                {formatPrice(product.preco_venda)}
                              </span>
                            </td>

                            {/* Unit */}
                            <td className="px-3 py-3">
                              <span>{(product as any).unidade || "UN"}</span>
                            </td>

                            {/* PCS/CTN */}
                            <td className="px-3 py-3">
                              <span>{(product as any).pcs_ctn || "N/A"}</span>
                            </td>

                            {/* Quantidade */}
                            <td className="px-3 py-3">
                              <span className="font-medium">{product.quantidade_atual}</span>
                            </td>

                            {/* Peso Unitário */}
                            <td className="px-3 py-3">
                              <span>{(product as any).peso_unitario_g ? `${(product as any).peso_unitario_g}g` : "N/A"}</span>
                            </td>

                            {/* Peso Cx Master */}
                            <td className="px-3 py-3">
                              <span>{(product as any).peso_cx_master_kg ? `${(product as any).peso_cx_master_kg}kg` : "N/A"}</span>
                            </td>

                            {/* Comprimento */}
                            <td className="px-3 py-3">
                              <span>{(product as any).comprimento ? `${(product as any).comprimento}cm` : "N/A"}</span>
                            </td>

                            {/* Largura */}
                            <td className="px-3 py-3">
                              <span>{(product as any).largura ? `${(product as any).largura}cm` : "N/A"}</span>
                            </td>

                            {/* Altura */}
                            <td className="px-3 py-3">
                              <span>{(product as any).altura ? `${(product as any).altura}cm` : "N/A"}</span>
                            </td>

                            {/* CBM */}
                            <td className="px-3 py-3">
                              <span>{(product as any).cbm_cubagem || "N/A"}</span>
                            </td>

                            {/* NCM */}
                            <td className="px-3 py-3">
                              <span className="font-mono">{(product as any).ncm || "N/A"}</span>
                            </td>

                            {/* Código de Barras */}
                            <td className="px-3 py-3">
                              <span className="font-mono">{product.codigo_barras || "N/A"}</span>
                            </td>

                            {/* Status/Estoque */}
                            <td className="px-3 py-3">
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
                            </td>

                            {/* Actions */}
                            <td className="px-3 py-3">
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
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Scroll hint */}
                <div className="text-xs text-muted-foreground mt-2 text-center">
                  <span>💡 Role horizontalmente para ver todas as colunas</span>
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