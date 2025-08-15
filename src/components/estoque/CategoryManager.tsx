import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Settings2,
  Palette,
  Tag,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Categoria {
  id: string;
  nome: string;
  descricao?: string;
  cor: string;
  icone?: string;
  ativo: boolean;
  ordem: number;
}

interface CategoryManagerProps {
  organizationId?: string;
  onCategorySelect?: (categoria: Categoria) => void;
  selectedCategoryId?: string;
  showInactive?: boolean;
}

const ICONES_PREDEFINIDOS = [
  { value: 'Car', label: 'Carro' },
  { value: 'Coffee', label: 'Café' },
  { value: 'Sparkles', label: 'Brilho' },
  { value: 'Smartphone', label: 'Smartphone' },
  { value: 'Home', label: 'Casa' },
  { value: 'Book', label: 'Livro' },
  { value: 'Heart', label: 'Coração' },
  { value: 'Gamepad2', label: 'Jogos' },
  { value: 'Hammer', label: 'Ferramentas' },
  { value: 'Laptop', label: 'Laptop' },
  { value: 'Shirt', label: 'Roupas' },
  { value: 'Package', label: 'Pacote' },
  { value: 'Star', label: 'Estrela' },
  { value: 'Circle', label: 'Círculo' }
];

const CORES_PREDEFINIDAS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#64748b', '#374151', '#1f2937'
];

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  organizationId,
  onCategorySelect,
  selectedCategoryId,
  showInactive = false
}) => {
  const { toast } = useToast();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Categoria | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    cor: '#6366f1',
    icone: 'Package',
    ativo: true
  });

  useEffect(() => {
    if (organizationId) {
      loadCategorias();
    }
  }, [organizationId, showInactive]);

  const loadCategorias = async () => {
    if (!organizationId) return;
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('categorias_produtos')
        .select('*')
        .eq('organization_id', organizationId)
        .order('ordem', { ascending: true });

      if (!showInactive) {
        query = query.eq('ativo', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      setCategorias(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar categorias",
        description: "Não foi possível carregar as categorias."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openDialog = (categoria?: Categoria) => {
    if (categoria) {
      setEditingCategory(categoria);
      setFormData({
        nome: categoria.nome,
        descricao: categoria.descricao || '',
        cor: categoria.cor,
        icone: categoria.icone || 'Package',
        ativo: categoria.ativo
      });
    } else {
      setEditingCategory(null);
      setFormData({
        nome: '',
        descricao: '',
        cor: '#6366f1',
        icone: 'Package',
        ativo: true
      });
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    setFormData({
      nome: '',
      descricao: '',
      cor: '#6366f1',
      icone: 'Package',
      ativo: true
    });
  };

  const saveCategory = async () => {
    if (!organizationId || !formData.nome.trim()) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Nome da categoria é obrigatório."
      });
      return;
    }

    try {
      if (editingCategory) {
        // Atualizar categoria existente
        const { error } = await supabase
          .from('categorias_produtos')
          .update({
            nome: formData.nome,
            descricao: formData.descricao || null,
            cor: formData.cor,
            icone: formData.icone,
            ativo: formData.ativo
          })
          .eq('id', editingCategory.id);

        if (error) throw error;

        toast({
          title: "Categoria atualizada!",
          description: "As alterações foram salvas com sucesso."
        });
      } else {
        // Criar nova categoria
        const proximaOrdem = Math.max(...categorias.map(c => c.ordem), 0) + 1;
        
        const { error } = await supabase
          .from('categorias_produtos')
          .insert({
            organization_id: organizationId,
            nome: formData.nome,
            descricao: formData.descricao || null,
            cor: formData.cor,
            icone: formData.icone,
            ativo: formData.ativo,
            ordem: proximaOrdem
          });

        if (error) throw error;

        toast({
          title: "Categoria criada!",
          description: "Nova categoria foi adicionada com sucesso."
        });
      }

      closeDialog();
      loadCategorias();
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error);
      
      if (error.code === '23505') {
        toast({
          variant: "destructive",
          title: "Nome duplicado",
          description: "Já existe uma categoria com este nome."
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao salvar",
          description: "Não foi possível salvar a categoria."
        });
      }
    }
  };

  const toggleCategoryStatus = async (categoria: Categoria) => {
    try {
      const { error } = await supabase
        .from('categorias_produtos')
        .update({ ativo: !categoria.ativo })
        .eq('id', categoria.id);

      if (error) throw error;

      toast({
        title: categoria.ativo ? "Categoria desativada" : "Categoria ativada",
        description: `A categoria "${categoria.nome}" foi ${categoria.ativo ? 'desativada' : 'ativada'}.`
      });

      loadCategorias();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível alterar o status da categoria."
      });
    }
  };

  const deleteCategory = async (categoria: Categoria) => {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${categoria.nome}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('categorias_produtos')
        .delete()
        .eq('id', categoria.id);

      if (error) throw error;

      toast({
        title: "Categoria excluída",
        description: `A categoria "${categoria.nome}" foi removida.`
      });

      loadCategorias();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Não foi possível excluir a categoria. Verifique se não há produtos associados."
      });
    }
  };

  if (!organizationId) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Organização não encontrada
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Categorias
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Nova
              </Button>
            </DialogTrigger>
          </Dialog>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : categorias.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma categoria encontrada</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => openDialog()}
            >
              Criar primeira categoria
            </Button>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {categorias.map((categoria) => (
              <div
                key={categoria.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  selectedCategoryId === categoria.id 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                } ${!categoria.ativo ? 'opacity-60' : ''}`}
              >
                <div 
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => onCategorySelect?.(categoria)}
                >
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: categoria.cor }}
                  />
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {categoria.nome}
                      </span>
                      {!categoria.ativo && (
                        <Badge variant="secondary" className="text-xs">
                          Inativa
                        </Badge>
                      )}
                    </div>
                    
                    {categoria.descricao && (
                      <p className="text-sm text-muted-foreground truncate">
                        {categoria.descricao}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCategoryStatus(categoria)}
                    className="h-8 w-8 p-0"
                  >
                    {categoria.ativo ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDialog(categoria)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCategory(categoria)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dialog de criação/edição */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome da categoria"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição opcional da categoria"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cor">Cor</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: formData.cor }}
                      />
                      <Input
                        id="cor"
                        type="color"
                        value={formData.cor}
                        onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="grid grid-cols-10 gap-1">
                      {CORES_PREDEFINIDAS.map((cor) => (
                        <button
                          key={cor}
                          type="button"
                          className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                          style={{ backgroundColor: cor }}
                          onClick={() => setFormData({ ...formData, cor })}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="icone">Ícone</Label>
                  <Select
                    value={formData.icone}
                    onValueChange={(value) => setFormData({ ...formData, icone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICONES_PREDEFINIDOS.map((icone) => (
                        <SelectItem key={icone.value} value={icone.value}>
                          {icone.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="ativo">Categoria ativa</Label>
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeDialog}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={saveCategory}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};