import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Loader2, X, Edit } from 'lucide-react';
import { LocalEstoque } from '@/features/estoque/types/locais.types';
import { useLocalEstoqueAtivo } from '@/hooks/useLocalEstoqueAtivo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TIPO_ICONS: Record<string, string> = {
  principal: '🏢',
  fullfilment_ml: '📦',
  fullfilment_shopee: '🛍️',
  filial: '🏪',
  outro: '📍'
};

interface LocalEstoqueSelectorProps {
  showActions?: boolean;
}

export function LocalEstoqueSelector({ showActions = false }: LocalEstoqueSelectorProps) {
  const [locais, setLocais] = useState<LocalEstoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [localParaDeletar, setLocalParaDeletar] = useState<LocalEstoque | null>(null);
  const [localParaEditar, setLocalParaEditar] = useState<LocalEstoque | null>(null);
  const [deletando, setDeletando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: '',
    endereco: '',
    descricao: ''
  });
  const { localAtivo, setLocalAtivo } = useLocalEstoqueAtivo();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const carregarLocais = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('locais_estoque')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error) throw error;

      // ✅ CRÍTICO: Ordenar para colocar o principal SEMPRE primeiro
      const locaisOrdenados = (data || []).sort((a, b) => {
        // Principal sempre vem primeiro
        if (a.tipo === 'principal') return -1;
        if (b.tipo === 'principal') return 1;
        // Depois ordena alfabeticamente
        return a.nome.localeCompare(b.nome);
      });

      setLocais(locaisOrdenados as LocalEstoque[]);

      // ✅ CRÍTICO: Se não tem local ativo OU se o local salvo não existe mais,
      // SEMPRE seleciona o principal primeiro
      const localSalvoAindaExiste = localAtivo && locaisOrdenados.some(l => l.id === localAtivo.id);
      
      if (!localAtivo || !localSalvoAindaExiste) {
        const principal = locaisOrdenados.find(l => l.tipo === 'principal') || locaisOrdenados[0];
        if (principal) {
          console.log('🏢 Selecionando Estoque Principal por padrão');
          setLocalAtivo({
            id: principal.id,
            nome: principal.nome,
            tipo: principal.tipo
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar locais:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarLocais();
  }, []);

  // Escutar evento global para recarregar locais
  useEffect(() => {
    const handleReload = () => {
      console.log('🔄 Recarregando locais...');
      carregarLocais();
    };
    
    window.addEventListener('reload-locais-estoque', handleReload);
    return () => window.removeEventListener('reload-locais-estoque', handleReload);
  }, []);

  const handleLocalChange = (localId: string) => {
    const local = locais.find(l => l.id === localId);
    if (local) {
      console.log('🏢 Alterando local ativo para:', local.nome, local.id);
      setLocalAtivo({
        id: local.id,
        nome: local.nome,
        tipo: local.tipo
      });
    }
  };

  const abrirEdicao = (local: LocalEstoque) => {
    setLocalParaEditar(local);
    setFormData({
      nome: local.nome,
      tipo: local.tipo,
      endereco: local.endereco || '',
      descricao: local.descricao || ''
    });
  };

  const confirmarEdicao = async () => {
    if (!localParaEditar) return;

    setEditando(true);
    try {
      // ✅ VALIDAÇÃO: Verificar se já existe outro local com o mesmo nome
      const { data: localExistente, error: checkError } = await supabase
        .from('locais_estoque')
        .select('id, nome')
        .eq('organization_id', localParaEditar.organization_id)
        .ilike('nome', formData.nome.trim())
        .neq('id', localParaEditar.id) // Excluir o próprio local da verificação
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (localExistente) {
        toast({
          title: 'Nome já existe',
          description: `Já existe um local de estoque chamado "${localExistente.nome}". Por favor, escolha outro nome.`,
          variant: 'destructive'
        });
        setEditando(false);
        return;
      }

      const { error } = await supabase
        .from('locais_estoque')
        .update({
          nome: formData.nome,
          tipo: formData.tipo,
          endereco: formData.endereco || null,
          descricao: formData.descricao || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', localParaEditar.id);

      if (error) throw error;

      toast({
        title: 'Local atualizado',
        description: `${formData.nome} foi atualizado com sucesso.`,
      });

      // Atualizar local ativo se for o que está sendo editado
      if (localAtivo?.id === localParaEditar.id) {
        setLocalAtivo({
          id: localParaEditar.id,
          nome: formData.nome,
          tipo: formData.tipo
        });
      }

      // Recarregar lista
      carregarLocais();
      
      // Disparar evento global para recarregar em outros componentes
      window.dispatchEvent(new Event('reload-locais-estoque'));
    } catch (error) {
      console.error('Erro ao editar local:', error);
      toast({
        title: 'Erro ao editar local',
        description: error instanceof Error ? error.message : 'Ocorreu um erro inesperado.',
        variant: 'destructive'
      });
    } finally {
      setEditando(false);
      setLocalParaEditar(null);
    }
  };

  const confirmarExclusao = async () => {
    if (!localParaDeletar) return;

    setDeletando(true);
    try {
      // 1. Deletar todas as movimentações de estoque deste local
      const { error: movError } = await supabase
        .from('movimentacoes_estoque')
        .delete()
        .eq('local_id', localParaDeletar.id);

      if (movError) throw movError;

      // 2. Deletar todos os registros de estoque_por_local
      const { error: estoqueError } = await supabase
        .from('estoque_por_local')
        .delete()
        .eq('local_id', localParaDeletar.id);

      if (estoqueError) throw estoqueError;

      // 3. Deletar o local de estoque
      const { error: localError } = await supabase
        .from('locais_estoque')
        .delete()
        .eq('id', localParaDeletar.id);

      if (localError) throw localError;

      toast({
        title: 'Local excluído',
        description: `${localParaDeletar.nome} foi removido com sucesso.`,
      });

      // Se o local excluído era o ativo, selecionar o principal
      if (localAtivo?.id === localParaDeletar.id) {
        const principal = locais.find(l => l.tipo === 'principal');
        if (principal) {
          setLocalAtivo({
            id: principal.id,
            nome: principal.nome,
            tipo: principal.tipo
          });
        }
      }

      // Recarregar lista
      carregarLocais();
      
      // Disparar evento global para recarregar em outros componentes
      window.dispatchEvent(new Event('reload-locais-estoque'));
    } catch (error) {
      console.error('Erro ao excluir local:', error);
      toast({
        title: 'Erro ao excluir local',
        description: error instanceof Error ? error.message : 'Ocorreu um erro inesperado.',
        variant: 'destructive'
      });
    } finally {
      setDeletando(false);
      setLocalParaDeletar(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando locais...
      </div>
    );
  }

  if (locais.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        Nenhum local cadastrado
      </div>
    );
  }

  // Em mobile, mostrar apenas o estoque principal de forma simplificada
  if (isMobile) {
    const principal = locais.find(l => l.tipo === 'principal');
    if (!principal) return null;
    
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm bg-primary/10 rounded-lg">
        <span>{TIPO_ICONS['principal']}</span>
        <span className="font-medium text-primary">{principal.nome}</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {locais.map((local) => {
          const isActive = localAtivo?.id === local.id;
          const isPrincipal = local.tipo === 'principal';
          
          return (
            <div key={local.id} className="relative group">
              <Button
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => handleLocalChange(local.id)}
                className={cn(
                  "flex items-center gap-2 transition-all",
                  isActive && "shadow-md",
                  showActions && !isPrincipal && "pr-16"
                )}
              >
                <span>{TIPO_ICONS[local.tipo] || '📍'}</span>
                <span>{local.nome}</span>
              </Button>
              
              {showActions && !isPrincipal && (
                <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      abrirEdicao(local);
                    }}
                    title="Editar local"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  {!local.is_system && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocalParaDeletar(local);
                      }}
                      title="Excluir local"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dialog de Edição */}
      <Dialog open={!!localParaEditar} onOpenChange={(open) => !open && setLocalParaEditar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Local de Estoque</DialogTitle>
            <DialogDescription>
              Atualize as informações do local de estoque.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Filial Centro"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="principal" disabled>🏢 Estoque Principal</SelectItem>
                  <SelectItem value="fullfilment_ml">📦 Fullfilment Mercado Livre</SelectItem>
                  <SelectItem value="fullfilment_shopee">🛍️ Fullfilment Shopee</SelectItem>
                  <SelectItem value="filial">🏪 Filial</SelectItem>
                  <SelectItem value="outro">📍 Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                placeholder="Endereço completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Observações sobre este local"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setLocalParaEditar(null)}
              disabled={editando}
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmarEdicao}
              disabled={editando || !formData.nome || !formData.tipo}
            >
              {editando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Exclusão */}
      <AlertDialog open={!!localParaDeletar} onOpenChange={(open) => !open && setLocalParaDeletar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o local <strong>{localParaDeletar?.nome}</strong>?
              <br /><br />
              <span className="text-destructive font-semibold">
                ⚠️ Todos os registros de estoque deste local serão permanentemente removidos.
              </span>
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              disabled={deletando}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Excluindo...
                </>
              ) : (
                'Excluir Local'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
