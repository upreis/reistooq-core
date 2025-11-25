import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProductWithStock {
  id: string;
  sku_interno: string;
  nome: string;
  quantidade: number;
  url_imagem: string | null;
}

export const useEstoqueProducts = () => {
  const [highStockProducts, setHighStockProducts] = useState<ProductWithStock[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Buscar organization_id do usuário
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('organizacao_id')
          .eq('id', user.id)
          .single();

        const organizacaoId = profile?.organizacao_id;
        if (!organizacaoId) {
          setLoading(false);
          return;
        }

        // Buscar produtos filho com suas quantidades em estoque
        const { data: products, error: productsError } = await supabase
          .from('produtos')
          .select(`
            id,
            sku_interno,
            nome,
            url_imagem,
            estoque_por_local!inner (
              quantidade
            )
          `)
          .eq('organization_id', organizacaoId)
          .eq('ativo', true)
          .not('sku_pai', 'is', null) // Produtos filho têm sku_pai preenchido
          .order('nome', { ascending: true });

        if (productsError) throw productsError;

        // Processar e agrupar produtos por quantidade
        const productsWithStock: ProductWithStock[] = (products || []).map(p => ({
          id: p.id,
          sku_interno: p.sku_interno,
          nome: p.nome,
          url_imagem: p.url_imagem,
          quantidade: (p.estoque_por_local as any[])?.[0]?.quantidade || 0
        }));

        // Ordenar por quantidade e pegar top 10 de cada categoria
        const sortedByHighStock = [...productsWithStock].sort((a, b) => b.quantidade - a.quantidade);
        const sortedByLowStock = [...productsWithStock].sort((a, b) => a.quantidade - b.quantidade);

        setHighStockProducts(sortedByHighStock.slice(0, 10));
        setLowStockProducts(sortedByLowStock.slice(0, 10));

      } catch (err) {
        console.error('Error fetching stock products:', err);
        setError(err instanceof Error ? err.message : 'Erro ao buscar produtos');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { highStockProducts, lowStockProducts, loading, error };
};
