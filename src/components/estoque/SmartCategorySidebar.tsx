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
  Plus
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useHierarchicalCategories } from "@/features/products/hooks/useHierarchicalCategories";
import { CategoryCreationModal } from "./CategoryCreationModal";
import { CategoryImportModal } from "./CategoryImportModal";
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
    const principalCategories = getCategoriasPrincipais();
    
    return principalCategories.map(principal => {
      // Contar produtos na categoria principal
      const principalProducts = products.filter(product => {
        const categoria = product.categoria || '';
        return categoria.toLowerCase().includes(principal.nome.toLowerCase());
      });

      // Buscar categorias filhas (nível 2)
      const subCategories = getCategorias(principal.id).map(categoria => {
        const categoriaProducts = products.filter(product => {
          const prodCategoria = product.categoria || '';
          return prodCategoria.toLowerCase().includes(categoria.nome.toLowerCase());
        });

        // Buscar subcategorias (nível 3)
        const subSubCategories = getSubcategorias(categoria.id).map(subcategoria => {
          const subcategoriaProducts = products.filter(product => {
            const prodCategoria = product.categoria || '';
            return prodCategoria.toLowerCase().includes(subcategoria.nome.toLowerCase());
          });

          return {
            id: subcategoria.id,
            nome: subcategoria.nome,
            cor: subcategoria.cor,
            icone: subcategoria.icone,
            productCount: subcategoriaProducts.length,
          };
        }).filter(sub => sub.productCount > 0); // Só mostrar se tiver produtos

        return {
          id: categoria.id,
          nome: categoria.nome,
          cor: categoria.cor,
          icone: categoria.icone,
          productCount: categoriaProducts.length,
          children: subSubCategories,
        };
      }).filter(cat => cat.productCount > 0 || cat.children!.length > 0); // Mostrar se tiver produtos ou filhos

      return {
        id: principal.id,
        nome: principal.nome,
        cor: principal.cor,
        icone: principal.icone,
        productCount: principalProducts.length,
        children: subCategories,
      };
    }).filter(cat => cat.productCount > 0 || cat.children!.length > 0); // Só mostrar se tiver produtos ou filhos
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
    onHierarchicalFiltersChange({
      categoriaPrincipal: categoryId,
      categoria: undefined,
      subcategoria: undefined,
    });
    // Always expand the selected category
    const newExpanded = new Set(expandedCategories);
    newExpanded.add(categoryId);
    setExpandedCategories(newExpanded);
  };

  const getSelectedValue = () => {
    if (hierarchicalFilters.subcategoria) {
      return `subcategoria-${hierarchicalFilters.subcategoria}`;
    }
    if (hierarchicalFilters.categoria) {
      return `categoria-${hierarchicalFilters.categoria}`;
    }
    if (hierarchicalFilters.categoriaPrincipal) {
      return `principal-${hierarchicalFilters.categoriaPrincipal}`;
    }
    return "todas";
  };

  const handleRadioChange = (value: string) => {
    if (value === "todas") {
      clearFilters();
      return;
    }

    const [type, id] = value.split('-');
    
    if (type === "principal") {
      selectPrincipalCategory(id);
    } else if (type === "categoria") {
      // Find the principal category for this categoria
      const principal = categoriesWithCounts.find(p => 
        p.children?.some(c => c.id === id)
      );
      if (principal) {
        selectCategory(principal.id, id);
      }
    } else if (type === "subcategoria") {
      // Find the principal and categoria for this subcategoria
      let principalId = "";
      let categoriaId = "";
      
      categoriesWithCounts.forEach(principal => {
        principal.children?.forEach(categoria => {
          if (categoria.children?.some(sub => sub.id === id)) {
            principalId = principal.id;
            categoriaId = categoria.id;
          }
        });
      });
      
      if (principalId && categoriaId) {
        selectSubcategory(principalId, categoriaId, id);
      }
    }
  };

  const selectCategory = (principalId: string, categoryId: string) => {
    onHierarchicalFiltersChange({
      categoriaPrincipal: principalId,
      categoria: categoryId,
      subcategoria: undefined,
    });
  };

  const selectSubcategory = (principalId: string, categoryId: string, subcategoryId: string) => {
    onHierarchicalFiltersChange({
      categoriaPrincipal: principalId,
      categoria: categoryId,
      subcategoria: subcategoryId,
    });
  };

  const clearFilters = () => {
    onHierarchicalFiltersChange({});
    setExpandedCategories(new Set());
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Categorias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com botões de ação */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
            <div className="flex gap-1">
              <CategoryCreationModal
                trigger={
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                }
              />
              <CategoryImportModal
                trigger={
                  <Button variant="ghost" size="sm" className="text-xs px-2">
                    Excel
                  </Button>
                }
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <RadioGroup value={getSelectedValue()} onValueChange={handleRadioChange}>
            {/* Botão "Todas" */}
            <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50">
              <RadioGroupItem value="todas" id="todas" />
              <Label htmlFor="todas" className="flex items-center justify-between w-full cursor-pointer">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span>Todas</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {products.length}
                </Badge>
              </Label>
            </div>

            {/* Categorias hierárquicas */}
            {categoriesWithCounts.map((principal) => (
              <div key={principal.id} className="space-y-1">
                {/* Categoria Principal */}
                <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value={`principal-${principal.id}`} id={`principal-${principal.id}`} />
                  <Label htmlFor={`principal-${principal.id}`} className="flex items-center justify-between w-full cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleCategory(principal.id);
                        }}
                      >
                        {expandedCategories.has(principal.id) ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </Button>
                      {expandedCategories.has(principal.id) ? (
                        <FolderOpen className="h-4 w-4" style={{ color: principal.cor }} />
                      ) : (
                        <Folder className="h-4 w-4" style={{ color: principal.cor }} />
                      )}
                      <span className="text-sm">{principal.nome}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {principal.productCount}
                    </Badge>
                  </Label>
                </div>

                {/* Categorias (Nível 2) */}
                {expandedCategories.has(principal.id) && principal.children && (
                  <div className="ml-6 space-y-1">
                    {principal.children.map((categoria) => (
                      <div key={categoria.id} className="space-y-1">
                        <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50">
                          <RadioGroupItem value={`categoria-${categoria.id}`} id={`categoria-${categoria.id}`} />
                          <Label htmlFor={`categoria-${categoria.id}`} className="flex items-center justify-between w-full cursor-pointer">
                            <div className="flex items-center gap-2">
                              {categoria.children && categoria.children.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-0 h-auto"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    toggleCategory(categoria.id);
                                  }}
                                >
                                  {expandedCategories.has(categoria.id) ? (
                                    <ChevronDown className="h-3 w-3" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                              <div 
                                className="w-3 h-3 rounded-full border"
                                style={{ backgroundColor: categoria.cor }}
                              />
                              <span className="text-sm">{categoria.nome}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {categoria.productCount}
                            </Badge>
                          </Label>
                        </div>

                        {/* Subcategorias (Nível 3) */}
                        {expandedCategories.has(categoria.id) && categoria.children && (
                          <div className="ml-6 space-y-1">
                            {categoria.children.map((subcategoria) => (
                              <div key={subcategoria.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50">
                                <RadioGroupItem value={`subcategoria-${subcategoria.id}`} id={`subcategoria-${subcategoria.id}`} />
                                <Label htmlFor={`subcategoria-${subcategoria.id}`} className="flex items-center justify-between w-full cursor-pointer">
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: subcategoria.cor }}
                                    />
                                    <span className="text-xs">{subcategoria.nome}</span>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {subcategoria.productCount}
                                  </Badge>
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </RadioGroup>

          {/* Estado vazio */}
          {categoriesWithCounts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma categoria com produtos</p>
              <div className="mt-4 space-y-2">
                <CategoryCreationModal
                  trigger={
                    <Button variant="outline" size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Criar Primeira Categoria
                    </Button>
                  }
                />
                <CategoryImportModal
                  trigger={
                    <Button variant="outline" size="sm" className="gap-2 w-full">
                      <Package className="h-4 w-4" />
                      Importar do Excel
                    </Button>
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}