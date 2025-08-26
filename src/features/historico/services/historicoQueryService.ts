import { supabase } from "@/integrations/supabase/client";
import { 
  HistoricoVenda, 
  HistoricoFilters, 
  HistoricoResponse, 
  HistoricoPagination,
  HistoricoSummary,
  SortableFields 
} from "../types/historicoTypes";
import { HistoricoVendaPublic } from "@/types/historico";

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

      // Use RPC segura que aplica RLS e mascara dados sensíveis
      const { data, error, count } = await supabase.rpc('get_historico_vendas_masked', {
        _search: filters.search || null,
        _start: filters.dataInicio || null,
        _end: filters.dataFim || null,
        _limit: validatedLimit,
        _offset: offset
      });

      // Filtros, ordenação e paginação são feitos via RPC parameters

      if (error) {
        console.error('❌ Erro ao buscar histórico:', error);
        throw new Error(`Erro ao buscar histórico: ${error.message}`);
      }

      const vendas = (data || []) as any[];
      
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

      // Use o count retornado pela RPC (pode ser estimado)
      const totalRecords = filteredVendas.length;

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

  static async getHistoricoById(id: string): Promise<HistoricoVendaPublic | null> {
    try {
      const { data, error } = await supabase.rpc('get_historico_vendas_masked', {
        _search: id,
        _limit: 1,
        _offset: 0
      });

      if (error) {
        console.error('❌ Erro ao buscar venda por ID:', error);
        throw new Error(`Erro ao buscar venda: ${error.message}`);
      }

      const vendas = (data || []) as any[];
      return vendas.find(v => v.id === id || v.id_unico === id) || null;

    } catch (error) {
      console.error('❌ Erro ao buscar venda por ID:', error);
      throw error;
    }
  }

  static async getStatusOptions(): Promise<string[]> {
    try {
      const { data, error } = await supabase.rpc('get_historico_vendas_masked', {
        _search: null,
        _limit: 1000,
        _offset: 0
      });

      if (error) {
        console.error('❌ Erro ao buscar status:', error);
        return [];
      }

      const vendas = (data || []) as any[];
      const uniqueStatus = [...new Set(vendas.map(item => item.status))];
      return uniqueStatus.filter(Boolean);

    } catch (error) {
      console.error('❌ Erro ao buscar status:', error);
      return [];
    }
  }

  static async getCidadesOptions(): Promise<string[]> {
    try {
      const { data, error } = await supabase.rpc('get_historico_vendas_masked', {
        _search: null,
        _limit: 1000,
        _offset: 0
      });

      if (error) {
        console.error('❌ Erro ao buscar cidades:', error);
        return [];
      }

      const vendas = (data || []) as any[];
      const uniqueCidades = [...new Set(vendas.map(item => item.cidade))];
      return uniqueCidades.filter(Boolean).sort();

    } catch (error) {
      console.error('❌ Erro ao buscar cidades:', error);
      return [];
    }
  }

  static async getUfOptions(): Promise<string[]> {
    try {
      const { data, error } = await supabase.rpc('get_historico_vendas_masked', {
        _search: null,
        _limit: 1000,
        _offset: 0
      });

      if (error) {
        console.error('❌ Erro ao buscar UFs:', error);
        return [];
      }

      const vendas = (data || []) as any[];
      const uniqueUfs = [...new Set(vendas.map(item => item.uf))];
      return uniqueUfs.filter(Boolean).sort();

    } catch (error) {
      console.error('❌ Erro ao buscar UFs:', error);
      return [];
    }
  }
}