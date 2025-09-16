import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Search, RefreshCw, Download, Filter, Package, 
  Users, Calendar, Loader2, AlertTriangle, CheckCircle
} from 'lucide-react';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VirtualTable } from '@/components/ui/virtual-table';
import { Skeleton } from '@/components/ui/skeleton';

// Types
interface MLOrder {
  id: string;
  order_id: string;
  status: string;
  date_created: string;
  total_amount: number;
  currency: string;
  buyer_id?: string;
  buyer_nickname?: string;
  item_title?: string;
  quantity: number;
  has_claims: boolean;
  claims_count: number;
  raw_data: any;
}

interface MLAccount {
  id: string;
  name: string;
  account_identifier: string;
  organization_id: string;
  is_active: boolean;
}

interface Props {
  mlAccounts: MLAccount[];
  onOrdersLoaded?: (orders: MLOrder[]) => void;
}

// Hooks customizados
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Componentes memoizados
const MetricCard = React.memo(({ title, value, icon: Icon, color = "default" }: {
  title: string;
  value: string | number;
  icon: any;
  color?: "default" | "success" | "warning" | "error";
}) => (
  <Card className="hover-scale transition-all duration-200">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={`text-2xl font-bold ${
            color === 'success' ? 'text-green-600' : 
            color === 'warning' ? 'text-yellow-600' : 
            color === 'error' ? 'text-red-600' : 
            'text-foreground'
          }`}>
            {value}
          </p>
        </div>
        <Icon className={`h-8 w-8 ${
          color === 'success' ? 'text-green-600' : 
          color === 'warning' ? 'text-yellow-600' : 
          color === 'error' ? 'text-red-600' : 
          'text-muted-foreground'
        }`} />
      </div>
    </CardContent>
  </Card>
));

