import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UnidadeMedida {
  id: string;
  nome: string;
  abreviacao: string;
  tipo: 'comprimento' | 'massa' | 'volume' | 'contagem';
  unidade_base: boolean;
  fator_conversao: number;
  organization_id: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export function useUnidadesMedida() {
  const [unidades, setUnidades] = useState<UnidadeMedida[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Carregar todas as unidades de medida
  const loadUnidades = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('unidades_medida')
        .select('*')
        .eq('ativo', true)
        .order('tipo', { ascending: true })
        .order('nome', { ascending: true });

      if (error) throw error;

      setUnidades(data as UnidadeMedida[] || []);
    } catch (error) {
      console.error('Erro ao carregar unidades de medida:', error);
      toast({
        title: "Erro ao carregar unidades",
        description: "Não foi possível carregar as unidades de medida.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Buscar unidades por tipo
  const getUnidadesByTipo = useCallback((tipo: string): UnidadeMedida[] => {
    return unidades.filter(u => u.tipo === tipo);
  }, [unidades]);

  // Buscar unidade por ID
  const getUnidadeById = useCallback((id: string): UnidadeMedida | undefined => {
    return unidades.find(u => u.id === id);
  }, [unidades]);

  // Converter quantidade entre unidades
  const converterQuantidade = useCallback(async (
    quantidade: number,
    unidadeOrigemId: string,
    unidadeDestinoId: string
  ): Promise<number | null> => {
    try {
      const { data, error } = await supabase.rpc('converter_quantidade', {
        quantidade_origem: quantidade,
        unidade_origem_id: unidadeOrigemId,
        unidade_destino_id: unidadeDestinoId
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao converter quantidade:', error);
      toast({
        title: "Erro na conversão",
        description: "Não foi possível converter a quantidade.",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  // Verificar se duas unidades são compatíveis (mesmo tipo)
  const saoUnidadesCompativeis = useCallback((unidadeId1: string, unidadeId2: string): boolean => {
    const unidade1 = getUnidadeById(unidadeId1);
    const unidade2 = getUnidadeById(unidadeId2);
    
    return !!(unidade1 && unidade2 && unidade1.tipo === unidade2.tipo);
  }, [getUnidadeById]);

  // Buscar unidade padrão por tipo
  const getUnidadeBasePorTipo = useCallback((tipo: string): UnidadeMedida | undefined => {
    return unidades.find(u => u.tipo === tipo && u.unidade_base);
  }, [unidades]);

  // Carregar unidades automaticamente
  useEffect(() => {
    loadUnidades();
  }, [loadUnidades]);

  return {
    unidades,
    loading,
    loadUnidades,
    getUnidadesByTipo,
    getUnidadeById,
    converterQuantidade,
    saoUnidadesCompativeis,
    getUnidadeBasePorTipo,
  };
}