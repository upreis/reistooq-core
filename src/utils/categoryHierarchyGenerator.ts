// Utilitário para gerar hierarquia de categorias a partir dos produtos
import { supabase } from '@/integrations/supabase/client';

interface CategoryData {
  nome: string;
  nivel: 1 | 2 | 3;
  categoria_principal_id?: string;
  categoria_id?: string;
  cor?: string;
  icone?: string;
}

export class CategoryHierarchyGenerator {
  private static categoriesCache = new Map<string, string>();

  static async generateFromProducts() {
    try {
      console.log('🔍 Iniciando geração de hierarquia de categorias...');
      
      // 1. Buscar todos os produtos com categorias
      const { data: produtos, error: produtosError } = await supabase
        .from('produtos')
        .select('categoria')
        .not('categoria', 'is', null)
        .neq('categoria', '');

      if (produtosError) throw produtosError;

      console.log(`📦 Encontrados ${produtos.length} produtos com categorias`);

      // 2. Buscar categorias existentes
      const { data: categoriasExistentes, error: categoriasError } = await supabase
        .from('categorias_produtos')
        .select('*')
        .eq('ativo', true);

      if (categoriasError) throw categoriasError;

      // 3. Mapear categorias existentes para evitar duplicatas
      const existingCategories = new Set<string>();
      const categoryIdMap = new Map<string, string>();
      
      categoriasExistentes.forEach(cat => {
        const key = `${cat.nivel}-${cat.nome}`;
        existingCategories.add(key);
        categoryIdMap.set(cat.nome, cat.id);
      });

      // 4. Processar categorias dos produtos
      const categoryHierarchy = new Map<string, Set<string>>();
      const subcategoryHierarchy = new Map<string, Set<string>>();

      produtos.forEach(produto => {
        const categoria = produto.categoria;
        if (!categoria.includes('→')) return; // Pular categorias simples

        const parts = categoria.split('→').map(p => p.trim());
        if (parts.length < 2) return;

        const [principal, categoria2, subcategoria] = parts;

        // Mapear categoria principal -> categorias
        if (!categoryHierarchy.has(principal)) {
          categoryHierarchy.set(principal, new Set());
        }
        categoryHierarchy.get(principal)!.add(categoria2);

        // Mapear categoria -> subcategorias (se houver)
        if (subcategoria) {
          const categoryKey = `${principal}→${categoria2}`;
          if (!subcategoryHierarchy.has(categoryKey)) {
            subcategoryHierarchy.set(categoryKey, new Set());
          }
          subcategoryHierarchy.get(categoryKey)!.add(subcategoria);
        }
      });

      console.log(`🏗️ Hierarquia mapeada: ${categoryHierarchy.size} principais, ${subcategoryHierarchy.size} grupos de subcategorias`);

      // 5. Criar categorias de nível 2
      let createdCategories = 0;
      const colors = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#ec4899'];

      for (const [principal, categorias] of categoryHierarchy) {
        const principalId = categoryIdMap.get(principal);
        if (!principalId) {
          console.warn(`⚠️ Categoria principal "${principal}" não encontrada`);
          continue;
        }

        for (const categoriaNome of categorias) {
          const key = `2-${categoriaNome}`;
          if (existingCategories.has(key)) continue;

          try {
            const { data, error } = await supabase
              .from('categorias_produtos')
              .insert({
                nome: categoriaNome,
                nivel: 2,
                categoria_principal_id: principalId,
                cor: colors[createdCategories % colors.length],
                ativo: true,
                organization_id: '' // Será definido pelo RLS trigger
              })
              .select()
              .single();

            if (error) throw error;

            categoryIdMap.set(categoriaNome, data.id);
            existingCategories.add(key);
            createdCategories++;
            console.log(`✅ Categoria criada: ${categoriaNome} (nível 2)`);
          } catch (error) {
            console.error(`❌ Erro ao criar categoria "${categoriaNome}":`, error);
          }
        }
      }

      // 6. Criar subcategorias de nível 3
      for (const [categoryKey, subcategorias] of subcategoryHierarchy) {
        const [principal, categoria2] = categoryKey.split('→');
        const categoria2Id = categoryIdMap.get(categoria2);
        const principalId = categoryIdMap.get(principal);

        if (!categoria2Id || !principalId) {
          console.warn(`⚠️ IDs não encontrados para "${categoryKey}"`);
          continue;
        }

        for (const subcategoriaNome of subcategorias) {
          const key = `3-${subcategoriaNome}`;
          if (existingCategories.has(key)) continue;

          try {
            const { error } = await supabase
              .from('categorias_produtos')
              .insert({
                nome: subcategoriaNome,
                nivel: 3,
                categoria_principal_id: principalId,
                categoria_id: categoria2Id,
                cor: colors[createdCategories % colors.length],
                ativo: true,
                organization_id: '' // Será definido pelo RLS trigger
              });

            if (error) throw error;

            existingCategories.add(key);
            createdCategories++;
            console.log(`✅ Subcategoria criada: ${subcategoriaNome} (nível 3)`);
          } catch (error) {
            console.error(`❌ Erro ao criar subcategoria "${subcategoriaNome}":`, error);
          }
        }
      }

      console.log(`🎉 Geração concluída! ${createdCategories} categorias criadas`);
      return { success: true, created: createdCategories };

    } catch (error) {
      console.error('❌ Erro na geração de hierarquia:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  static async cleanupDuplicates() {
    try {
      // Remove categorias duplicadas manualmente
      const { data: categorias, error } = await supabase
        .from('categorias_produtos')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Agrupar por nome e nível, manter apenas a primeira
      const seen = new Set<string>();
      const toDelete: string[] = [];

      categorias.forEach(cat => {
        const key = `${cat.nivel}-${cat.nome}`;
        if (seen.has(key)) {
          toDelete.push(cat.id);
        } else {
          seen.add(key);
        }
      });

      if (toDelete.length > 0) {
        await supabase
          .from('categorias_produtos')
          .update({ ativo: false })
          .in('id', toDelete);
      }
      
      console.log(`🧹 Limpeza concluída: ${toDelete.length} duplicatas removidas`);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro na limpeza:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }
}