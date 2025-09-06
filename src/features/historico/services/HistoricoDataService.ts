// Serviço principal para dados do histórico
import { supabase } from "@/integrations/supabase/client";
import { 
  HistoricoVenda, 
  HistoricoFilters, 
  HistoricoResponse, 
  HistoricoPagination,
  HistoricoSummary,
  SortableFields 
} from "../types/historicoTypes";
import { HistoricoValidators } from "../utils/historicoValidators";
import { HistoricoCacheService } from "./HistoricoCacheService";
import { dlog } from "@/lib/debug";

export class HistoricoDataService {
  private static readonly DEFAULT_LIMIT = 50;
  private static readonly MAX_LIMIT = 1000;
  private static cache = new HistoricoCacheService();

  // Buscar dados principais com cache inteligente
  static async getHistoricoVendas(
    filters: HistoricoFilters = {},
    page: number = 1,
    limit: number = this.DEFAULT_LIMIT,
    sortBy: SortableFields = 'data_pedido',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<HistoricoResponse> {
    try {
      // Validar entrada
      const filterValidation = HistoricoValidators.validateFilters(filters);
      if (!filterValidation.isValid) {
        throw new Error(`Filtros inválidos: ${filterValidation.errors.map(e => e.message).join(', ')}`);
      }

      const paginationValidation = HistoricoValidators.validatePagination({
        page, limit, sortBy, sortOrder
      });
      if (!paginationValidation.isValid) {
        throw new Error(`Paginação inválida: ${paginationValidation.errors.map(e => e.message).join(', ')}`);
      }

      // Gerar chave de cache
      const cacheKey = this.generateCacheKey(filters, page, limit, sortBy, sortOrder);
      
      // Tentar cache primeiro
      const cached = this.cache.get(cacheKey);
      if (cached) {
        dlog('📋 Cache hit:', cacheKey);
        return cached as HistoricoResponse;
      }

      dlog('🔍 Buscando histórico:', { filters, page, limit, sortBy, sortOrder });

      // Preparar parâmetros
      const validatedLimit = Math.min(Math.max(limit, 1), this.MAX_LIMIT);
      const offset = (page - 1) * validatedLimit;

      // Usar view segura com mascaramento automático
      let query = supabase
        .from('historico_vendas_safe')
        .select('*')
        .order('created_at', { ascending: sortOrder !== 'desc' });

      // Aplicar filtros na query
      if (filters.search) {
        query = query.or(`numero_pedido.ilike.%${filters.search}%,sku_produto.ilike.%${filters.search}%,descricao.ilike.%${filters.search}%,cliente_nome.ilike.%${filters.search}%`);
      }

      if (filters.dataInicio) {
        query = query.gte('data_pedido', filters.dataInicio);
      }

      if (filters.dataFim) {
        query = query.lte('data_pedido', filters.dataFim);
      }

      // Aplicar paginação
      query = query.range(offset, offset + validatedLimit - 1);

      const { data, error } = await query;

      if (error) {
        throw new Error(`Erro ao buscar dados: ${error.message}`);
      }

      const vendas = (data || []) as any[];
      
      // Aplicar filtros adicionais
      const filteredVendas = this.applyClientFilters(vendas, filters);
      
      // Aplicar ordenação
      const sortedVendas = this.applySorting(filteredVendas, sortBy, sortOrder);
      
      // Calcular estatísticas
      const summary = this.calculateSummary(sortedVendas);
      
      // Paginação (simulada para filtros client-side)
      const totalEstimated = sortedVendas.length < validatedLimit ? 
        offset + sortedVendas.length : 
        offset + validatedLimit + 1;

      const pagination: HistoricoPagination = {
        page,
        limit: validatedLimit,
        total: totalEstimated,
        totalPages: Math.ceil(totalEstimated / validatedLimit),
        hasNextPage: sortedVendas.length === validatedLimit,
        hasPrevPage: page > 1
      };

      const response: HistoricoResponse = {
        data: sortedVendas,
        pagination,
        summary
      };

      // Cache do resultado
      this.cache.set(cacheKey, response);

      dlog('✅ Dados carregados:', { 
        vendas: sortedVendas.length, 
        total: pagination.total,
        valorTotal: summary.valorTotalVendas 
      });

      return response;

    } catch (error) {
      console.error('❌ Erro no serviço de dados:', error);
      throw error;
    }
  }

  // Buscar venda por ID
  static async getVendaById(id: string): Promise<any | null> {
    try {
      const cacheKey = `venda_${id}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
      return cached as any;
      }

      const { data, error } = await supabase.rpc('get_historico_vendas_masked', {
        _search: id,
        _limit: 1,
        _offset: 0
      });

      if (error) {
        throw new Error(`Erro ao buscar venda: ${error.message}`);
      }

      const vendas = (data || []) as any[];
      const venda = vendas.find(v => v.id === id || v.id_unico === id) || null;

      if (venda) {
        this.cache.set(cacheKey, venda, 60 * 1000); // Cache curto para dados específicos
      }

      return venda;

    } catch (error) {
      console.error('❌ Erro ao buscar venda por ID:', error);
      throw error;
    }
  }

  // Buscar opções para filtros
  static async getFilterOptions(): Promise<{
    status: string[];
    cidades: string[];
    ufs: string[];
    situacoes: string[];
  }> {
    try {
      const cacheKey = 'filter_options';
      const cached = this.cache.get(cacheKey);
      if (cached) {
      return cached as { status: string[]; cidades: string[]; ufs: string[]; situacoes: string[]; };
      }

      // Buscar opções usando RPC segura que já aplica RLS
      const [statusResult, cidadesResult, ufsResult] = await Promise.all([
        supabase.rpc('get_historico_vendas_masked', { _limit: 1000 }),
        supabase.rpc('get_historico_vendas_masked', { _limit: 1000 }),
        supabase.rpc('get_historico_vendas_masked', { _limit: 1000 })
      ]);

      const options = {
        status: [...new Set((statusResult.data || []).map((item: any) => item.status).filter(Boolean))].sort(),
        cidades: [...new Set((cidadesResult.data || []).map((item: any) => item.cidade).filter(Boolean))].sort(),
        ufs: [...new Set((ufsResult.data || []).map((item: any) => item.uf).filter(Boolean))].sort(),
        situacoes: ['pendente', 'processando', 'concluida', 'cancelada', 'devolvida'] // Estático por enquanto
      };

      // Cache longo para opções
      this.cache.set(cacheKey, options, 30 * 60 * 1000);

      return options;

    } catch (error) {
      console.error('❌ Erro ao buscar opções de filtro:', error);
      return { status: [], cidades: [], ufs: [], situacoes: [] };
    }
  }

  // Buscar estatísticas rápidas
  static async getQuickStats(filters?: HistoricoFilters): Promise<{
    totalVendas: number;
    valorTotal: number;
    ticketMedio: number;
    crescimentoMensal: number;
  }> {
    try {
      const cacheKey = `quick_stats_${JSON.stringify(filters || {})}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached as { totalVendas: number; valorTotal: number; ticketMedio: number; crescimentoMensal: number; };
      }

      // Para demonstração, usar dados mock
      // TODO: Implementar query otimizada no Supabase
      const stats = {
        totalVendas: 1250,
        valorTotal: 485000.00,
        ticketMedio: 388.00,
        crescimentoMensal: 12.5
      };

      this.cache.set(cacheKey, stats, 5 * 60 * 1000);
      return stats;

    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      return { totalVendas: 0, valorTotal: 0, ticketMedio: 0, crescimentoMensal: 0 };
    }
  }

