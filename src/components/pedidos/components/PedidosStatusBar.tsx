/**
 * 🎯 BARRA DE RESUMO COM CONTADORES POR STATUS
 * Apenas exibição de contadores, sem filtros clicáveis
 */

import { memo, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, Package, Truck, CheckSquare, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PedidosStatusBarProps {
  orders: any[];
  mappingData: Map<string, any>;
  isPedidoProcessado: (order: any) => boolean;
  className?: string;
}

export const PedidosStatusBar = memo<PedidosStatusBarProps>(({
  orders,
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
      icon: Filter
    },
    {
      key: 'pronto_baixar',
      label: 'Prontos p/ baixar',
      count: counters.prontosBaixa,
      icon: Package
    },
    {
      key: 'mapear_incompleto',
      label: 'Mapeamento pendente',
      count: counters.mapeamentoPendente,
      icon: AlertTriangle
    },
    {
      key: 'baixado',
      label: 'Baixados',
      count: counters.baixados,
      icon: CheckCircle
    },
    {
      key: 'shipped',
      label: 'Enviados',
      count: counters.shipped,
      icon: Truck
    },
    {
      key: 'delivered',
      label: 'Entregues',
      count: counters.delivered,
      icon: CheckSquare
    }
  ];

  return (
    <Card className={cn("bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground mr-2">
            Resumo:
          </span>
          {statusChips.map((chip) => {
            const Icon = chip.icon;
            
            return (
              <div
                key={chip.key}
                className="flex items-center gap-2 px-3 py-1 rounded-md bg-muted/50 border"
              >
                <Icon className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm font-medium">{chip.label}</span>
                <Badge 
                  variant="secondary"
                  className="ml-1 h-5 min-w-[20px] text-xs"
                >
                  {chip.count}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
});

PedidosStatusBar.displayName = 'PedidosStatusBar';