import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProdutoComposicao } from "@/hooks/useProdutosComposicoes";

interface ComposicoesCategorySidebarProps {
  produtos: ProdutoComposicao[];
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

interface CategoryData {
  nome: string;
  productCount: number;
  children?: CategoryData[];
}

export function ComposicoesCategorySidebar({ 
  produtos, 
  hierarchicalFilters, 
  onHierarchicalFiltersChange,
  isCollapsed = false,
  onToggleCollapse
}: ComposicoesCategorySidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  
  // Processar categorias diretamente dos produtos
  const categoriesWithCounts = useMemo(() => {
    const categoriaMap = new Map<string, {
      produtos: ProdutoComposicao[];
      subcategorias: Map<string, ProdutoComposicao[]>;
    }>();

    // Agrupar produtos por categoria principal
    produtos.forEach(produto => {
      if (produto.categoria_principal) {
        if (!categoriaMap.has(produto.categoria_principal)) {
          categoriaMap.set(produto.categoria_principal, {
            produtos: [],
            subcategorias: new Map()
          });
        }
        const catData = categoriaMap.get(produto.categoria_principal)!;
        catData.produtos.push(produto);
        
        // Agrupar por categoria secundária (se existir)
        if (produto.categoria) {
          if (!catData.subcategorias.has(produto.categoria)) {
            catData.subcategorias.set(produto.categoria, []);
          }
          catData.subcategorias.get(produto.categoria)!.push(produto);
        }
      }
    });

    // Converter para estrutura hierárquica
    return Array.from(categoriaMap.entries()).map(([catPrincipal, data]) => ({
      nome: catPrincipal,
      productCount: data.produtos.length,
      children: Array.from(data.subcategorias.entries()).map(([catSecundaria, produtos]) => ({
        nome: catSecundaria,
        productCount: produtos.length
      })).filter(sub => sub.productCount > 0)
    })).filter(cat => cat.productCount > 0);
  }, [produtos]);

  // Filtrar categorias baseado na busca
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categoriesWithCounts;
    
    const search = searchTerm.toLowerCase();
    return categoriesWithCounts.filter(principal => {
      if (principal.nome.toLowerCase().includes(search)) return true;
      return principal.children?.some(cat => 
        cat.nome.toLowerCase().includes(search)
      );
    }).map(principal => ({
      ...principal,
      children: principal.children?.filter(cat =>
        cat.nome.toLowerCase().includes(search)
      )
    }));
  }, [categoriesWithCounts, searchTerm]);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const selectCategory = (level: 'principal' | 'categoria', categoryName: string, parentName?: string) => {
    switch (level) {
      case 'principal':
        if (hierarchicalFilters.categoriaPrincipal === categoryName && !hierarchicalFilters.categoria) {
          // Se clicou na mesma categoria principal que já estava selecionada, limpar filtros
          onHierarchicalFiltersChange({});
        } else {
          // Selecionar nova categoria principal
          onHierarchicalFiltersChange({ categoriaPrincipal: categoryName });
          // Auto-expandir se não estiver expandida
          if (!expandedCategories.has(categoryName)) {
            toggleCategory(categoryName);
          }
        }
        break;
      case 'categoria':
        if (hierarchicalFilters.categoria === categoryName) {
          // Se clicou na mesma categoria que já estava selecionada, voltar para principal
          onHierarchicalFiltersChange({ categoriaPrincipal: parentName });
        } else {
          // Selecionar nova categoria
          onHierarchicalFiltersChange({ 
            categoriaPrincipal: parentName, 
            categoria: categoryName 
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
  const totalProducts = produtos.length;

  // Renderizar item de categoria
  const renderCategoryItem = (
    category: CategoryData, 
    level: number = 0, 
    parentName?: string
  ) => {
    const isExpanded = expandedCategories.has(category.nome);
    
    // Determinar se está selecionado baseado no nível
    const isSelected = level === 0 
      ? hierarchicalFilters.categoriaPrincipal === category.nome && !hierarchicalFilters.categoria
      : hierarchicalFilters.categoria === category.nome;

    const hasChildren = category.children && category.children.length > 0;
    const paddingLeft = isCollapsed ? 0 : level * 12;

    return (
      <div key={category.nome} className="space-y-1">
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (level === 0) selectCategory('principal', category.nome);
                  else selectCategory('categoria', category.nome, parentName);
                }}
                className={cn(
                  "w-full justify-start h-auto py-2 transition-all relative group border-l-2",
                  "px-2",
                  isSelected 
                    ? "border-l-primary bg-primary/10 text-primary font-medium" 
                    : "border-l-transparent text-foreground hover:border-l-primary/50 hover:bg-primary/5 hover:text-foreground",
                  level === 0 && "font-medium",
                  level === 1 && "text-sm ml-2"
                )}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* Ícone de expansão */}
                  {hasChildren && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCategory(category.nome);
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
                    ) : (
                      <Package className="h-3 w-3 text-current" />
                    )}
                  </div>
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="ml-2">
              <p className="text-sm font-medium">{category.nome}</p>
              <p className="text-xs text-muted-foreground">{category.productCount} produtos</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (level === 0) selectCategory('principal', category.nome);
              else selectCategory('categoria', category.nome, parentName);
            }}
            className={cn(
              "w-full h-auto py-2.5 transition-all relative group overflow-visible border-l-3",
              "pl-3 pr-4",
              isSelected 
                ? "border-l-primary bg-primary/10 text-primary font-medium shadow-sm" 
                : "border-l-transparent text-foreground hover:border-l-primary/50 hover:bg-primary/5 hover:text-foreground",
              level === 0 && "font-medium",
              level === 1 && "text-sm ml-2"
            )}
            style={{ paddingLeft: `${paddingLeft + 12}px` }}
          >
            <div className="flex items-center justify-between gap-2 w-full">
              {/* Lado esquerdo: ícones e texto */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Ícone de expansão */}
                {hasChildren && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCategory(category.nome);
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
                  ) : (
                    <Package className="h-3 w-3 text-current" />
                  )}
                </div>
                
                {/* Nome da categoria */}
                <span className={cn(
                  "truncate text-left transition-colors",
                  isSelected && "font-medium",
                  level === 0 && "font-medium",
                  level === 1 && "text-sm"
                )}>
                  {category.nome}
                </span>
              </div>
              
              {/* Lado direito: contador */}
              <div className={cn(
                "inline-flex h-6 min-w-[24px] px-2 rounded-full flex-shrink-0 items-center justify-center text-xs font-medium tabular-nums transition-colors",
                isSelected 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground border border-border"
              )}>
                {category.productCount}
              </div>
            </div>
          </Button>
        )}
        
        {/* Filhos - sempre mostrar se expandido */}
        {isExpanded && hasChildren && !isCollapsed && (
          <div className="space-y-1">
            {category.children!.map(child => 
              renderCategoryItem(child, level + 1, category.nome)
            )}
          </div>
        )}
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <div className="w-12 flex flex-col gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="w-full h-10 p-0"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="ml-2">
              <p>Expandir categorias</p>
            </TooltipContent>
          </Tooltip>
          <ScrollArea className="flex-1 overflow-x-visible pr-2">
            <div className="space-y-1">
              {filteredCategories.map(category => renderCategoryItem(category))}
            </div>
          </ScrollArea>
        </div>
      </TooltipProvider>
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
        
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9 text-sm border-border/60 focus:border-primary"
          />
        </div>
        
        {/* Filtro ativo */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between p-2.5 bg-primary/8 border border-primary/30 rounded-lg">
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Filtro ativo</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearFilters}
              className="h-6 w-6 p-0 text-primary hover:bg-primary/20 rounded-md"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-3 space-y-1">
        {/* Botão "Todas" */}
        <Button
          variant={!hasActiveFilters ? "default" : "ghost"}
          className="w-full justify-between h-10 text-sm font-medium"
          onClick={clearFilters}
        >
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>Todas as categorias</span>
          </div>
          <Badge 
            variant={!hasActiveFilters ? "default" : "secondary"} 
            className="text-xs font-medium tabular-nums min-w-[28px] h-6 px-2 bg-muted/80 text-muted-foreground border border-border/50"
          >
            {totalProducts}
          </Badge>
        </Button>
        
        <ScrollArea className="h-[55vh] overflow-x-visible pr-3">
          <div className="space-y-1 pr-4">
            {filteredCategories.length > 0 ? (
              filteredCategories.map(category => renderCategoryItem(category))
            ) : (
              <div className="text-center py-8">
                <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground font-medium">
                  {searchTerm ? 'Nenhuma categoria encontrada' : 'Sem categorias disponíveis'}
                </p>
                {searchTerm && (
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Tente um termo diferente
                  </p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}