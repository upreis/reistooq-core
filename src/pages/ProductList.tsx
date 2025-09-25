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
                  <table className="w-full min-w-[4000px] text-xs">
                    {/* Table Header */}
                    <thead className="bg-muted/50 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">SKU</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">IMAGEM</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">IMAGEM FORNECEDOR</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">MATERIAL</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[60px]">COR</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[200px]">Nome do Produto</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[120px]">DESCRIÇÃO</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">PACKAGE</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">PREÇO</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[60px]">UNIT</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[70px]">PCS/CTN</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">Quantidade</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[90px]">PESO UNITARIO(g)</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[110px]">Peso cx Master (KG)</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[130px]">Peso Sem cx Master (KG)</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[140px]">Peso total cx Master (KG)</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[160px]">Peso total sem cx Master (KG)</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">Comprimento</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[70px]">Largura</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[60px]">Altura</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[90px]">CBM Cubagem</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">CBM Total</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[100px]">Quantidade Total</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[90px]">Valor Total</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">OBS</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[120px]">Codigo de Barras</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">Ações</th>
                      </tr>
                    </thead>

                    {/* Table Body */}
                    <tbody>
                      {products.map((product, index) => {
                        // Cálculos automáticos
                        const quantidade = product.quantidade_atual || 0;
                        const pcsCtn = (product as any).pcs_ctn || 0;
                        const preco = product.preco_venda || 0;
                        const pesoCxMaster = (product as any).peso_cx_master_kg || 0;
                        const comprimento = (product as any).comprimento || 0;
                        const largura = (product as any).largura || 0;
                        const altura = (product as any).altura || 0;
                        
                        // Cálculos das colunas derivadas
                        const pesoSemCxMaster = pesoCxMaster > 0 ? pesoCxMaster - 1 : 0;
                        const pesoTotalCxMaster = pesoCxMaster * quantidade;
                        const pesoTotalSemCxMaster = pesoSemCxMaster * quantidade;
                        const cbmCubagem = (comprimento * largura * altura) / 1000000;
                        const cbmTotal = cbmCubagem * quantidade;
                        const quantidadeTotal = pcsCtn * quantidade;
                        const valorTotal = preco * quantidadeTotal;

                        return (
                          <tr
                            key={product.id}
                            className={`border-b hover:bg-muted/30 transition-colors ${
                              index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                            }`}
                          >
                            {/* SKU */}
                            <td className="px-3 py-3">
                              <span className="font-mono font-medium text-xs">{product.sku_interno}</span>
                            </td>

                            {/* IMAGEM */}
                            <td className="px-3 py-3">
                              <div className="w-8 h-8 bg-muted rounded flex items-center justify-center overflow-hidden">
                                {product.url_imagem ? (
                                  <img 
                                    src={product.url_imagem} 
                                    alt={product.nome} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      if (parent) {
                                        parent.innerHTML = '<div class="w-4 h-4 bg-gray-300 rounded"></div>';
                                      }
                                    }}
                                  />
                                ) : (
                                  <Package className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                            </td>

                            {/* IMAGEM DO FORNECEDOR */}
                            <td className="px-3 py-3">
                              <div className="w-8 h-8 bg-muted rounded flex items-center justify-center overflow-hidden">
                                {(product as any).url_imagem_fornecedor ? (
                                  <img 
                                    src={(product as any).url_imagem_fornecedor} 
                                    alt="Fornecedor" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      if (parent) {
                                        parent.innerHTML = '<div class="w-4 h-4 bg-gray-300 rounded"></div>';
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="w-4 h-4 bg-gray-300 rounded"></div>
                                )}
                              </div>
                            </td>

                            {/* MATERIAL */}
                            <td className="px-3 py-3">
                              <span className="text-xs">{(product as any).material || "-"}</span>
                            </td>

                            {/* COR */}
                            <td className="px-3 py-3">
                              <span className="text-xs">{(product as any).cor || "-"}</span>
                            </td>

                            {/* Nome do Produto */}
                            <td className="px-3 py-3">
                              <span className="text-xs font-medium" title={product.nome}>
                                {product.nome.length > 30 ? `${product.nome.substring(0, 30)}...` : product.nome}
                              </span>
                            </td>

                            {/* DESCRIÇÃO */}
                            <td className="px-3 py-3">
                              <span className="text-xs" title={product.descricao || ""}>
                                {product.descricao ? 
                                  (product.descricao.length > 20 ? `${product.descricao.substring(0, 20)}...` : product.descricao) 
                                  : "-"
                                }
                              </span>
                            </td>

                            {/* PACKAGE */}
                            <td className="px-3 py-3">
                              <span className="text-xs">{(product as any).package_info || "-"}</span>
                            </td>

                            {/* PREÇO */}
                            <td className="px-3 py-3">
                              <span className="text-xs font-medium">
                                {formatPrice(product.preco_venda)}
                              </span>
                            </td>

                            {/* UNIT */}
                            <td className="px-3 py-3">
                              <span className="text-xs">{(product as any).unidade || "UN"}</span>
                            </td>

                            {/* PCS/CTN */}
                            <td className="px-3 py-3">
                              <span className="text-xs">{pcsCtn || "-"}</span>
                            </td>

                            {/* Quantidade */}
                            <td className="px-3 py-3">
                              <span className="text-xs font-medium">{quantidade}</span>
                            </td>

                            {/* PESO UNITARIO(g) */}
                            <td className="px-3 py-3">
                              <span className="text-xs">{(product as any).peso_unitario_g ? `${(product as any).peso_unitario_g}g` : "-"}</span>
                            </td>

                            {/* Peso cx Master (KG) */}
                            <td className="px-3 py-3">
                              <span className="text-xs">{pesoCxMaster ? `${pesoCxMaster.toFixed(2)}kg` : "-"}</span>
                            </td>

                            {/* Peso Sem cx Master (KG) - CALCULADO */}
                            <td className="px-3 py-3">
                              <span className="text-xs font-medium text-blue-600">
                                {pesoCxMaster > 0 ? `${pesoSemCxMaster.toFixed(2)}kg` : "-"}
                              </span>
                            </td>

                            {/* Peso total cx Master (KG) - CALCULADO */}
                            <td className="px-3 py-3">
                              <span className="text-xs font-medium text-green-600">
                                {pesoCxMaster > 0 ? `${pesoTotalCxMaster.toFixed(2)}kg` : "-"}
                              </span>
                            </td>

                            {/* Peso total sem cx Master (KG) - CALCULADO */}
                            <td className="px-3 py-3">
                              <span className="text-xs font-medium text-green-600">
                                {pesoCxMaster > 0 ? `${pesoTotalSemCxMaster.toFixed(2)}kg` : "-"}
                              </span>
                            </td>

                            {/* Comprimento */}
                            <td className="px-3 py-3">
                              <span className="text-xs">{comprimento ? `${comprimento}cm` : "-"}</span>
                            </td>

                            {/* Largura */}
                            <td className="px-3 py-3">
                              <span className="text-xs">{largura ? `${largura}cm` : "-"}</span>
                            </td>

                            {/* Altura */}
                            <td className="px-3 py-3">
                              <span className="text-xs">{altura ? `${altura}cm` : "-"}</span>
                            </td>

                            {/* CBM Cubagem - CALCULADO */}
                            <td className="px-3 py-3">
                              <span className="text-xs font-medium text-purple-600">
                                {(comprimento && largura && altura) ? cbmCubagem.toFixed(6) : "-"}
                              </span>
                            </td>

                            {/* CBM Total - CALCULADO */}
                            <td className="px-3 py-3">
                              <span className="text-xs font-medium text-purple-600">
                                {(comprimento && largura && altura) ? cbmTotal.toFixed(6) : "-"}
                              </span>
                            </td>

                            {/* Quantidade Total - CALCULADO */}
                            <td className="px-3 py-3">
                              <span className="text-xs font-medium text-orange-600">
                                {pcsCtn > 0 ? quantidadeTotal : "-"}
                              </span>
                            </td>

                            {/* Valor Total - CALCULADO */}
                            <td className="px-3 py-3">
                              <span className="text-xs font-medium text-red-600">
                                {(pcsCtn > 0 && preco > 0) ? formatPrice(valorTotal) : "-"}
                              </span>
                            </td>

                            {/* OBS */}
                            <td className="px-3 py-3">
                              <span className="text-xs" title={(product as any).observacoes || ""}>
                                {(product as any).observacoes ? 
                                  ((product as any).observacoes.length > 15 ? `${(product as any).observacoes.substring(0, 15)}...` : (product as any).observacoes)
                                  : "-"
                                }
                              </span>
                            </td>

                            {/* Codigo de Barras */}
                            <td className="px-3 py-3">
                              <span className="text-xs font-mono">{product.codigo_barras || "-"}</span>
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
                
                {/* Legenda das cores dos cálculos */}
                <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/30 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-600 rounded"></div>
                      <span>Peso Sem cx Master (calculado)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-600 rounded"></div>
                      <span>Pesos Totais (calculados)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-600 rounded"></div>
                      <span>CBM (calculado)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-600 rounded"></div>
                      <span>Quantidade Total (calculado)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-600 rounded"></div>
                      <span>Valor Total (calculado)</span>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <span>💡 Role horizontalmente para ver todas as colunas</span>
                  </div>
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