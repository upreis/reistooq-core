import { useState, useMemo } from 'react';
import { EstoqueFilterState } from '@/components/estoque/EstoqueIntelligentFilters';
import { Product } from '@/hooks/useProducts';

export function useEstoqueFilters(products: Product[] = []) {
  const [filters, setFilters] = useState<EstoqueFilterState>({
    orderBy: 'recent',
    statusFilter: 'all',
    priceRange: 'all',
    stockRange: 'all',
  });

  // Calcular estatísticas
  const stats = useMemo(() => {
    let noStock = 0;
    let lowStock = 0;
    let overStock = 0;

    products.forEach(product => {
      const currentStock = product.quantidade_atual || 0;
      const minStock = product.estoque_minimo || 0;
      const maxStock = product.estoque_maximo || 0;

      if (currentStock === 0) {
        noStock++;
      } else if (currentStock <= minStock) {
        lowStock++;
      } else if (maxStock > 0 && currentStock > maxStock) {
        overStock++;
      }
    });

    return {
      total: products.length,
      displayed: 0, // Será atualizado no filteredData
      noStock,
      lowStock,
      overStock,
    };
  }, [products]);

  // Aplicar filtros
  const filteredData = useMemo(() => {
    let filtered = [...products];

    // Filtrar por status
    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter(product => {
        const currentStock = product.quantidade_atual || 0;
        const minStock = product.estoque_minimo || 0;
        const maxStock = product.estoque_maximo || 0;
        
        switch (filters.statusFilter) {
          case 'no-stock':
            return currentStock === 0;
          
          case 'low-stock':
            return currentStock > 0 && currentStock <= minStock;
          
          case 'in-stock':
            return currentStock > minStock && (maxStock === 0 || currentStock <= maxStock);
          
          case 'over-stock':
            return maxStock > 0 && currentStock > maxStock;
          
          default:
            return true;
        }
      });
    }

    // Filtrar por preço
    if (filters.priceRange !== 'all') {
      filtered = filtered.filter(product => {
        const preco = product.preco_venda || 0;
        
        switch (filters.priceRange) {
          case '0-50':
            return preco >= 0 && preco <= 50;
          case '50-100':
            return preco > 50 && preco <= 100;
          case '100-200':
            return preco > 100 && preco <= 200;
          case '200+':
            return preco > 200;
          default:
            return true;
        }
      });
    }

    // Filtrar por quantidade em estoque
    if (filters.stockRange !== 'all') {
      filtered = filtered.filter(product => {
        const stock = product.quantidade_atual || 0;
        
        switch (filters.stockRange) {
          case '0':
            return stock === 0;
          case '1-10':
            return stock >= 1 && stock <= 10;
          case '11-50':
            return stock >= 11 && stock <= 50;
          case '50+':
            return stock > 50;
          default:
            return true;
        }
      });
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (filters.orderBy) {
        case 'recent':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        
        case 'price-desc':
          return (b.preco_venda || 0) - (a.preco_venda || 0);
        
        case 'price-asc':
          return (a.preco_venda || 0) - (b.preco_venda || 0);

        case 'stock-desc':
          return (b.quantidade_atual || 0) - (a.quantidade_atual || 0);
        
        case 'stock-asc':
          return (a.quantidade_atual || 0) - (b.quantidade_atual || 0);
        
        case 'name-asc':
          return (a.nome || '').localeCompare(b.nome || '');
        
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, filters]);

  // Atualizar estatística de produtos exibidos
  const finalStats = useMemo(() => ({
    ...stats,
    displayed: filteredData.length,
  }), [stats, filteredData.length]);

  return {
    filters,
    setFilters,
    filteredData,
    stats: finalStats,
  };
}