/**
 * 📦 VENDAS ONLINE - Página Principal
 * Gerenciamento completo de vendas do Mercado Livre
 */

import { VendasFiltersBar } from '@/features/vendas-online/components/VendasFiltersBar';
import { VendasOnlineTable } from '@/features/vendas-online/components/VendasOnlineTable';
import { VendasPaginationFooter } from '@/features/vendas-online/components/VendasPaginationFooter';
import { VendasAccountSelector } from '@/features/vendas-online/components/VendasAccountSelector';
import { useVendasData } from '@/features/vendas-online/hooks/useVendasData';
import { useVendasStore } from '@/features/vendas-online/store/vendasStore';
import { useSidebarUI } from '@/context/SidebarUIContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, TrendingUp, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { MLOrdersNav } from '@/features/ml/components/MLOrdersNav';

export default function VendasOnline() {
  const { refresh } = useVendasData();
  const { orders, pagination, isLoading, setPage, setItemsPerPage } = useVendasStore();
  const { isSidebarCollapsed } = useSidebarUI();
  
  // Calcular estatísticas
  const stats = {
    total: pagination.total,
    pending: orders.filter(o => o.status === 'payment_in_process').length,
    completed: orders.filter(o => o.status === 'paid').length,
    revenue: orders.reduce((sum, o) => sum + o.total_amount, 0)
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
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Faturamento</p>
                    <p className="text-2xl font-bold">
                      {stats.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
                itemsPerPage={pagination.itemsPerPage}
                currentPage={pagination.currentPage}
                onPageChange={setPage}
                onItemsPerPageChange={setItemsPerPage}
                showFirstLastButtons={true}
                pageButtonLimit={5}
              />
            </div>
          )}
      </div>
    </div>
  );
}
