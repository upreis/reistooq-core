/**
 * 📦 VENDAS ONLINE - Página Principal
 * Gerenciamento completo de vendas do Mercado Livre
 */

import { useState, useMemo } from 'react';
import { VendasFiltersBar } from '@/features/vendas-online/components/VendasFiltersBar';
import { VendasOnlineTable } from '@/features/vendas-online/components/VendasOnlineTable';
import { VendasPaginationFooter } from '@/features/vendas-online/components/VendasPaginationFooter';
import { VendasAccountSelector } from '@/features/vendas-online/components/VendasAccountSelector';
import { useVendasData } from '@/features/vendas-online/hooks/useVendasData';
import { useVendasStore } from '@/features/vendas-online/store/vendasStore';
import { useSidebarUI } from '@/context/SidebarUIContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, TrendingUp, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { MLOrdersNav } from '@/features/ml/components/MLOrdersNav';
import { useVendaStorage } from '@/features/vendas-online/hooks/useVendaStorage';
import type { StatusAnalise } from '@/features/vendas-online/types/venda-analise.types';
import { STATUS_ATIVOS, STATUS_HISTORICO } from '@/features/vendas-online/types/venda-analise.types';

export default function VendasOnline() {
  const { refresh } = useVendasData();
  const { orders, pagination, isLoading, setPage, setItemsPerPage } = useVendasStore();
  const { isSidebarCollapsed } = useSidebarUI();
  
  // 💾 STORAGE DE ANÁLISE (localStorage)
  const {
    analiseStatus,
    setAnaliseStatus
  } = useVendaStorage();
  
  // Estado de abas
  const [activeTab, setActiveTab] = useState<'ativas' | 'historico'>('ativas');
  
  // Enriquecer vendas com status_analise_local do localStorage
  const vendasEnriquecidas = useMemo(() => {
    return orders.map(venda => ({
      ...venda,
      status_analise_local: analiseStatus[venda.id.toString()] || 'pendente' as StatusAnalise
    }));
  }, [orders, analiseStatus]);
  
  // Filtrar vendas por aba ativa (Ativas vs Histórico)
  const vendasFiltradasPorAba = useMemo(() => {
    if (activeTab === 'ativas') {
      return vendasEnriquecidas.filter(v => 
        STATUS_ATIVOS.includes(v.status_analise_local)
      );
    } else {
      return vendasEnriquecidas.filter(v => 
        STATUS_HISTORICO.includes(v.status_analise_local)
      );
    }
  }, [vendasEnriquecidas, activeTab]);
  
  // Contadores de abas
  const countAtivas = vendasEnriquecidas.filter(v => 
    STATUS_ATIVOS.includes(v.status_analise_local)
  ).length;
  
  const countHistorico = vendasEnriquecidas.filter(v => 
    STATUS_HISTORICO.includes(v.status_analise_local)
  ).length;
  
  // Calcular estatísticas (baseado em vendas filtradas por aba)
  const stats = {
    total: vendasFiltradasPorAba.length,
    pending: vendasFiltradasPorAba.filter(o => o.status === 'payment_in_process').length,
    completed: vendasFiltradasPorAba.filter(o => o.status === 'paid').length,
    revenue: vendasFiltradasPorAba.reduce((sum, o) => sum + o.total_amount, 0)
  };

  return (
    <div className="w-full">
      <div className="space-y-6">
          {/* Sub-navegação */}
          <MLOrdersNav />
          
          {/* Header */}
          <div className="px-4 md:px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Vendas Online</h1>
                <p className="text-muted-foreground">
                  Gerencie todas as suas vendas do Mercado Livre em um só lugar
                </p>
              </div>
              
              <Button onClick={() => refresh()} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Vendas</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pendentes</p>
                    <p className="text-2xl font-bold">{stats.pending}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Concluídas</p>
                    <p className="text-2xl font-bold">{stats.completed}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Receita</p>
                    <p className="text-2xl font-bold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(stats.revenue)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
          
          {/* Account Selector */}
          <div className="px-4 md:px-6">
            <VendasAccountSelector />
          </div>
          
          {/* Tabs: Ativas vs Histórico */}
          <div className="px-4 md:px-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'ativas' | 'historico')}>
              <TabsList className="grid w-auto grid-cols-2 shrink-0 h-10">
                <TabsTrigger value="ativas" className="h-10">
                  Ativas ({countAtivas})
                </TabsTrigger>
                <TabsTrigger value="historico" className="h-10">
                  Histórico ({countHistorico})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Filters */}
          <div className="px-4 md:px-6">
            <VendasFiltersBar />
          </div>
          
          {/* Table */}
          <div className="px-4 md:px-6 pb-24">
            <VendasOnlineTable />
          </div>
          
          {/* Rodapé Fixado com Paginação */}
          {!isLoading && pagination.total > 0 && (
            <div 
              className={`fixed bottom-0 right-0 bg-background border-t shadow-lg z-40 transition-all duration-300 ${
                isSidebarCollapsed ? 'md:left-[72px]' : 'md:left-72'
              } left-0`}
            >
              <VendasPaginationFooter
                totalItems={pagination.total}
                currentPage={pagination.currentPage}
                itemsPerPage={pagination.itemsPerPage}
                onPageChange={setPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          )}
        </div>
    </div>
  );
}
