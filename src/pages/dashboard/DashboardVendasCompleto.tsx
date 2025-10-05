import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, DollarSign, TrendingUp, Users, 
  Package, Download
} from 'lucide-react';
import { useHistoricoVendas } from '@/features/historico/hooks/useHistoricoVendas';
import { HistoricoAnalyticsService } from '@/features/historico/services/historicoAnalyticsService';
import { VendasFilters } from './components/VendasFilters';
import { VendasMetricsCards } from './components/VendasMetricsCards';
import { VendasTable } from './components/VendasTable';

export default function DashboardVendasCompleto() {
  const [filters, setFilters] = useState({
    dataInicio: '',
    dataFim: '',
    empresas: [],
    status: [],
    uf: [],
    cidades: [],
    skus: [],
    produtos: []
  });
  
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  
  const { data: historicoData, isLoading } = useHistoricoVendas(1, 1000);
  const vendas = historicoData?.data || [];
  
  const analytics = useMemo(() => {
    if (!vendas.length) return null;
    return HistoricoAnalyticsService.getAnalytics();
  }, [vendas]);
  
  const metrics = useMemo(() => {
    if (!vendas.length) return null;
    
    const hoje = new Date().toISOString().split('T')[0];
    const ontem = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    const vendasHoje = vendas.filter(v => v.data_pedido === hoje);
    const vendasOntem = vendas.filter(v => v.data_pedido === ontem);
    
    const valorHoje = vendasHoje.reduce((sum, v) => sum + (v.valor_total || 0), 0);
    const valorOntem = vendasOntem.reduce((sum, v) => sum + (v.valor_total || 0), 0);
    
    const crescimentoVendas = valorOntem > 0 ? ((valorHoje - valorOntem) / valorOntem) * 100 : 0;
    
    return {
      vendasHoje: {
        valor: valorHoje,
        quantidade: vendasHoje.length,
        crescimento: crescimentoVendas
      },
      totalVendas: vendas.length,
      valorTotal: vendas.reduce((sum, v) => sum + (v.valor_total || 0), 0),
      ticketMedio: vendas.length > 0 ? vendas.reduce((sum, v) => sum + (v.valor_total || 0), 0) / vendas.length : 0,
      clientesUnicos: new Set(vendas.map(v => v.cliente_nome).filter(Boolean)).size,
      produtosUnicos: new Set(vendas.map(v => v.sku_produto).filter(Boolean)).size
    };
  }, [vendas]);
  
  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
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
            <p className="text-muted-foreground">Análise completa das vendas com dados em tempo real</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>
      
      {/* Filtros Interativos */}
      <VendasFilters
        filters={filters}
        onFiltersChange={handleFilterChange}
        vendas={vendas}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
      />
      
      {/* Cards de Métricas */}
      <VendasMetricsCards
        metrics={metrics}
        analytics={analytics}
        isLoading={isLoading}
      />
      
      {/* Tabela de Dados */}
      <VendasTable
        vendas={vendas}
        filters={filters}
        analytics={analytics}
      />
    </div>
  );
}
