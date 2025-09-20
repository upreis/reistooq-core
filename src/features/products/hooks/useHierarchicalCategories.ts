// Hook para gerenciar categorias hierárquicas (Categoria Principal > Categoria > Subcategoria)
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { logger } from '@/utils/logger';

export interface HierarchicalCategory {
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
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateHierarchicalCategoryData {
  nome: string;
  descricao?: string;
  cor?: string;
  icone?: string;
  nivel: number;
  categoria_principal_id?: string;
  categoria_id?: string;
  ordem?: number;
}

export const useHierarchicalCategories = () => {
  const [categories, setCategories] = useState<HierarchicalCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { profile, loading: profileLoading } = useCurrentProfile();
  const orgId = profile?.organizacao_id || null;
  const generationAttemptedRef = useRef(false);

  const loadCategories = async () => {
    try {
      if (profileLoading) return; // Aguarda perfil

      setLoading(true);
      setError(null);
      
      if (!orgId) {
        logger.warn('Organização não disponível. Pulando carregamento de categorias.');
        setCategories([]);
        return;
      }
      
      logger.info('Carregando categorias hierárquicas para org:', { orgId });
      
      const { data, error } = await supabase
        .from('categorias_produtos')
        .select('*')
        .eq('organization_id', orgId)
        .eq('ativo', true)
        .order('nivel', { ascending: true })
        .order('ordem', { ascending: true })
        .order('nome');

      if (error) {
        logger.error('Erro ao carregar categorias:', error);
        throw error;
      }
      
      logger.info('Categorias carregadas:', { count: data?.length || 0 });
      setCategories((data || []) as HierarchicalCategory[]);
      
      // Auto-sincronizar se necessário e não tentado ainda
      const level1Count = (data || []).filter(c => c.nivel === 1).length;
      const level2Count = (data || []).filter(c => c.nivel === 2).length;
      // Se faltam principais (<8) ou quase nenhum nível 2 (<10), sincroniza
      if ((level1Count < 8 || level2Count < 10) && !generationAttemptedRef.current) {
        generationAttemptedRef.current = true;
        logger.info('Executando sincronização automática de categorias');
        setTimeout(syncCategories, 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar categorias');
      logger.error('Error loading hierarchical categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const syncCategories = async () => {
    try {
      if (!orgId) {
        logger.warn('Organização não disponível. Pulando sincronização.');
        return;
      }

      logger.info('Executando sincronização de categorias padrão...');
      
      const { data, error } = await supabase.rpc('seed_default_categories');
      
      if (error) {
        logger.error('Erro ao sincronizar categorias:', error);
        throw error;
      }
      
      logger.info('Sincronização concluída:', { data: JSON.stringify(data) });
      
      // Recarregar categorias após sincronização
      setTimeout(loadCategories, 500);
      
    } catch (error) {
      logger.error('Erro na sincronização:', error);
    }
  };

  const createCategory = async (data: CreateHierarchicalCategoryData) => {
    const { error } = await supabase
      .from('categorias_produtos')
      .insert({
        ...data,
        ativo: true,
        organization_id: orgId
      });

    if (error) throw error;
    
    await loadCategories();
  };

  const updateCategory = async (id: string, data: CreateHierarchicalCategoryData) => {
    const { error } = await supabase
      .from('categorias_produtos')
      .update(data)
      .eq('id', id);

    if (error) throw error;
    
    await loadCategories();
  };

  const deleteCategory = async (id: string) => {
    // Soft delete - mark as inactive instead of hard delete
    const { error } = await supabase
      .from('categorias_produtos')
      .update({ ativo: false })
      .eq('id', id);

    if (error) throw error;
    
    await loadCategories();
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
  }, [orgId, profileLoading]);

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refreshCategories: loadCategories,
    syncCategories,
    getCategoriasPrincipais,
    getCategorias,
    getSubcategorias
  };
};