/**
 * 🎯 BARRA DE RESUMO COM CONTADORES POR STATUS
 * Cada chip aplica filtro rápido e mostra contagem em tempo real
 */

import { memo, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, Package, Truck, CheckSquare, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PedidosStatusBarProps {
  orders: any[];
  quickFilter: string;
  onQuickFilterChange: (filter: 'all' | 'pronto_baixar' | 'mapear_incompleto' | 'baixado' | 'shipped' | 'delivered') => void;
  mappingData: Map<string, any>;
  isPedidoProcessado: (order: any) => boolean;
  className?: string;
}

export const PedidosStatusBar = memo<PedidosStatusBarProps>(({
  orders,
  quickFilter,
  onQuickFilterChange,
  mappingData,
  isPedidoProcessado,
  className
}) => {
  // Calcular contadores em tempo real
  const counters = useMemo(() => {
    if (!orders?.length) {
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
      const id = order?.id || order?.numero || order?.unified?.id;
      const mapping = mappingData?.get?.(id);
      const isProcessado = isPedidoProcessado(order);
      
      const statuses = [
        order?.shipping_status,
        order?.shipping?.status,
        order?.unified?.shipping?.status,
        order?.situacao,
        order?.status
      ].filter(Boolean).map((s: any) => String(s).toLowerCase());

      // Pronto para baixa: tem mapeamento completo e não foi baixado
      if (mapping && (mapping.skuEstoque || mapping.skuKit) && !isProcessado) {
        prontosBaixa++;
      }
      
      // Mapeamento pendente: tem mapeamento incompleto e não foi baixado
      if (mapping && mapping.temMapeamento && !(mapping.skuEstoque || mapping.skuKit) && !isProcessado) {
        mapeamentoPendente++;
      }
      
      // Baixados: processados ou com status de baixa
      if (isProcessado || String(order?.status_baixa || '').toLowerCase().includes('baixado')) {
        baixados++;
      }
      
      // Enviados
      if (statuses.some((s: string) => s.includes('shipped') || s.includes('ready_to_ship'))) {
        shipped++;
      }
      
      // Entregues
      if (statuses.some((s: string) => s.includes('delivered'))) {
        delivered++;
      }
    }

    return {
      total: orders.length,
      prontosBaixa,
      mapeamentoPendente,
      baixados,
      shipped,
      delivered
    };
  }, [orders, mappingData, isPedidoProcessado]);

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
      icon: Truck,
      variant: 'outline' as const,
      color: 'info'
    },
    {
      key: 'delivered',
      label: 'Entregues',
      count: counters.delivered,
      icon: CheckSquare,
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