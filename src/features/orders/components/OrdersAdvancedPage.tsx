import React, { memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SalesStatsCard as StatsCard } from "@/components/dashboard/SalesStatsCard";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { OrdersAdvancedFilters } from "./OrdersAdvancedFilters";
import { OrdersBulkOperations } from "./OrdersBulkOperations";
import { useOrdersQuery } from "../hooks/useOrdersQuery";
import { useOrdersBulk } from "../hooks/useOrdersBulk";
import { OrderAdvanced } from "../types/orders-advanced.types";
import { OrderFiltersState } from "../types/orders-filters.types";
import { ShoppingCart, Clock, CheckCircle, XCircle, Plus, TrendingUp } from "lucide-react";

interface OrdersPageProps {
  className?: string;
}

// Enhanced stats calculation
const calculateStats = (orders: OrderAdvanced[]) => {
  const today = new Date().toISOString().split('T')[0];
  
  const stats = {
    today: orders.filter(order => order.data_pedido.startsWith(today)).length,
    pending: orders.filter(order => ['Pendente', 'Aguardando'].includes(order.situacao)).length,
    completed: orders.filter(order => ['Entregue', 'Concluído'].includes(order.situacao)).length,
    cancelled: orders.filter(order => ['Cancelado', 'Devolvido'].includes(order.situacao)).length,
    total_value: orders.reduce((sum, order) => sum + order.valor_total, 0),
    avg_value: orders.length > 0 ? orders.reduce((sum, order) => sum + order.valor_total, 0) / orders.length : 0,
  };

  return stats;
};

