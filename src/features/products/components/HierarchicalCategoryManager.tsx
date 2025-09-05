// Visualizador do catálogo global de categorias (somente leitura)
import { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft, ChevronRight, Tags, Layers, Package, Search, Filter, RefreshCw, BookOpen, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useCatalogCategories, CatalogCategory } from '../hooks/useCatalogCategories';
import { CategoryGridSkeleton } from './CategoryCardSkeleton';
import { CategoryErrorState } from './CategoryErrorState';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useToastFeedback } from '@/hooks/useToastFeedback';

const NIVEL_LABELS = {
  1: 'Categoria Principal',
  2: 'Categoria', 
  3: 'Subcategoria'
};

export function HierarchicalCategoryManager() {
  const { 
    categories, 
    loading, 
    error,
    getCategoriasPrincipais,
    getCategorias,
    getSubcategorias,
    refreshCategories
  } = useCatalogCategories();
  
  const { showSuccess, showError } = useToastFeedback();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para navegação hierárquica
  const [currentView, setCurrentView] = useState<'principal' | 'categoria' | 'subcategoria'>('principal');
  const [activePrincipal, setActivePrincipal] = useState<CatalogCategory | null>(null);
  const [activeCategoria, setActiveCategoria] = useState<CatalogCategory | null>(null);

  const categoriasPrincipais = getCategoriasPrincipais();

  // Estatísticas
  const stats = {
    total: categories.length,
    principais: categoriasPrincipais.length,
    categorias: categories.filter(c => c.nivel === 2).length,
    subcategorias: categories.filter(c => c.nivel === 3).length
  };

  // Navegação hierárquica com feedback
  const handleNavigateToPrincipal = useCallback((principal: CatalogCategory) => {
    setActivePrincipal(principal);
    setActiveCategoria(null);
    setCurrentView('categoria');
    setSearchTerm('');
    setFocusedIndex(-1);
    showSuccess(`Navegando para categorias de "${principal.nome}"`);
  }, [showSuccess]);

  const handleNavigateToCategoria = useCallback((categoria: CatalogCategory) => {
    setActiveCategoria(categoria);
    setCurrentView('subcategoria');
    setSearchTerm('');
    setFocusedIndex(-1);
    showSuccess(`Navegando para subcategorias de "${categoria.nome}"`);
  }, [showSuccess]);

  const handleBackToCategoria = useCallback(() => {
    setActiveCategoria(null);
    setCurrentView('categoria');
    setSearchTerm('');
    setFocusedIndex(-1);
  }, []);

  const handleBackToPrincipal = useCallback(() => {
    setActivePrincipal(null);
    setActiveCategoria(null);
    setCurrentView('principal');
    setSearchTerm('');
    setFocusedIndex(-1);
  }, []);

  // Refresh com feedback
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshCategories();
      showSuccess('Catálogo atualizado com sucesso');
    } catch (error) {
      showError('Erro ao atualizar catálogo');
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshCategories, showSuccess, showError]);

  // Get current categories for keyboard navigation
  const getCurrentCategories = useCallback(() => {
    if (currentView === 'principal') {
      return getFilteredCategories(categoriasPrincipais);
    } else if (currentView === 'categoria' && activePrincipal) {
      return getFilteredCategories(getCategorias(activePrincipal.id));
    } else if (currentView === 'subcategoria' && activeCategoria) {
      return getFilteredCategories(getSubcategorias(activeCategoria.id));
    }
    return [];
  }, [currentView, activePrincipal, activeCategoria, searchTerm]);

  // Keyboard navigation
  useKeyboardNavigation({
    onArrowUp: () => {
      const currentCategories = getCurrentCategories();
      if (currentCategories.length > 0) {
        setFocusedIndex(prev => prev > 0 ? prev - 1 : currentCategories.length - 1);
      }
    },
    onArrowDown: () => {
      const currentCategories = getCurrentCategories();
      if (currentCategories.length > 0) {
        setFocusedIndex(prev => prev < currentCategories.length - 1 ? prev + 1 : 0);
      }
    },
    onEnter: () => {
      const currentCategories = getCurrentCategories();
      if (focusedIndex >= 0 && focusedIndex < currentCategories.length) {
        const category = currentCategories[focusedIndex];
        if (currentView === 'principal') {
          handleNavigateToPrincipal(category);
        } else if (currentView === 'categoria') {
          handleNavigateToCategoria(category);
        }
      }
    },
    onEscape: () => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  });

  // Reset focused index when view changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [currentView, searchTerm]);

  // Função para renderizar cards clicáveis com design moderno e acessibilidade
  const renderCategoryCard = useCallback((category: CatalogCategory, onClick?: () => void, index?: number) => {
    const subcategoriesCount = category.nivel === 1 
      ? getCategorias(category.id).length 
      : category.nivel === 2 
        ? getSubcategorias(category.id).length 
        : 0;
    
    const hasSubcategories = subcategoriesCount > 0;
    const isClickable = !!onClick;
    const isFocused = index === focusedIndex;

    return (
      <Card 
        key={category.id} 
        className={`group transition-all duration-300 animate-fade-in ${
          isClickable 
            ? 'hover-scale cursor-pointer border-muted hover:border-primary/50 interactive-item' 
            : 'border-muted hover:shadow-md'
        } ${isFocused ? 'ring-2 ring-primary ring-offset-2' : ''}`}
        onClick={isClickable ? onClick : undefined}
        role={isClickable ? "button" : "article"}
        tabIndex={isClickable ? 0 : -1}
        aria-label={isClickable 
          ? `Navegar para ${category.nome}${hasSubcategories ? `, ${subcategoriesCount} ${category.nivel === 1 ? 'categorias' : 'subcategorias'}` : ''}`
          : `Categoria ${category.nome}`
        }
        onKeyDown={isClickable ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        } : undefined}
      >
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Indicador visual da categoria */}
              <div className="relative shrink-0">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-background shadow-lg transition-colors"
                  style={{ backgroundColor: category.cor || 'hsl(var(--primary))' }}
                />
                {hasSubcategories && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-success rounded-full border border-background" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap sm:flex-nowrap">
                  <h4 className="font-semibold text-sm truncate">{category.nome}</h4>
                  <Badge variant="outline" className="text-xs h-5 px-2 shrink-0">
                    Nível {category.nivel}
                  </Badge>
                </div>
                
                {category.descricao && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {category.descricao}
                  </p>
                )}
                
                {category.categoria_completa && (
                  <p className="text-xs text-primary/80 line-clamp-1 mb-2">
                    {category.categoria_completa}
                  </p>
                )}
                
                {/* Indicadores de subcategorias */}
                {hasSubcategories && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs h-5">
                      <Package className="w-3 h-3 mr-1" />
                      {subcategoriesCount} {category.nivel === 1 ? 'categorias' : 'subcategorias'}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {/* Ícone de visualização */}
              <div className="flex opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                <Eye className="h-4 w-4 text-muted-foreground" />
              </div>
              
              {/* Seta para navegação */}
              {isClickable && (
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors ml-2" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }, [getCategorias, getSubcategorias, focusedIndex]);

  // Filtrar categorias baseado na pesquisa
  const getFilteredCategories = (categoriesList: CatalogCategory[]) => {
    return categoriesList.filter(category => 
      category.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.descricao && category.descricao.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (category.categoria_completa && category.categoria_completa.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header skeleton */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <div className="h-6 w-48 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-4 w-96 bg-muted rounded animate-pulse" />
              </div>
              <div className="h-9 w-24 bg-muted rounded animate-pulse" />
            </div>
            
            {/* Statistics skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="text-center p-3 bg-background/70 rounded-lg border">
                  <div className="h-8 w-12 bg-muted rounded mx-auto mb-2 animate-pulse" />
                  <div className="h-3 w-16 bg-muted rounded mx-auto animate-pulse" />
                </div>
              ))}
            </div>
          </CardHeader>
        </Card>

        {/* Alert skeleton */}
        <div className="h-16 bg-muted rounded-lg animate-pulse" />

        {/* Controls skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="h-9 w-32 bg-muted rounded animate-pulse" />
                <div className="h-9 w-64 bg-muted rounded animate-pulse" />
                <div className="h-9 w-48 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Content skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Tags className="h-5 w-5" />
              <div className="h-6 w-48 bg-muted rounded animate-pulse" />
              <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
            </div>
          </CardHeader>
          <CardContent>
            <CategoryGridSkeleton count={6} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <CategoryErrorState 
          error={error} 
          onRetry={handleRefresh}
          isRetrying={isRefreshing}
        />
      </div>
    );
  }
  
  console.log('🧭 Estado atual:', { currentView, activePrincipal: activePrincipal?.nome, activeCategoria: activeCategoria?.nome });
  
  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 animate-fade-in">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center gap-2 text-xl">
                <BookOpen className="h-6 w-6 text-primary" />
                Catálogo de Categorias
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Visualize a estrutura hierárquica completa (somente leitura)
              </p>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="hover:bg-primary/10"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Atualizando...' : 'Recarregar'}
              </Button>
            </div>
          </div>
          
          {/* Estatísticas responsivas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            <div className="text-center p-3 bg-background/70 rounded-lg border transition-colors hover:bg-background/90">
              <div className="text-xl sm:text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-3 bg-background/70 rounded-lg border transition-colors hover:bg-background/90">
              <div className="text-xl sm:text-2xl font-bold text-warning">{stats.principais}</div>
              <div className="text-xs text-muted-foreground">Principais</div>
            </div>
            <div className="text-center p-3 bg-background/70 rounded-lg border transition-colors hover:bg-background/90">
              <div className="text-xl sm:text-2xl font-bold text-success">{stats.categorias}</div>
              <div className="text-xs text-muted-foreground">Categorias</div>
            </div>
            <div className="text-center p-3 bg-background/70 rounded-lg border transition-colors hover:bg-background/90">
              <div className="text-xl sm:text-2xl font-bold text-primary">{stats.subcategorias}</div>
              <div className="text-xs text-muted-foreground">Subcategorias</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Alert informativo */}
      <Alert>
        <BookOpen className="h-4 w-4" />
        <AlertDescription>
          Este catálogo é somente para consulta. As categorias exibidas são globais e estão disponíveis para todos os usuários como referência para cadastro de produtos.
        </AlertDescription>
      </Alert>

      {/* Área de controle principal */}
      <Card className="animate-fade-in">
        <CardHeader>
          <div className="flex flex-col gap-4">
            {/* Navegação hierárquica */}
            {currentView !== 'principal' && (
              <div className="flex items-center gap-2 flex-wrap">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={currentView === 'categoria' ? handleBackToPrincipal : handleBackToCategoria}
                  className="hover:bg-primary/10"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {currentView === 'categoria' ? 'Voltar às Principais' : 'Voltar às Categorias'}
                </Button>
                
                {/* Breadcrumb responsivo */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                  <span className="truncate max-w-32 sm:max-w-none">{activePrincipal?.nome}</span>
                  {activeCategoria && (
                    <>
                      <ChevronRight className="h-4 w-4 shrink-0" />
                      <span className="truncate max-w-32 sm:max-w-none">{activeCategoria.nome}</span>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Controles de pesquisa e filtro */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Pesquisa */}
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  ref={searchInputRef}
                  placeholder="Pesquisar categorias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-8 focus:ring-2 focus:ring-primary"
                  aria-label="Pesquisar categorias"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                    aria-label="Limpar pesquisa"
                    title="Limpar pesquisa"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Filtro por nível */}
              <Select 
                value={filterLevel?.toString() || 'all'} 
                onValueChange={(value) => setFilterLevel(value === 'all' ? null : parseInt(value))}
              >
                <SelectTrigger className="w-full sm:w-48 hover:bg-muted/50">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os níveis</SelectItem>
                  <SelectItem value="1">Categorias Principais</SelectItem>
                  <SelectItem value="2">Categorias</SelectItem>
                  <SelectItem value="3">Subcategorias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Lista de categorias */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
            <Tags className="h-5 w-5 shrink-0" />
            <span className="truncate">
              {currentView === 'principal' && 'Categorias Principais'}
              {currentView === 'categoria' && `Categorias de "${activePrincipal?.nome}"`}
              {currentView === 'subcategoria' && `Subcategorias de "${activeCategoria?.nome}"`}
            </span>
            <Badge variant="outline" className="text-xs h-5 px-2 shrink-0">
              {(() => {
                if (currentView === 'principal') {
                  return getFilteredCategories(categoriasPrincipais).length;
                } else if (currentView === 'categoria' && activePrincipal) {
                  return getFilteredCategories(getCategorias(activePrincipal.id)).length;
                } else if (currentView === 'subcategoria' && activeCategoria) {
                  return getFilteredCategories(getSubcategorias(activeCategoria.id)).length;
                }
                return 0;
              })()} itens
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Dica de navegação por teclado */}
            {getCurrentCategories().length > 0 && (
              <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
                💡 Dica: Use as setas ↑↓ para navegar, Enter para selecionar, Esc para focar na pesquisa
              </div>
            )}
            
            <div className="grid gap-3" role="list" aria-label="Lista de categorias">
              {currentView === 'principal' && (
                getFilteredCategories(categoriasPrincipais).map((principal, index) => 
                  renderCategoryCard(
                    principal, 
                    () => handleNavigateToPrincipal(principal),
                    index
                  )
                )
              )}
              
              {currentView === 'categoria' && activePrincipal && (
                getFilteredCategories(getCategorias(activePrincipal.id)).map((categoria, index) => 
                  renderCategoryCard(
                    categoria, 
                    () => handleNavigateToCategoria(categoria),
                    index
                  )
                )
              )}
              
              {currentView === 'subcategoria' && activeCategoria && (
                getFilteredCategories(getSubcategorias(activeCategoria.id)).map((subcategoria, index) => 
                  renderCategoryCard(subcategoria, undefined, index)
                )
              )}
            </div>
            
            {/* Estado vazio melhorado */}
            {(() => {
              let currentCategories: any[] = [];
              if (currentView === 'principal') {
                currentCategories = getFilteredCategories(categoriasPrincipais);
              } else if (currentView === 'categoria' && activePrincipal) {
                currentCategories = getFilteredCategories(getCategorias(activePrincipal.id));
              } else if (currentView === 'subcategoria' && activeCategoria) {
                currentCategories = getFilteredCategories(getSubcategorias(activeCategoria.id));
              }
              
              if (currentCategories.length === 0) {
                return (
                  <div className="text-center py-12 animate-fade-in">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhuma categoria disponível'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm 
                        ? 'Tente ajustar os termos da pesquisa ou limpar os filtros'
                        : `Não há ${NIVEL_LABELS[currentView === 'principal' ? 1 : currentView === 'categoria' ? 2 : 3].toLowerCase()}s disponíveis neste nível`
                      }
                    </p>
                    {searchTerm && (
                      <Button 
                        variant="outline" 
                        onClick={() => setSearchTerm('')}
                        className="hover:bg-primary/10"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Limpar pesquisa
                      </Button>
                    )}
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}