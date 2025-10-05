import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BarChart3, Download, RefreshCw } from 'lucide-react';
import { useDashboardVendas } from '@/features/dashboard/hooks/useDashboardVendas';
import { VendasFilters } from './components/VendasFilters';
import { VendasCharts } from './components/VendasCharts';
import { VendasMap } from './components/VendasMap';
import { VendasTable } from './components/VendasTable';
import { VendasExportModal } from './components/VendasExportModal';

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

  const handleStateClick = (stateData: any) => {
    if (stateData) {
      setSelectedState(stateData);
      handleFilterChange({ uf: [stateData.uf] });
    } else {
      setSelectedState(null);
      handleFilterChange({ uf: [] });
    }
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
      
      {/* Filtros Interativos */}
      <VendasFilters
        filters={filters}
        onFiltersChange={handleFilterChange}
        vendas={allVendas}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
      />
      
      {/* Layout Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráficos - 2 colunas */}
        <div className="lg:col-span-2 space-y-6">
          <VendasCharts
            analytics={analytics}
            vendas={vendas}
            filters={filters}
          />
        </div>
        
        {/* Mapa - 1 coluna */}
        <div className="space-y-6">
          <VendasMap
            analytics={analytics}
            onStateClick={handleStateClick}
            selectedState={selectedState}
          />
        </div>
      </div>
      
      {/* Tabela de Dados */}
      <VendasTable
        vendas={vendas}
        filters={filters}
        analytics={analytics}
      />
      
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