// Order Details Modal Component
const OrderDetailsModal = memo<{
  order: OrderAdvanced | null;
  open: boolean;
  onClose: () => void;
}>(({ order, open, onClose }) => {
  if (!order || !open) return null;

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Pedido {order.numero}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Cliente</label>
              <p className="text-sm">{order.nome_cliente}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <Badge variant="outline">{order.situacao}</Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Data do Pedido</label>
              <p className="text-sm">{formatDate(order.data_pedido)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Valor Total</label>
              <p className="text-lg font-semibold">{formatCurrency(order.valor_total)}</p>
            </div>
          </div>

          {/* Enhanced Info */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Prioridade</label>
              <Badge variant={order.priority === 'urgent' ? 'destructive' : 'outline'}>
                {order.priority}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tags</label>
              <div className="flex flex-wrap gap-1">
                {order.tags?.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Margem de Lucro</label>
              <p className="text-sm font-medium text-green-600">
                {order.profit_margin.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Location & Tracking */}
          {(order.cidade || order.codigo_rastreamento) && (
            <div className="space-y-3">
              <h4 className="font-medium">Entrega</h4>
              <div className="grid grid-cols-2 gap-4">
                {order.cidade && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Localização</label>
                    <p className="text-sm">{[order.cidade, order.uf].filter(Boolean).join(', ')}</p>
                  </div>
                )}
                {order.codigo_rastreamento && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Rastreamento</label>
                    <p className="text-sm font-mono">{order.codigo_rastreamento}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {(order.obs || order.obs_interna) && (
            <div className="space-y-3">
              <h4 className="font-medium">Observações</h4>
              {order.obs && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Cliente</label>
                  <p className="text-sm bg-muted p-2 rounded">{order.obs}</p>
                </div>
              )}
              {order.obs_interna && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Interna</label>
                  <p className="text-sm bg-muted p-2 rounded">{order.obs_interna}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

export const OrdersAdvancedPage = memo<OrdersPageProps>(({ className }) => {
  const [selectedOrder, setSelectedOrder] = React.useState<OrderAdvanced | null>(null);
  const [showDetailsModal, setShowDetailsModal] = React.useState(false);

  // Main data hooks
  const ordersQuery = useOrdersQuery({
    initialPageSize: 25,
    enableRealtime: true,
    staleTime: 30000, // 30 seconds
  });

  const bulk = useOrdersBulk(ordersQuery.orders);

  // Calculate enhanced stats
  const stats = React.useMemo(() => calculateStats(ordersQuery.orders), [ordersQuery.orders]);

  // Handlers
  const handleViewDetails = useCallback((order: OrderAdvanced) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  }, []);

  const handleCloseDetailsModal = useCallback(() => {
    setShowDetailsModal(false);
    setSelectedOrder(null);
  }, []);

  const handleExport = useCallback((format: 'csv' | 'xlsx' | 'pdf') => {
    console.log(`Exporting ${ordersQuery.orders.length} orders as ${format}`);
    // Mock implementation - would call export service
    bulk.bulkExport(format);
  }, [ordersQuery.orders.length, bulk]);

  // Enhanced order table with selection handling
  const enhancedOrders = React.useMemo(() => {
    return ordersQuery.orders.map(order => ({
      ...order,
      isSelected: bulk.selectedOrders.includes(order.id),
      isEligible: bulk.eligibleOrders.includes(order.id),
    }));
  }, [ordersQuery.orders, bulk.selectedOrders, bulk.eligibleOrders]);

  return (
    <div className={`container mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6 space-y-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pedidos Avançado</h1>
          <p className="text-muted-foreground">
            Gestão inteligente de pedidos com analytics e automação
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Pedido
        </Button>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <StatsCard
          title="Hoje"
          value={stats.today.toString()}
          change="+12% vs ontem"
          changeType="positive"
          icon={ShoppingCart}
          gradient="primary"
        />
        <StatsCard
          title="Pendentes"
          value={stats.pending.toString()}
          change="Aguardando ação"
          changeType="neutral"
          icon={Clock}
          gradient="warning"
        />
        <StatsCard
          title="Concluídos"
          value={stats.completed.toString()}
          change="+8% vs ontem"
          changeType="positive"
          icon={CheckCircle}
          gradient="success"
        />
        <StatsCard
          title="Cancelados"
          value={stats.cancelled.toString()}
          change="-2 vs ontem"
          changeType="negative"
          icon={XCircle}
          gradient="danger"
        />
        <StatsCard
          title="Valor Total"
          value={new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(stats.total_value)}
          change="+15% vs mês passado"
          changeType="positive"
          icon={TrendingUp}
          gradient="success"
        />
        <StatsCard
          title="Ticket Médio"
          value={new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(stats.avg_value)}
          change="+5% vs média"
          changeType="positive"
          icon={TrendingUp}
          gradient="primary"
        />
      </div>

      {/* Advanced Filters */}
      <OrdersAdvancedFilters
        filters={ordersQuery.filters as OrderFiltersState}
        onFiltersChange={ordersQuery.setFilters}
        onClearFilters={ordersQuery.clearFilters}
      />

      {/* Bulk Operations Panel */}
      <OrdersBulkOperations
        selectedCount={bulk.selectedOrders.length}
        eligibleCount={bulk.eligibleOrders.length}
        totalOrders={ordersQuery.total}
        isProcessing={bulk.isProcessing}
        isExporting={false} // Would come from export hook
        currentOperation={bulk.currentOperation}
        onClearSelection={bulk.clearSelection}
        onBulkLowStock={bulk.bulkLowStock}
        onBulkCancelOrders={bulk.bulkCancelOrders}
        onExport={handleExport}
        onRefresh={ordersQuery.refresh}
      />

      {/* Enhanced Orders Table */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">
            Pedidos ({ordersQuery.total})
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {ordersQuery.isValidating && "Atualizando..."}
            {ordersQuery.isLoading && "Carregando..."}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <OrdersTable
            orders={enhancedOrders}
            isLoading={ordersQuery.isLoading}
            selectedOrders={bulk.selectedOrders}
            eligibleOrders={bulk.eligibleOrders}
            onSelectOrder={bulk.selectOrder}
            onUnselectOrder={bulk.unselectOrder}
            onSelectAll={() => bulk.selectAll(ordersQuery.orders)}
            onClearSelection={bulk.clearSelection}
            onViewDetails={handleViewDetails}
            getStockEligibility={(order) => ({ 
              canProcess: bulk.eligibleOrders.includes(order.id),
              reason: bulk.eligibleOrders.includes(order.id) ? 'Elegível' : 'Não elegível'
            })}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {ordersQuery.pagination.total_pages > 1 && (
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Página {ordersQuery.pagination.page} de {ordersQuery.pagination.total_pages}
                {' '}({ordersQuery.total} pedidos no total)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={ordersQuery.previousPage}
                  disabled={ordersQuery.pagination.page <= 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={ordersQuery.nextPage}
                  disabled={ordersQuery.pagination.page >= ordersQuery.pagination.total_pages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {ordersQuery.isError && ordersQuery.error && (
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">
              Erro ao carregar pedidos: {ordersQuery.error.message}
            </p>
            <Button variant="outline" onClick={ordersQuery.refresh}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <OrderDetailsModal
        order={selectedOrder}
        open={showDetailsModal}
        onClose={handleCloseDetailsModal}
      />
    </div>
  );
});

OrdersAdvancedPage.displayName = 'OrdersAdvancedPage';