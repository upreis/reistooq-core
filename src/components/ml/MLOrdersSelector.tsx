import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Search, RefreshCw, Download, Filter, Package, 
  Users, Calendar, Loader2, AlertTriangle, CheckCircle,
  Eye, Grid, Table2, X
} from 'lucide-react';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

// Types
interface MLOrder {
  id: string;
  order_id?: string;
  status: string;
  date_created: string;
  date_closed?: string;
  last_updated?: string;
  total_amount: number;
  currency?: string;
  buyer_id?: string;
  buyer_nickname?: string;
  buyer_email?: string;
  buyer_phone?: string;
  item_title?: string;
  item_id?: string;
  variation_id?: string;
  quantity: number;
  unit_price?: number;
  has_claims?: boolean;
  claims_count?: number;
  seller_id?: string;
  seller_nickname?: string;
  payment_status?: string;
  payment_method?: string;
  installments?: number;
  shipping_id?: string;
  shipping_status?: string;
  shipping_mode?: string;
  shipping_method?: string;
  tracking_number?: string;
  estimated_delivery?: string;
  pack_id?: string;
  shipping_cost?: number;
  marketplace_fee?: number;
  city?: string;
  state?: string;
  zip_code?: string;
  address?: string;
  receiver_name?: string;
  receiver_phone?: string;
  tags?: string[];
  order_items?: any[];
  payments?: any[];
  shipping?: any;
  raw_data?: any;
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

// Hook customizado para debounce
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Componente de métricas
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

// Componente de card de pedido
const OrderCard = React.memo(({ order, onClick }: { order: MLOrder; onClick: () => void }) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'cancelled': return 'destructive';
      case 'paid': return 'default';
      case 'shipped': return 'secondary';
      case 'delivered': return 'default';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'cancelled': return 'Cancelada';
      case 'paid': return 'Paga';
      case 'shipped': return 'Enviada';
      case 'delivered': return 'Entregue';
      default: return status || 'N/A';
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
            <p className="text-xs text-muted-foreground">Order: {order.id || order.order_id}</p>
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
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount || 0)}
            </p>
          </div>
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {new Date(order.date_created).toLocaleDateString('pt-BR')}
          </span>
          <span className="text-xs text-muted-foreground">
            Qtd: {order.quantity || 1}
          </span>
        </div>
      </CardContent>
    </Card>
  );
});

