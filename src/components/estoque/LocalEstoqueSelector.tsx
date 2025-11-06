import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Loader2, X } from 'lucide-react';
import { LocalEstoque } from '@/features/estoque/types/locais.types';
import { useLocalEstoqueAtivo } from '@/hooks/useLocalEstoqueAtivo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
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

const TIPO_ICONS: Record<string, string> = {
  principal: '🏢',
  fullfilment_ml: '📦',
  fullfilment_shopee: '🛍️',
  filial: '🏪',
  outro: '📍'
};

export function LocalEstoqueSelector() {
  const [locais, setLocais] = useState<LocalEstoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [localParaDeletar, setLocalParaDeletar] = useState<LocalEstoque | null>(null);
  const [deletando, setDeletando] = useState(false);
  const { localAtivo, setLocalAtivo } = useLocalEstoqueAtivo();
  const { toast } = useToast();

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

  const confirmarExclusao = async () => {
    if (!localParaDeletar) return;

    setDeletando(true);
    try {
      // 1. Deletar todos os registros de estoque_por_local
      const { error: estoqueError } = await supabase
        .from('estoque_por_local')
        .delete()
        .eq('local_id', localParaDeletar.id);

      if (estoqueError) throw estoqueError;

      // 2. Deletar o local de estoque
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
                  !isPrincipal && "pr-8"
                )}
              >
                <span>{TIPO_ICONS[local.tipo] || '📍'}</span>
                <span>{local.nome}</span>
              </Button>
              
              {!isPrincipal && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full shadow-sm"
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
          );
        })}
      </div>

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
