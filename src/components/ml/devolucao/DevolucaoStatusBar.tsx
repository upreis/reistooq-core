/**
 * 🎯 BARRA DE RESUMO COM CONTADORES POR STATUS DE DEVOLUÇÃO
 * Cada chip aplica filtro rápido e mostra contagem em tempo real
 */

import { memo, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter, Package, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DevolucaoStatusBarProps {
  devolucoes: any[];
  quickFilter: string;
  onQuickFilterChange: (filter: 'all' | 'opened' | 'closed' | 'cancelled' | 'pending') => void;
  className?: string;
}

export const DevolucaoStatusBar = memo<DevolucaoStatusBarProps>(({ 
  devolucoes,
  quickFilter,
  onQuickFilterChange,
  className
}) => {
  // ✅ CONTAGEM: Contar devoluções por status
  const counters = useMemo(() => {
    console.log('📊 [DevolucaoStatusBar] Contando devoluções:', { 
      devolucoesLength: devolucoes?.length, 
      quickFilter
    });
    
    if (!devolucoes?.length) {
      console.log('📊 [DevolucaoStatusBar] Nenhuma devolução');
      return { total: 0, opened: 0, closed: 0, cancelled: 0, pending: 0 };
    }

    // ✅ Se quickFilter está ativo, todos os itens pertencem a essa categoria
    if (quickFilter === 'opened') {
      return {
        total: devolucoes.length,
        opened: devolucoes.length,
        closed: 0,
        cancelled: 0,
        pending: 0
      };
    }
    
    if (quickFilter === 'closed') {
      return {
        total: devolucoes.length,
        opened: 0,
        closed: devolucoes.length,
        cancelled: 0,
        pending: 0
      };
    }
    
    if (quickFilter === 'cancelled') {
      return {
        total: devolucoes.length,
        opened: 0,
        closed: 0,
        cancelled: devolucoes.length,
        pending: 0
      };
    }

    if (quickFilter === 'pending') {
      return {
        total: devolucoes.length,
        opened: 0,
        closed: 0,
        cancelled: 0,
        pending: devolucoes.length
      };
    }

    // ✅ MODO 'ALL': Calcular contadores reais
    let opened = 0;
    let closed = 0;
    let cancelled = 0;
    let pending = 0;

    for (const devolucao of devolucoes) {
      const status = devolucao.status_claim?.toLowerCase() || '';
      
      if (status === 'opened') {
        opened++;
      } else if (status === 'closed') {
        closed++;
      } else if (status === 'cancelled') {
        cancelled++;
      } else {
        pending++;
      }
    }

    const result = {
      total: devolucoes.length,
      opened,
      closed,
      cancelled,
      pending
    };
    
    console.log('📊 [DevolucaoStatusBar] Contadores:', result);
    return result;
  }, [devolucoes, quickFilter]);

  const statusChips = [
    {
      key: 'all',
      label: 'Todas as devoluções',
      count: counters.total,
      icon: Filter,
      variant: 'secondary' as const,
    },
    {
      key: 'opened',
      label: 'Abertas',
      count: counters.opened,
      icon: Package,
      variant: 'default' as const,
    },
    {
      key: 'closed',
      label: 'Fechadas',
      count: counters.closed,
      icon: CheckCircle,
      variant: 'outline' as const,
    },
    {
      key: 'cancelled',
      label: 'Canceladas',
      count: counters.cancelled,
      icon: XCircle,
      variant: 'outline' as const,
    },
    {
      key: 'pending',
      label: 'Pendentes',
      count: counters.pending,
      icon: Clock,
      variant: 'outline' as const,
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

DevolucaoStatusBar.displayName = 'DevolucaoStatusBar';
