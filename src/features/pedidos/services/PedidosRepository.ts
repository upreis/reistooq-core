import { supabase } from '@/integrations/supabase/client';
import { Pedido, PedidosFilters, PedidosResponse, PedidosAnalytics } from '../types/pedidos.types';

export class PedidosRepository {
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static cache = new Map<string, { data: any; timestamp: number }>();

  private static getCacheKey(accountId: string, filters: PedidosFilters, page: number): string {
    return `pedidos_${accountId}_${JSON.stringify(filters)}_${page}`;
  }

  private static isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  static async findWithFilters(
    accountId: string,
    filters: PedidosFilters,
    page = 1,
    pageSize = 25
  ): Promise<PedidosResponse> {
    const cacheKey = this.getCacheKey(accountId, filters, page);
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    try {
      // First try database
      const dbResult = await this.fetchFromDatabase(accountId, filters, page, pageSize);
      
      if (dbResult.data.length > 0) {
        this.cache.set(cacheKey, { data: dbResult, timestamp: Date.now() });
        return dbResult;
      }

      // Fallback to unified-orders
      const unifiedResult = await this.fetchFromUnifiedOrders(accountId, filters, page, pageSize);
      this.cache.set(cacheKey, { data: unifiedResult, timestamp: Date.now() });
      return unifiedResult;
    } catch (error) {
      console.error('Error fetching pedidos:', error);
      throw new Error('Erro ao carregar pedidos');
    }
  }

  private static async fetchFromDatabase(
    accountId: string,
    filters: PedidosFilters,
    page: number,
    pageSize: number
  ): Promise<PedidosResponse> {
    let query = supabase
      .from('pedidos')
      .select(`
        id, numero, nome_cliente, cpf_cnpj, data_pedido, situacao,
        valor_total, valor_frete, valor_desconto, numero_ecommerce,
        numero_venda, empresa, cidade, uf, obs, integration_account_id,
        created_at, updated_at,
        itens_pedidos (sku, descricao, quantidade, valor_unitario, valor_total)
      `, { count: 'exact' })
      .eq('integration_account_id', accountId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.search) {
      query = query.or(
        `numero.ilike.%${filters.search}%,nome_cliente.ilike.%${filters.search}%,cpf_cnpj.ilike.%${filters.search}%`
      );
    }
    
    if (filters.situacao?.length) {
      query = query.in('situacao', filters.situacao);
    }
    
    if (filters.dataInicio) {
      query = query.gte('data_pedido', filters.dataInicio.toISOString().split('T')[0]);
    }
    
    if (filters.dataFim) {
      query = query.lte('data_pedido', filters.dataFim.toISOString().split('T')[0]);
    }
    
    if (filters.cidade) {
      query = query.ilike('cidade', `%${filters.cidade}%`);
    }
    
    if (filters.uf) {
      query = query.eq('uf', filters.uf);
    }
    
    if (filters.valorMin !== undefined) {
      query = query.gte('valor_total', filters.valorMin);
    }
    
    if (filters.valorMax !== undefined) {
      query = query.lte('valor_total', filters.valorMax);
    }

    // Pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    query = query.range(start, end);

    const result = await query;
    
    if (result.error) throw result.error;

    const processedData = await this.processDbPedidos(result.data || []);
    
    return {
      data: processedData,
      total: result.count || 0,
      has_next_page: (result.count || 0) > (page * pageSize),
      page,
    };
  }

  private static async fetchFromUnifiedOrders(
    accountId: string,
    filters: PedidosFilters,
    page: number,
    pageSize: number
  ): Promise<PedidosResponse> {
    const apiParams: any = {
      integration_account_id: accountId,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      enrich: true,
      include_shipping: true,
    };

    if (filters.search) apiParams.q = filters.search;
    if (filters.situacao?.length === 1) apiParams.status = filters.situacao[0].toLowerCase();
    if (filters.dataInicio) apiParams.date_from = filters.dataInicio.toISOString().split('T')[0];
    if (filters.dataFim) apiParams.date_to = filters.dataFim.toISOString().split('T')[0];

    const { data, error } = await supabase.functions.invoke('unified-orders', {
      body: apiParams
    });

    if (error) throw error;
    if (!data?.ok) throw new Error('Erro na resposta da API');

    const processedData = await this.processUnifiedPedidos(data.results || [], data.unified || []);
    
    return {
      data: processedData,
      total: processedData.length,
      has_next_page: processedData.length === pageSize,
      page,
    };
  }

