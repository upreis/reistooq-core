// Hook para gerenciar categorias hierárquicas (Categoria Principal > Categoria > Subcategoria)
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CategoryHierarchyGenerator } from '@/utils/categoryHierarchyGenerator';

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

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Carregando categorias hierárquicas...');
      
      const { data, error } = await supabase
        .from('categorias_produtos')
        .select('*')
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
      
      // Auto-gerar hierarquia se necessário
      await checkAndGenerateHierarchy((data || []) as HierarchicalCategory[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar categorias');
      console.error('Error loading hierarchical categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkAndGenerateHierarchy = async (currentCategories: HierarchicalCategory[]) => {
    try {
      // Contar categorias por nível
      const level1Count = currentCategories.filter(c => c.nivel === 1).length;
      const level2Count = currentCategories.filter(c => c.nivel === 2).length;
      const level3Count = currentCategories.filter(c => c.nivel === 3).length;
      
      // Se há categorias principais mas poucas subcategorias, verificar se há produtos com hierarquia
      if (level1Count > 0 && level2Count + level3Count < 5) {
        const { data: products } = await supabase
          .from('produtos')
          .select('categoria')
          .not('categoria', 'is', null)
          .like('categoria', '%→%')
          .limit(1);
        
        // Se há produtos com hierarquia, gerar automaticamente
        if (products && products.length > 0) {
          console.log('🔄 Auto-gerando hierarquia de categorias...');
          const result = await CategoryHierarchyGenerator.generateFromProducts();
          if (result.success && result.created && result.created > 0) {
            console.log(`✅ ${result.created} categorias geradas automaticamente`);
            // Recarregar categorias após geração
            setTimeout(() => loadCategories(), 1000);
          }
        }
      }
    } catch (error) {
      console.log('Erro na verificação automática:', error);
      // Não exibir erro para o usuário, é um processo em background
    }
  };

  const createCategory = async (data: CreateHierarchicalCategoryData) => {
    const { error } = await supabase
      .from('categorias_produtos')
      .insert({
        ...data,
        ativo: true,
        organization_id: '' // Will be set by RLS trigger
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
  const getCategoriasPrincipais = () => 
    categories.filter(cat => cat.nivel === 1);

  const getCategorias = (categoriaPrincipalId: string) => 
    categories.filter(cat => cat.nivel === 2 && cat.categoria_principal_id === categoriaPrincipalId);

  const getSubcategorias = (categoriaId: string) => 
    categories.filter(cat => cat.nivel === 3 && cat.categoria_id === categoriaId);

  useEffect(() => {
    loadCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refreshCategories: loadCategories,
    getCategoriasPrincipais,
    getCategorias,
    getSubcategorias
  };
};