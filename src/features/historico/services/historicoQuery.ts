import { supabase } from "@/integrations/supabase/client";

export interface FetchHistoricoParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: {
    by: 'data_pedido' | 'numero_pedido' | 'valor_total' | 'quantidade' | 'cliente_nome' | 'status';
    dir: 'asc' | 'desc';
  };
  from?: string;
  to?: string;
  status?: string[];
}

export interface FetchHistoricoResult {
  rows: any[];
  total: number;
  rls?: boolean;
  code?: string | number;
  message?: string;
}

export async function fetchHistorico(params: FetchHistoricoParams): Promise<FetchHistoricoResult> {
  const {
    page = 1,
    pageSize = 20,
    search = '',
    sort = { by: 'data_pedido', dir: 'desc' },
    from,
    to,
    status
  } = params;

  try {
    console.log('🔍 Fetching histórico:', params);

    // DEPRECATED: Esta query direta não funcionará mais devido ao RLS hardening
    // RECOMENDAÇÃO: Use HistoricoQueryService.getHistorico() com RPC segura
    console.warn('DEPRECADO: Use HistoricoQueryService.getHistorico() ao invés desta função');
    
    // Fallback para RPC quando possível
    const offset = (page - 1) * pageSize;
    const rpcResult = await supabase.rpc('get_historico_vendas_masked', {
      _search: search || null,
      _limit: pageSize,
      _offset: offset
    });
    
    if (rpcResult.data) {
      return {
        rows: rpcResult.data,
        total: rpcResult.data.length
      };
    }

    // Fallback para view segura
    let query = supabase
      .from('historico_vendas_safe')
      .select('id, numero_pedido, sku_produto, descricao, quantidade, valor_unitario, valor_total, data_pedido, status', { count: 'exact' });

    // Aplicar filtros de busca
    if (search.trim()) {
      query = query.or(`descricao.ilike.%${search}%,sku_produto.ilike.%${search}%,cliente_nome.ilike.%${search}%,numero_pedido.ilike.%${search}%`);
    }

    // Filtros de data
    if (from) {
      query = query.gte('data_pedido', from);
    }
    if (to) {
      query = query.lte('data_pedido', to);
    }

    // Filtro de status
    if (status && status.length > 0) {
      query = query.in('status', status);
    }

    // Ordenação
    query = query.order(sort.by, { ascending: sort.dir === 'asc' });

    // Paginação
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    query = query.range(start, end);

    const { data, count, error } = await query;

    if (error) {
      console.error('❌ Erro na query:', error);
      
      // Tratar 401/403 com um shape especial
      const code = String(error.code);
      if (code === '401' || code === '403' || code === '42501') {
        return {
          rows: [],
          total: 0,
          rls: true,
          code: error.code,
          message: error.message
        };
      }
      
      throw error;
    }

    console.log('✅ Histórico carregado:', { rows: data?.length, total: count });

    return {
      rows: data || [],
      total: count || 0
    };

  } catch (error: any) {
    console.error('❌ Erro no fetchHistorico:', error);
    
    // Tratar 401/403 mesmo em catch
    const code = String(error?.code || '');
    if (code === '401' || code === '403' || code === '42501') {
      return {
        rows: [],
        total: 0,
        rls: true,
        code: error.code,
        message: error.message
      };
    }
    
    throw error;
  }
}

// Download template
export async function downloadTemplate(): Promise<string> {
  console.warn('Usando template fallback básico');
  // Fallback básico (não podemos acessar information_schema via Supabase client)
  return 'numero_pedido,sku_produto,descricao,quantidade,valor_unitario,valor_total,data_pedido,status,cliente_nome\n# Exemplo:\n# PEDIDO001,SKU123,Produto Teste,1,100.00,100.00,2024-01-01,concluida,Cliente Teste\n';
}