  private static async processDbPedidos(rawData: any[]): Promise<Pedido[]> {
    const pedidos = rawData.map((pedido: any) => {
      const itens = pedido.itens_pedidos || [];
      const totalItens = itens.reduce((sum: number, item: any) => sum + (item.quantidade || 0), 0);
      const skuPrincipal = itens[0]?.sku || pedido.obs?.split(',')[0]?.trim() || '';

      return {
        ...pedido,
        id_unico: skuPrincipal ? `${skuPrincipal}-${pedido.numero}` : pedido.numero,
        itens,
        total_itens: totalItens > 0 ? totalItens : 1,
        sku_estoque: null,
        sku_kit: null,
        qtd_kit: null,
        status_estoque: 'pronto_baixar' as const,
        tem_mapeamento: false,
      };
    });

    // Add mapping verification
    return this.addMappingInfo(pedidos);
  }

  private static async processUnifiedPedidos(results: any[], unified: any[]): Promise<Pedido[]> {
    const pedidos = results.map((raw: any, index: number) => {
      const unifiedData = unified[index] || {};
      const orderItems = raw.order_items || [];
      
      const itens = orderItems.map((item: any) => ({
        sku: item.item?.seller_sku || item.item?.id?.toString() || '',
        descricao: item.item?.title || '',
        quantidade: item.quantity || 1,
        valor_unitario: item.unit_price || 0,
        valor_total: (item.unit_price || 0) * (item.quantity || 1),
      }));

      const totalItens = itens.reduce((sum: number, it: any) => sum + it.quantidade, 0);
      const skuPrincipal = itens[0]?.sku || raw.id?.toString() || '';

      return {
        id: raw.id?.toString() || '',
        numero: raw.id?.toString() || '',
        id_unico: `${skuPrincipal}-${raw.id}`,
        nome_cliente: raw.buyer?.nickname || 'N/A',
        cpf_cnpj: raw.buyer?.identification?.number || null,
        data_pedido: raw.date_created?.split('T')[0] || new Date().toISOString().split('T')[0],
        situacao: this.mapMlStatus(raw.status),
        valor_total: raw.total_amount || 0,
        valor_frete: raw.payments?.[0]?.shipping_cost ?? raw.shipping?.cost ?? 0,
        valor_desconto: raw.coupon?.amount || 0,
        numero_ecommerce: raw.pack_id?.toString() || null,
        numero_venda: raw.id?.toString() || null,
        empresa: 'Mercado Livre',
        cidade: raw.shipping?.receiver_address?.city?.name || null,
        uf: raw.shipping?.receiver_address?.state?.id?.split('-').pop() || null,
        obs: orderItems.map((item: any) => item?.item?.title).filter(Boolean).join(', ') || null,
        integration_account_id: accountId,
        created_at: raw.date_created || new Date().toISOString(),
        updated_at: raw.last_updated || new Date().toISOString(),
        itens,
        total_itens: totalItens > 0 ? totalItens : 1,
        sku_estoque: null,
        sku_kit: null,
        qtd_kit: null,
        status_estoque: 'pronto_baixar' as const,
        tem_mapeamento: false,
      };
    });

    return this.addMappingInfo(pedidos);
  }

  private static async addMappingInfo(pedidos: Pedido[]): Promise<Pedido[]> {
    // Get all SKUs for mapping verification
    const allSkus = pedidos.flatMap(p => p.itens.map(i => i.sku)).filter(Boolean);
    
    if (allSkus.length === 0) return pedidos;

    try {
      const { data: mapeamentos } = await supabase
        .from('mapeamentos_depara')
        .select('sku_pedido, sku_correspondente, sku_simples, quantidade')
        .in('sku_pedido', allSkus)
        .eq('ativo', true);

      const mappingMap = new Map(
        (mapeamentos || []).map(m => [m.sku_pedido, m])
      );

      return pedidos.map(pedido => {
        const pedidoSkus = pedido.itens.map(i => i.sku);
        const temMapeamento = pedidoSkus.some(sku => mappingMap.has(sku));
        
        let sku_estoque = null;
        let sku_kit = null;
        let qtd_kit = null;

        if (temMapeamento) {
          const mapeamento = mappingMap.get(pedidoSkus[0]);
          if (mapeamento) {
            sku_estoque = mapeamento.sku_correspondente || mapeamento.sku_simples;
            sku_kit = mapeamento.sku_pedido;
            qtd_kit = mapeamento.quantidade || 1;
          }
        }

        return {
          ...pedido,
          tem_mapeamento: temMapeamento,
          sku_estoque,
          sku_kit,
          qtd_kit,
        };
      });
    } catch (error) {
      console.error('Error adding mapping info:', error);
      return pedidos;
    }
  }

