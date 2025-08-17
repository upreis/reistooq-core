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
      const days = getDaysFromRange(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Basic metrics from sales history
      const { data: salesData } = await supabase
        .from('historico_vendas')
        .select('valor_total, quantidade, data_pedido')
        .gte('data_pedido', startDate.toISOString().split('T')[0]);

      // Product metrics
      const { data: productsData } = await supabase
        .from('produtos')
        .select('quantidade_atual, estoque_minimo, nome, sku_interno');

      // Mock data for demo (replace with real queries)
      const totalSales = salesData?.reduce((sum, item) => sum + Number(item.valor_total), 0) || 0;
      const totalOrders = salesData?.length || 0;
      const activeProducts = productsData?.filter(p => p.quantidade_atual > 0).length || 0;
      const lowStockProducts = productsData?.filter(p => p.quantidade_atual <= p.estoque_minimo).length || 0;

      setMetrics({
        totalSales,
        salesGrowth: Math.random() * 20, // Mock growth
        totalOrders,
        ordersGrowth: Math.random() * 15, // Mock growth
        activeProducts,
        lowStockProducts,
        activeUsers: Math.floor(Math.random() * 50) + 10, // Mock data
        newUsers: Math.floor(Math.random() * 10) + 1 // Mock data
      });

      // Generate mock trend data
      const trend: SalesTrendPoint[] = [];
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        trend.push({
          date: date.toLocaleDateString(),
          sales: Math.random() * 5000 + 1000,
          orders: Math.floor(Math.random() * 20) + 5
        });
      }
      setSalesTrend(trend);

      // Product metrics
      setProductMetrics({
        topProducts: [
          { name: 'Produto A', value: 30 },
          { name: 'Produto B', value: 25 },
          { name: 'Produto C', value: 20 },
          { name: 'Outros', value: 25 }
        ],
        byCategory: [
          { name: 'Eletrônicos', sales: 12000 },
          { name: 'Roupas', sales: 8000 },
          { name: 'Livros', sales: 5000 },
          { name: 'Casa', sales: 7000 }
        ],
        lowStock: productsData?.filter(p => p.quantidade_atual <= p.estoque_minimo).map(p => ({
          name: p.nome,
          sku: p.sku_interno,
          stock: p.quantidade_atual
        })).slice(0, 5) || []
      });

      // User activity mock data
      const activity: UserActivityPoint[] = [];
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        activity.push({
          date: date.toLocaleDateString(),
          active: Math.floor(Math.random() * 30) + 10,
          new: Math.floor(Math.random() * 5) + 1
        });
      }
      setUserActivity(activity);

    } catch (error) {
      console.error('Error loading analytics:', error);
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