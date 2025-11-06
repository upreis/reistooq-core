/**
 * 🪝 HOOK - COMPOSIÇÕES DE INSUMOS
 * Gerenciamento de insumos debitados 1x por pedido
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import type { ComposicaoInsumo, ComposicaoInsumoEnriquecida, InsumoFormData } from '../types/insumos.types';

type ComposicaoInsumoInsert = Database['public']['Tables']['composicoes_insumos']['Insert'];

export function useInsumosComposicoes(localId?: string) {
  const queryClient = useQueryClient();

  // 📥 Buscar todos os insumos filtrados por local
  const { data: insumos = [], isLoading, error, refetch } = useQuery({
    queryKey: ['composicoes-insumos', localId],
    queryFn: async () => {
      if (!localId) return [];

      const { data, error } = await supabase
        .from('composicoes_insumos')
        .select('*')
        .eq('ativo', true)
        .eq('local_id', localId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ComposicaoInsumo[];
    },
    enabled: !!localId
  });

  // 📥 Buscar insumos enriquecidos (com nomes e estoque)
  const { data: insumosEnriquecidos = [] } = useQuery({
    queryKey: ['composicoes-insumos-enriquecidos', localId],
    queryFn: async () => {
      if (!localId) return [];

      const { data: composicoes, error } = await supabase
        .from('composicoes_insumos')
        .select('*')
        .eq('ativo', true)
        .eq('local_id', localId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar nomes dos produtos e estoque dos insumos
      const skusProdutos = [...new Set(composicoes?.map(c => c.sku_produto) || [])];
      const skusInsumos = [...new Set(composicoes?.map(c => c.sku_insumo) || [])];

      // Buscar produtos (podem estar em produtos ou produtos_composicoes) do mesmo local
      // @ts-ignore - Supabase typing issue with complex queries
      const produtosPromise = supabase.from('produtos').select('sku_interno, nome').in('sku_interno', skusProdutos).eq('local_id', localId);
      // @ts-ignore - Supabase typing issue with complex queries  
      const composicoesPromise = supabase.from('produtos_composicoes').select('sku_interno, nome').in('sku_interno', skusProdutos);
      // @ts-ignore - Supabase typing issue with complex queries
      const insumosPromise = supabase.from('produtos').select('sku_interno, nome, quantidade_atual').in('sku_interno', skusInsumos).eq('local_id', localId);
      
      const [produtosRes, composicoesRes, insumosRes] = await Promise.all([
        produtosPromise,
        composicoesPromise,
        insumosPromise
      ]);

      // Criar mapas de nomes e estoques
      const nomesProdutos = new Map<string, string>();
      produtosRes.data?.forEach(p => nomesProdutos.set(p.sku_interno, p.nome));
      composicoesRes.data?.forEach(p => nomesProdutos.set(p.sku_interno, p.nome));

      const insumosMap = new Map<string, { nome: string; estoque: number }>();
      insumosRes.data?.forEach(i => 
        insumosMap.set(i.sku_interno, { nome: i.nome, estoque: i.quantidade_atual })
      );

      // Enriquecer dados
      const enriquecidos: ComposicaoInsumoEnriquecida[] = composicoes?.map(comp => ({
        ...comp,
        nome_produto: nomesProdutos.get(comp.sku_produto) || comp.sku_produto,
        nome_insumo: insumosMap.get(comp.sku_insumo)?.nome || comp.sku_insumo,
        estoque_disponivel: insumosMap.get(comp.sku_insumo)?.estoque || 0
      })) || [];

      return enriquecidos;
    },
    enabled: !!localId
  });

  // 🔍 Buscar insumos de um produto específico
  const getInsumosBySku = (skuProduto: string): ComposicaoInsumo[] => {
    return insumos.filter(i => i.sku_produto === skuProduto);
  };

  // ➕ Criar novo insumo
  const createMutation = useMutation({
    mutationFn: async (data: InsumoFormData & { local_id: string }) => {
      const { data: result, error } = await supabase
        .from('composicoes_insumos')
        .insert({
          sku_produto: data.sku_produto,
          sku_insumo: data.sku_insumo,
          quantidade: data.quantidade,
          observacoes: data.observacoes || null,
          local_id: data.local_id
        } as any)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['composicoes-insumos'] });
      queryClient.invalidateQueries({ queryKey: ['composicoes-insumos-enriquecidos'] });
      toast.success('Insumo cadastrado com sucesso');
    },
    onError: (error: any) => {
      console.error('Erro ao criar insumo:', error);
      
      if (error.code === '23505') {
        toast.error('Este insumo já está cadastrado para este produto');
      } else {
        toast.error('Erro ao cadastrar insumo: ' + error.message);
      }
    }
  });

  // ✏️ Atualizar insumo
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsumoFormData> }) => {
      const { data: result, error } = await supabase
        .from('composicoes_insumos')
        .update({
          quantidade: data.quantidade,
          observacoes: data.observacoes
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['composicoes-insumos'] });
      queryClient.invalidateQueries({ queryKey: ['composicoes-insumos-enriquecidos'] });
      toast.success('Insumo atualizado com sucesso');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar insumo:', error);
      toast.error('Erro ao atualizar insumo: ' + error.message);
    }
  });

  // 🗑️ Excluir insumo
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('composicoes_insumos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['composicoes-insumos'] });
      queryClient.invalidateQueries({ queryKey: ['composicoes-insumos-enriquecidos'] });
      toast.success('Insumo excluído com sucesso');
    },
    onError: (error: any) => {
      console.error('Erro ao excluir insumo:', error);
      toast.error('Erro ao excluir insumo: ' + error.message);
    }
  });

  return {
    // Data
    insumos,
    insumosEnriquecidos,
    isLoading,
    error,

    // Queries
    getInsumosBySku,
    refetch,

    // Mutations
    createInsumo: createMutation.mutateAsync,
    updateInsumo: updateMutation.mutateAsync,
    deleteInsumo: deleteMutation.mutateAsync,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}
