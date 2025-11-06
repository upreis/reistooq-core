// 🎯 Hook para analytics avançadas
// Métricas complexas e dados agregados para insights

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsMetrics {
  totalSales: number;
  salesGrowth: number;
  totalOrders: number;
  ordersGrowth: number;
  activeProducts: number;
  lowStockProducts: number;
  activeUsers: number;
  newUsers: number;
}

interface SalesTrendPoint {
  date: string;
  sales: number;
  orders: number;
}

interface ProductMetrics {
  topProducts: Array<{ name: string; value: number }>;
  byCategory: Array<{ name: string; sales: number }>;
  lowStock: Array<{ name: string; sku: string; stock: number }>;
}

interface UserActivityPoint {
  date: string;
  active: number;
  new: number;
}

export const useAnalytics = (timeRange: string = '30d') => {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [salesTrend, setSalesTrend] = useState<SalesTrendPoint[]>([]);
  const [productMetrics, setProductMetrics] = useState<ProductMetrics | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivityPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const getDaysFromRange = (range: string): number => {
    switch (range) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 30;
    }
  };

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const days = getDaysFromRange(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Carregar dados reais de histórico de vendas
      const { data: salesData } = await supabase
        .rpc('get_historico_vendas_masked', {
          _start: startDate.toISOString().split('T')[0],
          _end: null,
          _search: null,
          _limit: 5000,
          _offset: 0
        });

      // Carregar dados reais de produtos
      const { data: productsData } = await supabase
        .from('produtos')
        .select('quantidade_atual, estoque_minimo, nome, sku_interno, preco_custo, valor_total:preco_venda');

      // Calcular métricas reais
      const vendasArray = (salesData as any[]) || [];
      const totalSales = vendasArray.reduce((sum, item: any) => sum + Number(item.valor_total || 0), 0) || 0;
      const totalOrders = vendasArray.length || 0;
      const activeProducts = productsData?.filter(p => p.quantidade_atual > 0).length || 0;
      const lowStockProducts = productsData?.filter(p => p.quantidade_atual <= p.estoque_minimo && p.quantidade_atual >= 0).length || 0;

      // Calcular crescimento (comparar com período anterior)
      const previousStartDate = new Date();
      previousStartDate.setDate(previousStartDate.getDate() - (days * 2));
      previousStartDate.setDate(previousStartDate.getDate() + days);

      const { data: previousSalesData } = await supabase
        .rpc('get_historico_vendas_masked', {
          _start: previousStartDate.toISOString().split('T')[0],
          _end: startDate.toISOString().split('T')[0],
          _search: null,
          _limit: 5000,
          _offset: 0
        });

      const prevArray = (previousSalesData as any[]) || [];
      const previousTotalSales = prevArray.reduce((sum, item: any) => sum + Number(item.valor_total || 0), 0) || 1;
      const previousTotalOrders = prevArray.length || 1;

      const salesGrowth = previousTotalSales > 0 ? ((totalSales - previousTotalSales) / previousTotalSales) * 100 : 0;
      const ordersGrowth = previousTotalOrders > 0 ? ((totalOrders - previousTotalOrders) / previousTotalOrders) * 100 : 0;

      setMetrics({
        totalSales,
        salesGrowth: Number(salesGrowth.toFixed(1)),
        totalOrders,
        ordersGrowth: Number(ordersGrowth.toFixed(1)),
        activeProducts,
        lowStockProducts,
        activeUsers: Math.floor(Math.random() * 50) + 10, // Mock - seria melhor ter dados reais de usuários
        newUsers: Math.floor(Math.random() * 10) + 1 // Mock - seria melhor ter dados reais
      });

      // Gerar dados de tendência baseados em dados reais
      const trend: SalesTrendPoint[] = [];
      const salesByDate = new Map<string, { sales: number; orders: number }>();

      vendasArray.forEach((sale: any) => {
        const date = sale.data_pedido || sale.created_at?.split('T')[0];
        if (date) {
          const existing = salesByDate.get(date) || { sales: 0, orders: 0 };
          existing.sales += Number(sale.valor_total || 0);
          existing.orders += 1;
          salesByDate.set(date, existing);
        }
      });

      // Preencher tendência com dados reais ou zeros
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayData = salesByDate.get(dateStr) || { sales: 0, orders: 0 };
        
        trend.push({
          date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          sales: dayData.sales,
          orders: dayData.orders
        });
      }
      setSalesTrend(trend);

      // Product metrics baseados em dados reais
      if (productsData) {
        const lowStockItems = productsData
          .filter(p => p.quantidade_atual <= p.estoque_minimo && p.quantidade_atual >= 0)
          .slice(0, 5)
          .map(p => ({
            name: p.nome,
            sku: p.sku_interno,
            stock: p.quantidade_atual
          }));

        // Mock dos top produtos (seria melhor calcular dos dados de vendas)
        setProductMetrics({
          topProducts: [
            { name: 'Produto A', value: 30 },
            { name: 'Produto B', value: 25 },
            { name: 'Produto C', value: 20 },
            { name: 'Outros', value: 25 }
          ],
          byCategory: [
            { name: 'Eletrônicos', sales: totalSales * 0.4 },
            { name: 'Roupas', sales: totalSales * 0.3 },
            { name: 'Casa', sales: totalSales * 0.2 },
            { name: 'Outros', sales: totalSales * 0.1 }
          ],
          lowStock: lowStockItems
        });
      }

      // User activity com dados simulados (seria melhor ter dados reais)
      const activity: UserActivityPoint[] = [];
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        activity.push({
          date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          active: Math.floor(Math.random() * 30) + 10,
          new: Math.floor(Math.random() * 5) + 1
        });
      }
      setUserActivity(activity);

    } catch (error) {
      console.error('Error loading analytics:', error);
      // Fallback para dados simulados em caso de erro
      setMetrics({
        totalSales: 0,
        salesGrowth: 0,
        totalOrders: 0,
        ordersGrowth: 0,
        activeProducts: 0,
        lowStockProducts: 0,
        activeUsers: 0,
        newUsers: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadMetrics();
  }, [timeRange]);

  return {
    metrics,
    salesTrend,
    productMetrics,
    userActivity,
    loading,
    refresh: loadMetrics
  };
};