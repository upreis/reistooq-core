// Hook para gerenciar categorias hierárquicas (Categoria Principal > Categoria > Subcategoria)
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';

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
        console.warn('⚠️ Organização não disponível. Pulando carregamento de categorias.');
        setCategories([]);
        return;
      }
      
      console.log('🔍 Carregando categorias hierárquicas para org:', orgId);
      
      const { data, error } = await supabase
        .from('categorias_produtos')
        .select('*')
        .eq('organization_id', orgId)
        .eq('ativo', true)
        .order('nivel', { ascending: true })
        .order('ordem', { ascending: true })
        .order('nome');

      if (error) {
        console.error('❌ Erro ao carregar categorias:', error);
        throw error;
      }
      
      console.log('✅ Categorias carregadas:', data?.length || 0);
      setCategories((data || []) as HierarchicalCategory[]);
      
      // Auto-sincronizar se necessário e não tentado ainda
      const level2Count = (data || []).filter(c => c.nivel === 2).length;
      if (level2Count < 10 && !generationAttemptedRef.current) {
        generationAttemptedRef.current = true;
        console.log('🔄 Executando sincronização automática de categorias...');
        setTimeout(syncCategories, 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar categorias');
      console.error('Error loading hierarchical categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const syncCategories = async () => {
    try {
      if (!orgId) {
        console.warn('⚠️ Organização não disponível. Pulando sincronização.');
        return;
      }

      console.log('🔄 Executando sincronização de categorias padrão...');
      
      const { data, error } = await supabase.rpc('seed_default_categories');
      
      if (error) {
        console.error('❌ Erro ao sincronizar categorias:', error);
        throw error;
      }
      
      console.log('✅ Sincronização concluída:', data);
      
      // Recarregar categorias após sincronização
      setTimeout(loadCategories, 500);
      
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
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

  // Helpers para filtrar por nível
  const getCategoriasPrincipais = () => {
    const principais = categories.filter(cat => cat.nivel === 1);
    console.log('🔍 Hook getCategoriasPrincipais:', principais.length, principais.map(c => c.nome));
    return principais;
  };

  const getCategorias = (categoriaPrincipalId: string) => {
    const cats = categories.filter(cat => cat.nivel === 2 && cat.categoria_principal_id === categoriaPrincipalId);
    console.log('🔍 Hook getCategorias para', categoriaPrincipalId, ':', cats.length, cats.map(c => c.nome));
    return cats;
  };

  const getSubcategorias = (categoriaId: string) => {
    const subcats = categories.filter(cat => cat.nivel === 3 && cat.categoria_id === categoriaId);
    console.log('🔍 Hook getSubcategorias para', categoriaId, ':', subcats.length, subcats.map(c => c.nome));
    return subcats;
  };

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