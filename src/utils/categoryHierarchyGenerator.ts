// Utilitário para gerar hierarquia de categorias a partir dos produtos
import { supabase } from '@/integrations/supabase/client';

export class CategoryHierarchyGenerator {
  static async generateFromProducts() {
    try {
      console.log('🔍 Iniciando geração de hierarquia de categorias...');
      
      // 1. Buscar todos os produtos com categorias hierárquicas
      const { data: produtos, error: produtosError } = await supabase
        .from('produtos')
        .select('categoria')
        .not('categoria', 'is', null)
        .neq('categoria', '')
        .like('categoria', '%→%');

      if (produtosError) throw produtosError;

      console.log(`📦 Encontrados ${produtos.length} produtos com categorias hierárquicas`);

      // 2. Buscar categorias existentes
      const { data: categoriasExistentes, error: categoriasError } = await supabase
        .from('categorias_produtos')
        .select('*')
        .eq('ativo', true);

      if (categoriasError) throw categoriasError;

      // 3. Mapear categorias existentes para evitar duplicatas
      const categoryIdMap = new Map<string, string>();
      const existingByLevel = new Map<string, Set<string>>();
      
      categoriasExistentes.forEach(cat => {
        categoryIdMap.set(cat.nome, cat.id);
        
        const levelKey = `${cat.nivel}`;
        if (!existingByLevel.has(levelKey)) {
          existingByLevel.set(levelKey, new Set());
        }
        existingByLevel.get(levelKey)!.add(cat.nome);
      });

      // 4. Processar categorias dos produtos
      const colors = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#ec4899'];
      let colorIndex = 0;

      // Mapear estrutura hierárquica
      const hierarchy = new Map<string, Set<string>>();
      const subcategoryMap = new Map<string, Set<string>>();

      produtos.forEach(produto => {
        const categoria = produto.categoria;
        if (!categoria.includes('→')) return;

        const parts = categoria.split('→').map(p => p.trim());
        if (parts.length < 2) return;

        const [principal, categoria2, subcategoria] = parts;

        // Mapear categoria principal -> categorias
        if (!hierarchy.has(principal)) {
          hierarchy.set(principal, new Set());
        }
        hierarchy.get(principal)!.add(categoria2);

        // Mapear categoria -> subcategorias
        if (subcategoria) {
          const catKey = `${principal}→${categoria2}`;
          if (!subcategoryMap.has(catKey)) {
            subcategoryMap.set(catKey, new Set());
          }
          subcategoryMap.get(catKey)!.add(subcategoria);
        }
      });

      console.log(`🔗 Hierarquia mapeada: ${hierarchy.size} principais, ${subcategoryMap.size} grupos de subcategorias`);

      // 5. Criar categorias de nível 2
      const toCreateLevel2: any[] = [];
      for (const [principal, categorias] of hierarchy) {
        const principalId = categoryIdMap.get(principal);
        if (!principalId) {
          console.warn(`⚠️ Categoria principal "${principal}" não encontrada`);
          continue;
        }

        for (const categoriaNome of categorias) {
          if (existingByLevel.get('2')?.has(categoriaNome)) continue;

          toCreateLevel2.push({
            nome: categoriaNome,
            nivel: 2,
            categoria_principal_id: principalId,
            cor: colors[colorIndex % colors.length],
            ativo: true,
            organization_id: '' // Será preenchido pelo RLS
          });
          
          colorIndex++;
        }
      }

      let createdCategories = 0;
      
      // Inserir categorias de nível 2
      if (toCreateLevel2.length > 0) {
        const { data: createdLevel2, error: level2Error } = await supabase
          .from('categorias_produtos')
          .insert(toCreateLevel2)
          .select();

        if (level2Error) throw level2Error;
        
        createdCategories += createdLevel2.length;
        console.log(`✅ Criadas ${createdLevel2.length} categorias de nível 2`);

        // Atualizar mapa com novas categorias
        createdLevel2.forEach(cat => {
          categoryIdMap.set(cat.nome, cat.id);
        });
      }

      // 6. Criar subcategorias de nível 3
      const toCreateLevel3: any[] = [];
      
      for (const [categoryKey, subcategorias] of subcategoryMap) {
        const [principal, categoria2] = categoryKey.split('→');
        const principalId = categoryIdMap.get(principal);
        const categoria2Id = categoryIdMap.get(categoria2);

        if (!principalId || !categoria2Id) {
          console.warn(`⚠️ IDs não encontrados para "${categoryKey}"`);
          continue;
        }

        for (const subcategoriaNome of subcategorias) {
          if (existingByLevel.get('3')?.has(subcategoriaNome)) continue;

          toCreateLevel3.push({
            nome: subcategoriaNome,
            nivel: 3,
            categoria_principal_id: principalId,
            categoria_id: categoria2Id,
            cor: colors[colorIndex % colors.length],
            ativo: true,
            organization_id: '' // Será preenchido pelo RLS
          });
          
          colorIndex++;
        }
      }

      // Inserir subcategorias de nível 3
      if (toCreateLevel3.length > 0) {
        const { data: createdLevel3, error: level3Error } = await supabase
          .from('categorias_produtos')
          .insert(toCreateLevel3)
          .select();

        if (level3Error) throw level3Error;
        
        createdCategories += createdLevel3.length;
        console.log(`✅ Criadas ${createdLevel3.length} subcategorias de nível 3`);
      }

      console.log(`🎉 Geração concluída! ${createdCategories} categorias criadas`);
      return { success: true, created: createdCategories };

    } catch (error) {
      console.error('❌ Erro na geração de hierarquia:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }
}