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
  onQuickFilterChange: (filter: 'all' | 'pronto_baixar' | 'mapear_incompleto' | 'baixado') => void;
  className?: string;
  globalCounts?: Partial<{ total: number; prontosBaixa: number; mapeamentoPendente: number; baixados: number }>;
  mappingData?: Map<string, any>;
  isPedidoProcessado?: (order: any) => boolean;
}

export const PedidosStatusBar = memo<PedidosStatusBarProps>(({ 
  orders,
  quickFilter,
  onQuickFilterChange,
  className,
  globalCounts,
  mappingData,
  isPedidoProcessado
}) => {
  // ✅ CONTAGEM SIMPLES: Apenas pedidos da página atual baseado na coluna Status da Baixa
  const counters = useMemo(() => {
    console.log('📊 [StatusBar] Contando pedidos da página atual:', { ordersLength: orders?.length });
    
    if (!orders?.length) {
      return { total: 0, prontosBaixa: 0, mapeamentoPendente: 0, baixados: 0 };
    }

    let prontosBaixa = 0;
    let mapeamentoPendente = 0;
    let baixados = 0;

    for (const order of orders) {
      // ✅ CALCULAR STATUS DA BAIXA (mesma lógica do PedidosTableSection)
      
      // 🔍 PRIMEIRO: Verificar se já foi baixado (histórico)
      const jaProcessado = isPedidoProcessado?.(order);
      if (jaProcessado) {
        baixados++;
        continue;
      }
      
      // 🗂️ SEGUNDO: Verificar mapeamento completo (de-para)
      const mapping = mappingData?.get?.(order.id);
      const temMapeamentoCompleto = mapping && (mapping.skuEstoque || mapping.skuKit);
      const temMapeamentoIncompleto = mapping && mapping.temMapeamento && !temMapeamentoCompleto;
      
      if (temMapeamentoCompleto) {
        prontosBaixa++;           // ← "Pronto p/ Baixar"
      } else if (temMapeamentoIncompleto || !mapping) {
        mapeamentoPendente++;     // ← "Mapear Incompleto" ou "Sem Mapear"
      }
    }

    const result = {
      total: orders.length,
      prontosBaixa,
      mapeamentoPendente,
      baixados
    };
    
    console.log('📊 [StatusBar] Contadores da página atual:', result);
    return result;
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