const OrderCard = React.memo(({ order, onClick }: { order: MLOrder; onClick: () => void }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'cancelled': return 'destructive';
      case 'paid': return 'default';
      case 'shipped': return 'secondary';
      case 'delivered': return 'default';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'cancelled': return 'Cancelada';
      case 'paid': return 'Paga';
      case 'shipped': return 'Enviada';
      case 'delivered': return 'Entregue';
      default: return status;
    }
  };

  return (
    <Card className="hover-scale transition-all duration-200 cursor-pointer" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-sm truncate max-w-[200px]" title={order.item_title}>
              {order.item_title || 'Produto não identificado'}
            </h3>
            <p className="text-xs text-muted-foreground">Order: {order.order_id}</p>
          </div>
          <Badge variant={getStatusColor(order.status)}>
            {getStatusLabel(order.status)}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Comprador:</span>
            <p className="font-medium">{order.buyer_nickname || 'N/A'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Valor:</span>
            <p className="font-medium text-green-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: order.currency || 'BRL' }).format(order.total_amount || 0)}
            </p>
          </div>
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {new Date(order.date_created).toLocaleDateString('pt-BR')}
          </span>
          <div className="flex gap-1">
            <Badge variant="outline" className="text-xs">
              Qtd: {order.quantity}
            </Badge>
            {order.has_claims && (
              <Badge variant="destructive" className="text-xs">
                {order.claims_count} claims
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// Componente principal
const MLOrdersSelector: React.FC<Props> = ({ mlAccounts, onOrdersLoaded }) => {
  console.log('✅ MLOrdersSelector carregado - mlAccounts:', mlAccounts?.length);
  
  // Estados
  const [filtros, setFiltros] = React.useState({
    search: '',
    status: 'all',
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    accountIds: [] as string[],
    claimsFilter: 'all'
  });

  const [viewMode, setViewMode] = React.useState<'cards' | 'table'>('cards');
  const [selectedOrder, setSelectedOrder] = React.useState<MLOrder | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [orders, setOrders] = React.useState<MLOrder[]>([]);
  
  const queryClient = useQueryClient();
  const debouncedSearch = useDebounce(filtros.search, 500);

  // Auto-selecionar primeira conta ativa
  React.useEffect(() => {
    if (mlAccounts?.length > 0 && filtros.accountIds.length === 0) {
      const firstActive = mlAccounts.find(acc => acc.is_active);
      if (firstActive) {
        setFiltros(prev => ({ ...prev, accountIds: [firstActive.id] }));
      }
    }
  }, [mlAccounts]);

  // Mutation para buscar pedidos da API
  const fetchOrdersMutation = useMutation({
    mutationFn: async () => {
      if (filtros.accountIds.length === 0) {
        throw new Error('Selecione pelo menos uma conta ML');
      }

      const results = await Promise.allSettled(
        filtros.accountIds.map(async (accountId) => {
          const account = mlAccounts.find(acc => acc.id === accountId);
          if (!account) return [];

          console.log(`🔍 Buscando pedidos para conta: ${account.name}`);
          
          const { data, error } = await supabase.functions.invoke('unified-orders', {
            body: {
              integration_account_id: accountId,
              limit: 100,
              offset: 0,
              status: filtros.status !== 'all' ? filtros.status : undefined,
              date_from: filtros.dateFrom,
              date_to: filtros.dateTo,
              search: debouncedSearch || undefined
            }
          });

          if (error) {
            console.error(`❌ Erro ao buscar pedidos para ${account.name}:`, error);
            throw new Error(`Erro na conta ${account.name}: ${error.message}`);
          }

          return (data?.orders || []).map((order: any) => ({
            id: order.id || order.order_id,
            order_id: order.order_id || order.id,
            status: order.status,
            date_created: order.date_created,
            total_amount: order.total_amount,
            currency: order.currency || 'BRL',
            buyer_id: order.buyer_id,
            buyer_nickname: order.buyer_nickname,
            item_title: order.item_title,
            quantity: order.quantity || 1,
            has_claims: order.has_claims || false,
            claims_count: order.claims_count || 0,
            raw_data: order
          }));
        })
      );

      const allOrders = results
        .filter((result): result is PromiseFulfilledResult<MLOrder[]> => result.status === 'fulfilled')
        .flatMap(result => result.value);

      const errors = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason.message);

      if (errors.length > 0) {
        console.warn('Alguns erros ocorreram:', errors);
        toast.warning(`Algumas contas falharam: ${errors.join(', ')}`);
      }

      return allOrders;
    },
    onSuccess: (data) => {
      setOrders(data);
      onOrdersLoaded?.(data);
      toast.success(`✅ ${data.length} pedidos carregados da API ML`);
    },
    onError: (error: any) => {
      console.error('❌ Erro ao buscar pedidos:', error);
      toast.error(`Erro ao buscar pedidos: ${error.message}`);
    }
  });

  // Métricas calculadas
  const metricas = React.useMemo(() => {
    const total = orders.length;
    const pagos = orders.filter(o => o.status === 'paid').length;
    const enviados = orders.filter(o => o.status === 'shipped').length;
    const cancelados = orders.filter(o => o.status === 'cancelled').length;
    const comClaims = orders.filter(o => o.has_claims).length;
    const valorTotal = orders.reduce((acc, o) => acc + (o.total_amount || 0), 0);

    return { total, pagos, enviados, cancelados, comClaims, valorTotal };
  }, [orders]);

  // Filtrar pedidos
  const ordersFiltered = React.useMemo(() => {
    let filtered = orders;

    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase();
      filtered = filtered.filter(order => 
        order.order_id?.toLowerCase().includes(search) ||
        order.buyer_nickname?.toLowerCase().includes(search) ||
        order.item_title?.toLowerCase().includes(search)
      );
    }

    if (filtros.status !== 'all') {
      filtered = filtered.filter(order => order.status === filtros.status);
    }

    if (filtros.claimsFilter === 'with_claims') {
      filtered = filtered.filter(order => order.has_claims);
    } else if (filtros.claimsFilter === 'without_claims') {
      filtered = filtered.filter(order => !order.has_claims);
    }

    return filtered;
  }, [orders, debouncedSearch, filtros.status, filtros.claimsFilter]);

  // Handlers
  const handleSearch = React.useCallback(() => {
    setCurrentPage(1);
    fetchOrdersMutation.mutate();
  }, [fetchOrdersMutation]);

  const handleExport = React.useCallback(() => {
    if (ordersFiltered.length === 0) {
      toast.error('Nenhum pedido para exportar');
      return;
    }

    const csvContent = [
      ['Order ID', 'Status', 'Data', 'Comprador', 'Produto', 'Valor', 'Claims'],
      ...ordersFiltered.map(order => [
        order.order_id,
        order.status,
        new Date(order.date_created).toLocaleDateString('pt-BR'),
        order.buyer_nickname || '',
        order.item_title || '',
        order.total_amount || 0,
        order.has_claims ? `${order.claims_count} claims` : 'Sem claims'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ml_orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [ordersFiltered]);

  // Colunas para tabela virtual
  const tableColumns = React.useMemo(() => [
    { key: 'order_id', label: 'Order ID', width: 140, render: (item: MLOrder) => item.order_id },
    { key: 'status', label: 'Status', width: 100, render: (item: MLOrder) => (
      <Badge variant="outline">{item.status}</Badge>
    )},
    { key: 'buyer_nickname', label: 'Comprador', width: 150, render: (item: MLOrder) => item.buyer_nickname || 'N/A' },
    { key: 'item_title', label: 'Produto', width: 200, render: (item: MLOrder) => (
      <span className="truncate" title={item.item_title}>{item.item_title}</span>
    )},
    { key: 'total_amount', label: 'Valor', width: 120, render: (item: MLOrder) => (
      <span className="text-green-600 font-medium">
        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: item.currency || 'BRL' }).format(item.total_amount || 0)}
      </span>
    )},
    { key: 'date_created', label: 'Data', width: 120, render: (item: MLOrder) => (
      new Date(item.date_created).toLocaleDateString('pt-BR')
    )},
    { key: 'claims', label: 'Claims', width: 80, render: (item: MLOrder) => (
      item.has_claims ? (
        <Badge variant="destructive" className="text-xs">{item.claims_count}</Badge>
      ) : (
        <Badge variant="secondary" className="text-xs">0</Badge>
      )
    )}
  ], []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pedidos Mercado Livre</h2>
          <p className="text-muted-foreground">Buscar pedidos diretamente da API ML</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={ordersFiltered.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Métricas Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <MetricCard title="Total" value={metricas.total} icon={Package} />
        <MetricCard title="Pagos" value={metricas.pagos} icon={CheckCircle} color="success" />
        <MetricCard title="Enviados" value={metricas.enviados} icon={Package} color="default" />
        <MetricCard title="Cancelados" value={metricas.cancelados} icon={AlertTriangle} color="error" />
        <MetricCard title="Com Claims" value={metricas.comClaims} icon={AlertTriangle} color="warning" />
        <MetricCard 
          title="Valor Total" 
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metricas.valorTotal)} 
          icon={Package} 
          color="success" 
        />
      </div>

      {/* Filtros e Seleção de Contas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Configurações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seleção de Contas ML */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              <Users className="h-4 w-4 inline mr-1" />
              Contas ML (obrigatório)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {mlAccounts.map((account) => (
                <div key={account.id} className="flex items-center space-x-2 p-2 border rounded">
                  <input
                    type="checkbox"
                    id={account.id}
                    checked={filtros.accountIds.includes(account.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFiltros(prev => ({ 
                          ...prev, 
                          accountIds: [...prev.accountIds, account.id] 
                        }));
                      } else {
                        setFiltros(prev => ({ 
                          ...prev, 
                          accountIds: prev.accountIds.filter(id => id !== account.id) 
                        }));
                      }
                    }}
                    className="rounded"
                  />
                  <label htmlFor={account.id} className="text-sm font-medium cursor-pointer">
                    {account.name} ({account.account_identifier})
                  </label>
                  {account.is_active ? (
                    <Badge variant="outline" className="text-xs">Ativa</Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">Inativa</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Filtros básicos */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por Order ID, comprador, produto..."
                value={filtros.search}
                onChange={(e) => setFiltros(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            
            <Select value={filtros.status} onValueChange={(value) => setFiltros(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="paid">Pagos</SelectItem>
                <SelectItem value="shipped">Enviados</SelectItem>
                <SelectItem value="delivered">Entregues</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtros.claimsFilter} onValueChange={(value) => setFiltros(prev => ({ ...prev, claimsFilter: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Claims" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="with_claims">Com Claims</SelectItem>
                <SelectItem value="without_claims">Sem Claims</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={filtros.dateFrom}
              onChange={(e) => setFiltros(prev => ({ ...prev, dateFrom: e.target.value }))}
            />

            <Input
              type="date"
              value={filtros.dateTo}
              onChange={(e) => setFiltros(prev => ({ ...prev, dateTo: e.target.value }))}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSearch} 
              disabled={fetchOrdersMutation.isPending || filtros.accountIds.length === 0}
              className="flex items-center gap-2"
            >
              {fetchOrdersMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {fetchOrdersMutation.isPending ? 'Buscando...' : 'Buscar Pedidos'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setFiltros(prev => ({ 
                ...prev, 
                accountIds: mlAccounts.filter(acc => acc.is_active).map(acc => acc.id) 
              }))}
            >
              Selecionar Todas Ativas
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setFiltros(prev => ({ ...prev, accountIds: [] }))}
            >
              Limpar Seleção
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Controles de Visualização */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Visualização:</span>
          <div className="flex rounded-lg border">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="rounded-r-none"
            >
              <Package className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-l-none"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <span className="text-sm text-muted-foreground">
          {ordersFiltered.length} de {orders.length} {ordersFiltered.length === 1 ? 'resultado' : 'resultados'}
        </span>
      </div>

      {/* Conteúdo principal */}
      {fetchOrdersMutation.isPending ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-3" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : ordersFiltered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum pedido encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {orders.length === 0 
                ? 'Selecione uma conta ML e clique em "Buscar Pedidos"' 
                : 'Ajuste os filtros para encontrar pedidos'
              }
            </p>
            {filtros.accountIds.length === 0 && (
              <Button onClick={() => setFiltros(prev => ({ 
                ...prev, 
                accountIds: mlAccounts.filter(acc => acc.is_active).map(acc => acc.id) 
              }))}>
                Selecionar Contas Ativas
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ordersFiltered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={() => setSelectedOrder(order)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <VirtualTable
              data={ordersFiltered}
              columns={tableColumns}
              height={600}
              itemHeight={60}
              onRowClick={(order) => setSelectedOrder(order)}
              enableVirtualization={ordersFiltered.length > 50}
              threshold={50}
            />
          </CardContent>
        </Card>
      )}

      {/* Modal de Detalhes */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-6 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Informações Básicas</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Order ID:</strong> {selectedOrder.order_id}</div>
                      <div><strong>Status:</strong> <Badge>{selectedOrder.status}</Badge></div>
                      <div><strong>Data:</strong> {new Date(selectedOrder.date_created).toLocaleString('pt-BR')}</div>
                      <div><strong>Quantidade:</strong> {selectedOrder.quantity}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Comprador e Valores</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Comprador:</strong> {selectedOrder.buyer_nickname || 'N/A'}</div>
                      <div><strong>ID Comprador:</strong> {selectedOrder.buyer_id || 'N/A'}</div>
                      <div><strong>Valor Total:</strong> 
                        <span className="text-green-600 font-medium ml-1">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: selectedOrder.currency || 'BRL' }).format(selectedOrder.total_amount || 0)}
                        </span>
                      </div>
                      <div><strong>Claims:</strong> 
                        {selectedOrder.has_claims ? (
                          <Badge variant="destructive" className="ml-1">{selectedOrder.claims_count} claims</Badge>
                        ) : (
                          <Badge variant="secondary" className="ml-1">Sem claims</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Produto</h4>
                  <p className="text-sm">{selectedOrder.item_title || 'Produto não identificado'}</p>
                </div>
                
                {selectedOrder.raw_data && (
                  <div>
                    <h4 className="font-semibold mb-2">Dados Técnicos</h4>
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-[200px]">
                      {JSON.stringify(selectedOrder.raw_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default React.memo(MLOrdersSelector);