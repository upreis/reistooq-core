import { useState, useMemo, useEffect } from 'react';
import { useHistoricoVendas } from '@/features/historico/hooks/useHistoricoVendas';
import { HistoricoAnalyticsService } from '@/features/historico/services/historicoAnalyticsService';

export function useDashboardVendas() {
  const [filters, setFilters] = useState({
    dataInicio: '',
    dataFim: '',
    empresas: [] as string[],
    status: [] as string[],
    uf: [] as string[],
    cidades: [] as string[],
    skus: [] as string[],
    produtos: [] as string[]
  });
  
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  
  const { data: historicoData, isLoading, refetch } = useHistoricoVendas(1, 1000);
  const vendas = historicoData?.data || [];
  
  useEffect(() => {
    const now = new Date();
    let dataInicio = '';
    
    switch (selectedPeriod) {
      case '1d':
        dataInicio = now.toISOString().split('T')[0];
        break;
      case '7d':
        dataInicio = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '30d':
        dataInicio = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '90d':
        dataInicio = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'year':
        dataInicio = `${now.getFullYear()}-01-01`;
        break;
      default:
        dataInicio = '';
    }
    
    if (dataInicio) {
      setFilters(prev => ({ ...prev, dataInicio, dataFim: '' }));
    }
  }, [selectedPeriod]);
  
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
  
  const filteredVendas = useMemo(() => {
    let result = vendas;
    
    if (filters.empresas?.length > 0) {
      result = result.filter(v => filters.empresas.includes(v.empresa));
    }
    
    if (filters.uf?.length > 0) {
      result = result.filter(v => filters.uf.includes(v.uf));
    }
    
    if (filters.cidades?.length > 0) {
      result = result.filter(v => filters.cidades.includes(v.cidade));
    }
    
    if (filters.skus?.length > 0) {
      result = result.filter(v => filters.skus.includes(v.sku_produto));
    }
    
    if (filters.status?.length > 0) {
      result = result.filter(v => filters.status.includes(v.status));
    }
    
    if (filters.dataInicio) {
      result = result.filter(v => v.data_pedido >= filters.dataInicio);
    }
    
    if (filters.dataFim) {
      result = result.filter(v => v.data_pedido <= filters.dataFim);
    }
    
    return result;
  }, [vendas, filters]);
  
  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  const clearFilters = () => {
    setFilters({
      dataInicio: '',
      dataFim: '',
      empresas: [],
      status: [],
      uf: [],
      cidades: [],
      skus: [],
      produtos: []
    });
  };
  
  const hasActiveFilters = Object.values(filters).some(v => 
    Array.isArray(v) ? v.length > 0 : v !== ''
  );
  
  return {
    vendas: filteredVendas,
    allVendas: vendas,
    analytics,
    metrics,
    isLoading,
    filters,
    selectedPeriod,
    hasActiveFilters,
    handleFilterChange,
    setSelectedPeriod,
    clearFilters,
    refetch
  };
}
