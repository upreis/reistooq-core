
import React, { useState, useCallback } from 'react';
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingCart, Clock, CheckCircle, XCircle, Plus, ExternalLink } from "lucide-react";
import { OrdersProvider, useOrdersData, useOrdersActions } from '@/features/orders/components/layout/OrdersProvider';
import { OrdersList } from '@/features/orders/components/list/OrdersList';
import { OrdersFilters } from '@/components/orders/OrdersFilters';
import { BulkActionsBar } from '@/components/orders/BulkActionsBar';
import { OrdersSyncStatus } from '@/components/orders/OrdersSyncStatus';
import { Order } from '@/features/orders/types/Orders.types';
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

// Main component with the new architecture
const PedidosContent = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // New optimized hooks
  const { orders, stats, total, isLoading, isError, error, refetch } = useOrdersData();
  const { setFilters, clearFilters } = useOrdersActions();
  
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
    console.log('Export CSV - will be implemented in next phase');
  }, []);
  
  const handleClearFilters = useCallback(() => {
    clearFilters();
  }, [clearFilters]);
  
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);
  
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
      <OrdersSyncStatus onSyncComplete={handleRefresh} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Pedidos Hoje"
          value={stats.today.toString()}
          change={isLoading ? "Carregando..." : "+12% vs ontem"}
          changeType="positive"
          icon={ShoppingCart}
          gradient="primary"
        />
        <StatsCard
          title="Pendentes"
          value={stats.pending.toString()}
          change="Aguardando processamento"
          changeType="neutral"
          icon={Clock}
          gradient="warning"
        />
        <StatsCard
          title="Concluídos"
          value={stats.completed.toString()}
          change={isLoading ? "Carregando..." : "+8% vs ontem"}
          changeType="positive"
          icon={CheckCircle}
          gradient="success"
        />
        <StatsCard
          title="Cancelados"
          value={stats.cancelled.toString()}
          change={isLoading ? "Carregando..." : "-2 vs ontem"}
          changeType="negative"
          icon={XCircle}
          gradient="danger"
        />
      </div>

      {/* Modern Orders List - Replaces old table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Lista de Pedidos</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCsv}>
              Exportar CSV
            </Button>
            <Button variant="outline" onClick={handleClearFilters}>
              Limpar Filtros
            </Button>
          </div>
        </div>
        
        <OrdersList 
          orders={orders}
          isLoading={isLoading}
          isError={isError}
          error={error}
          hasMore={false}
          onLoadMore={() => {}}
          onOrderSelect={handleViewDetails}
          onOrderAction={(action, orderId) => console.log('Order action:', action, orderId)}
          selectedOrderIds={[]}
          viewMode="cards"
          isCompactMode={false}
        />
      </div>

      {/* Error state */}
      {isError && (
        <div className="text-center py-8">
          <p className="text-destructive">Erro ao carregar pedidos: {error?.message}</p>
          <Button variant="outline" onClick={handleRefresh} className="mt-2">
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

// Main wrapper with provider
const Pedidos = () => {
  return (
    <OrdersProvider 
      initialFilters={{ 
        limit: 50,
        offset: 0
      }}
      enableRealtime={true}
      enableNotifications={true}
    >
      <PedidosContent />
    </OrdersProvider>
  );
};

export default Pedidos;