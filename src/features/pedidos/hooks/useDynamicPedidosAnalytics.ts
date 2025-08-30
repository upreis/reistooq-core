/**
 * 🎯 Hook para Analytics Dinâmicos dos Pedidos
 * Gera insights em tempo real baseado nos pedidos filtrados
 */

import { useMemo } from 'react';
import { formatMoney } from '@/lib/format';

interface PedidosAnalyticsResult {
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    averageTicket: number;
    completionRate: number;
    totalShipping: number;
    totalDiscount: number;
  };
  alerts: Array<{
    type: 'critical' | 'warning' | 'info' | 'success';
    title: string;
    message: string;
    count: number;
    actionRequired: boolean;
  }>;
  trends: {
    revenueByDay: Array<{ date: string; revenue: number; orders: number }>;
    statusDistribution: Array<{ name: string; value: number; percentage: number }>;
    companyAnalysis: Array<{ name: string; orders: number; revenue: number; percentage: number }>;
    shippingAnalysis: Array<{ status: string; count: number; percentage: number }>;
  };
  forecasts: {
    deliveryForecast: Array<{ date: string; count: number; revenue: number }>;
    upcomingDeliveries: number;
    overdueOrders: number;
  };
}

export function useDynamicPedidosAnalytics(
  filteredOrders: any[], 
  allOrders: any[] = []
): PedidosAnalyticsResult {
  
  return useMemo(() => {
    if (!filteredOrders || filteredOrders.length === 0) {
      return {
        metrics: {
          totalRevenue: 0,
          totalOrders: 0,
          averageTicket: 0,
          completionRate: 0,
          totalShipping: 0,
          totalDiscount: 0,
        },
        alerts: [],
        trends: {
          revenueByDay: [],
          statusDistribution: [],
          companyAnalysis: [],
          shippingAnalysis: [],
        },
        forecasts: {
          deliveryForecast: [],
          upcomingDeliveries: 0,
          overdueOrders: 0,
        }
      };
    }

    // 🎯 MÉTRICAS PRINCIPAIS baseadas nos pedidos filtrados
    const totalRevenue = filteredOrders.reduce((sum, order) => {
      return sum + (Number(order.valor_total) || 0);
    }, 0);

    const totalShipping = filteredOrders.reduce((sum, order) => {
      return sum + (Number(order.valor_frete) || 0);
    }, 0);

    const totalDiscount = filteredOrders.reduce((sum, order) => {
      return sum + (Number(order.valor_desconto) || 0);
    }, 0);

    const totalOrders = filteredOrders.length;
    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Taxa de conclusão baseada em status
    const completedStatuses = ['delivered', 'entregue', 'concluido', 'finalizado'];
    const completedOrders = filteredOrders.filter(order => 
      completedStatuses.some(status => 
        order.situacao?.toLowerCase().includes(status.toLowerCase())
      )
    ).length;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    // 🚨 ALERTAS INTELIGENTES baseados nos dados reais
    const alerts: any[] = [];

    // Verificar pedidos sem mapeamento
    const unmappedOrders = filteredOrders.filter(order => {
      const skus = order.skus || [];
      return skus.length === 0 || skus.some((sku: string) => !sku || sku.trim() === '');
    });

    if (unmappedOrders.length > 0) {
      alerts.push({
        type: 'critical' as const,
        title: 'SKUs Não Mapeados',
        message: `${unmappedOrders.length} pedidos precisam de mapeamento de produtos`,
        count: unmappedOrders.length,
        actionRequired: true
      });
    }

    // Verificar pedidos atrasados
    const today = new Date();
    const overdueOrders = filteredOrders.filter(order => {
      if (!order.data_prevista) return false;
      const expectedDate = new Date(order.data_prevista);
      return expectedDate < today && !completedStatuses.some(status => 
        order.situacao?.toLowerCase().includes(status.toLowerCase())
      );
    });

    if (overdueOrders.length > 0) {
      alerts.push({
        type: 'warning' as const,
        title: 'Pedidos Atrasados',
        message: `${overdueOrders.length} pedidos passaram da data prevista`,
        count: overdueOrders.length,
        actionRequired: true
      });
    }

    // Verificar pedidos pendentes em excesso
    const pendingOrders = filteredOrders.filter(order => 
      ['pending', 'pendente', 'processando', 'aguardando'].some(status =>
        order.situacao?.toLowerCase().includes(status.toLowerCase())
      )
    );

    if (pendingOrders.length > totalOrders * 0.3) {
      alerts.push({
        type: 'warning' as const,
        title: 'Muitos Pedidos Pendentes',
        message: `${pendingOrders.length} pedidos aguardando processamento (${((pendingOrders.length / totalOrders) * 100).toFixed(1)}%)`,
        count: pendingOrders.length,
        actionRequired: true
      });
    }

    // Alto valor médio (oportunidade)
    if (averageTicket > 500) {
      alerts.push({
        type: 'success' as const,
        title: 'Alto Ticket Médio',
        message: `Ticket médio de ${formatMoney(averageTicket)} está acima da média`,
        count: 0,
        actionRequired: false
      });
    }

    // 📊 TRENDS E ANÁLISES
    
    // Receita por dia
    const revenueByDayMap = new Map<string, { revenue: number; orders: number }>();
    filteredOrders.forEach(order => {
      if (order.data_pedido) {
        const date = new Date(order.data_pedido).toLocaleDateString('pt-BR');
        const current = revenueByDayMap.get(date) || { revenue: 0, orders: 0 };
        revenueByDayMap.set(date, {
          revenue: current.revenue + (Number(order.valor_total) || 0),
          orders: current.orders + 1
        });
      }
    });

    const revenueByDay = Array.from(revenueByDayMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => {
        const dateA = new Date(a.date.split('/').reverse().join('-'));
        const dateB = new Date(b.date.split('/').reverse().join('-'));
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-14); // Últimos 14 dias

    // Distribuição por status
    const statusMap = new Map<string, number>();
    filteredOrders.forEach(order => {
      const status = order.situacao || 'Não Informado';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    const statusDistribution = Array.from(statusMap.entries())
      .map(([name, value]) => ({ 
        name, 
        value, 
        percentage: (value / totalOrders) * 100 
      }))
      .sort((a, b) => b.value - a.value);

    // Análise por empresa
    const companyMap = new Map<string, { orders: number; revenue: number }>();
    filteredOrders.forEach(order => {
      const company = order.empresa || 'Não Informado';
      const current = companyMap.get(company) || { orders: 0, revenue: 0 };
      companyMap.set(company, {
        orders: current.orders + 1,
        revenue: current.revenue + (Number(order.valor_total) || 0)
      });
    });

    const companyAnalysis = Array.from(companyMap.entries())
      .map(([name, data]) => ({
        name,
        orders: data.orders,
        revenue: data.revenue,
        percentage: (data.orders / totalOrders) * 100
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    // Análise de logística/envio
    const shippingStatusMap = new Map<string, number>();
    filteredOrders.forEach(order => {
      // Extrair status de envio de diferentes possíveis campos
      const shippingStatus = 
        order.shipping_status || 
        order.substatus_estado_atual || 
        order.situacao || 
        'Não Informado';
      
      shippingStatusMap.set(shippingStatus, (shippingStatusMap.get(shippingStatus) || 0) + 1);
    });

    const shippingAnalysis = Array.from(shippingStatusMap.entries())
      .map(([status, count]) => ({
        status,
        count,
        percentage: (count / totalOrders) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // 🔮 PREVISÕES E FORECASTS
    
    // Previsão de entrega por data
    const deliveryMap = new Map<string, { count: number; revenue: number }>();
    filteredOrders.forEach(order => {
      if (order.data_prevista) {
        const date = new Date(order.data_prevista).toLocaleDateString('pt-BR');
        const current = deliveryMap.get(date) || { count: 0, revenue: 0 };
        deliveryMap.set(date, {
          count: current.count + 1,
          revenue: current.revenue + (Number(order.valor_total) || 0)
        });
      }
    });

    const deliveryForecast = Array.from(deliveryMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => {
        const dateA = new Date(a.date.split('/').reverse().join('-'));
        const dateB = new Date(b.date.split('/').reverse().join('-'));
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 10); // Próximas 10 datas

    // Entregas próximas (próximos 7 dias)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const upcomingDeliveries = filteredOrders.filter(order => {
      if (!order.data_prevista) return false;
      const expectedDate = new Date(order.data_prevista);
      return expectedDate >= today && expectedDate <= nextWeek;
    }).length;

    return {
      metrics: {
        totalRevenue,
        totalOrders,
        averageTicket,
        completionRate,
        totalShipping,
        totalDiscount,
      },
      alerts,
      trends: {
        revenueByDay,
        statusDistribution,
        companyAnalysis,
        shippingAnalysis,
      },
      forecasts: {
        deliveryForecast,
        upcomingDeliveries,
        overdueOrders: overdueOrders.length,
      }
    };
  }, [filteredOrders, allOrders]);
}