import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProdutoComposicao {
  id: string;
  sku_interno: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  subcategoria?: string;
  categoria_principal?: string;
  categoria_nivel2?: string;
  preco_venda?: number;
  preco_custo?: number;
  quantidade_atual: number;
  estoque_minimo: number;
  url_imagem?: string;
  codigo_barras?: string;
  status: string;
  ativo: boolean;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export const useProdutosComposicoes = () => {
  const queryClient = useQueryClient();

  const {
    data: produtos = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["produtos-composicoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos_composicoes")
        .select("*")
        .eq("ativo", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProdutoComposicao[];
    },
  });

  const createProduto = useMutation({
    mutationFn: async (produto: Omit<ProdutoComposicao, "id" | "organization_id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("produtos_composicoes")
        .insert([{ ...produto, organization_id: 'default' }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos-composicoes"] });
      toast.success("Produto criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar produto: " + error.message);
    },
  });

  const updateProduto = useMutation({
    mutationFn: async ({ id, ...produto }: Partial<ProdutoComposicao> & { id: string }) => {
      const { data, error } = await supabase
        .from("produtos_composicoes")
        .update(produto)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos-composicoes"] });
      toast.success("Produto atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar produto: " + error.message);
    },
  });

  const deleteProduto = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("produtos_composicoes")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos-composicoes"] });
      toast.success("Produto removido com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao remover produto: " + error.message);
    },
  });

  // Função para sincronizar componentes em uso
  const sincronizarComponentes = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("sincronizar_componentes_em_uso");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Componentes sincronizados!");
    },
    onError: (error: any) => {
      console.error("Erro ao sincronizar componentes:", error);
    },
  });

  // Função para importar produtos do controle de estoque
  const importarDoEstoque = useMutation({
    mutationFn: async (produtoIds: string[]) => {
      // Buscar produtos do estoque
      const { data: produtosEstoque, error: fetchError } = await supabase
        .from("produtos")
        .select("*")
        .in("id", produtoIds);

      if (fetchError) throw fetchError;

      // Converter para formato de produtos de composições
      const produtosParaImportar = produtosEstoque.map(produto => ({
        sku_interno: produto.sku_interno,
        nome: produto.nome,
        descricao: produto.descricao,
        categoria: produto.categoria,
        preco_venda: produto.preco_venda || 0,
        preco_custo: produto.preco_custo || 0,
        quantidade_atual: produto.quantidade_atual,
        estoque_minimo: produto.estoque_minimo,
        url_imagem: produto.url_imagem,
        codigo_barras: produto.codigo_barras,
        status: "active",
        ativo: true,
        organization_id: 'default'
      }));

      // Inserir na tabela de composições (com upsert para evitar duplicatas)
      const { data, error } = await supabase
        .from("produtos_composicoes")
        .upsert(produtosParaImportar, {
          onConflict: "sku_interno,organization_id",
          ignoreDuplicates: false
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["produtos-composicoes"] });
      toast.success(`${data?.length || 0} produtos importados com sucesso!`);
    },
    onError: (error: any) => {
      toast.error("Erro ao importar produtos: " + error.message);
    },
  });

  return {
    produtos,
    isLoading,
    error,
    refetch,
    createProduto: createProduto.mutate,
    createProdutoAsync: createProduto.mutateAsync,
    updateProduto: updateProduto.mutate,
    deleteProduto: deleteProduto.mutate,
    importarDoEstoque: importarDoEstoque.mutate,
    sincronizarComponentes: sincronizarComponentes.mutate,
    isCreating: createProduto.isPending,
    isUpdating: updateProduto.isPending,
    isDeleting: deleteProduto.isPending,
    isImporting: importarDoEstoque.isPending,
  };
};