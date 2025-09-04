// Gerenciador de categorias hierárquicas REFATORADO com UX/UI melhorada
import { useState } from 'react';
import { Plus, ArrowLeft, ChevronRight, Tags, Layers, Edit2, Trash2, Package, Search, Filter, Download, Upload, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useHierarchicalCategories, CreateHierarchicalCategoryData, HierarchicalCategory } from '../hooks/useHierarchicalCategories';

const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', 
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
];

const CATEGORY_ICONS = [
  'folder', 'package', 'box', 'shopping-cart', 'star', 'heart',
  'bookmark', 'tag', 'grid', 'layers', 'archive', 'briefcase'
];

const NIVEL_LABELS = {
  1: 'Categoria Principal',
  2: 'Categoria', 
  3: 'Subcategoria'
};

export function HierarchicalCategoryManager() {
  const { 
    categories, 
    loading, 
    createCategory, 
    updateCategory, 
    deleteCategory,
    getCategoriasPrincipais,
    getCategorias,
    getSubcategorias,
    refreshCategories
  } = useHierarchicalCategories();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<HierarchicalCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  
  // Estados para navegação hierárquica
  const [currentView, setCurrentView] = useState<'principal' | 'categoria' | 'subcategoria'>('principal');
  const [activePrincipal, setActivePrincipal] = useState<HierarchicalCategory | null>(null);
  const [activeCategoria, setActiveCategoria] = useState<HierarchicalCategory | null>(null);
  
  const { toast } = useToast();

  const form = useForm<CreateHierarchicalCategoryData>({
    defaultValues: {
      nome: '',
      descricao: '',
      cor: CATEGORY_COLORS[0],
      icone: CATEGORY_ICONS[0],
      nivel: 1,
      ordem: 0
    }
  });

  const categoriasPrincipais = getCategoriasPrincipais();

  // Estatísticas
  const stats = {
    total: categories.length,
    principais: categoriasPrincipais.length,
    categorias: categories.filter(c => c.nivel === 2).length,
    subcategorias: categories.filter(c => c.nivel === 3).length
  };

  const handleSubmit = async (data: CreateHierarchicalCategoryData) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
        toast({
          title: "✅ Categoria atualizada",
          description: `${NIVEL_LABELS[data.nivel]} foi atualizada com sucesso`,
        });
      } else {
        await createCategory(data);
        toast({
          title: "✅ Categoria criada",
          description: `${NIVEL_LABELS[data.nivel]} foi criada com sucesso`,
        });
      }
      closeDialog();
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Erro ao salvar categoria. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const openCreateDialog = (nivel: 1 | 2 | 3, categoriaPrincipalId?: string, categoriaId?: string) => {
    form.reset({
      nome: '',
      descricao: '',
      cor: CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)],
      icone: CATEGORY_ICONS[0],
      nivel,
      categoria_principal_id: categoriaPrincipalId,
      categoria_id: categoriaId,
      ordem: 0
    });
    setEditingCategory(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (category: HierarchicalCategory) => {
    form.reset({
      nome: category.nome,
      descricao: category.descricao || '',
      cor: category.cor || CATEGORY_COLORS[0],
      icone: category.icone || CATEGORY_ICONS[0],
      nivel: category.nivel,
      categoria_principal_id: category.categoria_principal_id,
      categoria_id: category.categoria_id,
      ordem: category.ordem || 0
    });
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    form.reset();
  };

  const handleDelete = async (category: HierarchicalCategory) => {
    if (window.confirm(`Tem certeza que deseja excluir "${category.nome}"?`)) {
      try {
        await deleteCategory(category.id);
        toast({
          title: "✅ Categoria excluída",
          description: "Categoria foi excluída com sucesso",
        });
      } catch (error) {
        toast({
          title: "❌ Erro",
          description: "Erro ao excluir categoria. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  // Navegação hierárquica
  const handleNavigateToPrincipal = (principal: HierarchicalCategory) => {
    setActivePrincipal(principal);
    setCurrentView('categoria');
  };

  const handleNavigateToCategoria = (categoria: HierarchicalCategory) => {
    setActiveCategoria(categoria);
    setCurrentView('subcategoria');
  };

  const handleBackToCategoria = () => {
    setActiveCategoria(null);
    setCurrentView('categoria');
  };

  const handleBackToPrincipal = () => {
    setActivePrincipal(null);
    setActiveCategoria(null);
    setCurrentView('principal');
  };

  // Função para renderizar cards clicáveis com design moderno
  const renderCategoryCard = (category: HierarchicalCategory, onClick?: () => void) => {
    const subcategoriesCount = category.nivel === 1 
      ? getCategorias(category.id).length 
      : category.nivel === 2 
        ? getSubcategorias(category.id).length 
        : 0;
    
    const hasSubcategories = subcategoriesCount > 0;
    const isClickable = !!onClick && hasSubcategories;

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
              {/* Botões de ação */}
              <div className="flex opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 hover:bg-blue-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditDialog(category);
                  }}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-destructive hover:bg-red-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(category);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
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
  const getFilteredCategories = (categoriesList: HierarchicalCategory[]) => {
    return categoriesList.filter(category => 
      category.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.descricao && category.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Layers className="h-6 w-6" />
                Gerenciador de Categorias
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Configure a estrutura hierárquica: Categoria Principal → Categoria → Subcategoria
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  toast({
                    title: "🔄 Atualizando categorias",
                    description: "Recarregando hierarquia de categorias...",
                  });
                  refreshCategories();
                }}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Sincronizar
              </Button>
            </div>
          </div>
          
          {/* Estatísticas */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="text-center p-3 bg-white/50 rounded-lg border">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-3 bg-white/50 rounded-lg border">
              <div className="text-2xl font-bold text-orange-600">{stats.principais}</div>
              <div className="text-xs text-muted-foreground">Principais</div>
            </div>
            <div className="text-center p-3 bg-white/50 rounded-lg border">
              <div className="text-2xl font-bold text-green-600">{stats.categorias}</div>
              <div className="text-xs text-muted-foreground">Categorias</div>
            </div>
            <div className="text-center p-3 bg-white/50 rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">{stats.subcategorias}</div>
              <div className="text-xs text-muted-foreground">Subcategorias</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Área de controle principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Pesquisa */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Pesquisar categorias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
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
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openCreateDialog(1)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Categoria Principal
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? 'Editar' : 'Nova'} {NIVEL_LABELS[form.watch('nivel') || 1]}
                  </DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da {NIVEL_LABELS[form.watch('nivel') || 1]}</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Eletrônicos, Smartphones, iPhone..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="descricao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição (opcional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva esta categoria..."
                              className="resize-none"
                              rows={2}
                              {...field} 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    {!editingCategory && form.watch('nivel') > 1 && (
                      <>
                        {form.watch('nivel') >= 2 && (
                          <FormField
                            control={form.control}
                            name="categoria_principal_id"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Categoria Principal</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categoriasPrincipais.map((cat) => (
                                      <SelectItem key={cat.id} value={cat.id}>
                                        {cat.nome}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        )}
                        
                        {form.watch('nivel') === 3 && form.watch('categoria_principal_id') && (
                          <FormField
                            control={form.control}
                            name="categoria_id"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Categoria</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getCategorias(form.watch('categoria_principal_id') || '').map((cat) => (
                                      <SelectItem key={cat.id} value={cat.id}>
                                        {cat.nome}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        )}
                      </>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="cor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cor</FormLabel>
                            <div className="grid grid-cols-4 gap-2">
                              {CATEGORY_COLORS.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                                    field.value === color 
                                      ? 'border-primary scale-110 shadow-lg' 
                                      : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                                  }`}
                                  style={{ backgroundColor: color }}
                                  onClick={() => field.onChange(color)}
                                />
                              ))}
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="icone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ícone</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CATEGORY_ICONS.map((icon) => (
                                  <SelectItem key={icon} value={icon}>
                                    {icon}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={closeDialog}>
                        Cancelar
                      </Button>
                      <Button type="submit">
                        {editingCategory ? 'Atualizar' : 'Criar'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Navegação/Breadcrumb */}
          {currentView !== 'principal' && (
            <div className="flex items-center gap-2 mb-6 p-4 bg-muted/30 rounded-lg border">
              <Button variant="ghost" size="sm" onClick={handleBackToPrincipal} className="hover:bg-primary/10">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Categorias Principais
              </Button>
              
              {activePrincipal && (
                <>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={currentView === 'subcategoria' ? handleBackToCategoria : undefined}
                    className={`${currentView === 'categoria' ? 'font-medium bg-primary/10' : ''} hover:bg-primary/10`}
                  >
                    {activePrincipal.nome}
                  </Button>
                </>
              )}
              
              {activeCategoria && (
                <>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm bg-primary/10 px-3 py-1 rounded-md">{activeCategoria.nome}</span>
                </>
              )}
            </div>
          )}

          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground">Carregando categorias...</p>
              </div>
            ) : (
              <>
                {/* Visualização de Categorias Principais */}
                {currentView === 'principal' && (
                  <>
                    {categoriasPrincipais.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Tags className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">Nenhuma categoria criada ainda</h3>
                        <p className="text-sm">Crie uma Categoria Principal para começar a organizar seus produtos</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {getFilteredCategories(categoriasPrincipais).map((principal) => 
                          renderCategoryCard(principal, () => handleNavigateToPrincipal(principal))
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Visualização de Categorias (nível 2) */}
                {currentView === 'categoria' && activePrincipal && (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-semibold">Categorias de {activePrincipal.nome}</h3>
                        <p className="text-sm text-muted-foreground">Organize seus produtos em categorias específicas</p>
                      </div>
                      <Button onClick={() => openCreateDialog(2, activePrincipal.id)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Categoria
                      </Button>
                    </div>
                    
                    {getCategorias(activePrincipal.id).length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">Nenhuma categoria criada ainda</h3>
                        <p className="text-sm">Crie categorias para organizar os produtos de {activePrincipal.nome}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {getFilteredCategories(getCategorias(activePrincipal.id)).map((categoria) => 
                          renderCategoryCard(categoria, () => handleNavigateToCategoria(categoria))
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Visualização de Subcategorias (nível 3) */}
                {currentView === 'subcategoria' && activeCategoria && (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-semibold">Subcategorias de {activeCategoria.nome}</h3>
                        <p className="text-sm text-muted-foreground">Detalhe ainda mais a organização dos seus produtos</p>
                      </div>
                      <Button onClick={() => openCreateDialog(3, activeCategoria.categoria_principal_id, activeCategoria.id)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Subcategoria
                      </Button>
                    </div>
                    
                    {getSubcategorias(activeCategoria.id).length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Tags className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">Nenhuma subcategoria criada ainda</h3>
                        <p className="text-sm">Crie subcategorias para detalhar ainda mais {activeCategoria.nome}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {getFilteredCategories(getSubcategorias(activeCategoria.id)).map((subcategoria) => 
                          renderCategoryCard(subcategoria)
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}