// Componente principal
const MLOrdersSelector: React.FC<Props> = ({ mlAccounts, onOrdersLoaded }) => {
  console.log('✅ MLOrdersSelector carregado - mlAccounts:', mlAccounts?.length);
  
  // Estados
  const [selectedAccount, setSelectedAccount] = React.useState<string>('');
  const [filters, setFilters] = React.useState({
    search: '',
    status: 'all',
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    limit: 100,
    offset: 0
  });
  const [viewMode, setViewMode] = React.useState<'cards' | 'table'>('cards');
  const [selectedOrder, setSelectedOrder] = React.useState<MLOrder | null>(null);
  const [showFilters, setShowFilters] = React.useState(false);
  
  const debouncedSearch = useDebounce(filters.search, 500);

  // Auto-selecionar primeira conta ativa
  React.useEffect(() => {
    if (mlAccounts?.length > 0 && !selectedAccount) {
      setSelectedAccount(mlAccounts[0].id);
    }
  }, [mlAccounts, selectedAccount]);

  // Query para buscar pedidos da API do ML
  const { data: ordersData, isLoading, error, refetch } = useQuery({
    queryKey: ['ml-orders-api', selectedAccount, filters.dateFrom, filters.dateTo, filters.status, debouncedSearch],
    queryFn: async () => {
      if (!selectedAccount) {
        console.log('⚠️ Nenhuma conta selecionada');
        return { results: [], ok: false };
      }

      console.log('🔍 Buscando pedidos da API ML para conta:', selectedAccount);
      console.log('📝 Filtros aplicados:', {
        integration_account_id: selectedAccount,
        limit: filters.limit,
        offset: filters.offset,
        date_from: filters.dateFrom,
        date_to: filters.dateTo,
        status: filters.status !== 'all' ? filters.status : undefined,
        search: debouncedSearch || undefined
      });

      const requestBody: any = {
        integration_account_id: selectedAccount,
        limit: filters.limit,
        offset: filters.offset,
        date_from: filters.dateFrom,
        date_to: filters.dateTo
      };

      if (filters.status !== 'all') {
        requestBody.status = filters.status;
      }

      if (debouncedSearch) {
        requestBody.search = debouncedSearch;
      }

      const { data, error } = await supabase.functions.invoke('unified-orders', {
        body: requestBody
      });

      if (error) {
        console.error('❌ Erro ao buscar pedidos da API:', error);
        throw error;
      }

      console.log('✅ Resposta da API recebida:', data);
      return data || { results: [], ok: false };
    },
    enabled: !!selectedAccount,
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Extrair pedidos dos dados e mapear campos
  const orders = React.useMemo(() => {
    const results = ordersData?.results || [];
    console.log('📊 Pedidos processados:', results.length);
    
    // Mapear dados completos da API
    return results.map((order: any) => {
      const firstPayment = order.payments?.[0] || {};
      const firstItem = order.order_items?.[0] || {};
      const shipping = order.shipping || order.detailed_shipping || {};
      const destination = shipping.destination || {};
      const shippingAddress = destination.shipping_address || {};
      
      return {
        id: order.id?.toString() || order.order_id?.toString(),
        order_id: order.id?.toString() || order.order_id?.toString(),
        status: order.status || 'unknown',
        date_created: order.date_created || order.date_closed || new Date().toISOString(),
        date_closed: order.date_closed,
        last_updated: order.last_updated,
        total_amount: firstPayment.transaction_amount || order.total_amount || 0,
        currency: firstPayment.currency_id || 'BRL',
        buyer_id: firstPayment.payer_id?.toString(),
        buyer_nickname: destination.receiver_name || order.buyer_nickname,
        buyer_email: order.buyer_email,
        buyer_phone: destination.receiver_phone || order.buyer_phone,
        item_title: firstItem?.item?.title || order.item_title || 'Produto não identificado',
        item_id: firstItem?.item?.id,
        variation_id: firstItem?.item?.variation_id,
        quantity: firstItem?.quantity || order.quantity || 1,
        unit_price: firstItem?.unit_price || firstPayment.transaction_amount || 0,
        has_claims: order.has_claims || false,
        claims_count: order.claims_count || 0,
        seller_id: firstPayment?.collector?.id?.toString(),
        seller_nickname: order.seller_nickname,
        payment_status: firstPayment.status,
        payment_method: firstPayment.payment_method_id,
        installments: firstPayment.installments,
        shipping_id: shipping.id?.toString(),
        shipping_status: shipping.status,
        shipping_mode: shipping.logistic?.mode,
        shipping_method: shipping.lead_time?.shipping_method?.name,
        tracking_number: shipping.tracking_number,
        estimated_delivery: shipping.lead_time?.estimated_delivery_time?.date,
        pack_id: order.pack_id,
        shipping_cost: shipping.costs?.receiver?.cost || 0,
        marketplace_fee: firstPayment.marketplace_fee || 0,
        city: shippingAddress.city?.name,
        state: shippingAddress.state?.name,
        zip_code: shippingAddress.zip_code,
        address: shippingAddress.address_line,
        receiver_name: destination.receiver_name,
        receiver_phone: destination.receiver_phone,
        tags: order.tags || [],
        order_items: order.order_items || [],
        payments: order.payments || [],
        shipping: shipping,
        raw_data: order
      };
    });
  }, [ordersData]);

  // Notificar callback quando orders mudarem
  React.useEffect(() => {
    if (orders.length > 0 && onOrdersLoaded) {
      onOrdersLoaded(orders);
    }
  }, [orders, onOrdersLoaded]);

  // Métricas calculadas expandidas
  const metrics = React.useMemo(() => {
    const total = orders.length;
    const paid = orders.filter(o => o.payment_status === 'approved').length;
    const shipped = orders.filter(o => o.shipping_status === 'shipped' || o.shipping_status === 'ready_to_ship').length;
    const delivered = orders.filter(o => o.shipping_status === 'delivered').length;
    const cancelled = orders.filter(o => o.status?.toLowerCase() === 'cancelled').length;
    const pending = orders.filter(o => o.payment_status === 'pending').length;
    const totalValue = orders.reduce((acc, o) => acc + (o.total_amount || 0), 0);
    const totalShippingCost = orders.reduce((acc, o) => acc + (o.shipping_cost || 0), 0);
    const totalMarketplaceFee = orders.reduce((acc, o) => acc + (o.marketplace_fee || 0), 0);
    const averageValue = total > 0 ? totalValue / total : 0;

    return { 
      total, paid, shipped, delivered, cancelled, pending, 
      totalValue, totalShippingCost, totalMarketplaceFee, averageValue 
    };
  }, [orders]);

  // Handlers
  const handleSearch = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const handleExport = React.useCallback(() => {
    if (orders.length === 0) {
      toast.error('Nenhum dados para exportar');
      return;
    }

    const csvContent = [
      [
        'Order ID', 'Status', 'Status Pagamento', 'Comprador', 'Produto', 'Quantidade', 
        'Valor Unitário', 'Valor Total', 'Método Pagamento', 'Cidade', 'Estado', 
        'CEP', 'Status Envio', 'Método Envio', 'Código Rastreamento', 'Data Criação', 
        'Data Fechamento', 'Estimativa Entrega'
      ],
      ...orders.map(o => [
        o.id || o.order_id || '',
        o.status || '',
        o.payment_status || '',
        o.buyer_nickname || '',
        o.item_title || '',
        o.quantity || 0,
        o.unit_price || 0,
        o.total_amount || 0,
        o.payment_method || '',
        o.city || '',
        o.state || '',
        o.zip_code || '',
        o.shipping_status || '',
        o.shipping_method || '',
        o.tracking_number || '',
        new Date(o.date_created).toLocaleDateString('pt-BR'),
        o.date_closed ? new Date(o.date_closed).toLocaleDateString('pt-BR') : '',
        o.estimated_delivery ? new Date(o.estimated_delivery).toLocaleDateString('pt-BR') : ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedidos_ml_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Arquivo exportado com sucesso!');
  }, [orders]);

  const clearFilters = React.useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
      limit: 100,
      offset: 0
    });
  }, []);

  if (error) {
    console.error('💥 Erro na query:', error);
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-red-600">Erro ao carregar pedidos</h3>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Pedidos da API ML</h2>
            <p className="text-muted-foreground">Buscar pedidos diretamente da API do Mercado Livre</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-1" />
              Filtros
            </Button>
            <Button
              variant="outline" 
              size="sm"
              onClick={handleExport}
              disabled={orders.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </Button>
            <Button
              size="sm"
              onClick={handleSearch}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Buscar
            </Button>
          </div>
        </div>

        {/* Seleção de conta */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              <Users className="h-4 w-4 inline mr-1" />
              Conta ML
            </label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar conta" />
              </SelectTrigger>
              <SelectContent>
                {mlAccounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} ({account.account_identifier})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              <Calendar className="h-4 w-4 inline mr-1" />
              Data Inicial
            </label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              <Calendar className="h-4 w-4 inline mr-1" />
              Data Final
            </label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
            />
          </div>
        </div>

        {/* Filtros expandidos */}
        {showFilters && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    <Search className="h-4 w-4 inline mr-1" />
                    Pesquisar
                  </label>
                  <Input
                    placeholder="Order ID, comprador, produto..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Status
                  </label>
                  <Select 
                    value={filters.status} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="paid">Pagos</SelectItem>
                      <SelectItem value="shipped">Enviados</SelectItem>
                      <SelectItem value="delivered">Entregues</SelectItem>
                      <SelectItem value="cancelled">Cancelados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Métricas expandidas */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        <MetricCard
          title="Total"
          value={metrics.total}
          icon={Package}
          color="default"
        />
        <MetricCard
          title="Pagos"
          value={metrics.paid}
          icon={CheckCircle}
          color="success"
        />
        <MetricCard
          title="Enviados"
          value={metrics.shipped}
          icon={Package}
          color="default"
        />
        <MetricCard
          title="Entregues"
          value={metrics.delivered}
          icon={CheckCircle}
          color="success"
        />
        <MetricCard
          title="Cancelados"
          value={metrics.cancelled}
          icon={AlertTriangle}
          color="error"
        />
        <MetricCard
          title="Pendentes"
          value={metrics.pending}
          icon={AlertTriangle}
          color="warning"
        />
        <MetricCard
          title="Valor Total"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalValue)}
          icon={Package}
          color="success"
        />
      </div>

      {/* Controles de visualização */}
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
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-l-none"
            >
              <Table2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <span className="text-sm text-muted-foreground">
          {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
        </span>
      </div>

      {/* Conteúdo principal */}
      {isLoading ? (
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
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum pedido encontrado</h3>
            <p className="text-muted-foreground">
              {!selectedAccount 
                ? 'Selecione uma conta ML para buscar pedidos' 
                : 'Ajuste os filtros ou tente um período diferente'
              }
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id || order.order_id}
              order={order}
              onClick={() => setSelectedOrder(order)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-[600px] overflow-auto">
                <table className="w-full">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Order ID</th>
                      <th className="text-left p-3 text-sm font-medium">Status</th>
                      <th className="text-left p-3 text-sm font-medium">Pagamento</th>
                      <th className="text-left p-3 text-sm font-medium">Comprador</th>
                      <th className="text-left p-3 text-sm font-medium">Produto</th>
                      <th className="text-left p-3 text-sm font-medium">Qtd</th>
                      <th className="text-left p-3 text-sm font-medium">Valor Unit.</th>
                      <th className="text-left p-3 text-sm font-medium">Valor Total</th>
                      <th className="text-left p-3 text-sm font-medium">Cidade/UF</th>
                      <th className="text-left p-3 text-sm font-medium">Envio</th>
                      <th className="text-left p-3 text-sm font-medium">Rastreamento</th>
                      <th className="text-left p-3 text-sm font-medium">Data</th>
                      <th className="text-left p-3 text-sm font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id || order.order_id} className="border-b hover:bg-muted/50">
                        <td className="p-3 text-sm font-mono">{order.id || order.order_id}</td>
                        <td className="p-3">
                          <Badge variant="outline">{order.status}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant={order.payment_status === 'approved' ? 'default' : 'secondary'}>
                            {order.payment_status || 'N/A'}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">{order.buyer_nickname || 'N/A'}</td>
                        <td className="p-3 text-sm truncate max-w-[200px]" title={order.item_title}>
                          {order.item_title || 'N/A'}
                        </td>
                        <td className="p-3 text-sm text-center">{order.quantity || 1}</td>
                        <td className="p-3 text-sm font-medium">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.unit_price || 0)}
                        </td>
                        <td className="p-3 text-sm font-medium">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount || 0)}
                        </td>
                        <td className="p-3 text-sm">
                          {order.city && order.state ? `${order.city}/${order.state}` : 'N/A'}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-xs">
                            {order.shipping_status || 'N/A'}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm font-mono">
                          {order.tracking_number || '-'}
                        </td>
                        <td className="p-3 text-sm">
                          {new Date(order.date_created).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de detalhes */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Informações básicas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Order ID</label>
                  <p className="text-sm font-mono">{selectedOrder.id || selectedOrder.order_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="text-sm">
                    <Badge variant="outline">{selectedOrder.status}</Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status Pagamento</label>
                  <p className="text-sm">
                    <Badge variant={selectedOrder.payment_status === 'approved' ? 'default' : 'secondary'}>
                      {selectedOrder.payment_status || 'N/A'}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Método Pagamento</label>
                  <p className="text-sm">{selectedOrder.payment_method || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Parcelas</label>
                  <p className="text-sm">{selectedOrder.installments || 1}x</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor Total</label>
                  <p className="text-sm font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOrder.total_amount || 0)}
                  </p>
                </div>
              </div>
              
              {/* Informações do comprador */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Informações do Comprador</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nome/Nickname</label>
                    <p className="text-sm">{selectedOrder.buyer_nickname || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ID do Comprador</label>
                    <p className="text-sm font-mono">{selectedOrder.buyer_id || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                    <p className="text-sm">{selectedOrder.buyer_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-sm">{selectedOrder.buyer_email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Informações do produto */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Produto</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Título</label>
                    <p className="text-sm">{selectedOrder.item_title || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ID do Item</label>
                    <p className="text-sm font-mono">{selectedOrder.item_id || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Quantidade</label>
                    <p className="text-sm">{selectedOrder.quantity || 1}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Valor Unitário</label>
                    <p className="text-sm font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOrder.unit_price || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informações de envio */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Envio</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <p className="text-sm">
                      <Badge variant="outline">{selectedOrder.shipping_status || 'N/A'}</Badge>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Método</label>
                    <p className="text-sm">{selectedOrder.shipping_method || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Código Rastreamento</label>
                    <p className="text-sm font-mono">{selectedOrder.tracking_number || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Custo Envio</label>
                    <p className="text-sm font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOrder.shipping_cost || 0)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Estimativa Entrega</label>
                    <p className="text-sm">
                      {selectedOrder.estimated_delivery ? new Date(selectedOrder.estimated_delivery).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Destinatário</label>
                    <p className="text-sm">{selectedOrder.receiver_name || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Endereço de entrega */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Endereço de Entrega</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Endereço</label>
                    <p className="text-sm">{selectedOrder.address || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">CEP</label>
                    <p className="text-sm font-mono">{selectedOrder.zip_code || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Cidade</label>
                    <p className="text-sm">{selectedOrder.city || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Estado</label>
                    <p className="text-sm">{selectedOrder.state || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Datas */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Datas</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data de Criação</label>
                    <p className="text-sm">{new Date(selectedOrder.date_created).toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data de Fechamento</label>
                    <p className="text-sm">
                      {selectedOrder.date_closed ? new Date(selectedOrder.date_closed).toLocaleString('pt-BR') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Financeiro */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Informações Financeiras</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Taxa Marketplace</label>
                    <p className="text-sm font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOrder.marketplace_fee || 0)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Valor Líquido</label>
                    <p className="text-sm font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        (selectedOrder.total_amount || 0) - (selectedOrder.marketplace_fee || 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {selectedOrder.tags && selectedOrder.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tags</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedOrder.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Dados completos em JSON */}
              {selectedOrder.raw_data && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dados Completos (JSON)</label>
                  <ScrollArea className="h-40 w-full border rounded p-3 bg-muted mt-2">
                    <pre className="text-xs">
                      {JSON.stringify(selectedOrder.raw_data, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MLOrdersSelector;