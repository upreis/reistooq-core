import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Store, Loader2, Plus, Edit, X, RefreshCw } from 'lucide-react';
import { useLocalVendaAtivo } from '@/hooks/useLocalVendaAtivo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { GerenciarLocaisVendaModal } from './GerenciarLocaisVendaModal';
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

interface LocalVenda {
  id: string;
  nome: string;
  tipo: string;
  icone: string;
  local_estoque_id: string;
  descricao?: string;
}

interface LocalEstoque {
  id: string;
  nome: string;
  tipo: string;
}

const TIPOS_LOCAL_VENDA = [
  { value: 'marketplace', label: 'Marketplace', icon: '🛒' },
  { value: 'loja_fisica', label: 'Loja Física', icon: '🏪' },
  { value: 'atacado', label: 'Atacado', icon: '📦' },
  { value: 'outro', label: 'Outro', icon: '📍' }
];

const ICONES_DISPONIVEIS = ['🛒', '🏪', '📦', '🛍️', '💻', '📱', '🏬', '🎯'];

interface LocalVendaSelectorProps {
  localEstoqueId: string;
  localEstoqueNome: string;
}

export function LocalVendaSelector({ localEstoqueId, localEstoqueNome }: LocalVendaSelectorProps) {
  const [locais, setLocais] = useState<LocalVenda[]>([]);
  const [locaisEstoque, setLocaisEstoque] = useState<LocalEstoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [localParaDeletar, setLocalParaDeletar] = useState<LocalVenda | null>(null);
  const [localParaEditar, setLocalParaEditar] = useState<LocalVenda | null>(null);
  const [deletando, setDeletando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: '',
    icone: '🛒',
    local_estoque_id: '',
    descricao: ''
  });
  const { localVendaAtivo, setLocalVendaAtivo } = useLocalVendaAtivo();
  const { toast } = useToast();

  const carregarLocais = async () => {
    setLoading(true);
    try {
      const [locaisVendaRes, locaisEstoqueRes] = await Promise.all([
        supabase
          .from('locais_venda')
          .select('*')
          .eq('ativo', true)
          .eq('local_estoque_id', localEstoqueId)
          .order('nome'),
        supabase
          .from('locais_estoque')
          .select('id, nome, tipo')
          .eq('ativo', true)
          .order('nome')
      ]);

      if (locaisVendaRes.error) throw locaisVendaRes.error;
      if (locaisEstoqueRes.error) throw locaisEstoqueRes.error;

      setLocais(locaisVendaRes.data || []);
      setLocaisEstoque(locaisEstoqueRes.data || []);

      // Selecionar primeiro local se nenhum ativo ou se o ativo não pertence ao estoque atual
      const locaisDoEstoque = locaisVendaRes.data || [];
      const localAtivoValido = localVendaAtivo && locaisDoEstoque.some(l => l.id === localVendaAtivo.id);
      
      if (!localAtivoValido && locaisDoEstoque.length > 0) {
        const primeiro = locaisDoEstoque[0];
        setLocalVendaAtivo({
          id: primeiro.id,
          nome: primeiro.nome,
          tipo: primeiro.tipo,
          icone: primeiro.icone,
          local_estoque_id: primeiro.local_estoque_id
        });
      }
    } catch (error) {
      console.error('Erro ao carregar locais de venda:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarLocais();
  }, [localEstoqueId]);

  useEffect(() => {
    const handleReload = () => carregarLocais();
    window.addEventListener('reload-locais-venda', handleReload);
    return () => window.removeEventListener('reload-locais-venda', handleReload);
  }, []);

  const handleLocalChange = (local: LocalVenda) => {
    setLocalVendaAtivo({
      id: local.id,
      nome: local.nome,
      tipo: local.tipo,
      icone: local.icone,
      local_estoque_id: local.local_estoque_id
    });
  };

  const abrirEdicao = (local: LocalVenda) => {
    setLocalParaEditar(local);
    setFormData({
      nome: local.nome,
      tipo: local.tipo,
      icone: local.icone,
      local_estoque_id: local.local_estoque_id,
      descricao: local.descricao || ''
    });
  };

  const confirmarEdicao = async () => {
    if (!localParaEditar) return;

    setEditando(true);
    try {
      const { error } = await supabase
        .from('locais_venda')
        .update({
          nome: formData.nome,
          tipo: formData.tipo,
          icone: formData.icone,
          local_estoque_id: formData.local_estoque_id,
          descricao: formData.descricao || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', localParaEditar.id);

      if (error) throw error;

      toast({
        title: 'Local de venda atualizado',
        description: `${formData.nome} foi atualizado com sucesso.`,
      });

      if (localVendaAtivo?.id === localParaEditar.id) {
        setLocalVendaAtivo({
          id: localParaEditar.id,
          nome: formData.nome,
          tipo: formData.tipo,
          icone: formData.icone,
          local_estoque_id: formData.local_estoque_id
        });
      }

      carregarLocais();
      window.dispatchEvent(new Event('reload-locais-venda'));
    } catch (error) {
      console.error('Erro ao editar local de venda:', error);
      toast({
        title: 'Erro ao editar',
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
      // Deletar composições primeiro
      await supabase
        .from('composicoes_local_venda')
        .delete()
        .eq('local_venda_id', localParaDeletar.id);

      // Deletar local de venda
      const { error } = await supabase
        .from('locais_venda')
        .delete()
        .eq('id', localParaDeletar.id);

      if (error) throw error;

      toast({
        title: 'Local de venda excluído',
        description: `${localParaDeletar.nome} foi removido com sucesso.`,
      });

      if (localVendaAtivo?.id === localParaDeletar.id) {
        const primeiro = locais.find(l => l.id !== localParaDeletar.id);
        if (primeiro) {
          setLocalVendaAtivo({
            id: primeiro.id,
            nome: primeiro.nome,
            tipo: primeiro.tipo,
            icone: primeiro.icone,
            local_estoque_id: primeiro.local_estoque_id
          });
        }
      }

      carregarLocais();
      window.dispatchEvent(new Event('reload-locais-venda'));
    } catch (error) {
      console.error('Erro ao excluir local de venda:', error);
      toast({
        title: 'Erro ao excluir',
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
        Carregando locais de venda...
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {locais.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Store className="h-4 w-4" />
            Nenhum local de venda cadastrado
          </div>
        ) : (
          locais.map((local) => {
            const isActive = localVendaAtivo?.id === local.id;
            
            return (
              <div key={local.id} className="relative group">
                <Button
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleLocalChange(local)}
                  className={cn(
                    "flex items-center gap-1.5 transition-all h-7 px-2.5 text-xs",
                    isActive && "shadow-md"
                  )}
                >
                  <span>{local.icone}</span>
                  <span className="font-medium">{local.nome}</span>
                </Button>
                
                <div className="absolute -top-1.5 -right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      abrirEdicao(local);
                    }}
                    title="Editar"
                  >
                    <Edit className="h-2 w-2" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocalParaDeletar(local);
                    }}
                    title="Excluir"
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
        
        <GerenciarLocaisVendaModal
          trigger={
            <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Local de Venda
            </Button>
          }
          onSuccess={carregarLocais}
          localEstoqueFixo={{ id: localEstoqueId, nome: localEstoqueNome }}
        />
      </div>

      {/* Dialog de Edição */}
      <Dialog open={!!localParaEditar} onOpenChange={(open) => !open && setLocalParaEditar(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Local de Venda</DialogTitle>
            <DialogDescription>
              Atualize as informações do local de venda.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="space-y-2 flex-1">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Mercado Livre"
                />
              </div>
              <div className="space-y-2">
                <Label>Ícone</Label>
                <Select value={formData.icone} onValueChange={(v) => setFormData({ ...formData, icone: v })}>
                  <SelectTrigger className="w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICONES_DISPONIVEIS.map((i) => (
                      <SelectItem key={i} value={i}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_LOCAL_VENDA.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.icon} {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="localEstoque">Local de Estoque Vinculado *</Label>
              <Select value={formData.local_estoque_id} onValueChange={(v) => setFormData({ ...formData, local_estoque_id: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locaisEstoque.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.tipo === 'principal' ? '🏢' : '📦'} {l.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Observações"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLocalParaEditar(null)} disabled={editando}>
              Cancelar
            </Button>
            <Button onClick={confirmarEdicao} disabled={editando || !formData.nome || !formData.local_estoque_id}>
              {editando ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : 'Salvar'}
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
              Tem certeza que deseja excluir o local de venda <strong>{localParaDeletar?.nome}</strong>?
              <br /><br />
              <span className="text-destructive font-semibold">
                ⚠️ Todas as composições deste local serão removidas.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              disabled={deletando}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletando ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Excluindo...</> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