  // Invalidar cache
  static invalidateCache(pattern?: string) {
    this.cache.invalidate(pattern);
  }

  // Prefetch da próxima página
  static async prefetchNextPage(
    filters: HistoricoFilters,
    currentPage: number,
    limit: number,
    sortBy: SortableFields,
    sortOrder: 'asc' | 'desc'
  ) {
    try {
      const nextPage = currentPage + 1;
      const cacheKey = this.generateCacheKey(filters, nextPage, limit, sortBy, sortOrder);
      
      // Só prefetch se não estiver em cache
      if (!this.cache.get(cacheKey)) {
        // Fazer requisição em background
        this.getHistoricoVendas(filters, nextPage, limit, sortBy, sortOrder)
          .catch(error => {
            dlog('❌ Erro no prefetch:', error);
          });
      }
    } catch (error) {
      dlog('❌ Erro no prefetch:', error);
    }
  }

  // --- Métodos privados ---

  private static generateCacheKey(
    filters: HistoricoFilters,
    page: number,
    limit: number,
    sortBy: SortableFields,
    sortOrder: 'asc' | 'desc'
  ): string {
    const filterHash = JSON.stringify(filters);
    return `historico_${btoa(filterHash)}_${page}_${limit}_${sortBy}_${sortOrder}`;
  }

