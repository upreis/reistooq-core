import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProdutoComponente {
  id: string;
  sku_produto: string;
  sku_componente: string;
  nome_componente: string;
  quantidade: number;
  unidade_medida_id: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface ComposicaoEstoque {
  sku_produto: string;
  nome_produto: string;
  componentes: ProdutoComponente[];
}

export function useComposicoesEstoque() {
  const [composicoes, setComposicoes] = useState<Record<string, ProdutoComponente[]>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Buscar composições para um SKU específico
  const getComposicoesForSku = useCallback((skuProduto: string): ProdutoComponente[] => {
    return composicoes[skuProduto] || [];
  }, [composicoes]);

  // Carregar todas as composições com unidades de medida
  const loadComposicoes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('produto_componentes')
        .select(`
          *,
          unidades_medida:unidade_medida_id (
            id,
            nome,
            abreviacao,
            tipo
          )
        `)
        .order('sku_produto', { ascending: true });

      if (error) throw error;

      // Agrupar por SKU do produto
      const groupedComposicoes: Record<string, ProdutoComponente[]> = {};
      data?.forEach((composicao) => {
        if (!groupedComposicoes[composicao.sku_produto]) {
          groupedComposicoes[composicao.sku_produto] = [];
        }
        groupedComposicoes[composicao.sku_produto].push(composicao as ProdutoComponente);
      });

      setComposicoes(groupedComposicoes);
    } catch (error) {
      console.error('Erro ao carregar composições:', error);
      toast({
        title: "Erro ao carregar composições",
        description: "Não foi possível carregar as composições dos produtos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Carregar composições automaticamente
  useEffect(() => {
    loadComposicoes();
  }, [loadComposicoes]);

  return {
    composicoes,
    loading,
    getComposicoesForSku,
    loadComposicoes,
  };
}