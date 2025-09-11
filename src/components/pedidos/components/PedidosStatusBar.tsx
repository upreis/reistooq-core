/**
 * 🎯 BARRA DE RESUMO COM CONTADORES POR STATUS
 * Cada chip aplica filtro rápido e mostra contagem em tempo real
 */

import { memo, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, Package, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PedidosStatusBarProps {
  orders: any[];
  quickFilter: string;
  onQuickFilterChange: (filter: 'all' | 'pronto_baixar' | 'mapear_incompleto' | 'baixado' | 'shipped' | 'delivered') => void;
  className?: string;
  globalCounts?: Partial<{ total: number; prontosBaixa: number; mapeamentoPendente: number; baixados: number; shipped: number; delivered: number }>;
}

export const PedidosStatusBar = memo<PedidosStatusBarProps>(({ 
  orders,
  quickFilter,
  onQuickFilterChange,
  className,
  globalCounts
}) => {
  // ✅ CORRIGIDO: Usar contadores globais quando disponíveis
  const counters = useMemo(() => {
    console.log('📊 [StatusBar] Calculando contadores:', { globalCounts, ordersLength: orders?.length });
    
    // ✅ PRIORIDADE: Se temos globalCounts, usar eles (resultado agregado dos filtros)
    if (globalCounts && typeof globalCounts.total === 'number') {
      const result = {
        total: globalCounts.total || 0,
        prontosBaixa: globalCounts.prontosBaixa || 0,
        mapeamentoPendente: globalCounts.mapeamentoPendente || 0,
        baixados: globalCounts.baixados || 0,
        shipped: globalCounts.shipped || 0,
        delivered: globalCounts.delivered || 0
      };
      console.log('📊 [StatusBar] Usando contadores globais:', result);
      return result;
    }

    // ✅ FALLBACK: Calcular contadores da página atual se não temos globalCounts válidos
    if (!orders?.length) {
      console.log('📊 [StatusBar] Nenhum pedido, retornando zeros');
      return {
        total: 0,
        prontosBaixa: 0,
        mapeamentoPendente: 0,
        baixados: 0,
        shipped: 0,
        delivered: 0
      };
    }

    let prontosBaixa = 0;
    let mapeamentoPendente = 0;
    let baixados = 0;
    let shipped = 0;
    let delivered = 0;

    for (const order of orders) {
      const statusBaixa = order?.status_baixa || order?.unified?.status_baixa || '';
      const shippingStatus = order?.shipping_status || order?.unified?.shipping?.status || '';
      
      // Usar a coluna "Status da Baixa" como referência principal
      if (statusBaixa === 'Pronto p/ Baixar') {
        prontosBaixa++;
      } else if (statusBaixa === 'Mapear Incompleto') {
        mapeamentoPendente++;
      } else if (statusBaixa === 'Baixado' || statusBaixa === 'Processado') {
        baixados++;
      }
      
      // Contadores de status de envio
      if (shippingStatus?.toLowerCase().includes('shipped')) {
        shipped++;
      }
      if (shippingStatus?.toLowerCase().includes('delivered')) {
        delivered++;
      }
    }

    const result = {
      total: orders.length,
      prontosBaixa,
      mapeamentoPendente,
      baixados,
      shipped,
      delivered
    };
    
    console.log('📊 [StatusBar] Contadores calculados localmente:', result);
    return result;
  }, [orders, globalCounts]);

  const statusChips = [
    {
      key: 'all',
      label: 'Todos os pedidos',
      count: counters.total,
      icon: Filter,
      variant: 'secondary' as const,
      color: 'default'
    },
    {
      key: 'pronto_baixar',
      label: 'Prontos p/ baixar',
      count: counters.prontosBaixa,
      icon: Package,
      variant: 'default' as const,
      color: 'success'
    },
    {
      key: 'mapear_incompleto',
      label: 'Mapeamento pendente',
      count: counters.mapeamentoPendente,
      icon: AlertTriangle,
      variant: 'outline' as const,
      color: 'warning'
    },
    {
      key: 'baixado',
      label: 'Baixados',
      count: counters.baixados,
      icon: CheckCircle,
      variant: 'outline' as const,
      color: 'success'
    },
    {
      key: 'shipped',
      label: 'Enviados',
      count: counters.shipped,
      icon: CheckCircle,
      variant: 'outline' as const,
      color: 'info'
    },
    {
      key: 'delivered',
      label: 'Entregues',
      count: counters.delivered,
      icon: CheckCircle,
      variant: 'outline' as const,
      color: 'success'
    }
  ];

  return (
    <Card className={cn("sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground mr-2">
            Resumo:
          </span>
          {statusChips.map((chip) => {
            const Icon = chip.icon;
            const isActive = quickFilter === chip.key;
            
            return (
              <Button
                key={chip.key}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => onQuickFilterChange(chip.key as any)}
                className={cn(
                  "gap-2 h-8 text-xs",
                  isActive && "ring-2 ring-primary ring-offset-2"
                )}
              >
                <Icon className="h-3 w-3" />
                {chip.label}
                <Badge 
                  variant={isActive ? 'secondary' : 'default'}
                  className="ml-1 h-5 min-w-[20px] text-xs"
                >
                  {chip.count}
                </Badge>
              </Button>
            );
          })}
        </div>
        
        {/* Indicador do filtro ativo */}
        {quickFilter !== 'all' && (
          <div className="text-xs text-muted-foreground">
            Mostrando apenas: {statusChips.find(c => c.key === quickFilter)?.label}
          </div>
        )}
      </div>
    </Card>
  );
});

PedidosStatusBar.displayName = 'PedidosStatusBar';