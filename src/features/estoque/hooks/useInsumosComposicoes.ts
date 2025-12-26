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

export function useInsumosComposicoes(localId?: string, localVendaId?: string) {
  const queryClient = useQueryClient();

  // 📥 Buscar todos os insumos filtrados por local de venda (independente por local de venda)
  const { data: insumos = [], isLoading, error, refetch } = useQuery({
    queryKey: ['composicoes-insumos', localVendaId],
    queryFn: async () => {
      if (!localVendaId) return [];

      console.log('🔍 [useInsumosComposicoes] Carregando insumos para local de venda:', localVendaId);
      
      // Buscar da tabela composicoes_local_venda (independente por local de venda)
      const { data, error } = await supabase
        .from('composicoes_local_venda')
        .select('*')
        .eq('local_venda_id', localVendaId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar insumos:', error);
        throw error;
      }
      
      console.log('✅ [useInsumosComposicoes] Insumos carregados:', data?.length);
      // Mapear para o tipo ComposicaoInsumo
      return data?.map(item => ({
        ...item,
        local_id: item.local_venda_id // Mapear local_venda_id para local_id para compatibilidade
      })) as ComposicaoInsumo[];
    },
    enabled: !!localVendaId
  });

  // 📥 Buscar insumos enriquecidos (com nomes e estoque)
  const { data: insumosEnriquecidos = [] } = useQuery({
    queryKey: ['composicoes-insumos-enriquecidos', localVendaId],
    queryFn: async () => {
      if (!localVendaId) return [];

      console.log('🔍 [Enriquecidos] Carregando para local de venda:', localVendaId);

      // Buscar da tabela composicoes_local_venda
      const { data: composicoes, error } = await supabase
        .from('composicoes_local_venda')
        .select('*')
        .eq('local_venda_id', localVendaId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar composições:', error);
        throw error;
      }

      console.log('📋 [Enriquecidos] Composições encontradas:', composicoes?.length);

      // Buscar nomes dos produtos e estoque dos insumos
      const skusProdutos = [...new Set(composicoes?.map(c => c.sku_produto) || [])];
      const skusInsumos = [...new Set(composicoes?.map(c => c.sku_insumo) || [])];

      // Buscar produtos (podem estar em produtos ou produtos_composicoes)
      const [produtosRes, composicoesRes, insumosRes] = await Promise.all([
        supabase.from('produtos').select('sku_interno, nome').in('sku_interno', skusProdutos),
        supabase.from('produtos_composicoes').select('sku_interno, nome').in('sku_interno', skusProdutos),
        supabase.from('produtos').select('sku_interno, nome, quantidade_atual').in('sku_interno', skusInsumos)
      ]);

      // Criar mapas de nomes e estoques
      const nomesProdutos = new Map<string, string>();
      produtosRes.data?.forEach(p => nomesProdutos.set(p.sku_interno, p.nome));
      composicoesRes.data?.forEach(p => nomesProdutos.set(p.sku_interno, p.nome));

      const insumosMap = new Map<string, { nome: string; estoque: number }>();
      insumosRes.data?.forEach(i => 
        insumosMap.set(i.sku_interno, { nome: i.nome, estoque: i.quantidade_atual })
      );

      // Enriquecer dados - adaptar campos da composicoes_local_venda
      const enriquecidos: ComposicaoInsumoEnriquecida[] = composicoes?.map(comp => ({
        id: comp.id,
        sku_produto: comp.sku_produto,
        sku_insumo: comp.sku_insumo,
        quantidade: comp.quantidade,
        local_id: undefined, // Não usado para composicoes_local_venda
        local_venda_id: localVendaId, // CRÍTICO: Usar local_venda_id para esta tabela
        organization_id: comp.organization_id,
        observacoes: comp.observacoes,
        ativo: comp.ativo,
        created_at: comp.created_at,
        updated_at: comp.updated_at,
        nome_produto: nomesProdutos.get(comp.sku_produto) || comp.sku_produto,
        nome_insumo: insumosMap.get(comp.sku_insumo)?.nome || comp.sku_insumo,
        estoque_disponivel: insumosMap.get(comp.sku_insumo)?.estoque || 0
      })) || [];

      console.log('✅ [Enriquecidos] Dados enriquecidos:', enriquecidos.length);
      return enriquecidos;
    },
    enabled: !!localVendaId
  });

  // 🔍 Buscar insumos de um produto específico
  const getInsumosBySku = (skuProduto: string): ComposicaoInsumo[] => {
    return insumos.filter(i => i.sku_produto === skuProduto);
  };

  // ➕ Criar novo insumo (na tabela composicoes_local_venda)
  const createMutation = useMutation({
    mutationFn: async (data: InsumoFormData & { local_venda_id: string }) => {
      const { data: orgId, error: orgError } = await supabase.rpc('get_current_org_id');
      if (orgError || !orgId) {
        throw new Error('Não foi possível obter a organização atual para salvar a composição.');
      }

      const { data: result, error } = await supabase
        .from('composicoes_local_venda')
        .insert({
          organization_id: orgId as unknown as string,
          sku_produto: data.sku_produto,
          sku_insumo: data.sku_insumo,
          quantidade: data.quantidade,
          observacoes: data.observacoes || null,
          local_venda_id: data.local_venda_id
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
        toast.error('Este insumo já está cadastrado para este produto neste local');
      } else {
        toast.error('Erro ao cadastrar insumo: ' + error.message);
      }
    }
  });

  // ✏️ Atualizar insumo (na tabela composicoes_local_venda)
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsumoFormData> }) => {
      const { data: result, error } = await supabase
        .from('composicoes_local_venda')
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

  // 🗑️ Excluir insumo (da tabela composicoes_local_venda)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('composicoes_local_venda')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['composicoes-insumos'] });
      queryClient.invalidateQueries({ queryKey: ['composicoes-insumos-enriquecidos'] });
      queryClient.invalidateQueries({ queryKey: ['insumos-produtos-base'] });
      toast.success('Insumo excluído com sucesso');
    },
    onError: (error: any) => {
      console.error('Erro ao excluir insumo:', error);
      toast.error('Erro ao excluir insumo: ' + error.message);
    }
  });

  // 🗑️ Excluir produto da lista (da tabela produtos_composicoes) - para produtos sem composições
  // Só deleta se o produto existe em produtos_composicoes (não em produtos)
  const deleteProdutoMutation = useMutation({
    mutationFn: async (skuProduto: string) => {
      console.log('🗑️ Tentando excluir produto da lista:', skuProduto);
      
      // Verificar se o produto existe em produtos_composicoes
      const { data: produtoComposicao, error: checkError } = await supabase
        .from('produtos_composicoes')
        .select('id')
        .eq('sku_interno', skuProduto)
        .maybeSingle();
      
      if (checkError) {
        console.error('❌ Erro ao verificar produto:', checkError);
        throw checkError;
      }
      
      if (!produtoComposicao) {
        console.log('ℹ️ Produto não está em produtos_composicoes, ignorando:', skuProduto);
        // Produto está apenas em 'produtos', não pode ser deletado
        return { deleted: false, reason: 'not_in_composicoes' };
      }
      
      // Produto existe em produtos_composicoes, pode deletar
      const { error } = await supabase
        .from('produtos_composicoes')
        .delete()
        .eq('sku_interno', skuProduto);

      if (error) throw error;
      
      console.log('✅ Produto excluído de produtos_composicoes:', skuProduto);
      return { deleted: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['composicoes-insumos'] });
      queryClient.invalidateQueries({ queryKey: ['composicoes-insumos-enriquecidos'] });
      queryClient.invalidateQueries({ queryKey: ['insumos-produtos-base'] });
    },
    onError: (error: any) => {
      console.error('Erro ao excluir produto:', error);
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
    deleteProduto: deleteProdutoMutation.mutateAsync,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending || deleteProdutoMutation.isPending
  };
}

