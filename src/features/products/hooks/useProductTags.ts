// 🎯 Hook para gerenciar tags de produtos
// CRUD completo para tags coloridas dos produtos

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProductTag {
  id: string;
  nome: string;
  cor: string;
  organization_id: string;
  created_at: string;
}

interface CreateTagData {
  nome: string;
  cor: string;
}

export const useProductTags = () => {
  const [tags, setTags] = useState<ProductTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTags = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('produto_tags')
        .select('*')
        .order('nome');

      if (error) throw error;
      
      setTags(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tags');
      console.error('Error loading tags:', err);
    } finally {
      setLoading(false);
    }
  };

  const createTag = async (data: CreateTagData) => {
    const { error } = await supabase
      .from('produto_tags')
      .insert({
        ...data,
        organization_id: '' // Will be set by RLS trigger
      });

    if (error) throw error;
    
    await loadTags();
  };

  const updateTag = async (id: string, data: CreateTagData) => {
    const { error } = await supabase
      .from('produto_tags')
      .update(data)
      .eq('id', id);

    if (error) throw error;
    
    await loadTags();
  };

  const deleteTag = async (id: string) => {
    // First, remove tag from all products
    await supabase
      .from('produto_tag_relacionamentos')
      .delete()
      .eq('tag_id', id);

    // Then delete the tag
    const { error } = await supabase
      .from('produto_tags')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    await loadTags();
  };

  useEffect(() => {
    loadTags();
  }, []);

  return {
    tags,
    loading,
    error,
    createTag,
    updateTag,
    deleteTag,
    refreshTags: loadTags
  };
};