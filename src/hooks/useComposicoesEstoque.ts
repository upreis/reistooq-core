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
  estoque_componente?: number; // Estoque disponível do componente
}

export interface ComposicaoEstoque {
  sku_produto: string;
  nome_produto: string;
  componentes: ProdutoComponente[];
}

export function useComposicoesEstoque(localId?: string) {
  const [composicoes, setComposicoes] = useState<Record<string, ProdutoComponente[]>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Buscar composições para um SKU específico
  const getComposicoesForSku = useCallback((skuProduto: string): ProdutoComponente[] => {
    return composicoes[skuProduto] || [];
  }, [composicoes]);

  // Carregar todas as composições com unidades de medida e estoque dos componentes
  const loadComposicoes = useCallback(async () => {
    if (!localId) {
      console.log('⚠️ Local não definido, aguardando...');
      setComposicoes({});
      return;
    }

    try {
      setLoading(true);
      
      console.log('🔍 Carregando composições para local:', localId);
      
      // Primeiro buscar as composições filtradas por local
      let query = supabase
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
        .eq('local_id', localId)
        .order('sku_produto', { ascending: true });

      const { data: composicoesData, error: composicoesError } = await query;
      
      if (composicoesError) throw composicoesError;

      // Buscar os SKUs únicos dos componentes (normalizar para uppercase e trim)
      const skusComponentes = Array.from(new Set(
        composicoesData?.map(comp => comp.sku_componente?.trim().toUpperCase()) || []
      )).filter(Boolean);

      console.log('🔍 SKUs componentes para buscar:', skusComponentes);

      // Buscar informações dos produtos componentes do mesmo local
      // @ts-ignore - Supabase typing issue with complex queries
      const produtosResponse = await supabase
        .from('produtos')
        .select('sku_interno, nome, quantidade_atual')
        .eq('local_id', localId);
      
      const produtosData = produtosResponse.data;
      const produtosError = produtosResponse.error;

      if (produtosError) throw produtosError;

      console.log('📦 Produtos encontrados no estoque:', produtosData?.length);

      // Criar mapa de produtos para lookup rápido (normalizar chave)
      const produtosMap = new Map();
      produtosData?.forEach(produto => {
        const skuNormalizado = produto.sku_interno?.trim().toUpperCase();
        produtosMap.set(skuNormalizado, produto);
      });

      console.log('🗺️ Mapa de produtos criado:', produtosMap.size, 'produtos');

      // Agrupar por SKU do produto
      const groupedComposicoes: Record<string, ProdutoComponente[]> = {};
      composicoesData?.forEach((composicao: any) => {
        if (!groupedComposicoes[composicao.sku_produto]) {
          groupedComposicoes[composicao.sku_produto] = [];
        }
        
        // Buscar informações do produto componente (normalizar para comparação)
        const skuComponenteNormalizado = composicao.sku_componente?.trim().toUpperCase();
        const produtoComponente = produtosMap.get(skuComponenteNormalizado);
        
        if (!produtoComponente) {
          console.warn(`⚠️ Componente não encontrado no estoque: ${composicao.sku_componente}`);
        }
        
        // Adicionar informações do estoque do componente
        const componenteComEstoque: ProdutoComponente = {
          ...composicao,
          nome_componente: produtoComponente?.nome || composicao.sku_componente,
          estoque_componente: produtoComponente?.quantidade_atual || 0
        };
        
        groupedComposicoes[composicao.sku_produto].push(componenteComEstoque);
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
  }, [localId, toast]);

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