  private static applyClientFilters(vendas: any[], filters: HistoricoFilters): any[] {
    let filtered = [...vendas];

    if (filters.status?.length) {
      filtered = filtered.filter(v => filters.status!.includes(v.status));
    }

    if (filters.valorMin !== undefined) {
      filtered = filtered.filter(v => (v.valor_total || 0) >= filters.valorMin!);
    }

    if (filters.valorMax !== undefined) {
      filtered = filtered.filter(v => (v.valor_total || 0) <= filters.valorMax!);
    }

    if (filters.cidades?.length) {
      filtered = filtered.filter(v => v.cidade && filters.cidades!.includes(v.cidade));
    }

    if (filters.uf?.length) {
      filtered = filtered.filter(v => v.uf && filters.uf!.includes(v.uf));
    }

    if (filters.situacao?.length) {
      filtered = filtered.filter(v => v.situacao && filters.situacao!.includes(v.situacao));
    }

    if (filters.cliente) {
      const clienteQuery = filters.cliente.toLowerCase();
      filtered = filtered.filter(v => 
        v.cliente_nome?.toLowerCase().includes(clienteQuery) ||
        v.cliente_documento?.toLowerCase().includes(clienteQuery)
      );
    }

    if (filters.sku) {
      const skuQuery = filters.sku.toLowerCase();
      filtered = filtered.filter(v => 
        v.sku_produto?.toLowerCase().includes(skuQuery) ||
        v.sku_estoque?.toLowerCase().includes(skuQuery)
      );
    }

    return filtered;
  }

  private static applySorting(
    vendas: any[],
    sortBy: SortableFields,
    sortOrder: 'asc' | 'desc'
  ): any[] {
    return [...vendas].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      let comparison = 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        // Para datas e outros tipos, converter para string
        const aStr = String(aValue);
        const bStr = String(bValue);
        comparison = aStr.localeCompare(bStr);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  private static calculateSummary(vendas: any[]): HistoricoSummary {
    if (vendas.length === 0) {
      return {
        totalVendas: 0,
        valorTotalVendas: 0,
        ticketMedio: 0,
        quantidadeTotalItens: 0,
        clientesUnicos: 0,
        produtosUnicos: 0
      };
    }

    const valorTotal = vendas.reduce((sum, v) => sum + (v.valor_total || 0), 0);
    const quantidadeTotal = vendas.reduce((sum, v) => sum + (v.quantidade || 0), 0);
    
    return {
      totalVendas: vendas.length,
      valorTotalVendas: valorTotal,
      ticketMedio: valorTotal / vendas.length,
      quantidadeTotalItens: quantidadeTotal,
      clientesUnicos: new Set(vendas.map(v => v.cliente_nome).filter(Boolean)).size,
      produtosUnicos: new Set(vendas.map(v => v.sku_produto).filter(Boolean)).size
    };
  }
}