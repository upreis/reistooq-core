import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Base product interface matching database columns
export interface BaseProduct {
  id: string;
  sku_interno: string;
  nome: string;
  categoria: string | null;
  descricao: string | null;
  codigo_barras: string | null;
  quantidade_atual: number;
  estoque_minimo: number;
  estoque_maximo: number;
  preco_custo: number | null;
  preco_venda: number | null;
  localizacao: string | null;
  unidade_medida_id: string | null;
  status: string;
  ativo: boolean;
  url_imagem: string | null;
  created_at: string;
  updated_at: string;
  ultima_movimentacao: string | null;
  organization_id: string | null;
  integration_account_id: string | null;
  sku_pai: string | null;
  eh_produto_pai?: boolean | null;
}

// Extended interface with additional fields for template import
export interface Product extends BaseProduct {
  // Additional fields from import template (optional for backwards compatibility)
  material?: string | null;
  cor?: string | null;
  peso_unitario_g?: number | null;
  peso_cx_master_kg?: number | null;
  comprimento?: number | null;
  largura?: number | null;
  altura?: number | null;
  cbm_cubagem?: number | null;
  cubagem_cm3?: number | null;
  ncm?: string | null;
  pis?: number | null;
  cofins?: number | null;
  imposto_importacao?: number | null;
  ipi?: number | null;
  icms?: number | null;
  url_imagem_fornecedor?: string | null;
  package?: string | null;
  package_info?: string | null;
  observacoes?: string | null;
  unidade?: string | null;
  pcs_ctn?: number | null;
  // Novos campos do template
  sob_encomenda?: boolean | null;
  dias_preparacao?: number | null;
  peso_liquido_kg?: number | null;
  peso_bruto_kg?: number | null;
  numero_volumes?: number | null;
  tipo_embalagem?: string | null;
  codigo_cest?: string | null;
  origem?: number | null;
  // Campos de categoria hierárquica
  categoria_principal?: string | null;
  categoria_nivel2?: string | null;
  subcategoria?: string | null;
}

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
  }) => {
    console.log('🔍 Buscando produtos no banco... Filtros:', filters);
    console.log('🏢 Local ID recebido:', filters?.local_id);

    // Se filtro por local_id, buscar de estoque_por_local
    if (filters?.local_id) {
      // Buscar produtos com estoque no local
      let query = supabase
        .from('estoque_por_local')
        .select(`
          quantidade,
          local_id,
          produtos (*)
        `)
        .eq('local_id', filters.local_id)
        .order('created_at', { ascending: false });

      const { data: estoqueData, error } = await query;
      
      console.log('📦 Dados brutos de estoque_por_local:', estoqueData?.slice(0, 3));
      
      if (error) {
        console.error('Error fetching products from estoque_por_local:', error);
        throw error;
      }

      // Buscar TODOS os produtos para incluir os que não têm estoque local ainda
      const { data: allProductsData, error: allProductsError } = await supabase
        .from('produtos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (allProductsError) {
        console.error('Error fetching all products:', allProductsError);
      }

      console.log('📦 Total de produtos no banco:', allProductsData?.length || 0);

      // Mapear dados para formato Product com quantidade do local
      const productsWithLocalStock = (estoqueData || [])
        .filter(item => item.produtos)
        .map(item => {
          const produto = item.produtos as unknown as Product;
          return {
            ...produto,
            quantidade_atual: item.quantidade
          } as Product;
        });

      // Adicionar produtos que não estão em estoque_por_local
      const existingProductIds = new Set(productsWithLocalStock.map(p => p.id));
      const productsWithoutLocalStock = (allProductsData || [])
        .filter(p => !existingProductIds.has(p.id))
        .map(p => ({
          ...p as unknown as Product,
          quantidade_atual: 0 // Produtos sem estoque local têm quantidade 0
        }));

      const allProducts = [...productsWithLocalStock, ...productsWithoutLocalStock]
        .filter(p => {
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

      console.log(`✅ Total de produtos (com e sem estoque local): ${allProducts.length}`);
      console.log(`📦 Com estoque local: ${productsWithLocalStock.length}`);
      console.log(`📦 Sem estoque local: ${productsWithoutLocalStock.length}`);
      
      return allProducts;
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
    
    console.log(`✅ Produtos encontrados: ${data?.length || 0}`);
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
    console.log('🔨 [createProduct] Iniciando criação:', {
      sku: product.sku_interno,
      nome: product.nome,
      quantidade: product.quantidade_atual
    });
    
    const orgId = await getCurrentOrgId();
    console.log('🏢 [createProduct] Organization ID:', orgId);

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
      'url_imagem', 'sku_pai', 'eh_produto_pai'
    ];

    if (existingProduct) {
      // Se o produto já existe (ativo ou inativo), atualizar com os novos dados (apenas campos permitidos)
      console.log(`🔄 Atualizando produto existente: ${product.sku_interno} (${existingProduct.ativo ? 'ativo' : 'inativo'})`);
      
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

    console.log('💾 [createProduct] Inserindo produto:', {
      sku: payload.sku_interno,
      organization_id: payload.organization_id
    });
    
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
    
    console.log('✅ [createProduct] Produto criado com sucesso:', data.id);

    // ✅ Criar registro de estoque APENAS NO ESTOQUE PRINCIPAL
    try {
      console.log('🏪 [createProduct] Buscando local principal...');
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
        console.log('✅ [createProduct] Local principal encontrado:', {
          id: localPrincipal.id,
          nome: localPrincipal.nome,
          tipo: localPrincipal.tipo
        });
        
        console.log('📦 [createProduct] Criando estoque_por_local:', {
          produto_id: data.id,
          local_id: localPrincipal.id,
          quantidade: product.quantidade_atual || 0,
          organization_id: orgId
        });
        
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
          console.log(`✅ [createProduct] Estoque criado no local "${localPrincipal.nome}": ${product.quantidade_atual || 0} unidades`);
        }
      } else {
        console.warn('⚠️ [createProduct] NENHUM local principal encontrado. Produto criado sem estoque_por_local.');
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
      'url_imagem', 'sku_pai', 'eh_produto_pai'
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
      console.warn('🔄 Produto órfão detectado, aplicando fallback...');
      
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

      console.log('✅ Produto órfão corrigido e atualizado');
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
          } else {
            console.log(`✅ Estoque atualizado no local ${localNome}: ${filteredUpdates.quantidade_atual}`);
          }
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
          } else {
            console.log(`✅ Estoque criado no local ${localNome}: ${filteredUpdates.quantidade_atual}`);
          }
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

    console.log('✅ Produto excluído permanentemente do banco:', id);
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