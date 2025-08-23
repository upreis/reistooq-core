import { useState, useEffect, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  Settings, 
  BarChart3, 
  Table as TableIcon, 
  Download,
  AlertTriangle,
  CheckCircle,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PedidosProvider } from './PedidosProvider';
import { PedidosFiltersAdvanced } from '../filters/PedidosFiltersAdvanced';
import { PedidosAnalyticsDashboard } from '../analytics/PedidosAnalyticsDashboard';
import { PedidosDataTable } from '../table/PedidosDataTable';
import { BulkActionsToolbar } from '../actions/BulkActionsToolbar';
import { usePedidosQuery, usePedidosAnalytics } from '../../hooks/usePedidosQuery';
import { usePedidosStore } from '../../stores/usePedidosStore';

interface PedidosPageProps {
  className?: string;
}

// Error Fallback Component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Erro na Página de Pedidos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {error.message || 'Ocorreu um erro inesperado'}
        </p>
        <Button onClick={resetErrorBoundary} variant="outline">
          Tentar Novamente
        </Button>
      </CardContent>
    </Card>
  );
}

// Loading Component
function LoadingFallback() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-16 bg-muted rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg" />
        ))}
      </div>
      <div className="h-96 bg-muted rounded-lg" />
    </div>
  );
}

// Main Page Content Component
function PedidosPageContent() {
  const [integrationAccountId, setIntegrationAccountId] = useState<string>('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('table');
  const [availableEmpresas, setAvailableEmpresas] = useState<string[]>([]);
  
  const store = usePedidosStore();
  
  // Queries
  const pedidosQuery = usePedidosQuery(integrationAccountId, store.appliedFilters, {
    enabled: !!integrationAccountId,
  });
  
  const analyticsQuery = usePedidosAnalytics(integrationAccountId, store.appliedFilters, {
    enabled: !!integrationAccountId,
  });

  // Load integration accounts
  useEffect(() => {
    loadAccounts();
  }, []);

  // Extract available empresas from data
  useEffect(() => {
    if (store.pedidos.length > 0) {
      const empresas = Array.from(new Set(store.pedidos.map(p => p.empresa).filter(Boolean)));
      setAvailableEmpresas(empresas);
    }
  }, [store.pedidos]);

  const loadAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('integration_accounts')
        .select('*')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const list = data || [];
      setAccounts(list);

      if (list.length > 0 && !integrationAccountId) {
        setIntegrationAccountId(list[0].id);
      }
    } catch (err: any) {
      console.error('Erro ao carregar contas:', err);
    }
  };

  const handleRefresh = () => {
    store.invalidateCache();
    pedidosQuery.refetch();
    analyticsQuery.refetch();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-muted-foreground">
            Gerencie seus pedidos e acompanhe métricas em tempo real
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Account Selector */}
          {accounts.length > 1 && (
            <select
              value={integrationAccountId}
              onChange={(e) => setIntegrationAccountId(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={pedidosQuery.isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${pedidosQuery.isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-1" />
            Configurações
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      {pedidosQuery.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {pedidosQuery.error.message}
          </AlertDescription>
        </Alert>
      )}

      {pedidosQuery.isSuccess && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Dados carregados com sucesso - {store.total} pedidos encontrados
            </span>
            <Badge variant="outline" className="ml-2">
              <Zap className="h-3 w-3 mr-1" />
              Cache ativo
            </Badge>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <PedidosFiltersAdvanced
        filters={store.filters}
        onFiltersChange={store.setFilters}
        onApplyFilters={store.applyFilters}
        onClearFilters={store.clearFilters}
        availableEmpresas={availableEmpresas}
      />

      {/* Bulk Actions */}
      {store.selectedIds.size > 0 && (
        <BulkActionsToolbar />
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="table" className="flex items-center gap-2">
            <TableIcon className="h-4 w-4" />
            Tabela
            {store.total > 0 && (
              <Badge variant="secondary" className="ml-1">
                {store.total}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-4">
          <PedidosDataTable integrationAccountId={integrationAccountId} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <PedidosAnalyticsDashboard 
            analytics={analyticsQuery.data}
            loading={analyticsQuery.isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Main Page Component with Error Boundary and Provider
export default function PedidosPage({ className }: PedidosPageProps) {
  const [integrationAccountId, setIntegrationAccountId] = useState<string>('');
  
  // Load first account ID for the provider
  useEffect(() => {
    const loadFirstAccount = async () => {
      try {
        const { data } = await supabase
          .from('integration_accounts')
          .select('id')
          .eq('provider', 'mercadolivre')
          .eq('is_active', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();
        
        if (data) {
          setIntegrationAccountId(data.id);
        }
      } catch (err) {
        console.error('Error loading integration account:', err);
      }
    };
    
    loadFirstAccount();
  }, []);

  if (!integrationAccountId) {
    return <LoadingFallback />;
  }

  return (
    <div className={className}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <PedidosProvider integrationAccountId={integrationAccountId}>
          <Suspense fallback={<LoadingFallback />}>
            <PedidosPageContent />
          </Suspense>
        </PedidosProvider>
      </ErrorBoundary>
    </div>
  );
}