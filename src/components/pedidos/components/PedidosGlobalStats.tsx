/**
 * 📊 ESTATÍSTICAS GLOBAIS DE PEDIDOS - OPÇÃO A (HÍBRIDA)
 * 
 * Mostra estatísticas de TODOS os pedidos dos últimos 60 dias
 * usando dados do cache ml_orders (sincronizado pelo CRON).
 * 
 * SEGURANÇA: Componente apenas EXIBE dados, não interfere na busca.
 */

import { usePedidosGlobalStats } from '@/hooks/usePedidosGlobalStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/format';
import { 
  Package, 
  TrendingUp, 
  Calendar, 
  Clock, 
  DollarSign,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PedidosGlobalStatsProps {
  className?: string;
  selectedAccountIds?: string[];
  compact?: boolean;
}

export function PedidosGlobalStats({ 
  className, 
  selectedAccountIds = [],
  compact = false 
}: PedidosGlobalStatsProps) {
  const { stats, isLoading, error, isFetched } = usePedidosGlobalStats({
    selectedAccountIds,
    enabled: true
  });

  // Não mostrar nada se ainda não carregou e não tem dados
  if (!isFetched && isLoading) {
    return (
      <Card className={cn("bg-muted/30", className)}>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se não tem dados suficientes, não mostrar
  if (stats.totalPedidos === 0 && !isLoading) {
    return null; // Não mostrar se não há dados no cache
  }

  if (error) {
    return (
      <Card className={cn("bg-destructive/5 border-destructive/20", className)}>
        <CardContent className="py-3 flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Erro ao carregar estatísticas globais</span>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className={cn("bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20", className)}>
        <CardContent className="py-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Total (60 dias):</span>
                <Badge variant="secondary" className="font-bold">
                  {stats.totalPedidos.toLocaleString('pt-BR')} pedidos
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Valor:</span>
                <Badge variant="outline" className="font-bold text-green-600 border-green-600/30">
                  {formatMoney(stats.totalValor)}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">Últimos 7 dias:</span>
                <Badge variant="outline" className="font-bold text-blue-600 border-blue-600/30">
                  {stats.ultimos7Dias.toLocaleString('pt-BR')}
                </Badge>
              </div>
            </div>

            {stats.ultimaSincronizacao && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3" />
                <span>
                  Atualizado {formatDistanceToNow(new Date(stats.ultimaSincronizacao), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Versão expandida
  return (
    <Card className={cn("bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          Estatísticas Globais (60 dias)
          {isLoading && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total de Pedidos */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total de Pedidos</p>
            <p className="text-2xl font-bold">{stats.totalPedidos.toLocaleString('pt-BR')}</p>
          </div>
          
          {/* Valor Total */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Valor Total</p>
            <p className="text-2xl font-bold text-green-600">{formatMoney(stats.totalValor)}</p>
          </div>
          
          {/* Últimos 7 dias */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
            <p className="text-2xl font-bold text-blue-600">{stats.ultimos7Dias.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-muted-foreground">{formatMoney(stats.valorUltimos7Dias)}</p>
          </div>
          
          {/* Hoje */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Hoje</p>
            <p className="text-2xl font-bold text-purple-600">{stats.hoje.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-muted-foreground">{formatMoney(stats.valorHoje)}</p>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t">
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
            Pendentes: {stats.pending}
          </Badge>
          <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
            Pagos: {stats.paid}
          </Badge>
          <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/20">
            Cancelados: {stats.cancelled}
          </Badge>
          
          {stats.ultimaSincronizacao && (
            <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Sync: {formatDistanceToNow(new Date(stats.ultimaSincronizacao), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
