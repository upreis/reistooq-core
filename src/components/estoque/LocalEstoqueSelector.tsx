import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Loader2 } from 'lucide-react';
import { LocalEstoque } from '@/features/estoque/types/locais.types';
import { useLocalEstoqueAtivo } from '@/hooks/useLocalEstoqueAtivo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

      // Ordenar para colocar o principal sempre primeiro
      const locaisOrdenados = (data || []).sort((a, b) => {
        if (a.tipo === 'principal') return -1;
        if (b.tipo === 'principal') return 1;
        return 0;
      });

      setLocais(locaisOrdenados as LocalEstoque[]);

      // Se não tem local ativo, seleciona o principal automaticamente
      if (!localAtivo && locaisOrdenados && locaisOrdenados.length > 0) {
        const principal = locaisOrdenados.find(l => l.tipo === 'principal') || locaisOrdenados[0];
        setLocalAtivo({
          id: principal.id,
          nome: principal.nome,
          tipo: principal.tipo
        });
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
    <div className="flex items-center gap-2 flex-wrap">
      {locais.map((local) => {
        const isActive = localAtivo?.id === local.id;
        return (
          <Button
            key={local.id}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => handleLocalChange(local.id)}
            className={cn(
              "flex items-center gap-2 transition-all",
              isActive && "shadow-md"
            )}
          >
            <span>{TIPO_ICONS[local.tipo] || '📍'}</span>
            <span>{local.nome}</span>
          </Button>
        );
      })}
    </div>
  );
}
