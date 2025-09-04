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
      
      console.log('📊 Auditoria de categorias:', {
        'Categorias Principais (nível 1)': level1Count,
        'Categorias (nível 2)': level2Count,
        'Subcategorias (nível 3)': level3Count,
        'Total': currentCategories.length
      });
      
      // SEMPRE criar hierarquia se não há categorias de nível 2 ou se há muito poucas
      if (level2Count < 10) {
        console.log('🔄 Iniciando criação da hierarquia completa...');
        await createCompleteHierarchy();
        return;
      }

      console.log('✅ Hierarquia já existe com', level2Count, 'categorias de nível 2');
      
    } catch (error) {
      console.error('❌ Erro na verificação automática:', error);
    }
  };

  const createCompleteHierarchy = async () => {
    try {
      console.log('🔄 Criando hierarquia completa de categorias...');
      
      // Estrutura completa extraída das imagens
      const hierarchyData = {
        'Casa, Móveis e Decoração': {
          'Decoração': ['Almofadas', 'Arranjos e Flores Artificiais', 'Cestas', 'Cortinas e Persianas'],
          'Móveis': ['Poltronas e Sofás', 'Mesas', 'Cadeiras', 'Estantes e Prateleiras'],
          'Organização': ['Cabides', 'Caixas Organizadoras', 'Ganchos', 'Prateleiras'],
          'Iluminação': ['Luminárias', 'Abajures', 'Lâmpadas', 'Lustres'],
          'Jardim': ['Vasos', 'Plantas Artificiais', 'Ferramentas de Jardim', 'Sementes']
        },
        'Eletrônicos, Áudio e Vídeo': {
          'Smartphones': ['iPhone', 'Samsung Galaxy', 'Xiaomi', 'Motorola'],
          'Tablets': ['iPad', 'Samsung Tab', 'Lenovo Tab', 'Positivo'],
          'Notebooks': ['Dell', 'HP', 'Lenovo', 'Asus'],
          'Áudio': ['Fones de Ouvido', 'Caixas de Som', 'Microfones', 'Amplificadores']
        },
        'Beleza e Cuidado Pessoal': {
          'Barbearia': ['Navalhas de Barbear', 'Pentes Alisadores de Barbas', 'Pincéis de Barba', 'Produtos Pós Barba'],
          'Cuidados com a Pele': ['Autobronzeador', 'Cuidado Facial', 'Cuidado do Corpo', 'Proteção Solar'],
          'Cuidados com o Cabelo': ['Cremes de Pentear', 'Fixadores para o Cabelo', 'Tratamentos com Cabelo'],
          'Farmácia': ['Algodões', 'Bandagens', 'Bicarbonato de Sódio', 'Bolsas de Colostomia'],
          'Higiene Pessoal': ['Absorventes para Axilas', 'Barbeadores Descartáveis', 'Cartuchos para Barbeadores'],
          'Manicure e Pedicure': ['Acetonas', 'Decoração de Unhas', 'Dedos para Treino', 'Diluentes de Esmaltes']
        },
        'Bebês': {
          'Higiene e Cuidados com o Bebê': ['Escovas e Pentes', 'Esponjas de Banho', 'Fraldas', 'Kits Cuidados para Bebês'],
          'Alimentação e Amamentação': ['Babadores', 'Bombas de Tirar Leite', 'Cadeiras de Alimentação', 'Copos, Pratos e Talheres'],
          'Brinquedos para Bebês': ['Balanços', 'Bolas', 'Bonecos de Atividades', 'Brinquedos de Empurrar e Puxar'],
          'Quarto do Bebê': ['Almofadas', 'Berços e Moises', 'Colchão para Berço', 'Enfeites de Porta']
        },
        'Arte, Papelaria e Armarinho': {
          'Artigos de Armarinho': ['Flores de Tecido', 'Franjas', 'Lantejuelas', 'Lãs'],
          'Materiais Escolares': ['Agendas', 'Comercial e Organização', 'Elásticos de Borracha', 'Escolar'],
          'Arte e Trabalhos Manuais': ['Artesanato em Cerâmica', 'Artesanato em Resina', 'Pincéis e Objetos para Pintar']
        },
        'Animais': {
          'Cães': ['Adestramento', 'Alimento, Petisco e Suplemento', 'Cadeiras de Rocha', 'Camas e Casas'],
          'Gatos': ['Gatos', 'Higiene', 'Portas e Rampas'],
          'Peixes': ['Acessórios para Aquários', 'Alimentos'],
          'Aves e Acessórios': ['Anilhas de Marcação', 'Bebedouros e Comedouros', 'Brinquedos', 'Gaiolas']
        },
        'Alimentos e Bebidas': {
          'Bebidas': ['Bebidas Alcoólicas Mistas', 'Bebidas Aperitivas', 'Bebidas Brancas e Licores', 'Cervejas'],
          'Mercearia': ['Algas Marinhas Nori', 'Alimentos Instantâneos', 'Arroz, Legumes e Sementes', 'Açúcar e Adoçantes'],
          'Frescos': ['Carnes e Frangos', 'Frios', 'Frutas e Vegetais', 'Laticínios']
        },
        'Acessórios para Veículos': {
          'Peças de Carros e Caminhonetes': ['Eletroventiladores', 'Fechaduras e Chaves', 'Filtros', 'Freios'],
          'Limpeza Automotiva': ['Anticorrosivos', 'Aspiradores', 'Brilhos', 'Ceras'],
          'Som Automotivo': ['Alto-Falantes', 'Antenas', 'Cabos e Conectores', 'Caixas Acústicas']
        }
      };

      // Criar/buscar categorias principais
      for (const [principalName, categories] of Object.entries(hierarchyData)) {
        console.log(`🔄 Processando categoria principal: ${principalName}`);
        
        // Primeiro, tentar buscar a categoria principal existente
        let { data: existingPrincipal } = await supabase
          .from('categorias_produtos')
          .select('id')
          .eq('nome', principalName)
          .eq('nivel', 1)
          .maybeSingle();

        let principalId = existingPrincipal?.id;

        // Se não existir, criar nova categoria principal
        if (!principalId) {
          const { data: newPrincipal, error: principalError } = await supabase
            .from('categorias_produtos')
            .insert({
              nome: principalName,
              nivel: 1,
              ativo: true,
              ordem: Object.keys(hierarchyData).indexOf(principalName) + 1,
              organization_id: '' // Will be set by RLS trigger
            })
            .select('id')
            .maybeSingle();

          if (principalError) {
            console.error('❌ Erro ao criar categoria principal:', principalError);
            continue;
          }
          
          principalId = newPrincipal?.id;
          console.log(`✅ Categoria principal criada: ${principalName}`);
        } else {
          console.log(`✅ Categoria principal encontrada: ${principalName}`);
        }

        if (!principalId) {
          console.error(`❌ Não foi possível obter ID para ${principalName}`);
          continue;
        }

        // Criar categorias de nível 2
        for (const [categoryName, subcategories] of Object.entries(categories)) {
          console.log(`  🔄 Processando categoria de nível 2: ${categoryName}`);
          
          // Verificar se a categoria de nível 2 já existe
          let { data: existingCategory } = await supabase
            .from('categorias_produtos')
            .select('id')
            .eq('nome', categoryName)
            .eq('nivel', 2)
            .eq('categoria_principal_id', principalId)
            .maybeSingle();

          let categoryId = existingCategory?.id;

          // Se não existir, criar nova categoria de nível 2
          if (!categoryId) {
            const { data: newCategory, error: categoryError } = await supabase
              .from('categorias_produtos')
              .insert({
                nome: categoryName,
                nivel: 2,
                categoria_principal_id: principalId,
                ativo: true,
                ordem: Object.keys(categories).indexOf(categoryName) + 1,
                organization_id: '' // Will be set by RLS trigger
              })
              .select('id')
              .maybeSingle();

            if (categoryError) {
              console.error('❌ Erro ao criar categoria de nível 2:', categoryError);
              continue;
            }
            
            categoryId = newCategory?.id;
            console.log(`    ✅ Categoria de nível 2 criada: ${categoryName}`);
          } else {
            console.log(`    ✅ Categoria de nível 2 encontrada: ${categoryName}`);
          }

          if (!categoryId) {
            console.error(`❌ Não foi possível obter ID para categoria ${categoryName}`);
            continue;
          }

          // Criar subcategorias de nível 3
          for (let i = 0; i < subcategories.length; i++) {
            const subcategoryName = subcategories[i];
            
            // Verificar se a subcategoria já existe
            const { data: existingSubcategory } = await supabase
              .from('categorias_produtos')
              .select('id')
              .eq('nome', subcategoryName)
              .eq('nivel', 3)
              .eq('categoria_id', categoryId)
              .maybeSingle();

            if (!existingSubcategory) {
              const { error: subcategoryError } = await supabase
                .from('categorias_produtos')
                .insert({
                  nome: subcategoryName,
                  nivel: 3,
                  categoria_id: categoryId,
                  ativo: true,
                  ordem: i + 1,
                  organization_id: '' // Will be set by RLS trigger
                });

              if (subcategoryError) {
                console.error('❌ Erro ao criar subcategoria:', subcategoryError);
              } else {
                console.log(`      ✅ Subcategoria criada: ${subcategoryName}`);
              }
            } else {
              console.log(`      ✅ Subcategoria já existe: ${subcategoryName}`);
            }
          }
        }
      }

      console.log('✅ Hierarquia completa processada com sucesso!');
      
      // Recarregar categorias após criação
      setTimeout(() => {
        console.log('🔄 Recarregando categorias após criação da hierarquia...');
        loadCategories();
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao criar hierarquia completa:', error);
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