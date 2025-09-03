import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Package, 
  ChevronRight, 
  ChevronDown, 
  Folder,
  FolderOpen,
  Search,
  Filter,
  X,
  Grid3X3,
  List
} from "lucide-react";
import { useHierarchicalCategories } from "@/features/products/hooks/useHierarchicalCategories";
import { Product } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface OptimizedCategorySidebarProps {
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface CategoryWithCount {
  id: string;
  nome: string;
  productCount: number;
  children?: CategoryWithCount[];
}

export function OptimizedCategorySidebar({ 
  products, 
  hierarchicalFilters, 
  onHierarchicalFiltersChange,
  isCollapsed = false,
  onToggleCollapse
}: OptimizedCategorySidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
  const isMobile = useIsMobile();
  
  // Auto-expandir categorias que têm seleção ativa
  useMemo(() => {
    if (hierarchicalFilters.categoriaPrincipal && !expandedCategories.has(hierarchicalFilters.categoriaPrincipal)) {
      setExpandedCategories(prev => new Set([...prev, hierarchicalFilters.categoriaPrincipal!]));
    }
    if (hierarchicalFilters.categoria && hierarchicalFilters.categoriaPrincipal) {
      const categoryKey = `${hierarchicalFilters.categoriaPrincipal}-${hierarchicalFilters.categoria}`;
      if (!expandedCategories.has(categoryKey)) {
        setExpandedCategories(prev => new Set([...prev, categoryKey]));
      }
    }
  }, [hierarchicalFilters, expandedCategories]);
  
  const { getCategoriasPrincipais, getCategorias, getSubcategorias } = useHierarchicalCategories();

  // Processar categorias com contadores
  const categoriesWithCounts = useMemo(() => {
    const principaisData = getCategoriasPrincipais();
    
    return principaisData.map(principal => {
      const principalProducts = products.filter(product => 
        (product as any).categoria_principal === principal.nome
      );

      const categoriasData = getCategorias(principal.id);
      const children = categoriasData.map(categoria => {
        const categoriaProducts = products.filter(product => 
          (product as any).categoria_nivel2 === categoria.nome
        );

        const subcategoriasData = getSubcategorias(categoria.id);
        const subcategoriaChildren = subcategoriasData.map(subcategoria => {
          const subcategoriaProducts = products.filter(product => 
            (product as any).subcategoria === subcategoria.nome
          );

          return {
            id: subcategoria.id,
            nome: subcategoria.nome,
            productCount: subcategoriaProducts.length
          };
        });

        return {
          id: categoria.id,
          nome: categoria.nome,
          productCount: categoriaProducts.length,
          children: subcategoriaChildren.length > 0 ? subcategoriaChildren : undefined
        };
      });

      return {
        id: principal.id,
        nome: principal.nome,
        productCount: principalProducts.length,
        children: children.length > 0 ? children : undefined
      };
    }).filter(principal => principal.productCount > 0);
  }, [products, getCategoriasPrincipais, getCategorias, getSubcategorias]);

  // Filtrar categorias baseado APENAS na busca (não na seleção)
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categoriesWithCounts;
    
    const search = searchTerm.toLowerCase();
    return categoriesWithCounts.filter(principal => {
      if (principal.nome.toLowerCase().includes(search)) return true;
      return principal.children?.some(cat => 
        cat.nome.toLowerCase().includes(search) ||
        cat.children?.some(sub => sub.nome.toLowerCase().includes(search))
      );
    }).map(principal => ({
      ...principal,
      children: principal.children?.filter(cat =>
        cat.nome.toLowerCase().includes(search) ||
        cat.children?.some(sub => sub.nome.toLowerCase().includes(search))
      )
    }));
  }, [categoriesWithCounts, searchTerm]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const selectCategory = (level: 'principal' | 'categoria' | 'subcategoria', principalId: string, categoryId?: string, subcategoryId?: string) => {
    switch (level) {
      case 'principal':
        if (hierarchicalFilters.categoriaPrincipal === principalId && !hierarchicalFilters.categoria) {
          // Se clicou na mesma categoria principal que já estava selecionada, limpar filtros
          onHierarchicalFiltersChange({});
        } else {
          // Selecionar nova categoria principal
          onHierarchicalFiltersChange({ categoriaPrincipal: principalId });
          // Auto-expandir se não estiver expandida
          if (!expandedCategories.has(principalId)) {
            toggleCategory(principalId);
          }
        }
        break;
      case 'categoria':
        if (hierarchicalFilters.categoria === categoryId && !hierarchicalFilters.subcategoria) {
          // Se clicou na mesma categoria que já estava selecionada, voltar para principal
          onHierarchicalFiltersChange({ categoriaPrincipal: principalId });
        } else {
          // Selecionar nova categoria
          onHierarchicalFiltersChange({ 
            categoriaPrincipal: principalId, 
            categoria: categoryId 
          });
        }
        break;
      case 'subcategoria':
        if (hierarchicalFilters.subcategoria === subcategoryId) {
          // Se clicou na mesma subcategoria que já estava selecionada, voltar para categoria
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
        break;
    }
  };

  const clearFilters = () => {
    onHierarchicalFiltersChange({});
    setSearchTerm("");
  };

  const hasActiveFilters = Object.values(hierarchicalFilters).some(Boolean);
  const totalProducts = products.length;

  // Renderizar item de categoria com responsividade
  const renderCategoryItem = (
    category: CategoryWithCount, 
    level: number = 0, 
    parentIds: string[] = []
  ) => {
    const categoryKey = [...parentIds, category.id].join('-');
    const isExpanded = expandedCategories.has(categoryKey);
    
    // Determinar se está selecionado baseado no nível
    const isSelected = level === 0 
      ? hierarchicalFilters.categoriaPrincipal === category.id && !hierarchicalFilters.categoria
      : level === 1
      ? hierarchicalFilters.categoria === category.id && !hierarchicalFilters.subcategoria
      : hierarchicalFilters.subcategoria === category.id;

    const hasChildren = category.children && category.children.length > 0;
    const paddingLeft = isCollapsed ? 0 : level * 12;

    return (
      <div key={categoryKey} className="space-y-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (level === 0) selectCategory('principal', category.id);
            else if (level === 1) selectCategory('categoria', parentIds[0], category.id);
            else selectCategory('subcategoria', parentIds[0], parentIds[1], category.id);
          }}
          className={cn(
            "w-full justify-start h-auto py-2 transition-all relative group border-l-2",
            isCollapsed ? "px-2" : "px-3",
            isSelected 
              ? "border-l-brand bg-brand text-brand-active-foreground font-medium" 
              : "border-l-transparent text-foreground hover:border-l-brand/50 hover:bg-brand-hover hover:text-foreground",
            level === 0 && "font-medium",
            level === 1 && "text-sm ml-2",
            level === 2 && "text-xs ml-4"
          )}
          style={{ paddingLeft: isCollapsed ? undefined : `${paddingLeft + 12}px` }}
          title={isCollapsed ? category.nome : undefined}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Ícone de expansão */}
            {hasChildren && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCategory(categoryKey);
                }}
                className="flex-shrink-0 w-4 h-4 flex items-center justify-center hover:bg-primary/20 rounded transition-colors cursor-pointer"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 text-primary" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
            )}
            
            {/* Ícone da categoria */}
            <div className="flex-shrink-0">
              {level === 0 ? (
                isSelected ? (
                  <FolderOpen className="h-4 w-4 text-current" />
                ) : (
                  <Folder className="h-4 w-4 text-current" />
                )
              ) : level === 1 ? (
                <Package className="h-3 w-3 text-current" />
              ) : (
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isSelected ? "bg-current" : "bg-current opacity-60"
                )} />
              )}
            </div>
            
            {/* Nome da categoria */}
            {!isCollapsed && (
              <span className={cn(
                "truncate flex-1 text-left transition-colors",
                isSelected && "font-medium",
                level === 0 && "font-medium",
                level === 1 && "text-sm",
                level === 2 && "text-xs"
              )}>
                {category.nome}
              </span>
            )}
            
            {/* Contador com melhor contraste */}
            {!isCollapsed && (
              <div className={cn(
                "ml-auto flex-shrink-0 px-2 py-0.5 rounded-full text-center min-w-[28px] transition-colors",
                isSelected 
                  ? "bg-brand-active-foreground/20 text-current" 
                  : "bg-muted text-muted-foreground",
                level === 0 && "text-xs",
                level === 1 && "text-[10px]",
                level === 2 && "text-[9px] px-1.5 min-w-[24px]"
              )}>
                {category.productCount}
              </div>
            )}
          </div>
        </Button>
        
        {/* Filhos - sempre mostrar se expandido */}
        {isExpanded && hasChildren && !isCollapsed && (
          <div className="space-y-1">
            {category.children!.map(child => 
              renderCategoryItem(child, level + 1, [...parentIds, category.id])
            )}
          </div>
        )}
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <div className="w-12 flex flex-col gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="w-full h-10 p-0"
          title="Expandir categorias"
        >
          <Grid3X3 className="h-4 w-4" />
        </Button>
        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {filteredCategories.map(category => renderCategoryItem(category))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 space-y-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Categorias</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(viewMode === 'tree' ? 'list' : 'tree')}
              className="h-7 w-7 p-0"
              title={viewMode === 'tree' ? 'Visualização em lista' : 'Visualização em árvore'}
            >
              {viewMode === 'tree' ? <List className="h-3 w-3" /> : <Grid3X3 className="h-3 w-3" />}
            </Button>
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="h-7 w-7 p-0"
                title="Recolher"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Buscar categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>
        
        {/* Filtro ativo */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between p-2 bg-primary/5 border border-primary/20 rounded-md">
            <div className="flex items-center gap-1">
              <Filter className="h-3 w-3 text-primary" />
              <span className="text-xs font-medium text-primary">Filtro ativo</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearFilters}
              className="h-5 w-5 p-0 text-primary hover:bg-primary/20"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-3 space-y-1">
        {/* Botão "Todas" */}
        <Button
          variant={!hasActiveFilters ? "default" : "ghost"}
          className="w-full justify-between h-9 text-sm"
          onClick={clearFilters}
        >
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>Todas</span>
          </div>
          <Badge variant={!hasActiveFilters ? "secondary" : "outline"} className="text-xs">
            {totalProducts}
          </Badge>
        </Button>
        
        <ScrollArea className="h-[50vh]">
          <div className="space-y-1 pr-2">
            {filteredCategories.length > 0 ? (
              filteredCategories.map(category => renderCategoryItem(category))
            ) : (
              <div className="text-center py-6">
                <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">
                  {searchTerm ? 'Nenhuma categoria encontrada' : 'Sem categorias'}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}