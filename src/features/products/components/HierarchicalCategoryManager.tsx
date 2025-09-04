// Gerenciador de categorias hierárquicas com interface para cadastro de Categoria Principal > Categoria > Subcategoria
import { useState } from 'react';
import { Plus, FolderOpen, Edit2, Trash2, ChevronRight, Tags, Layers, Grid3X3, ArrowLeft, ChevronDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3>(1);
  const [selectedPrincipal, setSelectedPrincipal] = useState<string>('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('');
  
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

  const handleSubmit = async (data: CreateHierarchicalCategoryData) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
        toast({
          title: "Categoria atualizada",
          description: "Categoria foi atualizada com sucesso",
        });
      } else {
        await createCategory(data);
        toast({
          title: "Categoria criada",
          description: "Nova categoria foi criada com sucesso",
        });
      }
      
      setIsDialogOpen(false);
      setEditingCategory(null);
      form.reset();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar categoria",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (category: HierarchicalCategory) => {
    setEditingCategory(category);
    form.setValue('nome', category.nome);
    form.setValue('descricao', category.descricao || '');
    form.setValue('cor', category.cor || CATEGORY_COLORS[0]);
    form.setValue('icone', category.icone || CATEGORY_ICONS[0]);
    form.setValue('nivel', category.nivel);
    form.setValue('categoria_principal_id', category.categoria_principal_id);
    form.setValue('categoria_id', category.categoria_id);
    form.setValue('ordem', category.ordem || 0);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await deleteCategory(id);
        toast({
          title: "Categoria excluída",
          description: "Categoria foi excluída com sucesso",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir categoria",
          variant: "destructive"
        });
      }
    }
  };

  const openCreateDialog = (nivel: 1 | 2 | 3, principalId?: string, categoriaId?: string) => {
    setEditingCategory(null);
    setSelectedLevel(nivel);
    form.reset({
      nome: '',
      descricao: '',
      cor: CATEGORY_COLORS[0],
      icone: CATEGORY_ICONS[0],
      nivel,
      categoria_principal_id: principalId,
      categoria_id: categoriaId,
      ordem: 0
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    form.reset();
  };

  // Navegação hierárquica
  const handleNavigateToPrincipal = (categoria: HierarchicalCategory) => {
    setActivePrincipal(categoria);
    setActiveCategoria(null);
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

  // Renderização de card clicável
  const renderClickableCard = (category: HierarchicalCategory, onClick?: () => void) => (
    <div
      key={category.id}
      className="group relative p-4 rounded-lg border border-border bg-card hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge 
            style={{ 
              backgroundColor: category.cor || CATEGORY_COLORS[0], 
              color: 'white' 
            }}
            className="text-xs"
          >
            {NIVEL_LABELS[category.nivel]}
          </Badge>
          <span className="font-medium">{category.nome}</span>
          {onClick && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
        
        <div className="hidden group-hover:flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {category.nivel < 3 && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => openCreateDialog(
                (category.nivel + 1) as 2 | 3,
                category.nivel === 1 ? category.id : category.categoria_principal_id,
                category.nivel === 2 ? category.id : undefined
              )}
            >
              <Plus className="h-3 w-3 mr-1" />
              {category.nivel === 1 ? 'Categoria' : 'Subcategoria'}
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => handleEdit(category)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => handleDelete(category.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {category.descricao && (
        <p className="text-sm text-muted-foreground mb-2">
          {category.descricao}
        </p>
      )}
      
      <div className="text-xs text-muted-foreground">
        {category.categoria_completa}
      </div>
    </div>
  );

  const renderCategoryCard = (category: HierarchicalCategory, level: number) => (
    <div
      key={category.id}
      className={`group relative p-4 rounded-lg border border-border bg-card hover:shadow-md transition-all ${
        level > 1 ? 'ml-6' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {level > 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <Badge 
            style={{ 
              backgroundColor: category.cor || CATEGORY_COLORS[0], 
              color: 'white' 
            }}
            className="text-xs"
          >
            {NIVEL_LABELS[category.nivel]}
          </Badge>
          <span className="font-medium">{category.nome}</span>
        </div>
        
        <div className="hidden group-hover:flex items-center gap-1">
          {category.nivel < 3 && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => openCreateDialog(
                (category.nivel + 1) as 2 | 3,
                category.nivel === 1 ? category.id : category.categoria_principal_id,
                category.nivel === 2 ? category.id : undefined
              )}
            >
              <Plus className="h-3 w-3 mr-1" />
              {category.nivel === 1 ? 'Categoria' : 'Subcategoria'}
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => handleEdit(category)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => handleDelete(category.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {category.descricao && (
        <p className="text-sm text-muted-foreground mb-2">
          {category.descricao}
        </p>
      )}
      
      <div className="text-xs text-muted-foreground">
        {category.categoria_completa}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Categorias Hierárquicas
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                toast({
                  title: "Atualizando categorias",
                  description: "Recarregando hierarquia de categorias...",
                });
                refreshCategories();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => openCreateDialog(1)}>
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
                                      ? 'border-primary scale-110' 
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
                    
                    <div className="flex justify-end gap-2">
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
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Navegação/Breadcrumb */}
        {currentView !== 'principal' && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
            <Button variant="ghost" size="sm" onClick={handleBackToPrincipal}>
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
                  className={currentView === 'categoria' ? 'font-medium' : ''}
                >
                  {activePrincipal.nome}
                </Button>
              </>
            )}
            
            {activeCategoria && (
              <>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{activeCategoria.nome}</span>
              </>
            )}
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Visualização de Categorias Principais */}
              {currentView === 'principal' && (
                <>
                  {categoriasPrincipais.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Tags className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma categoria criada ainda</p>
                      <p className="text-sm">Crie uma Categoria Principal para começar</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {categoriasPrincipais.map((principal) => 
                        renderClickableCard(principal, () => handleNavigateToPrincipal(principal))
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Visualização de Categorias (nível 2) */}
              {currentView === 'categoria' && activePrincipal && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      Categorias de {activePrincipal.nome}
                    </h3>
                    <Button 
                      size="sm" 
                      onClick={() => openCreateDialog(2, activePrincipal.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Categoria
                    </Button>
                  </div>
                  
                  {getCategorias(activePrincipal.id).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Grid3X3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma categoria criada ainda</p>
                      <p className="text-sm">Crie categorias para organizar seus produtos</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getCategorias(activePrincipal.id).map((categoria) => 
                        renderClickableCard(categoria, () => handleNavigateToCategoria(categoria))
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Visualização de Subcategorias (nível 3) */}
              {currentView === 'subcategoria' && activeCategoria && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      Subcategorias de {activeCategoria.nome}
                    </h3>
                    <Button 
                      size="sm" 
                      onClick={() => openCreateDialog(3, activeCategoria.categoria_principal_id, activeCategoria.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Subcategoria
                    </Button>
                  </div>
                  
                  {getSubcategorias(activeCategoria.id).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma subcategoria criada ainda</p>
                      <p className="text-sm">Crie subcategorias para detalhar ainda mais seus produtos</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getSubcategorias(activeCategoria.id).map((subcategoria) => 
                        renderClickableCard(subcategoria)
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
  );
}