import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Building2, Package, ArrowLeftRight, Plus, X } from 'lucide-react';
import { LocalEstoque } from '@/features/estoque/types/locais.types';
import { useLocalEstoqueAtivo } from '@/hooks/useLocalEstoqueAtivo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GerenciarLocaisModal } from './GerenciarLocaisModal';
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

const TIPO_ICONS: Record<string, React.ReactNode> = {
  principal: <Building2 className="h-3 w-3" />,
  fullfilment: <Package className="h-3 w-3" />,
  inhouse: <Building2 className="h-3 w-3" />,
  filial: <Building2 className="h-3 w-3" />,
  outro: <Package className="h-3 w-3" />
};

export type LayoutMode = "list" | "grid";

interface EstoqueLocationTabsProps {
  onLocationChange?: () => void;
  layoutMode?: LayoutMode;
  onLayoutChange?: (mode: LayoutMode) => void;
  onTransferClick?: () => void;
  selectedProductsCount?: number;
}


export function EstoqueLocationTabs({ 
  onLocationChange,
  layoutMode = "list",
  onLayoutChange,
  onTransferClick,
  selectedProductsCount = 0
}: EstoqueLocationTabsProps) {
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

      console.log('[EstoqueLocationTabs] Locais carregados:', data?.map(l => ({ nome: l.nome, tipo: l.tipo })));

      const locaisOrdenados = (data || []).sort((a, b) => {
        if (a.tipo === 'principal') return -1;
        if (b.tipo === 'principal') return 1;
        return a.nome.localeCompare(b.nome);
      });

      setLocais(locaisOrdenados as LocalEstoque[]);

      const localSalvoAindaExiste = localAtivo && locaisOrdenados.some(l => l.id === localAtivo.id);
      
      if (!localAtivo || !localSalvoAindaExiste) {
        const principal = locaisOrdenados.find(l => l.tipo === 'principal') || locaisOrdenados[0];
        if (principal) {
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

  useEffect(() => {
    const handleReload = () => {
      carregarLocais();
    };
    
    window.addEventListener('reload-locais-estoque', handleReload);
    return () => window.removeEventListener('reload-locais-estoque', handleReload);
  }, []);

  const handleLocalChange = (localId: string) => {
    const local = locais.find(l => l.id === localId);
    if (local) {
      setLocalAtivo({
        id: local.id,
        nome: local.nome,
        tipo: local.tipo
      });
      onLocationChange?.();
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
      <div className="flex items-center justify-center py-4 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Carregando locais...
      </div>
    );
  }

  const localPrincipal = locais.find(l => l.tipo === 'principal');
  const locaisFullfilment = locais.filter(l => l.tipo === 'fullfilment');
  const locaisInhouse = locais.filter(l => l.tipo === 'inhouse' || l.tipo === 'filial' || l.tipo === 'outro');

  const renderLocalButton = (local: LocalEstoque, canDelete: boolean = true) => {
    const isActive = localAtivo?.id === local.id;
    const isPrincipal = local.tipo === 'principal';
    
    return (
      <div key={local.id} className="relative group">
        <Button
          variant={isActive ? "default" : "outline"}
          size="sm"
          onClick={() => handleLocalChange(local.id)}
          className={cn(
            "flex items-center gap-1.5 transition-all h-7 px-2.5 text-xs",
            isActive && isPrincipal && "bg-amber-500 hover:bg-amber-600 text-amber-950 border-amber-500 shadow-sm",
            isActive && !isPrincipal && "shadow-sm"
          )}
        >
          {TIPO_ICONS[local.tipo] || <Package className="h-3 w-3" />}
          <span className="font-medium">{local.nome}</span>
        </Button>
        {/* Botão de excluir */}
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              setLocalParaDeletar(local);
            }}
            title="Excluir local"
          >
            <X className="h-2.5 w-2.5" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
      {/* Lado esquerdo: Locais de estoque */}
      <div className="flex items-center gap-4">
        {/* Seção: Unitário Geral (Estoque Principal) */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-muted-foreground tracking-wide">
            Unitário geral
          </span>
          <div className="flex items-center gap-2">
            {localPrincipal && renderLocalButton(localPrincipal, false)}
          </div>
        </div>

        {/* Separador vertical - In-house */}
        {locaisInhouse.length > 0 && (
          <div className="h-8 w-px bg-muted-foreground/40" />
        )}

        {/* Seção: In-house (inclui filial e outros) */}
        {locaisInhouse.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-medium text-muted-foreground tracking-wide">
              In-house
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {locaisInhouse.map((local) => renderLocalButton(local))}
            </div>
          </div>
        )}

        {/* Separador vertical - Fullfilment */}
        {locaisFullfilment.length > 0 && (
          <div className="h-8 w-px bg-muted-foreground/40" />
        )}

        {/* Seção: Fullfilment */}
        {locaisFullfilment.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-medium text-muted-foreground tracking-wide">
              Fullfilment
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {locaisFullfilment.map((local) => renderLocalButton(local))}
            </div>
          </div>
        )}
      </div>

      {/* Lado direito: Controles */}
      <div className="flex items-center gap-2">
        {/* Transferir Estoque */}
        {onTransferClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={onTransferClick}
            disabled={selectedProductsCount === 0}
            className="h-9"
          >
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Transferir Estoque
            {selectedProductsCount > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                {selectedProductsCount}
              </span>
            )}
          </Button>
        )}

        {/* Novo Local de Estoque */}
        <GerenciarLocaisModal 
          trigger={
            <Button variant="outline" size="sm" className="h-9">
              <Plus className="h-4 w-4 mr-2" />
              Local de Estoque
            </Button>
          }
          onSuccess={() => {
            carregarLocais();
            window.dispatchEvent(new Event('reload-locais-estoque'));
          }}
        />
      </div>

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
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
