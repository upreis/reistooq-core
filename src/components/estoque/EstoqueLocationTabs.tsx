import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Building2, Package } from 'lucide-react';
import { LocalEstoque } from '@/features/estoque/types/locais.types';
import { useLocalEstoqueAtivo } from '@/hooks/useLocalEstoqueAtivo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GerenciarLocaisModal } from './GerenciarLocaisModal';

const TIPO_ICONS: Record<string, React.ReactNode> = {
  principal: <Building2 className="h-4 w-4" />,
  fullfilment_ml: <Package className="h-4 w-4" />,
  fullfilment_shopee: <Package className="h-4 w-4" />,
  filial: <Building2 className="h-4 w-4" />,
  outro: <Package className="h-4 w-4" />
};

interface EstoqueLocationTabsProps {
  onLocationChange?: () => void;
}

export function EstoqueLocationTabs({ onLocationChange }: EstoqueLocationTabsProps) {
  const [locais, setLocais] = useState<LocalEstoque[]>([]);
  const [loading, setLoading] = useState(true);
  const { localAtivo, setLocalAtivo } = useLocalEstoqueAtivo();

  const carregarLocais = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('locais_estoque')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error) throw error;

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Carregando locais...
      </div>
    );
  }

  const localPrincipal = locais.find(l => l.tipo === 'principal');
  const outrosLocais = locais.filter(l => l.tipo !== 'principal');

  return (
    <div className="flex items-center gap-4 pb-4 border-b border-border">
      {/* Seção: Unitário Geral (Estoque Principal) */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Unitário Geral
        </span>
        <div className="flex items-center gap-2">
          {localPrincipal && (
            <Button
              variant={localAtivo?.id === localPrincipal.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleLocalChange(localPrincipal.id)}
              className={cn(
                "flex items-center gap-2 transition-all h-10 px-4",
                localAtivo?.id === localPrincipal.id && "bg-amber-500 hover:bg-amber-600 text-amber-950 border-amber-500 shadow-md"
              )}
            >
              {TIPO_ICONS['principal']}
              <span className="font-medium">{localPrincipal.nome}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Separador vertical */}
      {outrosLocais.length > 0 && (
        <div className="h-12 w-px bg-border" />
      )}

      {/* Seção: A Venda (Outros Locais - Fullfilments) */}
      {outrosLocais.length > 0 && (
        <div className="flex flex-col gap-1.5 flex-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            A Venda
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {outrosLocais.map((local) => {
              const isActive = localAtivo?.id === local.id;
              
              return (
                <Button
                  key={local.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleLocalChange(local.id)}
                  className={cn(
                    "flex items-center gap-2 transition-all h-10 px-4",
                    isActive && "shadow-md"
                  )}
                >
                  {TIPO_ICONS[local.tipo] || <Package className="h-4 w-4" />}
                  <span className="font-medium uppercase">{local.nome}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Botão Gerenciar Locais */}
      <div className="ml-auto">
        <GerenciarLocaisModal 
          onSuccess={() => {
            carregarLocais();
            window.dispatchEvent(new Event('reload-locais-estoque'));
          }}
        />
      </div>
    </div>
  );
}
