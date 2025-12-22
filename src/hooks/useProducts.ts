import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Re-export types from centralized location for backwards compatibility
export type { BaseProduct, Product } from "@/types/product";
import type { BaseProduct, Product } from "@/types/product";

export const useProducts = () => {
  const { user } = useAuth();

  const getCurrentOrgId = useCallback(async (): Promise<string> => {
    const { data, error } = await supabase.rpc('get_current_org_id');
    if (error || !data) {
      throw new Error('Não foi possível obter a organização atual.');
    }
    return data as unknown as string;
  }, []);

  const getProducts = useCallback(async (filters?: {
    search?: string;
    categoria?: string;
    status?: string;
    limit?: number;
    offset?: number;
    ativo?: boolean | 'all';
    local_id?: string;
    /**
     * Quando true, inclui também produtos que ainda não possuem registro em estoque_por_local,
     * atribuindo quantidade 0. Para locais recém-criados isso deve ser false.
     */
    include_all_products?: boolean;
  }) => {
    const applyClientFilters = (items: Product[]) => {
      return items.filter((p) => {
        // Aplicar filtros de ativo/inativo
        if (filters?.ativo === true && !p.ativo) return false;
        if (filters?.ativo === false && p.ativo) return false;

        // Aplicar filtro de busca
        if (filters?.search) {
          const searchLower = filters.search.toLowerCase();
          return (
            p.nome?.toLowerCase().includes(searchLower) ||
            p.sku_interno?.toLowerCase().includes(searchLower) ||
            p.codigo_barras?.toLowerCase().includes(searchLower)
          );
        }

        // Aplicar filtro de categoria
        if (filters?.categoria && p.categoria !== filters.categoria) return false;

        // Aplicar filtro de status
        if (filters?.status && p.status !== filters.status) return false;

        return true;
      });
    };

    // Buscar produtos com filtros aplicados

    // Se filtro por local_id, buscar de estoque_por_local
    if (filters?.local_id) {
      // Buscar produtos com estoque no local usando LEFT JOIN
      // Isso garante que tenhamos acesso a TODOS os campos de produtos
      const { data: estoqueData, error } = await supabase
        .from('estoque_por_local')
        .select(
          `
          quantidade,
          local_id,
          produtos (*)
        `,
        )
        .eq('local_id', filters.local_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products from estoque_por_local:', error);
        throw error;
      }

      // Mapear dados para formato Product com quantidade do local
      const productsWithLocalStock = (estoqueData || [])
        .filter((item) => item.produtos)
        .map((item) => {
          const produto = item.produtos as unknown as Product;
          return {
            ...produto,
            quantidade_atual: item.quantidade,
          } as Product;
        });

      // Por padrão, locais não-principais devem ser “vazios” até receber transferência.
      const includeAll = filters.include_all_products ?? false;
      if (!includeAll) {
        return applyClientFilters(productsWithLocalStock);
      }

      // Buscar TODOS os produtos para incluir os que não têm estoque local ainda
      const { data: allProductsData, error: allProductsError } = await supabase
        .from('produtos')
        .select('*')
        .order('created_at', { ascending: false });

      if (allProductsError) {
        console.error('Error fetching all products:', allProductsError);
      }

      // Adicionar produtos que não estão em estoque_por_local
      const existingProductIds = new Set(productsWithLocalStock.map((p) => p.id));
      const productsWithoutLocalStock = (allProductsData || [])
        .filter((p) => !existingProductIds.has(p.id))
        .map((p) => ({
          ...(p as unknown as Product),
          quantidade_atual: 0, // Produtos sem estoque local têm quantidade 0
        }));

      return applyClientFilters([...productsWithLocalStock, ...productsWithoutLocalStock]);
    }

    // Caso contrário, buscar normalmente da tabela produtos
    let query = supabase
      .from('produtos')
      .select('*')
      .order('created_at', { ascending: false});

    // Filtro de ativo/inativo: apenas aplicar se especificado
    if (filters?.ativo === true) {
      query = query.eq('ativo', true);
    } else if (filters?.ativo === false) {
      query = query.eq('ativo', false);
    }
    // Se ativo for undefined, não aplicar nenhum filtro (mostrar todos)

    if (filters?.search) {
      query = query.or(`nome.ilike.%${filters.search}%,sku_interno.ilike.%${filters.search}%,codigo_barras.ilike.%${filters.search}%`);
    }

    if (filters?.categoria) {
      query = query.eq('categoria', filters.categoria);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset || 0) + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
    
    
    return data as unknown as Product[];
  }, []);

  const getProduct = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      throw error;
    }

    return data as unknown as Product;
  }, []);

  const createProduct = useCallback(async (product: Omit<BaseProduct, 'id' | 'created_at' | 'updated_at' | 'ultima_movimentacao' | 'organization_id' | 'integration_account_id'> & Partial<Product>) => {
    
    const orgId = await getCurrentOrgId();
    

    // Verificar se já existe um produto com o mesmo SKU na organização (ativo ou inativo)
    const { data: existingProduct } = await supabase
      .from('produtos')
      .select('id, sku_interno, ativo')
      .eq('sku_interno', product.sku_interno)
      .eq('organization_id', orgId)
      .limit(1)
      .single();

    // Buscar unidade padrão "un" para a organização atual
    const { data: unidadePadrao } = await supabase
      .from('unidades_medida')
      .select('id')
      .eq('abreviacao', 'un')
      .limit(1)
      .single();

    // Filtrar apenas colunas que existem na tabela produtos
    const allowedColumns = [
      'sku_interno', 'nome', 'categoria', 'categoria_principal', 'descricao', 'codigo_barras',
      'quantidade_atual', 'estoque_minimo', 'estoque_maximo', 'preco_custo',
      'preco_venda', 'localizacao', 'unidade_medida_id', 'status', 'ativo',
      'url_imagem', 'sku_pai', 'eh_produto_pai',
      // Campos adicionais do template
      'sob_encomenda', 'dias_preparacao', 'peso_liquido_kg', 'peso_bruto_kg',
      'numero_volumes', 'tipo_embalagem', 'largura_cm', 'altura_cm', 'comprimento_cm',
      'ncm', 'codigo_cest', 'origem', 'categoria_nivel2', 'subcategoria'
    ];

    if (existingProduct) {
      // Se o produto já existe (ativo ou inativo), atualizar com os novos dados (apenas campos permitidos)
      // Produto já existe, atualizar com novos dados
      
      const filteredUpdates = Object.keys(product).reduce((acc, key) => {
        if (allowedColumns.includes(key)) {
          acc[key] = product[key];
        }
        return acc;
      }, {} as any);
      
      return await updateProduct(existingProduct.id, { ...filteredUpdates, ativo: true });
    }

    const filteredProduct = Object.keys(product).reduce((acc, key) => {
      if (allowedColumns.includes(key)) {
        acc[key] = product[key];
      }
      return acc;
    }, {} as any);

    const payload = {
      ...filteredProduct,
      organization_id: orgId,
      unidade_medida_id: filteredProduct.unidade_medida_id || unidadePadrao?.id || null,
    };

    
    const { data, error } = await supabase
      .from('produtos')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('❌ [createProduct] Erro ao criar produto:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // Tratamento específico para violação de constraint única
      if (error.code === '23505' && error.message?.includes('produtos_sku_interno_org_unique')) {
        throw new Error(`Já existe um produto com o SKU "${product.sku_interno}" nesta organização.`);
      }
      
      throw error;
    }
    
    

    // ✅ Criar registro de estoque APENAS NO ESTOQUE PRINCIPAL
    try {
      // Buscar local principal
      const { data: localPrincipal, error: localError } = await supabase
        .from('locais_estoque')
        .select('id, nome, tipo')
        .eq('organization_id', orgId)
        .eq('tipo', 'principal')
        .eq('ativo', true)
        .maybeSingle();
      
      if (localError) {
        console.error('❌ [createProduct] Erro ao buscar local principal:', localError);
      }

      if (localPrincipal) {
        // Criar estoque no local principal
        
        const { error: estoqueError } = await supabase
          .from('estoque_por_local')
          .insert({
            produto_id: data.id,
            local_id: localPrincipal.id,
            quantidade: product.quantidade_atual || 0,
            organization_id: orgId
          });

        if (estoqueError) {
          console.error('❌ [createProduct] Erro ao criar estoque_por_local:', {
            error: estoqueError,
            code: estoqueError.code,
            message: estoqueError.message,
            details: estoqueError.details
          });
          // Não falha a criação do produto, apenas registra o erro
        } else {
          // Estoque criado com sucesso
        }
      } else {
        // Nenhum local principal encontrado
      }
    } catch (estoqueError) {
      console.error('❌ [createProduct] Exceção ao criar estoque_por_local:', estoqueError);
      // Não falha a criação do produto
    }

    return data as unknown as Product;
  }, [getCurrentOrgId]);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    const orgId = await getCurrentOrgId();

    // Filtrar apenas colunas que existem na tabela produtos
    const allowedColumns = [
      'sku_interno', 'nome', 'categoria', 'categoria_principal', 'descricao', 'codigo_barras',
      'quantidade_atual', 'estoque_minimo', 'estoque_maximo', 'preco_custo',
      'preco_venda', 'localizacao', 'unidade_medida_id', 'status', 'ativo',
      'url_imagem', 'sku_pai', 'eh_produto_pai',
      // Campos adicionais do template
      'sob_encomenda', 'dias_preparacao', 'peso_liquido_kg', 'peso_bruto_kg',
      'numero_volumes', 'tipo_embalagem', 'largura_cm', 'altura_cm', 'comprimento_cm',
      'ncm', 'codigo_cest', 'origem', 'categoria_nivel2', 'subcategoria'
    ];

    const filteredUpdates = Object.keys(updates).reduce((acc, key) => {
      if (allowedColumns.includes(key)) {
        acc[key] = updates[key];
      }
      return acc;
    }, {} as any);

    // Se estiver atualizando o SKU, verificar se não está duplicado
    if (filteredUpdates.sku_interno) {
      const { data: existingProduct } = await supabase
        .from('produtos')
        .select('id, sku_interno')
        .eq('sku_interno', filteredUpdates.sku_interno)
        .eq('organization_id', orgId)
        .neq('id', id) // Excluir o próprio produto
        .limit(1)
        .single();

      if (existingProduct) {
        throw new Error(`Já existe outro produto com o SKU "${filteredUpdates.sku_interno}" nesta organização.`);
      }
    }

    // Primeiro, tentar atualizar com organization_id válido
    let { data, error } = await supabase
      .from('produtos')
      .update(filteredUpdates)
      .eq('id', id)
      .eq('organization_id', orgId)
      .select()
      .single();

    // Se falhou (provavelmente produto órfão), tentar fallback
    if (error && error.code === 'PGRST116') {
      // Produto órfão detectado, aplicando fallback
      
      // Fallback: atualizar produto órfão e setar organization_id
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('produtos')
        .update({ ...filteredUpdates, organization_id: orgId })
        .eq('id', id)
        .is('organization_id', null)
        .select()
        .single();

      if (fallbackError) {
        console.error('Error updating orphan product:', fallbackError);
        throw fallbackError;
      }

      // Produto órfão corrigido
      data = fallbackData;
    }

    if (error) {
      console.error('Error updating product:', error);
      
      // Tratamento específico para violação de constraint única
      if (error.code === '23505' && error.message?.includes('produtos_sku_interno_org_unique')) {
        throw new Error(`Já existe outro produto com o SKU "${updates.sku_interno}" nesta organização.`);
      }
      
      throw error;
    }

    // 🆕 Se a quantidade foi atualizada, atualizar também no estoque_por_local
    if (filteredUpdates.quantidade_atual !== undefined) {
      // Tentar pegar local ativo do localStorage, senão buscar estoque principal
      const localAtivoAtual = localStorage.getItem('reistoq_local_estoque_ativo');
      let localId: string | null = null;
      let localNome: string | null = null;
      
      if (localAtivoAtual) {
        const localAtivo = JSON.parse(localAtivoAtual);
        localId = localAtivo.id;
        localNome = localAtivo.nome;
      } else {
        // Se não houver local ativo, buscar o estoque principal
        const { data: localPrincipal } = await supabase
          .from('locais_estoque')
          .select('id, nome')
          .eq('organization_id', orgId)
          .eq('tipo', 'principal')
          .eq('ativo', true)
          .maybeSingle();
        
        if (localPrincipal) {
          localId = localPrincipal.id;
          localNome = localPrincipal.nome;
        }
      }
      
      if (localId) {
        // Verificar se já existe um registro para este produto neste local
        const { data: existingEstoque } = await supabase
          .from('estoque_por_local')
          .select('id')
          .eq('produto_id', id)
          .eq('local_id', localId)
          .maybeSingle();

        if (existingEstoque) {
          // Atualizar o registro existente
          const { error: estoqueError } = await supabase
            .from('estoque_por_local')
            .update({ quantidade: filteredUpdates.quantidade_atual })
            .eq('produto_id', id)
            .eq('local_id', localId);

          if (estoqueError) {
            console.error('⚠️ Erro ao atualizar estoque_por_local:', estoqueError);
          }
          // Estoque atualizado com sucesso
        } else {
          // Criar novo registro
          const { error: estoqueError } = await supabase
            .from('estoque_por_local')
            .insert({
              produto_id: id,
              local_id: localId,
              quantidade: filteredUpdates.quantidade_atual,
              organization_id: orgId
            });

          if (estoqueError) {
            console.error('⚠️ Erro ao criar estoque_por_local:', estoqueError);
          }
          // Estoque criado com sucesso
        }
      }
    }

    return data as unknown as Product;
  }, [getCurrentOrgId]);

  const deleteProduct = useCallback(async (id: string) => {
    const orgId = await getCurrentOrgId();

    // 🗑️ EXCLUSÃO REAL do banco de dados (não apenas soft delete)
    // Remove o produto permanentemente
    const { data, error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error) {
      console.error('Error deleting product:', error);
      throw error;
    }

    
    return data as unknown as Product;
  }, [getCurrentOrgId]);

  const getProductStats = useCallback(async () => {
    // Total de produtos
    const { count: totalProducts } = await supabase
      .from('produtos')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);

    // Produtos com estoque baixo - usar função RPC para comparação entre colunas
    const { data: lowStockCount, error: lowStockError } = await supabase
      .rpc('get_low_stock_products_count' as any);
    
    if (lowStockError) {
      console.warn('Erro ao buscar produtos com estoque baixo:', lowStockError);
    }
    
    const lowStockProducts = lowStockCount || 0;

    // Produtos sem estoque
    const { count: outOfStockProducts } = await supabase
      .from('produtos')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true)
      .eq('quantidade_atual', 0);

    // Valor total do estoque
    const { data: stockValue } = await supabase
      .from('produtos')
      .select('quantidade_atual, preco_custo')
      .eq('ativo', true)
      .not('preco_custo', 'is', null);

    const totalStockValue = stockValue?.reduce((total, product) => {
      return total + (product.quantidade_atual * (product.preco_custo || 0));
    }, 0) || 0;

    return {
      totalProducts: totalProducts || 0,
      lowStockProducts: lowStockProducts || 0,
      outOfStockProducts: outOfStockProducts || 0,
      totalStockValue
    };
  }, []);

  const getCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('produtos')
      .select('categoria')
      .eq('ativo', true)
      .not('categoria', 'is', null);

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    const categories = [...new Set(data.map(item => item.categoria))].filter(Boolean);
    return categories as string[];
  }, []);

  return {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductStats,
    getCategories
  };
};