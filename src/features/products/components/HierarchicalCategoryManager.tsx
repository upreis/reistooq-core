// Visualizador do catálogo global de categorias (somente leitura)
import { useState } from 'react';
import { ArrowLeft, ChevronRight, Tags, Layers, Package, Search, Filter, RefreshCw, BookOpen, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useCatalogCategories, CatalogCategory } from '../hooks/useCatalogCategories';

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
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  
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

  // Navegação hierárquica
  const handleNavigateToPrincipal = (principal: CatalogCategory) => {
    setActivePrincipal(principal);
    setActiveCategoria(null);
    setCurrentView('categoria');
    setSearchTerm('');
  };

  const handleNavigateToCategoria = (categoria: CatalogCategory) => {
    setActiveCategoria(categoria);
    setCurrentView('subcategoria');
    setSearchTerm('');
  };

  const handleBackToCategoria = () => {
    setActiveCategoria(null);
    setCurrentView('categoria');
    setSearchTerm('');
  };

  const handleBackToPrincipal = () => {
    setActivePrincipal(null);
    setActiveCategoria(null);
    setCurrentView('principal');
    setSearchTerm('');
  };

  // Função para renderizar cards clicáveis com design moderno
  const renderCategoryCard = (category: CatalogCategory, onClick?: () => void) => {
    const subcategoriesCount = category.nivel === 1 
      ? getCategorias(category.id).length 
      : category.nivel === 2 
        ? getSubcategorias(category.id).length 
        : 0;
    
    const hasSubcategories = subcategoriesCount > 0;
    const isClickable = !!onClick;

    return (
      <Card 
        key={category.id} 
        className={`group transition-all duration-300 ${
          isClickable 
            ? 'hover:shadow-xl hover:scale-[1.02] cursor-pointer border-muted hover:border-primary/50 hover:bg-primary/5' 
            : 'border-muted hover:shadow-md'
        }`}
        onClick={isClickable ? onClick : undefined}
      >
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              {/* Indicador visual da categoria */}
              <div className="relative">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
                  style={{ backgroundColor: category.cor || '#6366f1' }}
                />
                {hasSubcategories && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm truncate">{category.nome}</h4>
                  <Badge variant="outline" className="text-xs h-5 px-2 shrink-0">
                    Nível {category.nivel}
                  </Badge>
                </div>
                
                {category.descricao && (
                  <p className="text-xs text-muted-foreground truncate mb-2">
                    {category.descricao}
                  </p>
                )}
                
                {category.categoria_completa && (
                  <p className="text-xs text-blue-600 truncate mb-2">
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
            
            <div className="flex items-center gap-2">
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
  };

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
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Carregando catálogo de categorias...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Erro ao carregar catálogo: {error}
        </AlertDescription>
      </Alert>
    );
  }
  
  // Debug: listas calculadas por nível (implementação idêntica para todos os níveis)
  const categoriasPrincipaisCompletas = getCategoriasPrincipais();
  const principalList = getFilteredCategories(categoriasPrincipaisCompletas);
  
  const categoriasCompletas = activePrincipal ? getCategorias(activePrincipal.id) : [];
  const categoriaList = activePrincipal 
    ? getFilteredCategories(categoriasCompletas)
    : [];
    
  const subcategoriasCompletas = activeCategoria ? getSubcategorias(activeCategoria.id) : [];
  const subList = activeCategoria 
    ? getFilteredCategories(subcategoriasCompletas)
    : [];
  
  console.log('🧭 Debug detalhado:');
  console.log('  📁 Principais totais:', categoriasPrincipaisCompletas.length, '| Filtradas:', principalList.length);
  console.log('  📂 Categorias totais:', categoriasCompletas.length, '| Filtradas:', categoriaList.length, '| Principal ativa:', activePrincipal?.nome);
  console.log('  📄 Subcategorias totais:', subcategoriasCompletas.length, '| Filtradas:', subList.length, '| Categoria ativa:', activeCategoria?.nome);
  console.log('🧭 UI listas visíveis => Principais:', principalList.length, '| Categorias:', categoriaList.length, '| Subcategorias:', subList.length);
  
  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <BookOpen className="h-6 w-6 text-blue-600" />
                Catálogo de Categorias
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Visualize a estrutura hierárquica completa (somente leitura)
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={refreshCategories}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recarregar
              </Button>
            </div>
          </div>
          
          {/* Estatísticas */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="text-center p-3 bg-white/70 rounded-lg border">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-3 bg-white/70 rounded-lg border">
              <div className="text-2xl font-bold text-orange-600">{stats.principais}</div>
              <div className="text-xs text-muted-foreground">Principais</div>
            </div>
            <div className="text-center p-3 bg-white/70 rounded-lg border">
              <div className="text-2xl font-bold text-green-600">{stats.categorias}</div>
              <div className="text-xs text-muted-foreground">Categorias</div>
            </div>
            <div className="text-center p-3 bg-white/70 rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">{stats.subcategorias}</div>
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Navegação hierárquica */}
              {currentView !== 'principal' && (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={currentView === 'categoria' ? handleBackToPrincipal : handleBackToCategoria}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {currentView === 'categoria' ? 'Voltar às Principais' : 'Voltar às Categorias'}
                  </Button>
                  
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{activePrincipal?.nome}</span>
                    {activeCategoria && (
                      <>
                        <ChevronRight className="h-4 w-4" />
                        <span>{activeCategoria.nome}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {/* Pesquisa */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Pesquisar categorias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 pr-8"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Limpar pesquisa"
                    title="Limpar pesquisa"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Filtro por nível */}
              <Select value={filterLevel?.toString() || 'all'} onValueChange={(value) => setFilterLevel(value === 'all' ? null : parseInt(value))}>
                <SelectTrigger className="w-48">
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Tags className="h-5 w-5" />
            {currentView === 'principal' && 'Categorias Principais'}
            {currentView === 'categoria' && `Categorias de "${activePrincipal?.nome}"`}
            {currentView === 'subcategoria' && `Subcategorias de "${activeCategoria?.nome}"`}
            <Badge variant="outline" className="text-xs h-5 px-2">
              {(currentView === 'principal' ? principalList.length : currentView === 'categoria' ? categoriaList.length : subList.length)} itens
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="pr-2">
            <div className="grid gap-3">
              {currentView === 'principal' && (
                getFilteredCategories(categoriasPrincipais).map(principal => 
                  renderCategoryCard(
                    principal, 
                    () => handleNavigateToPrincipal(principal)
                  )
                )
              )}
              
              {currentView === 'categoria' && activePrincipal && (
                categoriaList.map(categoria => 
                  renderCategoryCard(
                    categoria, 
                    () => handleNavigateToCategoria(categoria)
                  )
                )
              )}
              
              {currentView === 'subcategoria' && activeCategoria && (
                subList.map(subcategoria => 
                  renderCategoryCard(subcategoria)
                )
              )}
            </div>
            
            {/* Estado vazio */}
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
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhuma categoria disponível'}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchTerm 
                        ? 'Tente ajustar os termos da pesquisa'
                        : `Não há ${NIVEL_LABELS[currentView === 'principal' ? 1 : currentView === 'categoria' ? 2 : 3].toLowerCase()}s disponíveis neste nível`
                      }
                    </p>
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