// 🎯 Gerenciador visual de tags para produtos
// Interface elegante para criar, editar e aplicar tags coloridas

import { useState } from 'react';
import { Plus, Tag, Edit2, Trash2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useProductTags } from '../hooks/useProductTags';

interface TagFormData {
  nome: string;
  cor: string;
}

const TAG_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', 
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#64748b', '#6b7280', '#374151'
];

export function ProductTagsManager() {
  const { tags, loading, createTag, updateTag, deleteTag } = useProductTags();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<any>(null);
  const { toast } = useToast();

  const form = useForm<TagFormData>({
    defaultValues: {
      nome: '',
      cor: TAG_COLORS[0]
    }
  });

  const filteredTags = tags.filter(tag => 
    tag.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (data: TagFormData) => {
    try {
      if (editingTag) {
        await updateTag(editingTag.id, data);
        toast({
          title: "Tag atualizada",
          description: "Tag foi atualizada com sucesso",
        });
      } else {
        await createTag(data);
        toast({
          title: "Tag criada",
          description: "Nova tag foi criada com sucesso",
        });
      }
      
      setIsDialogOpen(false);
      setEditingTag(null);
      form.reset();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar tag",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (tag: any) => {
    setEditingTag(tag);
    form.setValue('nome', tag.nome);
    form.setValue('cor', tag.cor);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta tag?')) {
      try {
        await deleteTag(id);
        toast({
          title: "Tag excluída",
          description: "Tag foi excluída com sucesso",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir tag",
          variant: "destructive"
        });
      }
    }
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingTag(null);
    form.reset();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tags de Produtos
          </CardTitle>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTag ? 'Editar Tag' : 'Nova Tag'}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Tag</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Promoção, Novo, Destaque..." {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor da Tag</FormLabel>
                        <div className="grid grid-cols-10 gap-2">
                          {TAG_COLORS.map((color) => (
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
                        
                        <div className="mt-3">
                          <Badge style={{ backgroundColor: field.value, color: 'white' }}>
                            Preview: {form.watch('nome') || 'Nome da Tag'}
                          </Badge>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={closeDialog}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingTag ? 'Atualizar' : 'Criar'}
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
              placeholder="Pesquisar tags..."
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
          ) : filteredTags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? 'Nenhuma tag encontrada' : 'Nenhuma tag criada ainda'}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filteredTags.map((tag) => (
                <div
                  key={tag.id}
                  className="group relative inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-sm font-medium"
                  style={{ backgroundColor: tag.cor }}
                >
                  <span>{tag.nome}</span>
                  
                  <div className="hidden group-hover:flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-white hover:bg-white/20"
                      onClick={() => handleEdit(tag)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-white hover:bg-white/20"
                      onClick={() => handleDelete(tag.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
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