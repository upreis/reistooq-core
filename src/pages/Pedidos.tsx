
import React, { useState, useCallback } from 'react';
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingCart, Clock, CheckCircle, XCircle, Plus, ExternalLink } from "lucide-react";
import { useOrders } from '@/hooks/useOrders';
import { useOrderExport } from '@/hooks/useOrderExport';
import { useBulkStock } from '@/hooks/useBulkStock';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { OrdersFilters } from '@/components/orders/OrdersFilters';
import { BulkActionsBar } from '@/components/orders/BulkActionsBar';
import { OrdersSyncStatus } from '@/components/orders/OrdersSyncStatus';
import { Order } from '@/services/OrderService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Order details modal component
const OrderDetailsModal = React.memo<{
  order: Order | null;
  open: boolean;
  onClose: () => void;
}>(({ order, open, onClose }) => {
  if (!order) return null;
  
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return dateString;
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Detalhes do Pedido {order.numero}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Cliente</label>
              <p className="text-sm">{order.nome_cliente}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">CPF/CNPJ</label>
              <p className="text-sm">{order.cpf_cnpj || 'Não informado'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Data do Pedido</label>
              <p className="text-sm">{formatDate(order.data_pedido)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Data Prevista</label>
              <p className="text-sm">{order.data_prevista ? formatDate(order.data_prevista) : 'Não informada'}</p>
            </div>
          </div>
          
          {/* Financial info */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Valor Total</label>
              <p className="text-lg font-semibold">{formatCurrency(order.valor_total)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Frete</label>
              <p className="text-sm">{formatCurrency(order.valor_frete)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Desconto</label>
              <p className="text-sm">{formatCurrency(order.valor_desconto)}</p>
            </div>
          </div>
          
          {/* Shipping info */}
          {(order.cidade || order.uf || order.codigo_rastreamento) && (
            <div className="space-y-3">
              <h4 className="font-medium">Informações de Entrega</h4>
              <div className="grid grid-cols-2 gap-4">
                {(order.cidade || order.uf) && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Endereço</label>
                    <p className="text-sm">{[order.cidade, order.uf].filter(Boolean).join(', ')}</p>
                  </div>
                )}
                {order.codigo_rastreamento && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Rastreamento</label>
                    <div className="flex items-center gap-2">
                      <p className="text-sm">{order.codigo_rastreamento}</p>
                      {order.url_rastreamento && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(order.url_rastreamento!, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
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
                  <label className="text-sm font-medium text-muted-foreground">Observações do Cliente</label>
                  <p className="text-sm bg-muted p-2 rounded">{order.obs}</p>
                </div>
              )}
              {order.obs_interna && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Observações Internas</label>
                  <p className="text-sm bg-muted p-2 rounded">{order.obs_interna}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});

const Pedidos = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Main hooks
  const orders = useOrders();
  const export_ = useOrderExport();
  const bulk = useBulkStock(orders.orders);
  
  // Handlers
  const handleViewDetails = useCallback((order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  }, []);
  
  const handleCloseDetailsModal = useCallback(() => {
    setShowDetailsModal(false);
    setSelectedOrder(null);
  }, []);
  
  const handleExportCsv = useCallback(() => {
    const filename = `pedidos_${new Date().toISOString().split('T')[0]}.csv`;
    export_.exportToCsv(orders.filters, filename);
  }, [export_, orders.filters]);
  
  const handleClearFilters = useCallback(() => {
    orders.setSearch('');
    orders.setSituacoes([]);
    orders.setFonte('interno');
    const defaultDates = { 
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0] 
    };
    orders.setDateRange(defaultDates.from, defaultDates.to);
  }, [orders]);
  
  return (
    <div className="container mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground">Gerencie pedidos de todas as plataformas em um só lugar</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Pedido
        </Button>
      </div>

      {/* Integration Status */}
      <OrdersSyncStatus onSyncComplete={orders.refresh} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Pedidos Hoje"
          value={orders.stats.today.toString()}
          change={orders.isLoadingStats ? "Carregando..." : "+12% vs ontem"}
          changeType="positive"
          icon={ShoppingCart}
          gradient="primary"
        />
        <StatsCard
          title="Pendentes"
          value={orders.stats.pending.toString()}
          change="Aguardando processamento"
          changeType="neutral"
          icon={Clock}
          gradient="warning"
        />
        <StatsCard
          title="Concluídos"
          value={orders.stats.completed.toString()}
          change={orders.isLoadingStats ? "Carregando..." : "+8% vs ontem"}
          changeType="positive"
          icon={CheckCircle}
          gradient="success"
        />
        <StatsCard
          title="Cancelados"
          value={orders.stats.cancelled.toString()}
          change={orders.isLoadingStats ? "Carregando..." : "-2 vs ontem"}
          changeType="negative"
          icon={XCircle}
          gradient="danger"
        />
      </div>

      {/* Filters */}
      <OrdersFilters
        filters={orders.filters}
        onSearchChange={orders.setSearch}
        onDateRangeChange={orders.setDateRange}
        onSituacoesChange={orders.setSituacoes}
        onFonteChange={orders.setFonte}
        onClearFilters={handleClearFilters}
      />

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={bulk.selectedOrders.length}
        eligibleCount={bulk.eligibleOrders.length}
        totalOrders={orders.total}
        isProcessing={bulk.isProcessing}
        isExporting={export_.isExporting}
        filters={orders.filters}
        onClearSelection={bulk.clearSelection}
        onBulkBaixarEstoque={bulk.bulkBaixarEstoque}
        onBulkCancelarPedidos={bulk.bulkCancelarPedidos}
        onExportCsv={handleExportCsv}
        onRefresh={orders.refresh}
      />

      {/* Orders Table */}
      <OrdersTable
        orders={orders.orders}
        isLoading={orders.isLoading}
        selectedOrders={bulk.selectedOrders}
        eligibleOrders={bulk.eligibleOrders}
        onSelectOrder={bulk.selectOrder}
        onUnselectOrder={bulk.unselectOrder}
        onSelectAll={() => bulk.selectAll(orders.orders)}
        onClearSelection={bulk.clearSelection}
        onViewDetails={handleViewDetails}
        getStockEligibility={bulk.getStockEligibility}
      />

      {/* Error state */}
      {orders.isError && (
        <div className="text-center py-8">
          <p className="text-destructive">Erro ao carregar pedidos: {orders.error?.message}</p>
          <Button variant="outline" onClick={orders.refresh} className="mt-2">
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Modals */}
      <OrderDetailsModal
        order={selectedOrder}
        open={showDetailsModal}
        onClose={handleCloseDetailsModal}
      />
    </div>
  );
};

export default Pedidos;