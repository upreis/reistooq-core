import { supabase } from "@/integrations/supabase/client";
import { HistoricoAnalytics, HistoricoVenda } from "../types/historicoTypes";

export class HistoricoAnalyticsService {
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutos

  static async getAnalytics(
    dataInicio?: string,
    dataFim?: string
  ): Promise<HistoricoAnalytics> {
    const cacheKey = `analytics_${dataInicio || 'all'}_${dataFim || 'all'}`;
    
    // Verificar cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('📊 Analytics obtidos do cache');
      return cached.data;
    }

    try {
      console.log('📊 Calculando analytics do histórico...');

      // Buscar dados base
      const { data: vendasData, error } = await supabase.rpc('get_historico_vendas_masked', {
        _start: dataInicio || null,
        _end: dataFim || null,
        _limit: 10000, // Limite alto para analytics
        _offset: 0
      });

      if (error) {
        throw new Error(`Erro ao buscar dados para analytics: ${error.message}`);
      }

      const vendas = (vendasData || []) as any[];
      
      // Calcular métricas de vendas
      const hoje = new Date().toISOString().split('T')[0];
      const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const umaSemanaAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const umMesAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const vendasHoje = vendas.filter(v => v.data_pedido === hoje);
      const vendasOntem = vendas.filter(v => v.data_pedido === ontem);
      const vendasSemana = vendas.filter(v => v.data_pedido >= umaSemanaAtras);
      const vendasMes = vendas.filter(v => v.data_pedido >= umMesAtras);

      const valorHoje = vendasHoje.reduce((sum, v) => sum + (v.valor_total || 0), 0);
      const valorOntem = vendasOntem.reduce((sum, v) => sum + (v.valor_total || 0), 0);
      const valorSemana = vendasSemana.reduce((sum, v) => sum + (v.valor_total || 0), 0);
      const valorMes = vendasMes.reduce((sum, v) => sum + (v.valor_total || 0), 0);

      // Top produtos vendidos
      const produtosCounts = vendas.reduce((acc, venda) => {
        const key = `${venda.sku_produto}_${venda.descricao}`;
        if (!acc[key]) {
          acc[key] = {
            sku: venda.sku_produto,
            nome: venda.descricao || venda.sku_produto,
            quantidade: 0,
            valor: 0
          };
        }
        acc[key].quantidade += venda.quantidade || 0;
        acc[key].valor += venda.valor_total || 0;
        return acc;
      }, {} as Record<string, any>);

      const topVendidos = Object.values(produtosCounts)
        .sort((a: any, b: any) => b.quantidade - a.quantidade)
        .slice(0, 10);

      // Análise geográfica
      const estadosCounts = vendas.reduce((acc, venda) => {
        if (!venda.uf) return acc;
        if (!acc[venda.uf]) {
          acc[venda.uf] = { uf: venda.uf, vendas: 0, valor: 0 };
        }
        acc[venda.uf].vendas++;
        acc[venda.uf].valor += venda.valor_total || 0;
        return acc;
      }, {} as Record<string, any>);

      const cidadesCounts = vendas.reduce((acc, venda) => {
        if (!venda.cidade || !venda.uf) return acc;
        const key = `${venda.cidade}_${venda.uf}`;
        if (!acc[key]) {
          acc[key] = { 
            cidade: venda.cidade, 
            uf: venda.uf, 
            vendas: 0, 
            valor: 0 
          };
        }
        acc[key].vendas++;
        acc[key].valor += venda.valor_total || 0;
        return acc;
      }, {} as Record<string, any>);

      // Análise temporal diária
      const vendasPorDia = vendas.reduce((acc, venda) => {
        const data = venda.data_pedido;
        if (!acc[data]) {
          acc[data] = { data, vendas: 0, valor: 0 };
        }
        acc[data].vendas++;
        acc[data].valor += venda.valor_total || 0;
        return acc;
      }, {} as Record<string, any>);

      const analytics: HistoricoAnalytics = {
        vendas: {
          hoje: vendasHoje.length,
          ontem: vendasOntem.length,
          semana: vendasSemana.length,
          mes: vendasMes.length,
          crescimentoDiario: valorOntem > 0 ? ((valorHoje - valorOntem) / valorOntem) * 100 : 0,
          crescimentoSemanal: valorSemana > 0 ? ((valorHoje - valorOntem) / valorSemana) * 100 : 0,
          crescimentoMensal: valorMes > 0 ? ((valorSemana - (valorMes - valorSemana)) / (valorMes - valorSemana)) * 100 : 0
        },
        produtos: {
          topVendidos: topVendidos as any[],
          categorias: [] // Implementar se houver campo categoria
        },
        geografico: {
          estados: Object.values(estadosCounts)
            .sort((a: any, b: any) => b.valor - a.valor)
            .slice(0, 10) as any[],
          cidades: Object.values(cidadesCounts)
            .sort((a: any, b: any) => b.valor - a.valor)
            .slice(0, 20) as any[]
        },
        temporal: {
          diario: Object.values(vendasPorDia)
            .sort((a: any, b: any) => new Date(a.data).getTime() - new Date(b.data).getTime())
            .slice(-30) as any[], // Últimos 30 dias
          semanal: [], // Implementar agrupamento semanal
          mensal: []   // Implementar agrupamento mensal
        }
      };

      // Armazenar no cache
      this.cache.set(cacheKey, {
        data: analytics,
        timestamp: Date.now()
      });

      console.log('✅ Analytics calculados:', {
        vendasHoje: analytics.vendas.hoje,
        valorTotal: valorMes,
        topProdutos: analytics.produtos.topVendidos.length
      });

      return analytics;

    } catch (error) {
      console.error('❌ Erro ao calcular analytics:', error);
      throw error;
    }
  }

  static clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Cache de analytics limpo');
  }

  static invalidateCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.clearCache();
    }
  }
}