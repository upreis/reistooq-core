/**
 * 🧪 PÁGINA DE TESTE - PEDIDOS V2 com Unified Cache System
 * 
 * Esta é uma página isolada para testar o novo sistema unificado de cache
 * implementado na FASE 2 do Adapted Combo 2.
 * 
 * ✅ Usa: useMlOrders hook (novo)
 * ✅ Cache: React Query + localStorage + Supabase ml_orders_cache
 * ✅ Isolada: Zero impacto no sistema atual de /pedidos
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMlOrders } from '@/hooks/useMlOrders';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, RefreshCw, Database, Zap } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PedidosV2() {
  // Buscar contas de integração do Mercado Livre
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['integration-accounts-ml-v2'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_accounts')
        .select('id, name, account_identifier')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });
  
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [periodo, setPeriodo] = useState<string>('30');
  
  // Calcular date_from e date_to baseado no período
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - parseInt(periodo));
  const dateTo = new Date();

  // Usar o novo hook unificado
  const {
    orders,
    total,
    source,
    isLoading,
    error,
    invalidateCache,
  } = useMlOrders({
    integration_account_ids: selectedAccounts.length > 0 ? selectedAccounts : accounts.map(a => a.id),
    date_from: dateFrom.toISOString().split('T')[0],
    date_to: dateTo.toISOString().split('T')[0],
    enabled: accounts.length > 0,
  });

  const handleRefresh = () => {
    invalidateCache();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🧪 Pedidos V2 - Teste de Cache</h1>
          <p className="text-muted-foreground mt-1">
            Página de teste do novo sistema unificado de cache (Adapted Combo 2)
          </p>
        </div>
        
        {source && (
          <Badge variant={source === 'cache' ? 'default' : 'secondary'} className="text-sm">
            {source === 'cache' ? (
              <><Database className="w-4 h-4 mr-1" /> Cache</>
            ) : (
              <><Zap className="w-4 h-4 mr-1" /> API ML</>
            )}
          </Badge>
        )}
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Período</label>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="15">Últimos 15 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="60">Últimos 60 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Contas</label>
            <Select 
              value={selectedAccounts.length > 0 ? selectedAccounts[0] : 'all'} 
              onValueChange={(value) => setSelectedAccounts(value === 'all' ? [] : [value])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as contas</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-2">
            <Button
              onClick={handleRefresh}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Forçar Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total de Pedidos</div>
          <div className="text-2xl font-bold mt-1">{total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Fonte de Dados</div>
          <div className="text-2xl font-bold mt-1">
            {source === 'cache' ? '💾 Cache' : '🌐 API ML'}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Status</div>
          <div className="text-2xl font-bold mt-1">
            {isLoading ? '⏳ Carregando...' : error ? '❌ Erro' : '✅ OK'}
          </div>
        </Card>
      </div>

      {/* Tabela de Pedidos */}
      <Card>
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Pedidos Encontrados</h2>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Pedido</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountsLoading || isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p className="text-muted-foreground">Carregando pedidos...</p>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-destructive">
                    ❌ Erro ao carregar pedidos: {error.message}
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum pedido encontrado no período selecionado
                  </TableCell>
                </TableRow>
              ) : (
                orders.slice(0, 50).map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      {order.id}
                    </TableCell>
                    <TableCell>
                      {order.date_created ? 
                        format(new Date(order.date_created), 'dd/MM/yyyy HH:mm', { locale: ptBR }) 
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.status === 'paid' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {order.buyer?.nickname || '-'}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      R$ {order.total_amount?.toFixed(2) || '0.00'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {orders.length > 50 && (
          <div className="p-4 border-t text-sm text-muted-foreground text-center">
            Exibindo 50 de {total} pedidos (limitado para teste)
          </div>
        )}
      </Card>

      {/* Debug Info */}
      <Card className="p-4 bg-muted/50">
        <h3 className="font-semibold mb-2">🔍 Debug Info</h3>
        <div className="text-xs space-y-1 font-mono">
          <div>Contas selecionadas: {selectedAccounts.length > 0 ? selectedAccounts.join(', ') : 'Todas'}</div>
          <div>Período: {periodo} dias</div>
          <div>Date From: {dateFrom.toISOString().split('T')[0]}</div>
          <div>Date To: {dateTo.toISOString().split('T')[0]}</div>
          <div>Total Orders: {total}</div>
          <div>Source: {source || 'N/A'}</div>
          <div>Loading: {isLoading ? 'Sim' : 'Não'}</div>
          <div>Error: {error ? error.message : 'Nenhum'}</div>
        </div>
      </Card>
    </div>
  );
}