  private static mapMlStatus(mlStatus: string): string {
    const statusMap: Record<string, string> = {
      'paid': 'Pago',
      'confirmed': 'Confirmado',
      'cancelled': 'Cancelado',
      'shipped': 'Enviado',
      'delivered': 'Entregue',
      'pending': 'Pendente',
    };
    
    return statusMap[mlStatus?.toLowerCase()] || mlStatus || 'Aberto';
  }

  static async getAnalytics(accountId: string, filters: PedidosFilters): Promise<PedidosAnalytics> {
    const cacheKey = `analytics_${accountId}_${JSON.stringify(filters)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    try {
      // Get basic stats
      const pedidosResult = await this.findWithFilters(accountId, filters, 1, 1000);
      const pedidos = pedidosResult.data;

      const today = new Date().toISOString().split('T')[0];
      const pedidosHoje = pedidos.filter(p => p.data_pedido === today);

      // Status distribution
      const statusDistribution = pedidos.reduce((acc, pedido) => {
        acc[pedido.situacao] = (acc[pedido.situacao] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Top produtos
      const produtoStats = new Map<string, { nome: string; quantidade: number; receita: number }>();
      
      pedidos.forEach(pedido => {
        pedido.itens.forEach(item => {
          const existing = produtoStats.get(item.sku) || { nome: item.descricao, quantidade: 0, receita: 0 };
          existing.quantidade += item.quantidade;
          existing.receita += item.valor_total;
          produtoStats.set(item.sku, existing);
        });
      });

      const topProdutos = Array.from(produtoStats.entries())
        .map(([sku, stats]) => ({ sku, ...stats }))
        .sort((a, b) => b.receita - a.receita)
        .slice(0, 10);

      // Revenue trend (last 30 days)
      const revenueByDate = new Map<string, { revenue: number; orders: number }>();
      
      pedidos.forEach(pedido => {
        const date = pedido.data_pedido;
        const existing = revenueByDate.get(date) || { revenue: 0, orders: 0 };
        existing.revenue += pedido.valor_total;
        existing.orders += 1;
        revenueByDate.set(date, existing);
      });

      const revenueTrend = Array.from(revenueByDate.entries())
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30); // Last 30 days

      // Mapping stats
      const totalPedidos = pedidos.length;
      const mapeados = pedidos.filter(p => p.tem_mapeamento).length;
      const mappingStats = {
        total: totalPedidos,
        mapeados,
        sem_mapeamento: totalPedidos - mapeados,
        percentage: totalPedidos > 0 ? Math.round((mapeados / totalPedidos) * 100) : 0,
      };

      const analytics: PedidosAnalytics = {
        total_pedidos: pedidos.length,
        total_receita: pedidos.reduce((sum, p) => sum + p.valor_total, 0),
        pedidos_hoje: pedidosHoje.length,
        receita_hoje: pedidosHoje.reduce((sum, p) => sum + p.valor_total, 0),
        status_distribution: statusDistribution,
        top_produtos: topProdutos,
        revenue_trend: revenueTrend,
        mapping_stats: mappingStats,
      };

      this.cache.set(cacheKey, { data: analytics, timestamp: Date.now() });
      return analytics;
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw new Error('Erro ao carregar analytics');
    }
  }

  static async verifyMapeamentos(skus: string[]) {
    if (skus.length === 0) return {};

    try {
      const { data: mapeamentos } = await supabase
        .from('mapeamentos_depara')
        .select('sku_pedido, sku_correspondente, sku_simples, quantidade')
        .in('sku_pedido', skus)
        .eq('ativo', true);

      return (mapeamentos || []).reduce((acc, m) => {
        acc[m.sku_pedido] = {
          sku_estoque: m.sku_correspondente || m.sku_simples,
          sku_kit: m.sku_pedido,
          qtd_kit: m.quantidade || 1,
          tem_mapeamento: true,
        };
        return acc;
      }, {} as Record<string, any>);
    } catch (error) {
      console.error('Error verifying mapeamentos:', error);
      return {};
    }
  }

  static async updatePedido(id: string, updates: Partial<Pedido>): Promise<Pedido> {
    const { data, error } = await supabase
      .from('pedidos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async bulkUpdate(ids: string[], updates: Partial<Pedido>): Promise<void> {
    const { error } = await supabase
      .from('pedidos')
      .update(updates)
      .in('id', ids);

    if (error) throw error;
  }

  static async processarBaixaEstoque(pedidoIds: string[]): Promise<any> {
    // This would call the stock reduction service
    // Implementation depends on existing EstoqueBaixaService
    throw new Error('Not implemented yet');
  }

  static clearCache(): void {
    this.cache.clear();
  }
}