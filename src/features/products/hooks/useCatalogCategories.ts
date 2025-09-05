// Hook para acessar o catálogo global de categorias (não vinculado a organização)
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CatalogCategory {
  id: string;
  nome: string;
  descricao?: string;
  cor?: string;
  icone?: string;
  nivel: number; // 1=Principal, 2=Categoria, 3=Subcategoria
  categoria_principal_id?: string;
  categoria_id?: string;
  categoria_completa?: string;
  ordem?: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useCatalogCategories = () => {
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Carregando catálogo global de categorias...');
      
      const { data, error } = await supabase
        .from('categorias_catalogo')
        .select('*')
        .eq('ativo', true)
        .order('nivel', { ascending: true })
        .order('ordem', { ascending: true })
        .order('nome');

      if (error) {
        console.error('❌ Erro ao carregar catálogo:', error);
        throw error;
      }
      
      console.log('✅ Catálogo carregado:', data?.length || 0, 'categorias');
      console.log('🔍 Debug - primeiras categorias:', data?.slice(0, 5));
      setCategories((data || []) as CatalogCategory[]);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar catálogo';
      setError(errorMessage);
      console.error('Error loading catalog categories:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helpers para filtrar por nível
  const getCategoriasPrincipais = () => {
    const principais = categories.filter(cat => cat.nivel === 1);
    console.log('🔍 Catalog getCategoriasPrincipais:', principais.length, principais.map(c => c.nome));
    return principais;
  };

  const getCategorias = (categoriaPrincipalId: string) => {
    const cats = categories.filter(cat => cat.nivel === 2 && cat.categoria_principal_id === categoriaPrincipalId);
    console.log('🔍 Catalog getCategorias para', categoriaPrincipalId, ':', cats.length, cats.map(c => c.nome));
    return cats;
  };

  const getSubcategorias = (categoriaId: string) => {
    const subcats = categories.filter(cat => cat.nivel === 3 && cat.categoria_id === categoriaId);
    console.log('🔍 Catalog getSubcategorias para', categoriaId, ':', subcats.length, subcats.map(c => c.nome));
    return subcats;
  };

  useEffect(() => {
    loadCategories();
  }, []);
  
  // Forçar reload na montagem do componente e quando dados podem ter mudado
  useEffect(() => {
    const timer = setTimeout(() => {
      if (categories.length === 0) {
        console.log('🔄 Recarregando categorias automaticamente...');
        loadCategories();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [categories.length]);

  // Forçar refresh para buscar novos dados de nível 3
  useEffect(() => {
    const forceRefresh = setTimeout(() => {
      console.log('🔄 Forçando refresh do catálogo para incluir nível 3...');
      loadCategories();
    }, 500);
    
    return () => clearTimeout(forceRefresh);
  }, []);

  return {
    categories,
    loading,
    error,
    refreshCategories: loadCategories,
    getCategoriasPrincipais,
    getCategorias,
    getSubcategorias
  };
};