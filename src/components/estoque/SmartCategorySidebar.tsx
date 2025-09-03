import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  ChevronRight, 
  ChevronDown, 
  Folder,
  FolderOpen,
  Plus,
  Filter,
  X
} from "lucide-react";
import { useHierarchicalCategories } from "@/features/products/hooks/useHierarchicalCategories";
import { Product } from "@/hooks/useProducts";


interface SmartCategorySidebarProps {
  products: Product[];
  hierarchicalFilters: {
    categoriaPrincipal?: string;
    categoria?: string;
    subcategoria?: string;
  };
  onHierarchicalFiltersChange: (filters: {
    categoriaPrincipal?: string;
    categoria?: string;
    subcategoria?: string;
  }) => void;
}

interface CategoryWithCount {
  id: string;
  nome: string;
  cor?: string;
  icone?: string;
  productCount: number;
  children?: CategoryWithCount[];
}

export function SmartCategorySidebar({ 
  products, 
  hierarchicalFilters, 
  onHierarchicalFiltersChange 
}: SmartCategorySidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const { getCategoriasPrincipais, getCategorias, getSubcategorias, loading } = useHierarchicalCategories();

  // Processar categorias com contadores de produtos
  const categoriesWithCounts = useMemo(() => {
    const principaisData = getCategoriasPrincipais();
    
    return principaisData.map(principal => {
      // Contar produtos da categoria principal
      const principalProducts = products.filter(product => {
        const categoria = product.categoria || '';
        return categoria.includes(principal.nome) || categoria === principal.nome;
      });

      // Processar categorias filhas
      const categoriasData = getCategorias(principal.id);
      const children = categoriasData.map(categoria => {
        // Contar produtos desta categoria específica
        const categoriaProducts = products.filter(product => {
          const produtoCategoria = product.categoria || '';
          return produtoCategoria.includes(categoria.nome);
        });

        // Processar subcategorias
        const subcategoriasData = getSubcategorias(categoria.id);
        const subcategoriaChildren = subcategoriasData.map(subcategoria => {
          const subcategoriaProducts = products.filter(product => {
            const produtoCategoria = product.categoria || '';
            return produtoCategoria.includes(subcategoria.nome);
          });

          return {
            id: subcategoria.id,
            nome: subcategoria.nome,
            cor: subcategoria.cor,
            icone: subcategoria.icone,
            productCount: subcategoriaProducts.length
          };
        }).filter(sub => sub.productCount > 0);

        return {
          id: categoria.id,
          nome: categoria.nome,
          cor: categoria.cor,
          icone: categoria.icone,
          productCount: categoriaProducts.length,
          children: subcategoriaChildren.length > 0 ? subcategoriaChildren : undefined
        };
      }).filter(cat => cat.productCount > 0);

      return {
        id: principal.id,
        nome: principal.nome,
        cor: principal.cor,
        icone: principal.icone,
        productCount: principalProducts.length,
        children: children.length > 0 ? children : undefined
      };
    }).filter(principal => principal.productCount > 0);
  }, [products, getCategoriasPrincipais, getCategorias, getSubcategorias]);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const selectPrincipalCategory = (categoryId: string) => {
    if (hierarchicalFilters.categoriaPrincipal === categoryId) {
      // Se já está selecionada, limpar
      onHierarchicalFiltersChange({});
    } else {
      // Selecionar nova categoria principal
      onHierarchicalFiltersChange({
        categoriaPrincipal: categoryId
      });
      
      // Auto-expandir se não estiver expandida
      if (!expandedCategories.has(categoryId)) {
        toggleCategory(categoryId);
      }
    }
  };

  const selectCategory = (principalId: string, categoryId: string) => {
    if (hierarchicalFilters.categoriaPrincipal === principalId && 
        hierarchicalFilters.categoria === categoryId &&
        !hierarchicalFilters.subcategoria) {
      // Se já está selecionada, voltar para categoria principal
      onHierarchicalFiltersChange({
        categoriaPrincipal: principalId
      });
    } else {
      // Selecionar nova categoria
      onHierarchicalFiltersChange({
        categoriaPrincipal: principalId,
        categoria: categoryId
      });
    }
  };

  const selectSubcategory = (principalId: string, categoryId: string, subcategoryId: string) => {
    if (hierarchicalFilters.categoriaPrincipal === principalId && 
        hierarchicalFilters.categoria === categoryId &&
        hierarchicalFilters.subcategoria === subcategoryId) {
      // Se já está selecionada, voltar para categoria
      onHierarchicalFiltersChange({
        categoriaPrincipal: principalId,
        categoria: categoryId
      });
    } else {
      // Selecionar nova subcategoria
      onHierarchicalFiltersChange({
        categoriaPrincipal: principalId,
        categoria: categoryId,
        subcategoria: subcategoryId
      });
    }
  };

  const clearFilters = () => {
    onHierarchicalFiltersChange({});
  };

  const hasActiveFilters = Object.values(hierarchicalFilters).some(Boolean);

  return (
    <>
      <Card className="border-border/50 shadow-sm backdrop-blur-sm bg-card/80">
        <CardHeader className="pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Folder className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">Categorias</CardTitle>
                <p className="text-xs text-muted-foreground">Navegue pelas categorias</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                // TODO: Implementar criação de categoria
                console.log('Criar categoria');
              }}
              className="h-8 w-8 p-0 hover:bg-primary/10 text-primary"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 space-y-1 max-h-[60vh] overflow-y-auto">
          {/* Filtro ativo */}
          {hasActiveFilters && (
            <div className="mb-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-3 w-3 text-primary" />
                  <span className="text-xs font-medium text-primary">Filtro ativo</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearFilters}
                  className="h-6 w-6 p-0 text-primary hover:bg-primary/20"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Botão "Todas" */}
          <Button
            variant={!hasActiveFilters ? "default" : "ghost"}
            className="w-full justify-between h-auto py-3 mb-2 transition-all hover:shadow-sm"
            onClick={clearFilters}
          >
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="font-medium">Todas as categorias</span>
            </div>
            <Badge variant={!hasActiveFilters ? "secondary" : "outline"} className="text-xs">
              {products.length}
            </Badge>
          </Button>

          {/* Categorias hierárquicas */}
          <div className="space-y-1">
            {categoriesWithCounts.map((principal) => {
              const isExpanded = expandedCategories.has(principal.id);
              const isSelected = hierarchicalFilters.categoriaPrincipal === principal.id && !hierarchicalFilters.categoria;
              
              return (
                <div key={principal.id} className="space-y-1">
                  {/* Categoria Principal */}
                  <div className="group relative">
                    <Button
                      variant={isSelected ? "default" : "ghost"}
                      size="sm"
                      onClick={() => selectPrincipalCategory(principal.id)}
                      className="w-full justify-start h-10 px-3 transition-all hover:bg-muted/80 group-hover:shadow-sm"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCategory(principal.id);
                          }}
                          className="h-5 w-5 p-0 hover:bg-primary/20 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3 text-primary" />
                          ) : (
                            <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                          )}
                        </Button>
                        
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {isExpanded ? (
                            <FolderOpen className="h-4 w-4 text-primary flex-shrink-0" />
                          ) : (
                            <Folder className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                          )}
                          <span className="text-sm font-medium truncate">{principal.nome}</span>
                        </div>
                        
                        <Badge 
                          variant={isSelected ? "secondary" : "outline"} 
                          className="ml-auto text-xs bg-muted hover:bg-primary/10 border-border/50"
                        >
                          {principal.productCount}
                        </Badge>
                      </div>
                    </Button>
                  </div>

                  {/* Categorias Filhas */}
                  {isExpanded && principal.children && principal.children.length > 0 && (
                    <div className="ml-6 space-y-1 border-l border-border/30 pl-3">
                      {principal.children.map((categoria) => {
                        const isSubExpanded = expandedCategories.has(`${principal.id}-${categoria.id}`);
                        const isCategorySelected = hierarchicalFilters.categoriaPrincipal === principal.id && 
                                                 hierarchicalFilters.categoria === categoria.id && 
                                                 !hierarchicalFilters.subcategoria;
                        
                        return (
                          <div key={categoria.id} className="space-y-1">
                            {/* Categoria */}
                            <div className="group relative">
                              <Button
                                variant={isCategorySelected ? "default" : "ghost"}
                                size="sm"
                                onClick={() => selectCategory(principal.id, categoria.id)}
                                className="w-full justify-start h-8 px-2 transition-all hover:bg-muted/60"
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  {categoria.children && categoria.children.length > 0 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleCategory(`${principal.id}-${categoria.id}`);
                                      }}
                                      className="h-4 w-4 p-0 hover:bg-primary/20"
                                    >
                                      {isSubExpanded ? (
                                        <ChevronDown className="h-3 w-3 text-primary" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                      )}
                                    </Button>
                                  )}
                                  
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <Package className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                                    <span className="text-xs font-medium truncate">{categoria.nome}</span>
                                  </div>
                                  
                                  <Badge variant="outline" className="ml-auto text-xs border-border/50">
                                    {categoria.productCount}
                                  </Badge>
                                </div>
                              </Button>
                            </div>

                            {/* Subcategorias */}
                            {isSubExpanded && categoria.children && categoria.children.length > 0 && (
                              <div className="ml-4 space-y-1 border-l border-border/20 pl-3">
                                {categoria.children.map((subcategoria) => {
                                  const isSubcategorySelected = hierarchicalFilters.categoriaPrincipal === principal.id && 
                                                              hierarchicalFilters.categoria === categoria.id && 
                                                              hierarchicalFilters.subcategoria === subcategoria.id;
                                  
                                  return (
                                    <Button
                                      key={subcategoria.id}
                                      variant={isSubcategorySelected ? "default" : "ghost"}
                                      size="sm"
                                      onClick={() => selectSubcategory(principal.id, categoria.id, subcategoria.id)}
                                      className="w-full justify-start h-7 px-2 transition-all hover:bg-muted/40"
                                    >
                                      <div className="flex items-center gap-2 flex-1">
                                        <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
                                        <span className="text-xs truncate">{subcategoria.nome}</span>
                                        <Badge variant="outline" className="ml-auto text-xs border-border/50">
                                          {subcategoria.productCount}
                                        </Badge>
                                      </div>
                                    </Button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Estado vazio */}
          {categoriesWithCounts.length === 0 && !loading && (
            <div className="text-center py-8">
              <div className="p-4 rounded-lg bg-muted/30 border border-dashed border-border">
                <Package className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground mb-1">Nenhuma categoria encontrada</p>
                <p className="text-xs text-muted-foreground/70">Importe ou crie suas primeiras categorias</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    // TODO: Implementar criação de categoria
                    console.log('Criar categoria');
                  }}
                  className="mt-3"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Criar categoria
                </Button>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-muted/50 rounded"></div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </>
  );
}