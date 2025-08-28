import { supabase } from '@/integrations/supabase/client';
import { ShopProduct, ShopFilters, ShopStats, ShopCategory } from '../types/shop.types';

export class ShopService {
  static async getProducts(filters: ShopFilters) {
    let query = supabase
      .from('produtos')
      .select('*', { count: 'exact' })
      .eq('ativo', true)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.search) {
      query = query.or(`nome.ilike.%${filters.search}%,descricao.ilike.%${filters.search}%,sku_interno.ilike.%${filters.search}%`);
    }

    if (filters.categoria) {
      query = query.eq('categoria', filters.categoria);
    }

    if (filters.priceRange.min !== undefined) {
      query = query.gte('preco_venda', filters.priceRange.min);
    }

    if (filters.priceRange.max !== undefined) {
      query = query.lte('preco_venda', filters.priceRange.max);
    }

    if (filters.stockStatus && filters.stockStatus.length > 0) {
      const stockConditions = filters.stockStatus.map(status => {
        switch (status) {
          case 'out_of_stock':
            return 'quantidade_atual.eq.0';
          case 'low_stock':
            return 'quantidade_atual.lte.estoque_minimo';
          case 'in_stock':
            return 'quantidade_atual.gt.estoque_minimo';
          default:
            return '';
        }
      }).filter(Boolean);
      
      if (stockConditions.length > 0) {
        query = query.or(stockConditions.join(','));
      }
    }

    if (filters.onSale) {
      query = query.gt('preco_custo', 0);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'price_asc':
        query = query.order('preco_venda', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('preco_venda', { ascending: false });
        break;
      case 'name':
        query = query.order('nome', { ascending: true });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Apply pagination
    const from = (filters.page - 1) * filters.limit;
    const to = from + filters.limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Erro ao buscar produtos: ${error.message}`);
    }

    // Transform data to match ShopProduct interface
    const products: ShopProduct[] = (data || []).map(product => ({
      ...product,
      stock_status: this.getStockStatus(product.quantidade_atual, product.estoque_minimo),
      isOnSale: product.preco_custo > 0 && product.preco_venda > product.preco_custo,
      originalPrice: product.preco_custo > 0 ? product.preco_custo : undefined,
      discount_percentage: product.preco_custo > 0 
        ? Math.round(((product.preco_custo - product.preco_venda) / product.preco_custo) * 100)
        : undefined,
      images: [], // Simplificado por agora - será implementado quando as imagens forem configuradas
      rating: Math.floor(Math.random() * 3) + 3, // Mock rating for now
      reviews_count: Math.floor(Math.random() * 100),
    }));

    return {
      products,
      total: count || 0,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil((count || 0) / filters.limit),
    };
  }

  static async getStats(): Promise<ShopStats> {
    // Get basic product stats
    const { data: productStats, error: productError } = await supabase
      .from('produtos')
      .select('id, preco_custo, preco_venda, quantidade_atual, estoque_minimo')
      .eq('ativo', true);

    if (productError) {
      throw new Error(`Erro ao buscar estatísticas: ${productError.message}`);
    }

    // Get categories count
    const { count: categoriesCount, error: categoriesError } = await supabase
      .from('categorias_produtos')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);

    if (categoriesError) {
      throw new Error(`Erro ao contar categorias: ${categoriesError.message}`);
    }

    const products = productStats || [];
    const onSaleCount = products.filter(p => p.preco_custo > 0 && p.preco_venda > p.preco_custo).length;
    const lowStockCount = products.filter(p => p.quantidade_atual <= p.estoque_minimo).length;
    const outOfStockCount = products.filter(p => p.quantidade_atual === 0).length;

    return {
      total_products: products.length,
      categories_count: categoriesCount || 0,
      avg_rating: 4.2, // Mock for now
      total_reviews: 1547, // Mock for now
      on_sale_count: onSaleCount,
      low_stock_count: lowStockCount,
      out_of_stock_count: outOfStockCount,
    };
  }

  static async getCategories(): Promise<ShopCategory[]> {
    const { data, error } = await supabase
      .from('categorias_produtos')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar categorias: ${error.message}`);
    }

    // Para cada categoria, contamos os produtos manualmente
    const categories = data || [];
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const { count } = await supabase
          .from('produtos')
          .select('*', { count: 'exact', head: true })
          .eq('ativo', true)
          .eq('categoria', category.nome);

        return {
          ...category,
          products_count: count || 0,
        };
      })
    );

    return categoriesWithCount;
  }

  static async getProduct(id: string): Promise<ShopProduct | null> {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('id', id)
      .eq('ativo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Erro ao buscar produto: ${error.message}`);
    }

    return {
      ...data,
      stock_status: this.getStockStatus(data.quantidade_atual, data.estoque_minimo),
      isOnSale: data.preco_custo > 0 && data.preco_venda > data.preco_custo,
      originalPrice: data.preco_custo > 0 ? data.preco_custo : undefined,
      discount_percentage: data.preco_custo > 0 
        ? Math.round(((data.preco_custo - data.preco_venda) / data.preco_custo) * 100)
        : undefined,
      images: [], // Simplificado por agora
      rating: Math.floor(Math.random() * 3) + 3,
      reviews_count: Math.floor(Math.random() * 100),
    };
  }

  private static getStockStatus(quantidadeAtual: number, estoqueMinimo: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
    if (quantidadeAtual === 0) return 'out_of_stock';
    if (quantidadeAtual <= estoqueMinimo) return 'low_stock';
    return 'in_stock';
  }
}