// Hook para acessar o catálogo global de categorias (não vinculado a organização)
import { useState, useEffect, useCallback } from 'react';
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

  // Helpers para filtrar por nível - memoizados para evitar re-renders
  const getCategoriasPrincipais = useCallback(() => {
    const principais = categories.filter(cat => cat.nivel === 1);
    return principais;
  }, [categories]);

  const getCategorias = useCallback((categoriaPrincipalId: string) => {
    const cats = categories.filter(cat => cat.nivel === 2 && cat.categoria_principal_id === categoriaPrincipalId);
    return cats;
  }, [categories]);

  const getSubcategorias = useCallback((categoriaId: string) => {
    const subcats = categories.filter(cat => cat.nivel === 3 && cat.categoria_id === categoriaId);
    return subcats;
  }, [categories]);

  useEffect(() => {
    loadCategories();
  }, []);
  
  // Carregamento único na montagem

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