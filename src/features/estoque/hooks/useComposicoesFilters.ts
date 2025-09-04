import { useState, useMemo } from 'react';
import { ComposicoesFilterState } from '@/components/estoque/ComposicoesFilters';
import { ProdutoComposicao } from '@/hooks/useProdutosComposicoes';
import { ProdutoComponente } from '@/hooks/useComposicoesEstoque';

export function useComposicoesFilters(
  produtos: ProdutoComposicao[] = [],
  composicoes: Record<string, ProdutoComponente[]> = {},
  custosProdutos: Record<string, number> = {}
) {
  const [filters, setFilters] = useState<ComposicoesFilterState>({
    orderBy: 'recent',
    statusFilter: 'all',
    priceRange: 'all',
  });

  // Calcular estatísticas
  const stats = useMemo(() => {
    let pending = 0;
    let lowStock = 0;

    produtos.forEach(produto => {
      const composicoesProduto = composicoes[produto.sku_interno] || [];
      
      // Verificar se tem componentes pendentes (não cadastrados)
      const hasPendingComponents = composicoesProduto.some(comp => 
        comp.nome_componente === comp.sku_componente
      );
      
      if (hasPendingComponents) {
        pending++;
      }

      // Verificar estoque baixo (pode produzir menos de 5 unidades)
      const estoqueDisponivel = composicoesProduto.length > 0 ? 
        Math.min(...composicoesProduto.map(comp => 
          Math.floor((comp.estoque_componente || 0) / comp.quantidade)
        )) : 0;
      
      if (estoqueDisponivel < 5 && estoqueDisponivel > 0) {
        lowStock++;
      }
    });

    return {
      total: produtos.length,
      displayed: 0, // Será atualizado no filteredData
      pending,
      lowStock,
    };
  }, [produtos, composicoes]);

  // Aplicar filtros
  const filteredData = useMemo(() => {
    let filtered = [...produtos];

    // Filtrar por status
    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter(produto => {
        const composicoesProduto = composicoes[produto.sku_interno] || [];
        
        switch (filters.statusFilter) {
          case 'pending':
            return composicoesProduto.some(comp => comp.nome_componente === comp.sku_componente);
          
          case 'complete':
            return composicoesProduto.length > 0 && 
                   !composicoesProduto.some(comp => comp.nome_componente === comp.sku_componente);
          
          case 'low-stock':
            const estoqueDisponivel = composicoesProduto.length > 0 ? 
              Math.min(...composicoesProduto.map(comp => 
                Math.floor((comp.estoque_componente || 0) / comp.quantidade)
              )) : 0;
            return estoqueDisponivel < 5 && estoqueDisponivel > 0;
          
          default:
            return true;
        }
      });
    }

    // Filtrar por preço
    if (filters.priceRange !== 'all') {
      filtered = filtered.filter(produto => {
        const preco = produto.preco_venda || 0;
        
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

    // Ordenar
    filtered.sort((a, b) => {
      switch (filters.orderBy) {
        case 'recent':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        
        case 'price-desc':
          return (b.preco_venda || 0) - (a.preco_venda || 0);
        
        case 'price-asc':
          return (a.preco_venda || 0) - (b.preco_venda || 0);
        
        case 'name-asc':
          return (a.nome || '').localeCompare(b.nome || '');
        
        default:
          return 0;
      }
    });

    return filtered;
  }, [produtos, composicoes, filters]);

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