/**
 * Hook para importar produtos do estoque como insumos
 */
export function useImportarInsumosDoEstoque() {
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (produtoIds: string[]) => {
      // Buscar produtos do estoque (incluindo organization_id)
      const { data: produtosEstoque, error: fetchError } = await supabase
        .from("produtos")
        .select("*")
        .in("id", produtoIds);

      if (fetchError) throw fetchError;
      if (!produtosEstoque || produtosEstoque.length === 0) {
        throw new Error("Nenhum produto encontrado para importar");
      }

      // Converter para formato de produtos_composicoes (insumos ficam na tabela de composições)
      const produtosParaImportar = produtosEstoque.map(produto => ({
        sku_interno: produto.sku_interno,
        nome: produto.nome,
        descricao: produto.descricao,
        categoria: produto.categoria,
        preco_venda: produto.preco_venda || 0,
        preco_custo: produto.preco_custo || 0,
        quantidade_atual: produto.quantidade_atual || 0,
        estoque_minimo: produto.estoque_minimo || 0,
        url_imagem: produto.url_imagem,
        codigo_barras: produto.codigo_barras,
        status: "active",
        ativo: true,
        organization_id: produto.organization_id
      }));

      // Inserir na tabela de composições (com upsert para evitar duplicatas)
      const { data, error } = await supabase
        .from("produtos_composicoes")
        .upsert(produtosParaImportar as any, {
          onConflict: "sku_interno,organization_id",
          ignoreDuplicates: false
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["produtos-composicoes"] });
      queryClient.invalidateQueries({ queryKey: ["composicoes-insumos"] });
      queryClient.invalidateQueries({ queryKey: ["composicoes-insumos-enriquecidos"] });
      toast.success(`${data?.length || 0} produtos importados com sucesso!`);
    },
    onError: (error: any) => {
      toast.error("Erro ao importar produtos: " + error.message);
    },
  });

  return {
    importarDoEstoque: importMutation.mutate,
    isImporting: importMutation.isPending
  };
}
