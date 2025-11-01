import { useState, useCallback, useEffect } from 'react';
import { useProducts, Product } from '@/hooks/useProducts';
import { useLocalEstoqueAtivo } from '@/hooks/useLocalEstoqueAtivo';
import { useToast } from '@/hooks/use-toast';

export function useEstoqueData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const { getProducts, getCategories } = useProducts();
  const { toast } = useToast();
  const { localAtivo } = useLocalEstoqueAtivo();

  const loadProducts = useCallback(async () => {
    if (!localAtivo?.id) {
      console.log('⚠️ Nenhum local ativo selecionado');
      setProducts([]);
      setLoading(false);
      return;
    }

    console.log('🔄 loadProducts chamado. Local ativo:', localAtivo.nome, localAtivo.id);
    try {
      setLoading(true);
      
      let ativoFilter: boolean | undefined;
      
      if (selectedStatus === "active_only") {
        ativoFilter = true;
      } else if (selectedStatus === "inactive_only") {
        ativoFilter = false;
      }
      
      console.log('🔍 Carregando produtos com filtros:', { 
        categoria: selectedCategory, 
        ativo: ativoFilter,
        local_id: localAtivo.id,
        local_nome: localAtivo.nome
      });
      
      const allProducts = await getProducts({
        categoria: selectedCategory === "all" ? undefined : selectedCategory,
        ativo: ativoFilter,
        local_id: localAtivo.id
      });

      console.log(`✅ Produtos carregados para ${localAtivo.nome}: ${allProducts.length}`);
      setProducts(allProducts);
    } catch (error) {
      console.error('❌ Erro ao carregar produtos:', error);
      toast({
        title: "Erro ao carregar produtos",
        description: "Não foi possível carregar o estoque.",
        variant: "destructive",
      });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedStatus, localAtivo?.id, localAtivo?.nome, getProducts, toast]);

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
    selectedStatus,
    setSelectedCategory,
    setSelectedStatus,
    loadProducts,
    localAtivo
  };
}
