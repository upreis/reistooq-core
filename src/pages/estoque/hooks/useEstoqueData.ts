import { useState, useCallback, useEffect } from 'react';
import { useProducts, Product } from '@/hooks/useProducts';
import { useLocalEstoqueAtivo } from '@/hooks/useLocalEstoqueAtivo';
import { useToast } from '@/hooks/use-toast';

export function useEstoqueData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { getProducts, getCategories } = useProducts();
  const { toast } = useToast();
  const { localAtivo } = useLocalEstoqueAtivo();

  const loadProducts = useCallback(async () => {
    if (!localAtivo?.id) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Carrega produtos do local selecionado
      // Para o Estoque Principal, mantemos a lista completa (inclui itens com zero)
      const allProducts = await getProducts({
        categoria: selectedCategory === "all" ? undefined : selectedCategory,
        local_id: localAtivo.id,
        include_all_products: localAtivo.tipo === 'principal'
      });

      setProducts(allProducts);
    } catch (error) {
      toast({
        title: "Erro ao carregar produtos",
        description: "Não foi possível carregar o estoque.",
        variant: "destructive",
      });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, localAtivo?.id, getProducts, toast]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      // Erro silencioso
    }
  }, [getCategories]);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts, loadCategories]);

  return {
    products,
    categories,
    loading,
    selectedCategory,
    setSelectedCategory,
    loadProducts,
    localAtivo
  };
}
