// 🎯 Gerenciador visual de categorias de produtos
// Interface moderna para organizar produtos por categorias com cores e ícones

import { useState } from 'react';
import { Plus, FolderOpen, Edit2, Trash2, Search, X, Grid3X3, Palette } from 'lucide-react';
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
import { useProductCategories } from '../hooks/useProductCategories';

interface CategoryFormData {
  nome: string;
  descricao?: string;
  cor?: string;
  icone?: string;
  ordem?: number;
}

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

export function CategoryManager() {
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useProductCategories();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const { toast } = useToast();

  const form = useForm<CategoryFormData>({
    defaultValues: {
      nome: '',
      descricao: '',
      cor: CATEGORY_COLORS[0],
      icone: CATEGORY_ICONS[0],
      ordem: 0
    }
  });

  const filteredCategories = categories.filter(category => 
    category.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (data: CategoryFormData) => {
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

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    form.setValue('nome', category.nome);
    form.setValue('descricao', category.descricao || '');
    form.setValue('cor', category.cor || CATEGORY_COLORS[0]);
    form.setValue('icone', category.icone || CATEGORY_ICONS[0]);
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

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    form.reset();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Categorias de Produtos
          </CardTitle>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Categoria</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Eletrônicos, Roupas, Livros..." {...field} />
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
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            Cor
                          </FormLabel>
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
                          <FormLabel className="flex items-center gap-2">
                            <Grid3X3 className="h-4 w-4" />
                            Ícone
                          </FormLabel>
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
                  
                  <FormField
                    control={form.control}
                    name="ordem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ordem de Exibição</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0"
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-2">Preview:</div>
                    <Badge 
                      style={{ 
                        backgroundColor: form.watch('cor'), 
                        color: 'white' 
                      }}
                      className="text-xs"
                    >
                      {form.watch('nome') || 'Nome da Categoria'}
                    </Badge>
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
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar categorias..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            {search && (
              <Button size="sm" variant="ghost" onClick={() => setSearch('')}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria criada ainda'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="group relative p-4 rounded-lg border border-border bg-card hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge 
                      style={{ 
                        backgroundColor: category.cor || CATEGORY_COLORS[0], 
                        color: 'white' 
                      }}
                      className="text-xs"
                    >
                      {category.nome}
                    </Badge>
                    
                    <div className="hidden group-hover:flex items-center gap-1">
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
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {category.descricao}
                    </p>
                  )}
                  
                  <div className="mt-2 text-xs text-muted-foreground">
                    Ícone: {category.icone || 'folder'} • Ordem: {category.ordem || 0}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}