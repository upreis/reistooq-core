import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Package, Folder, FolderOpen } from "lucide-react";
import { useHierarchicalCategories } from "@/features/products/hooks/useHierarchicalCategories";
import { Product } from "@/hooks/useProducts";

interface HierarchicalSidebarProps {
  products: Product[];
  hierarchicalFilters: {
    categoriaPrincipal?: string;
    categoria?: string;
    subcategoria?: string;
  };
  onFiltersChange: (filters: {
    categoriaPrincipal?: string;
    categoria?: string;
    subcategoria?: string;
  }) => void;
}

export function HierarchicalSidebar({
  products,
  hierarchicalFilters,
  onFiltersChange,
}: HierarchicalSidebarProps) {
  const { getCategoriasPrincipais, getCategorias, getSubcategorias, loading } = useHierarchicalCategories();
  const [expandedPrincipal, setExpandedPrincipal] = useState<string | null>(hierarchicalFilters.categoriaPrincipal || null);
  const [expandedCategoria, setExpandedCategoria] = useState<string | null>(hierarchicalFilters.categoria || null);

  const getProductCount = (categoryName: string, level: 'principal' | 'categoria' | 'subcategoria') => {
    return products.filter(product => {
      const categoriaCompleta = product.categoria || '';
      return categoriaCompleta.includes(categoryName);
    }).length;
  };

  const handlePrincipalClick = (principalId: string) => {
    if (expandedPrincipal === principalId) {
      // Se já está expandido, colapsar e limpar filtros
      setExpandedPrincipal(null);
      setExpandedCategoria(null);
      onFiltersChange({});
    } else {
      // Expandir e definir filtro
      setExpandedPrincipal(principalId);
      setExpandedCategoria(null);
      onFiltersChange({ categoriaPrincipal: principalId });
    }
  };

  const handleCategoriaClick = (categoriaId: string) => {
    if (expandedCategoria === categoriaId) {
      // Se já está expandido, colapsar
      setExpandedCategoria(null);
      onFiltersChange({ categoriaPrincipal: expandedPrincipal || undefined });
    } else {
      // Expandir e definir filtro
      setExpandedCategoria(categoriaId);
      onFiltersChange({ 
        categoriaPrincipal: expandedPrincipal || undefined,
        categoria: categoriaId 
      });
    }
  };

  const handleSubcategoriaClick = (subcategoriaId: string) => {
    onFiltersChange({
      categoriaPrincipal: expandedPrincipal || undefined,
      categoria: expandedCategoria || undefined,
      subcategoria: subcategoriaId
    });
  };

  const isSelected = (id: string, type: 'principal' | 'categoria' | 'subcategoria') => {
    switch (type) {
      case 'principal':
        return hierarchicalFilters.categoriaPrincipal === id;
      case 'categoria':
        return hierarchicalFilters.categoria === id;
      case 'subcategoria':
        return hierarchicalFilters.subcategoria === id;
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Categorias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const categoriasPrincipais = getCategoriasPrincipais();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Package className="h-4 w-4" />
          Navegação por Categorias
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 p-4">
        {/* Botão "Todas" */}
        <Button
          variant={!Object.values(hierarchicalFilters).some(Boolean) ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            setExpandedPrincipal(null);
            setExpandedCategoria(null);
            onFiltersChange({});
          }}
          className="w-full justify-between h-8 px-2"
        >
          <div className="flex items-center gap-2">
            <Package className="h-3 w-3" />
            <span className="text-xs">Todas as Categorias</span>
          </div>
          <Badge variant="secondary" className="text-xs h-4 px-1">
            {products.length}
          </Badge>
        </Button>

        {/* Categorias Principais */}
        {categoriasPrincipais.map((principal) => {
          const isExpanded = expandedPrincipal === principal.id;
          const isSelectedPrincipal = isSelected(principal.id, 'principal');
          const productCount = getProductCount(principal.nome, 'principal');

          return (
            <div key={principal.id} className="space-y-1">
              {/* Categoria Principal */}
              <Button
                variant={isSelectedPrincipal ? "default" : "ghost"}
                size="sm"
                onClick={() => handlePrincipalClick(principal.id)}
                className="w-full justify-between h-8 px-2"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  {isExpanded ? (
                    <FolderOpen className="h-3 w-3" />
                  ) : (
                    <Folder className="h-3 w-3" />
                  )}
                  <span className="text-xs truncate">{principal.nome}</span>
                </div>
                <Badge variant="secondary" className="text-xs h-4 px-1">
                  {productCount}
                </Badge>
              </Button>

              {/* Categorias (filhas) */}
              {isExpanded && (
                <div className="ml-4 space-y-1">
                  {getCategorias(principal.id).map((categoria) => {
                    const isCategoriaExpanded = expandedCategoria === categoria.id;
                    const isSelectedCategoria = isSelected(categoria.id, 'categoria');
                    const categoriaProductCount = getProductCount(categoria.nome, 'categoria');

                    return (
                      <div key={categoria.id} className="space-y-1">
                        {/* Categoria */}
                        <Button
                          variant={isSelectedCategoria ? "default" : "ghost"}
                          size="sm"
                          onClick={() => handleCategoriaClick(categoria.id)}
                          className="w-full justify-between h-8 px-2"
                        >
                          <div className="flex items-center gap-2">
                            {getSubcategorias(categoria.id).length > 0 ? (
                              isCategoriaExpanded ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )
                            ) : (
                              <div className="w-3" />
                            )}
                            {isCategoriaExpanded ? (
                              <FolderOpen className="h-3 w-3" />
                            ) : (
                              <Folder className="h-3 w-3" />
                            )}
                            <span className="text-xs truncate">{categoria.nome}</span>
                          </div>
                          <Badge variant="outline" className="text-xs h-4 px-1">
                            {categoriaProductCount}
                          </Badge>
                        </Button>

                        {/* Subcategorias */}
                        {isCategoriaExpanded && (
                          <div className="ml-4 space-y-1">
                            {getSubcategorias(categoria.id).map((subcategoria) => {
                              const isSelectedSubcategoria = isSelected(subcategoria.id, 'subcategoria');
                              const subcategoriaProductCount = getProductCount(subcategoria.nome, 'subcategoria');

                              return (
                                <Button
                                  key={subcategoria.id}
                                  variant={isSelectedSubcategoria ? "default" : "ghost"}
                                  size="sm"
                                  onClick={() => handleSubcategoriaClick(subcategoria.id)}
                                  className="w-full justify-between h-8 px-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-3" />
                                    <Package className="h-3 w-3" />
                                    <span className="text-xs truncate">{subcategoria.nome}</span>
                                  </div>
                                  <Badge variant="outline" className="text-xs h-4 px-1">
                                    {subcategoriaProductCount}
                                  </Badge>
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

        {categoriasPrincipais.length === 0 && (
          <div className="text-center py-6">
            <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhuma categoria encontrada
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}