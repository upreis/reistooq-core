import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Product {
  id: string;
  sku_interno: string;
  nome: string;
  categoria: string | null;
  descricao: string | null;
  codigo_barras: string | null;
  quantidade_atual: number;
  estoque_minimo: number;
  estoque_maximo: number;
  preco_custo: number | null;
  preco_venda: number | null;
  localizacao: string | null;
  status: string;
  ativo: boolean;
  url_imagem: string | null;
  created_at: string;
  updated_at: string;
  ultima_movimentacao: string | null;
  organization_id: string | null;
  integration_account_id: string | null;
}

export const useProducts = () => {
  const { user } = useAuth();

  const getProducts = async (filters?: {
    search?: string;
    categoria?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) => {
    let query = supabase
      .from('produtos')
      .select('*')
      .eq('ativo', true)
      .order('created_at', { ascending: false });

    if (filters?.search) {
      query = query.or(`nome.ilike.%${filters.search}%,sku_interno.ilike.%${filters.search}%,codigo_barras.ilike.%${filters.search}%`);
    }

    if (filters?.categoria) {
      query = query.eq('categoria', filters.categoria);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset || 0) + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
    
    return data as Product[];
  };

  const getProduct = async (id: string) => {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      throw error;
    }

    return data as Product;
  };

  const createProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'ultima_movimentacao' | 'organization_id' | 'integration_account_id'>) => {
    const { data, error } = await supabase
      .from('produtos')
      .insert([product])
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      throw error;
    }

    return data as Product;
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const { data, error } = await supabase
      .from('produtos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      throw error;
    }

    return data as Product;
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase
      .from('produtos')
      .update({ ativo: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  const getProductStats = async () => {
    // Total de produtos
    const { count: totalProducts } = await supabase
      .from('produtos')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);

    // Produtos com estoque baixo
    const { count: lowStockProducts } = await supabase
      .from('produtos')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true)
      .filter('quantidade_atual', 'lte', 'estoque_minimo');

    // Produtos sem estoque
    const { count: outOfStockProducts } = await supabase
      .from('produtos')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true)
      .eq('quantidade_atual', 0);

    // Valor total do estoque
    const { data: stockValue } = await supabase
      .from('produtos')
      .select('quantidade_atual, preco_custo')
      .eq('ativo', true)
      .not('preco_custo', 'is', null);

    const totalStockValue = stockValue?.reduce((total, product) => {
      return total + (product.quantidade_atual * (product.preco_custo || 0));
    }, 0) || 0;

    return {
      totalProducts: totalProducts || 0,
      lowStockProducts: lowStockProducts || 0,
      outOfStockProducts: outOfStockProducts || 0,
      totalStockValue
    };
  };

  const getCategories = async () => {
    const { data, error } = await supabase
      .from('produtos')
      .select('categoria')
      .eq('ativo', true)
      .not('categoria', 'is', null);

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    const categories = [...new Set(data.map(item => item.categoria))].filter(Boolean);
    return categories as string[];
  };

  return {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductStats,
    getCategories
  };
};