// 🎯 Hook para gerenciar categorias de produtos
// CRUD completo para categorias com cores e ícones

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProductCategory {
  id: string;
  nome: string;
  descricao?: string;
  cor?: string;
  icone?: string;
  ordem?: number;
  ativo: boolean;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

interface CreateCategoryData {
  nome: string;
  descricao?: string;
  cor?: string;
  icone?: string;
  ordem?: number;
}

export const useProductCategories = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('categorias_produtos')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true })
        .order('nome');

      if (error) throw error;
      
      setCategories(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar categorias');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (data: CreateCategoryData) => {
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

  const updateCategory = async (id: string, data: CreateCategoryData) => {
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
    refreshCategories: loadCategories
  };
};