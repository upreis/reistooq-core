import { supabase } from "@/integrations/supabase/client";
import { 
  HistoricoVenda, 
  HistoricoFilters, 
  HistoricoResponse, 
  HistoricoPagination,
  HistoricoSummary,
  SortableFields 
} from "../types/historicoTypes";

export class HistoricoQueryService {
  private static readonly DEFAULT_LIMIT = 20;
  private static readonly MAX_LIMIT = 100;

  static async getHistoricoVendas(
    filters: HistoricoFilters = {},
    page: number = 1,
    limit: number = this.DEFAULT_LIMIT,
    sortBy: SortableFields = 'data_pedido',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<HistoricoResponse> {
    try {
      // Validar e limitar parâmetros
      const validatedLimit = Math.min(Math.max(limit, 1), this.MAX_LIMIT);
      const offset = (page - 1) * validatedLimit;

      console.log('🔍 Buscando histórico de vendas...', { filters, page, limit: validatedLimit, sortBy, sortOrder });

      // Query the real historico_vendas table
      let query = supabase
        .from('historico_vendas')
        .select('*', { count: 'exact' });

      // Apply date filters
      if (filters.dataInicio) {
        query = query.gte('data_pedido', filters.dataInicio);
      }
      if (filters.dataFim) {
        query = query.lte('data_pedido', filters.dataFim);
      }

      // Apply search filter
      if (filters.search && filters.search.trim()) {
        query = query.or(`numero_pedido.ilike.%${filters.search}%,sku_produto.ilike.%${filters.search}%,descricao.ilike.%${filters.search}%,cliente_nome.ilike.%${filters.search}%`);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      query = query.range(offset, offset + validatedLimit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Erro ao buscar histórico:', error);
        throw new Error(`Erro ao buscar histórico: ${error.message}`);
      }

      const vendas = (data || []) as HistoricoVenda[];
      
      // Aplicar filtros adicionais no frontend (temporário)
      let filteredVendas = vendas;
      
      if (filters.status?.length) {
        filteredVendas = filteredVendas.filter(v => 
          filters.status!.includes(v.status)
        );
      }

      if (filters.valorMin !== undefined) {
        filteredVendas = filteredVendas.filter(v => 
          v.valor_total >= filters.valorMin!
        );
      }

      if (filters.valorMax !== undefined) {
        filteredVendas = filteredVendas.filter(v => 
          v.valor_total <= filters.valorMax!
        );
      }

      if (filters.cidades?.length) {
        filteredVendas = filteredVendas.filter(v => 
          v.cidade && filters.cidades!.includes(v.cidade)
        );
      }

      if (filters.uf?.length) {
        filteredVendas = filteredVendas.filter(v => 
          v.uf && filters.uf!.includes(v.uf)
        );
      }

      // Aplicar ordenação
      filteredVendas.sort((a, b) => {
        const aValue = a[sortBy as keyof HistoricoVenda];
        const bValue = b[sortBy as keyof HistoricoVenda];
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
      });

      // Use the exact count from Supabase
      const totalRecords = count || 0;

      const pagination: HistoricoPagination = {
        page,
        limit: validatedLimit,
        total: totalRecords,
        totalPages: Math.ceil(totalRecords / validatedLimit),
        hasNextPage: page < Math.ceil(totalRecords / validatedLimit),
        hasPrevPage: page > 1
      };

      // Calcular summary
      const summary: HistoricoSummary = {
        totalVendas: filteredVendas.length,
        valorTotalVendas: filteredVendas.reduce((sum, v) => sum + (v.valor_total || 0), 0),
        ticketMedio: filteredVendas.length > 0 ? 
          filteredVendas.reduce((sum, v) => sum + (v.valor_total || 0), 0) / filteredVendas.length : 0,
        quantidadeTotalItens: filteredVendas.reduce((sum, v) => sum + (v.quantidade || 0), 0),
        clientesUnicos: new Set(filteredVendas.map(v => v.cliente_nome).filter(Boolean)).size,
        produtosUnicos: new Set(filteredVendas.map(v => v.sku_produto).filter(Boolean)).size
      };

      console.log('✅ Histórico carregado:', { 
        vendas: filteredVendas.length, 
        total: pagination.total,
        valorTotal: summary.valorTotalVendas 
      });

      return {
        data: filteredVendas,
        pagination,
        summary
      };

    } catch (error) {
      console.error('❌ Erro no serviço de histórico:', error);
      throw error;
    }
  }

  static async getHistoricoById(id: string): Promise<HistoricoVenda | null> {
    try {
      const { data, error } = await supabase
        .from('historico_vendas')
        .select('*')
        .or(`id.eq.${id},id_unico.eq.${id}`)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null;
        }
        console.error('❌ Erro ao buscar venda por ID:', error);
        throw new Error(`Erro ao buscar venda: ${error.message}`);
      }

      return data as HistoricoVenda;

    } catch (error) {
      console.error('❌ Erro ao buscar venda por ID:', error);
      throw error;
    }
  }

  static async getStatusOptions(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('historico_vendas')
        .select('status')
        .not('status', 'is', null);

      if (error) {
        console.error('❌ Erro ao buscar status:', error);
        return [];
      }

      const uniqueStatus = [...new Set(data.map(item => item.status))];
      return uniqueStatus.filter(Boolean);

    } catch (error) {
      console.error('❌ Erro ao buscar status:', error);
      return [];
    }
  }

  static async getCidadesOptions(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('historico_vendas')
        .select('cidade')
        .not('cidade', 'is', null);

      if (error) {
        console.error('❌ Erro ao buscar cidades:', error);
        return [];
      }

      const uniqueCidades = [...new Set(data.map(item => item.cidade))];
      return uniqueCidades.filter(Boolean).sort();

    } catch (error) {
      console.error('❌ Erro ao buscar cidades:', error);
      return [];
    }
  }

  static async getUfOptions(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('historico_vendas')
        .select('uf')
        .not('uf', 'is', null);

      if (error) {
        console.error('❌ Erro ao buscar UFs:', error);
        return [];
      }

      const uniqueUfs = [...new Set(data.map(item => item.uf))];
      return uniqueUfs.filter(Boolean).sort();

    } catch (error) {
      console.error('❌ Erro ao buscar UFs:', error);
      return [];
    }
  }
}