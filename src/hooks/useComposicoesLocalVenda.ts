import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProdutoComponente } from './useComposicoesEstoque';

// Reutiliza a interface ProdutoComponente para compatibilidade com ComposicoesEstoque

export function useComposicoesLocalVenda(localVendaId?: string) {
  const [composicoes, setComposicoes] = useState<Record<string, ProdutoComponente[]>>({});
  const [localEstoqueId, setLocalEstoqueId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Buscar composições para um SKU específico (case-insensitive)
  const getComposicoesForSku = useCallback((skuProduto: string): ProdutoComponente[] => {
    const skuNormalizado = skuProduto.toUpperCase();
    // Procurar pela chave normalizada
    for (const [key, value] of Object.entries(composicoes)) {
      if (key.toUpperCase() === skuNormalizado) {
        return value;
      }
    }
    return [];
  }, [composicoes]);

  // Carregar composições do local de venda
  const loadComposicoes = useCallback(async () => {
    if (!localVendaId) {
      console.log('⚠️ Local de venda não definido, aguardando...');
      setComposicoes({});
      return;
    }

    try {
      setLoading(true);
      
      console.log('🛒 Carregando composições para local de venda:', localVendaId);
      
      // Primeiro buscar o local de venda para pegar o local_estoque_id vinculado
      const { data: localVenda, error: localError } = await supabase
        .from('locais_venda')
        .select('local_estoque_id')
        .eq('id', localVendaId)
        .single();

      if (localError) throw localError;
      
      const estoqueVinculadoId = localVenda?.local_estoque_id;
      setLocalEstoqueId(estoqueVinculadoId);
      
      console.log('📦 Estoque vinculado:', estoqueVinculadoId);

      // Buscar composições do local de venda
      const { data: composicoesData, error: composicoesError } = await supabase
        .from('composicoes_local_venda')
        .select('*')
        .eq('local_venda_id', localVendaId)
        .eq('ativo', true)
        .order('sku_produto', { ascending: true });
      
      if (composicoesError) throw composicoesError;

      // Buscar SKUs únicos dos insumos
      const skusInsumos = Array.from(new Set(
        composicoesData?.map(comp => comp.sku_insumo?.trim().toUpperCase()) || []
      )).filter(Boolean);

      console.log('🔍 SKUs insumos para buscar:', skusInsumos);

      // Buscar informações dos produtos insumos
      const { data: produtosData, error: produtosError } = await supabase
        .from('produtos')
        .select('id, sku_interno, nome')
        .in('sku_interno', skusInsumos as string[]);

      if (produtosError) throw produtosError;

      // Criar mapa de produtos para lookup rápido
      const produtosMap = new Map<string, { id: string; sku_interno: string; nome: string }>();
      (produtosData || []).forEach((produto) => {
        const skuNormalizado = produto.sku_interno?.trim().toUpperCase();
        if (skuNormalizado) produtosMap.set(skuNormalizado, produto);
      });

      // Buscar estoque DO LOCAL DE ESTOQUE VINCULADO (não do local de venda!)
      const produtoIds = Array.from(new Set((produtosData || []).map((p) => p.id))).filter(Boolean);
      const estoquePorProdutoId = new Map<string, number>();

      if (produtoIds.length > 0 && estoqueVinculadoId) {
        const { data: estoqueData, error: estoqueError } = await supabase
          .from('estoque_por_local')
          .select('produto_id, quantidade')
          .eq('local_id', estoqueVinculadoId)
          .in('produto_id', produtoIds as string[]);

        if (estoqueError) throw estoqueError;

        (estoqueData || []).forEach((row: any) => {
          estoquePorProdutoId.set(row.produto_id, row.quantidade || 0);
        });
      }

      console.log('📦 Estoque do local vinculado carregado:', estoquePorProdutoId.size);

      // Agrupar por SKU do produto - usando interface ProdutoComponente
      const groupedComposicoes: Record<string, ProdutoComponente[]> = {};
      composicoesData?.forEach((composicao: any) => {
        if (!groupedComposicoes[composicao.sku_produto]) {
          groupedComposicoes[composicao.sku_produto] = [];
        }
        
        const skuInsumoNormalizado = composicao.sku_insumo?.trim().toUpperCase();
        const produtoInsumo = skuInsumoNormalizado ? produtosMap.get(skuInsumoNormalizado) : undefined;

        const estoqueLocal = produtoInsumo?.id
          ? (estoquePorProdutoId.get(produtoInsumo.id) ?? 0)
          : 0;

        // Mapear para interface ProdutoComponente
        const componenteComEstoque: ProdutoComponente = {
          id: composicao.id,
          sku_produto: composicao.sku_produto,
          sku_componente: composicao.sku_insumo, // sku_insumo -> sku_componente
          nome_componente: produtoInsumo?.nome || composicao.sku_insumo, // nome_insumo -> nome_componente
          quantidade: composicao.quantidade,
          unidade_medida_id: null,
          organization_id: composicao.organization_id,
          created_at: composicao.created_at,
          updated_at: composicao.updated_at,
          estoque_componente: estoqueLocal, // estoque_insumo -> estoque_componente
        };
        
        groupedComposicoes[composicao.sku_produto].push(componenteComEstoque);
      });

      setComposicoes(groupedComposicoes);
    } catch (error) {
      console.error('Erro ao carregar composições do local de venda:', error);
      toast({
        title: "Erro ao carregar composições",
        description: "Não foi possível carregar as composições do local de venda.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [localVendaId, toast]);

  // Adicionar componente à composição
  const addComponente = useCallback(async (
    skuProduto: string,
    skuInsumo: string,
    quantidade: number
  ) => {
    if (!localVendaId) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organizacao_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organizacao_id) throw new Error('Organização não encontrada');

      const { error } = await supabase
        .from('composicoes_local_venda')
        .upsert({
          organization_id: profile.organizacao_id,
          local_venda_id: localVendaId,
          sku_produto: skuProduto.trim().toUpperCase(),
          sku_insumo: skuInsumo.trim().toUpperCase(),
          quantidade,
          ativo: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'local_venda_id,sku_produto,sku_insumo'
        });

      if (error) throw error;

      await loadComposicoes();
      return true;
    } catch (error) {
      console.error('Erro ao adicionar componente:', error);
      toast({
        title: "Erro ao adicionar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    }
  }, [localVendaId, loadComposicoes, toast]);

  // Remover componente da composição
  const removeComponente = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('composicoes_local_venda')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadComposicoes();
      return true;
    } catch (error) {
      console.error('Erro ao remover componente:', error);
      toast({
        title: "Erro ao remover",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    }
  }, [loadComposicoes, toast]);

  // Atualizar quantidade do componente
  const updateQuantidade = useCallback(async (id: string, quantidade: number) => {
    try {
      const { error } = await supabase
        .from('composicoes_local_venda')
        .update({ 
          quantidade,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      await loadComposicoes();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      toast({
        title: "Erro ao atualizar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    }
  }, [loadComposicoes, toast]);

  // Carregar composições automaticamente
  useEffect(() => {
    loadComposicoes();
  }, [loadComposicoes]);

  return {
    composicoes,
    loading,
    localEstoqueId,
    getComposicoesForSku,
    loadComposicoes,
    addComponente,
    removeComponente,
    updateQuantidade,
  };
}
