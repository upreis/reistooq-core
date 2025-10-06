import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { BarChart3, Download, RefreshCw } from 'lucide-react';
import { useDashboardVendas } from '@/features/dashboard/hooks/useDashboardVendas';
import { VendasFilters } from './components/VendasFilters';
import { VendasExportModal } from './components/VendasExportModal';
import { DashboardHeroCard } from './components/DashboardHeroCard';
import { DashboardKPICards } from './components/DashboardKPICards';
import { BrazilMap } from './components/BrazilMap';
import { DashboardCharts } from './components/DashboardCharts';
import { DashboardStatusCards } from './components/DashboardStatusCards';
import { DashboardProductsTable } from './components/DashboardProductsTable';

export default function DashboardVendasCompleto() {
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<any>(null);

  const {
    vendas,
    allVendas,
    analytics,
    isLoading,
    filters,
    selectedPeriod,
    hasActiveFilters,
    handleFilterChange,
    setSelectedPeriod,
    clearFilters,
    refetch
  } = useDashboardVendas();

  const handleStateClick = (uf: string) => {
    handleFilterChange({ uf: [uf] });
  };

  // Calculate metrics
  const dashboardMetrics = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Sales today
    const salesToday = vendas
      .filter(v => new Date(v.data_pedido).toDateString() === today.toDateString())
      .reduce((sum, v) => sum + (v.valor_total || 0), 0);

    const salesYesterday = allVendas
      .filter(v => new Date(v.data_pedido).toDateString() === yesterday.toDateString())
      .reduce((sum, v) => sum + (v.valor_total || 0), 0);

    const salesTodayChange = salesYesterday > 0 ? ((salesToday - salesYesterday) / salesYesterday) * 100 : 0;

    // Orders this month
    const ordersMonth = vendas.filter(v => new Date(v.data_pedido) >= startOfMonth).length;
    const ordersLastMonth = allVendas.filter(v => {
      const date = new Date(v.data_pedido);
      return date >= lastMonth && date <= endOfLastMonth;
    }).length;
    const ordersMonthChange = ordersLastMonth > 0 ? ((ordersMonth - ordersLastMonth) / ordersLastMonth) * 100 : 0;

    // Total revenue
    const totalRevenue = vendas.reduce((sum, v) => sum + (v.valor_total || 0), 0);
    const lastMonthRevenue = allVendas
      .filter(v => {
        const date = new Date(v.data_pedido);
        return date >= lastMonth && date <= endOfLastMonth;
      })
      .reduce((sum, v) => sum + (v.valor_total || 0), 0);
    const totalRevenueChange = lastMonthRevenue > 0 ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

    // New customers (unique cpf_cnpj this month vs last month)
    const customersThisMonth = new Set(
      vendas
        .filter(v => new Date(v.data_pedido) >= startOfMonth && v.cpf_cnpj)
        .map(v => v.cpf_cnpj)
    ).size;

    const customersLastMonth = new Set(
      allVendas
        .filter(v => {
          const date = new Date(v.data_pedido);
          return date >= lastMonth && date <= endOfLastMonth && v.cpf_cnpj;
        })
        .map(v => v.cpf_cnpj)
    ).size;

    const newCustomersChange = customersLastMonth > 0 ? ((customersThisMonth - customersLastMonth) / customersLastMonth) * 100 : 0;

    // Daily sales for chart (last 30 days)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    const dailySales = last30Days.map(dateStr => {
      const dayVendas = vendas.filter(v => v.data_pedido.split('T')[0] === dateStr);
      return {
        data: new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        vendas: dayVendas.length,
        valor: dayVendas.reduce((sum, v) => sum + (v.valor_total || 0), 0),
      };
    });

    // Top products
    const productSales = vendas.reduce((acc, v) => {
      const key = v.sku_produto || 'Sem SKU';
      if (!acc[key]) {
        acc[key] = { sku: key, nome: v.descricao || key, quantidade: 0, valor: 0 };
      }
      acc[key].quantidade += v.quantidade || 0;
      acc[key].valor += v.valor_total || 0;
      return acc;
    }, {} as Record<string, any>);

    const topProducts = Object.values(productSales)
      .sort((a: any, b: any) => b.quantidade - a.quantidade)
      .slice(0, 10);

    // Sales by channel
    const channelSales = vendas.reduce((acc, v) => {
      const empresa = v.empresa || 'Outros';
      if (!acc[empresa]) {
        acc[empresa] = { empresa, vendas: 0, valor: 0 };
      }
      acc[empresa].vendas += 1;
      acc[empresa].valor += v.valor_total || 0;
      return acc;
    }, {} as Record<string, any>);

    const salesByChannel = Object.values(channelSales);

    // Status data
    const statusCounts = vendas.reduce((acc, v) => {
      const status = v.status?.toLowerCase() || 'pendente';
      if (status.includes('entreg')) acc.entregues++;
      else if (status.includes('envi') || status.includes('transporte')) acc.enviados++;
      else acc.pendentes++;
      return acc;
    }, { pendentes: 0, enviados: 0, entregues: 0 });

    // State data for map
    const stateGroups = vendas.reduce((acc, v) => {
      const uf = v.uf || 'Outros';
      if (!acc[uf]) {
        acc[uf] = { uf, vendas: 0, valor: 0, pedidos: 0, cidades: {} as Record<string, any> };
      }
      acc[uf].vendas += 1;
      acc[uf].valor += v.valor_total || 0;
      acc[uf].pedidos += 1;
      
      const cidade = v.cidade || 'Não informada';
      if (!acc[uf].cidades[cidade]) {
        acc[uf].cidades[cidade] = { cidade, vendas: 0, valor: 0 };
      }
      acc[uf].cidades[cidade].vendas += 1;
      acc[uf].cidades[cidade].valor += v.valor_total || 0;
      
      return acc;
    }, {} as Record<string, any>);

    const stateData = Object.values(stateGroups).map((state: any) => ({
      ...state,
      cidades: Object.values(state.cidades).sort((a: any, b: any) => b.vendas - a.vendas),
    }));

    // Products table data
    const productsTableData = topProducts.map(p => ({
      sku: p.sku,
      nome: p.nome,
      empresa: vendas.find(v => v.sku_produto === p.sku)?.empresa || 'N/A',
      vendas: p.quantidade,
      receita: p.valor,
      status: 'ativo',
    }));

    return {
      salesToday,
      salesTodayChange,
      ordersMonth,
      ordersMonthChange,
      totalRevenue,
      totalRevenueChange,
      newCustomers: customersThisMonth,
      newCustomersChange,
      dailySales,
      topProducts,
      salesByChannel,
      statusData: { ...statusCounts, total: vendas.length },
      stateData,
      productsTableData,
      monthlyGoal: 50000, // Can be made configurable
      currentMonthSales: vendas.filter(v => new Date(v.data_pedido) >= startOfMonth).reduce((sum, v) => sum + (v.valor_total || 0), 0),
    };
  }, [vendas, allVendas]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Dashboard de Vendas</h1>
            <p className="text-muted-foreground">
              Análise completa com {allVendas.length.toLocaleString()} registros
              {hasActiveFilters && ` (${vendas.length.toLocaleString()} filtrados)`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportModalOpen(true)}
            disabled={vendas.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>
      
      {/* Hero Section */}
      <DashboardHeroCard
        totalSales={dashboardMetrics.totalRevenue}
        growthPercentage={dashboardMetrics.totalRevenueChange}
      />

      {/* Filtros Interativos */}
      <VendasFilters
        filters={filters}
        onFiltersChange={handleFilterChange}
        vendas={allVendas}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
      />
      
      {/* KPI Cards */}
      <DashboardKPICards
        salesToday={dashboardMetrics.salesToday}
        salesTodayChange={dashboardMetrics.salesTodayChange}
        ordersMonth={dashboardMetrics.ordersMonth}
        ordersMonthChange={dashboardMetrics.ordersMonthChange}
        totalRevenue={dashboardMetrics.totalRevenue}
        totalRevenueChange={dashboardMetrics.totalRevenueChange}
        newCustomers={dashboardMetrics.newCustomers}
        newCustomersChange={dashboardMetrics.newCustomersChange}
      />

      {/* Status Cards */}
      <DashboardStatusCards
        statusData={dashboardMetrics.statusData}
        onStatusClick={(status) => handleFilterChange({ status: [status] })}
      />

      {/* Layout Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráficos - 2 colunas */}
        <div className="lg:col-span-2 space-y-6">
          <DashboardCharts
            data={{
              dailySales: dashboardMetrics.dailySales,
              topProducts: dashboardMetrics.topProducts,
              salesByChannel: dashboardMetrics.salesByChannel,
              monthlyGoal: dashboardMetrics.monthlyGoal,
              currentMonthSales: dashboardMetrics.currentMonthSales,
            }}
          />
        </div>
        
        {/* Mapa - 1 coluna */}
        <BrazilMap
          stateData={dashboardMetrics.stateData}
          onStateClick={handleStateClick}
        />
      </div>
      
      {/* Tabela de Produtos */}
      <DashboardProductsTable products={dashboardMetrics.productsTableData} />
      
      {/* Modal de Exportação */}
      <VendasExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        vendas={vendas}
        analytics={analytics}
      />
    </div>
  );
}
