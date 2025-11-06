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
    from,
    to,
  } = params;

  try {
    console.log('🔍 Fetching histórico:', params);

    // Use only the secure RPC function - no more fallbacks to unsafe views
    const offset = (page - 1) * pageSize;
    const { data, error } = await supabase.rpc('get_historico_vendas_masked', {
      _search: search || null,
      _start: from || null,
      _end: to || null,
      _limit: pageSize,
      _offset: offset
    });
    
    if (error) {
      console.error('❌ Erro no RPC:', error);
      
      // Handle RLS/permission errors
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

    const rows = (data as any[]) || [];

    console.log('✅ Histórico carregado via RPC:', { rows: rows.length });

    return {
      rows,
      total: rows.length
    };

  } catch (error: any) {
    console.error('❌ Erro no fetchHistorico:', error);
    
    // Handle RLS/permission errors in catch
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