import { useState, useCallback, useEffect, useRef } from 'react';
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

  // Evita race-condition ao trocar de local rapidamente (ou quando 2 efeitos disparam em sequência)
  const requestSeqRef = useRef(0);

  const loadProducts = useCallback(async () => {
    const currentLocalId = localAtivo?.id;
    const currentLocalTipo = localAtivo?.tipo;
    const currentCategory = selectedCategory;

    // Marca esta chamada como a mais recente
    const requestId = ++requestSeqRef.current;

    if (!currentLocalId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // ✅ Evita “lista antiga” aparecer enquanto troca de local (parece que clonou itens)
      setProducts([]);

      const includeAllProducts = currentLocalTipo === 'principal';
      console.log('[useEstoqueData] Local:', localAtivo?.nome, '| Tipo:', currentLocalTipo, '| include_all_products:', includeAllProducts);

      const allProducts = await getProducts({
        categoria: currentCategory === "all" ? undefined : currentCategory,
        local_id: currentLocalId,
        include_all_products: includeAllProducts,
      });

      // Se entre o await e aqui o usuário trocou de local/categoria, ignorar resposta antiga
      if (requestId !== requestSeqRef.current) return;

      console.log('[useEstoqueData] Produtos retornados:', allProducts.length);
      setProducts(allProducts);
    } catch (error) {
      if (requestId !== requestSeqRef.current) return;

      toast({
        title: "Erro ao carregar produtos",
        description: "Não foi possível carregar o estoque.",
        variant: "destructive",
      });
      setProducts([]);
    } finally {
      if (requestId === requestSeqRef.current) {
        setLoading(false);
      }
    }
  }, [selectedCategory, localAtivo?.id, localAtivo?.tipo, localAtivo?.nome, getProducts, toast]);

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
    localAtivo,
  };
}
