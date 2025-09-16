import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Search, Filter, Download, RefreshCw, Eye, Package, 
  DollarSign, Clock, Activity, BarChart3, X, TrendingUp,
  ChevronDown, ChevronUp, Grid, Table2, AlertTriangle,
  FileText, Loader2, Settings, Users, Calendar, RotateCcw,
  MessageCircle, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { VirtualTable } from '@/components/ui/virtual-table';

// Types
interface DevolucaoML {
  id: string;
  integration_account_id: string;
  claim_id?: string;
  order_id: string;
  buyer_nickname?: string;
  item_title?: string;
  sku?: string;
  quantity: number;
  claim_type: 'claim' | 'return' | 'cancellation';
  claim_status: string;
  amount_refunded: number;
  date_created: string;
  date_closed?: string;
  processed_status?: 'pending' | 'reviewed' | 'resolved';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  raw_data?: any;
  reason_code?: string;
  reason_description?: string;
  dados_claim?: any;
  dados_return?: any;
  dados_mensagens?: any;
}

interface Props {
  mlAccounts: any[];
  refetch?: () => void;
}

// Hooks customizados memoizados
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Componentes memoizados para performance
const MetricCard = React.memo(({ title, value, icon: Icon, color = "default", trend }: {
  title: string;
  value: string | number;
  icon: any;
  color?: "default" | "success" | "warning" | "error";
  trend?: number;
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
          {trend !== undefined && (
            <div className={`flex items-center text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="h-3 w-3 mr-1" />
              {trend > 0 && '+'}{trend}%
            </div>
          )}
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

const FilterSection = React.memo(({ filtros, setFiltros, mlAccounts, onSearch, isLoading }: {
  filtros: any;
  setFiltros: (filtros: any) => void;
  mlAccounts: any[];
  onSearch: () => void;
  isLoading: boolean;
}) => {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Devoluções
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2"
          >
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showAdvanced ? 'Menos filtros' : 'Mais filtros'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros básicos sempre visíveis */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              <Users className="h-4 w-4 inline mr-1" />
              Conta ML
            </label>
            <Select 
              value={filtros.selectedAccountId} 
              onValueChange={(value) => setFiltros(prev => ({ 
                ...prev, 
                selectedAccountId: value,
                accountIds: [value]
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar conta" />
              </SelectTrigger>
              <SelectContent>
                {mlAccounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por order, SKU, comprador..."
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
              <SelectItem value="opened">Abertos</SelectItem>
              <SelectItem value="closed">Fechados</SelectItem>
              <SelectItem value="in_process">Em Processo</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={onSearch} 
            disabled={isLoading || !filtros.selectedAccountId}
            className="flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Buscar
          </Button>
        </div>

        {/* Filtros avançados colapsáveis */}
        {showAdvanced && (
          <div className="animate-fade-in space-y-4 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={filtros.tipo} onValueChange={(value) => setFiltros(prev => ({ ...prev, tipo: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="claim">Reclamação</SelectItem>
                  <SelectItem value="return">Devolução</SelectItem>
                  <SelectItem value="cancellation">Cancelamento</SelectItem>
                </SelectContent>
              </Select>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Data Início
                </label>
                <Input
                  type="date"
                  value={filtros.dateFrom}
                  onChange={(e) => setFiltros(prev => ({ ...prev, dateFrom: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Data Fim
                </label>
                <Input
                  type="date"
                  value={filtros.dateTo}
                  onChange={(e) => setFiltros(prev => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setFiltros({
                  search: '',
                  status: 'all',
                  tipo: 'all',
                  prioridade: 'all',
                  dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  dateTo: new Date().toISOString().split('T')[0],
                  accountIds: mlAccounts.length > 0 ? [mlAccounts[0].id] : [],
                  processedStatus: 'all',
                  selectedAccountId: mlAccounts.length > 0 ? mlAccounts[0].id : ''
                })}
              >
                <X className="h-4 w-4 mr-1" />
                Limpar Filtros
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

const DevolucaoCard = React.memo(({ devolucao, onClick }: { devolucao: DevolucaoML; onClick: () => void }) => {
  const getTypeIcon = () => {
    switch (devolucao.claim_type) {
      case 'return':
        return <RotateCcw className="h-4 w-4 text-blue-600" />;
      case 'claim':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'cancellation':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card className="hover-scale transition-all duration-200 cursor-pointer" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {getTypeIcon()}
              <h3 className="font-semibold text-sm truncate max-w-[180px]" title={devolucao.item_title}>
                {devolucao.item_title || 'Produto não identificado'}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">Order: {devolucao.order_id}</p>
            {devolucao.reason_description && (
              <p className="text-xs text-orange-600 mt-1 italic">
                Motivo: {devolucao.reason_description}
              </p>
            )}
          </div>
          <Badge variant={
            devolucao.priority === 'urgent' ? 'destructive' :
            devolucao.priority === 'high' ? 'default' :
            'secondary'
          }>
            {devolucao.claim_status}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Comprador:</span>
            <p className="font-medium">{devolucao.buyer_nickname || 'N/A'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Valor:</span>
            <p className="font-medium text-green-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(devolucao.amount_refunded || 0)}
            </p>
          </div>
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {new Date(devolucao.date_created).toLocaleDateString('pt-BR')}
          </span>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs">
              {devolucao.claim_type}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// Componente principal otimizado
const DevolucaoAvancadasOptimizada: React.FC<Props> = ({ mlAccounts, refetch }) => {
  console.log('✅ DevolucaoAvancadasOptimizada carregado - mlAccounts:', mlAccounts?.length);
  
  // Estados otimizados
  const [filtros, setFiltros] = React.useState({
    search: '',
    status: 'all',
    tipo: 'all',
    prioridade: 'all',
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    accountIds: [] as string[],
    processedStatus: 'all',
    selectedAccountId: '' as string // Novo: conta única selecionada
  });

  const [viewMode, setViewMode] = React.useState<'cards' | 'table'>('cards');
  const [selectedDevolucao, setSelectedDevolucao] = React.useState<DevolucaoML | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  
  const queryClient = useQueryClient();
  const debouncedSearch = useDebounce(filtros.search, 500);

  // Auto-selecionar primeira conta ativa
  React.useEffect(() => {
    if (mlAccounts?.length > 0 && !filtros.selectedAccountId) {
      setFiltros(prev => ({ 
        ...prev, 
        selectedAccountId: mlAccounts[0].id,
        accountIds: [mlAccounts[0].id]
      }));
    }
  }, [mlAccounts]);

  // Query otimizada para buscar da tabela (dados já sincronizados)
  const { data: devolucoes = [], isLoading, error } = useQuery<DevolucaoML[]>({
    queryKey: ['devolucoes-otimizada', { selectedAccountId: filtros.selectedAccountId, dateFrom: filtros.dateFrom, dateTo: filtros.dateTo, search: debouncedSearch, status: filtros.status, tipo: filtros.tipo }],
    queryFn: async () => {
      if (!filtros.selectedAccountId) {
        return [];
      }

      console.log('🔍 Buscando devoluções da tabela para conta:', filtros.selectedAccountId);
      
      let query = supabase
        .from('ml_devolucoes_reclamacoes')
        .select('*');

      // Filtrar por conta selecionada
      query = query.eq('integration_account_id', filtros.selectedAccountId);
      
      // Aplicar filtros de busca
      if (debouncedSearch) {
        query = query.or(`order_id.ilike.%${debouncedSearch}%,buyer_nickname.ilike.%${debouncedSearch}%,item_title.ilike.%${debouncedSearch}%,sku.ilike.%${debouncedSearch}%`);
      }
      
      // Filtros de status e tipo
      if (filtros.status !== 'all') {
        query = query.eq('claim_status', filtros.status);
      }
      
      if (filtros.tipo !== 'all') {
        query = query.eq('claim_type', filtros.tipo);
      }
      
      // Filtros de data
      if (filtros.dateFrom) {
        query = query.gte('date_created', filtros.dateFrom);
      }
      
      if (filtros.dateTo) {
        query = query.lte('date_created', filtros.dateTo + 'T23:59:59.999Z');
      }
      
      const { data, error } = await query
        .order('date_created', { ascending: false })
        .limit(1000);
      
      if (error) {
        console.error('❌ Erro ao buscar devoluções:', error);
        throw error;
      }

      console.log('✅ Devoluções carregadas da tabela:', data?.length || 0);
      return data as DevolucaoML[];
    },
    enabled: !!filtros.selectedAccountId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para sincronização
  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!filtros.selectedAccountId) {
        throw new Error('Nenhuma conta selecionada');
      }

      const { data, error } = await supabase.functions.invoke('ml-devolucoes-sync', {
        body: {
          integration_account_id: filtros.selectedAccountId,
          mode: 'enriched',
          date_from: filtros.dateFrom,
          date_to: filtros.dateTo,
          enrich_level: 'complete'
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Sincronização concluída! ${data?.found || 0} itens encontrados`);
      queryClient.invalidateQueries({ queryKey: ['devolucoes-api'] });
      refetch?.();
    },
    onError: (error: any) => {
      toast.error(`Erro na sincronização: ${error.message}`);
    }
  });

  // Métricas calculadas otimizadas
  const metricas = React.useMemo(() => {
    const total = devolucoes.length;
    const pendentes = devolucoes.filter(d => d.processed_status === 'pending' || !d.processed_status).length;
    const urgentes = devolucoes.filter(d => d.priority === 'urgent').length;
    const valorTotal = devolucoes.reduce((acc, d) => acc + (d.amount_refunded || 0), 0);
    const valorMedio = total > 0 ? valorTotal / total : 0;

    return { total, pendentes, urgentes, valorTotal, valorMedio };
  }, [devolucoes]);

  // Handlers otimizados
  const handleSearch = React.useCallback(() => {
    setCurrentPage(1);
    queryClient.invalidateQueries({ queryKey: ['devolucoes-otimizada'] });
  }, [queryClient]);

  const handleExport = React.useCallback(() => {
    if (devolucoes.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const csvContent = [
      ['Order ID', 'Status', 'Tipo', 'Comprador', 'Produto', 'Motivo Cancelamento', 'Valor', 'Data'],
      ...devolucoes.map(d => [
        d.order_id,
        d.claim_status,
        d.claim_type,
        d.buyer_nickname || '',
        d.item_title || '',
        d.reason_description || '',
        d.amount_refunded || 0,
        new Date(d.date_created).toLocaleDateString('pt-BR')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devolucoes_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [devolucoes]);

  // Função para ícones de tipo
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'return':
        return <RotateCcw className="h-4 w-4 text-blue-600" />;
      case 'claim':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'cancellation':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  // Colunas para tabela virtual
  const tableColumns = React.useMemo(() => [
    { key: 'order_id', label: 'Order ID', width: 120, render: (item: DevolucaoML) => item.order_id },
    { key: 'type_icon', label: 'Tipo', width: 80, render: (item: DevolucaoML) => (
      <div className="flex items-center justify-center">
        {getTypeIcon(item.claim_type)}
      </div>
    )},
    { key: 'claim_status', label: 'Status', width: 100, render: (item: DevolucaoML) => (
      <Badge variant="outline">{item.claim_status}</Badge>
    )},
    { key: 'claim_type', label: 'Categoria', width: 100, render: (item: DevolucaoML) => item.claim_type },
    { key: 'buyer_nickname', label: 'Comprador', width: 150, render: (item: DevolucaoML) => item.buyer_nickname || 'N/A' },
    { key: 'item_title', label: 'Produto', width: 200, render: (item: DevolucaoML) => (
      <span className="truncate" title={item.item_title}>{item.item_title}</span>
    )},
    { key: 'reason_description', label: 'Motivo Cancelamento', width: 180, render: (item: DevolucaoML) => (
      <span className="truncate text-orange-600" title={item.reason_description}>
        {item.reason_description || '-'}
      </span>
    )},
    { key: 'amount_refunded', label: 'Valor', width: 120, render: (item: DevolucaoML) => (
      <span className="text-green-600 font-medium">
        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount_refunded || 0)}
      </span>
    )},
    { key: 'date_created', label: 'Data', width: 120, render: (item: DevolucaoML) => (
      new Date(item.date_created).toLocaleDateString('pt-BR')
    )}
  ], []);

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar dados</h3>
            <p className="text-muted-foreground mb-4">{error.message}</p>
            <Button onClick={handleSearch}>Tentar novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Devoluções Avançadas</h1>
          <p className="text-muted-foreground">Sistema otimizado de gestão de devoluções ML</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={devolucoes.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
            {syncMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sincronizar
          </Button>
        </div>
      </div>

      {/* Métricas Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <MetricCard
          title="Total"
          value={metricas.total}
          icon={BarChart3}
          color="default"
        />
        <MetricCard
          title="Pendentes"
          value={metricas.pendentes}
          icon={Clock}
          color="warning"
        />
        <MetricCard
          title="Urgentes"
          value={metricas.urgentes}
          icon={AlertTriangle}
          color="error"
        />
        <MetricCard
          title="Valor Total"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metricas.valorTotal)}
          icon={DollarSign}
          color="success"
        />
        <MetricCard
          title="Valor Médio"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metricas.valorMedio)}
          icon={TrendingUp}
          color="default"
        />
      </div>

      {/* Filtros */}
      <FilterSection
        filtros={filtros}
        setFiltros={setFiltros}
        mlAccounts={mlAccounts}
        onSearch={handleSearch}
        isLoading={isLoading}
      />

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
          {devolucoes.length} {devolucoes.length === 1 ? 'resultado' : 'resultados'}
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
      ) : devolucoes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma devolução encontrada</h3>
            <p className="text-muted-foreground">
              {filtros.selectedAccountId ? 'Ajuste os filtros ou sincronize os dados da API' : 'Selecione uma conta ML para começar'}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {devolucoes.map((devolucao) => (
            <DevolucaoCard
              key={devolucao.id}
              devolucao={devolucao}
              onClick={() => setSelectedDevolucao(devolucao)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <VirtualTable
              data={devolucoes || []}
              columns={tableColumns}
              height={600}
              itemHeight={60}
              onRowClick={(devolucao) => setSelectedDevolucao(devolucao)}
              enableVirtualization={(devolucoes?.length || 0) > 50}
              threshold={50}
            />
          </CardContent>
        </Card>
      )}

      {/* Modal de Detalhes */}
      <Dialog open={!!selectedDevolucao} onOpenChange={() => setSelectedDevolucao(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDevolucao && getTypeIcon(selectedDevolucao.claim_type)}
              Detalhes da Devolução
            </DialogTitle>
          </DialogHeader>
          {selectedDevolucao && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-6 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Informações Básicas</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Order ID:</strong> {selectedDevolucao.order_id}</div>
                      <div><strong>Claim ID:</strong> {selectedDevolucao.claim_id || 'N/A'}</div>
                      <div><strong>Status:</strong> <Badge>{selectedDevolucao.claim_status}</Badge></div>
                      <div><strong>Tipo:</strong> {selectedDevolucao.claim_type}</div>
                      <div><strong>Data Criação:</strong> {new Date(selectedDevolucao.date_created).toLocaleString('pt-BR')}</div>
                      {selectedDevolucao.date_closed && (
                        <div><strong>Data Fechamento:</strong> {new Date(selectedDevolucao.date_closed).toLocaleString('pt-BR')}</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Produto e Valores</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Produto:</strong> {selectedDevolucao.item_title}</div>
                      <div><strong>SKU:</strong> {selectedDevolucao.sku || 'N/A'}</div>
                      <div><strong>Comprador:</strong> {selectedDevolucao.buyer_nickname || 'N/A'}</div>
                      <div><strong>Quantidade:</strong> {selectedDevolucao.quantity}</div>
                      <div><strong>Valor Reembolsado:</strong> 
                        <span className="text-green-600 font-medium ml-1">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedDevolucao.amount_refunded || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedDevolucao.reason_description && (
                  <div>
                    <h4 className="font-semibold mb-2 text-orange-600">Motivo do Cancelamento</h4>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <p className="text-sm text-orange-800">
                        <strong>Código:</strong> {selectedDevolucao.reason_code || 'N/A'}
                      </p>
                      <p className="text-sm text-orange-800 mt-1">
                        <strong>Descrição:</strong> {selectedDevolucao.reason_description}
                      </p>
                    </div>
                  </div>
                )}

                {selectedDevolucao.dados_mensagens?.messages && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Mensagens
                    </h4>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {selectedDevolucao.dados_mensagens.messages.map((msg: any, idx: number) => (
                        <div key={idx} className="bg-muted rounded-lg p-3">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-medium text-muted-foreground">
                              {msg.from === 'buyer' ? 'Comprador' : msg.from === 'seller' ? 'Vendedor' : 'Suporte ML'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(msg.date).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-sm">{msg.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {(selectedDevolucao.dados_claim || selectedDevolucao.dados_return) && (
                  <div>
                    <h4 className="font-semibold mb-2">Dados Detalhados</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedDevolucao.dados_claim && (
                        <div>
                          <h5 className="text-sm font-medium mb-2">Dados do Claim</h5>
                          <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-[150px]">
                            {JSON.stringify(selectedDevolucao.dados_claim, null, 2)}
                          </pre>
                        </div>
                      )}
                      {selectedDevolucao.dados_return && (
                        <div>
                          <h5 className="text-sm font-medium mb-2">Dados da Devolução</h5>
                          <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-[150px]">
                            {JSON.stringify(selectedDevolucao.dados_return, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedDevolucao.raw_data && (
                  <div>
                    <h4 className="font-semibold mb-2">Dados Técnicos Completos</h4>
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-[200px]">
                      {JSON.stringify(selectedDevolucao.raw_data, null, 2)}
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

export default React.memo(DevolucaoAvancadasOptimizada);