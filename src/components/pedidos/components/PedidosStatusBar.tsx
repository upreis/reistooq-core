/**
 * 🎯 BARRA DE RESUMO COM CONTADORES POR STATUS
 * Cada chip aplica filtro rápido e mostra contagem em tempo real
 */

import { memo, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, Package, Filter, XCircle, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PedidosStatusBarProps {
  orders: any[];
  quickFilter: string;
  onQuickFilterChange: (filter: 'all' | 'pronto_baixar' | 'mapear_incompleto' | 'baixado' | 'sem_estoque' | 'sku_nao_cadastrado') => void;
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
  // ✅ CONTAGEM SIMPLES: Contar pedidos da página atual (já filtrados)
  const counters = useMemo(() => {
    console.log('📊 [StatusBar] Contando pedidos filtrados:', { 
      ordersLength: orders?.length, 
      quickFilter,
      hasMapping: !!mappingData,
      mappingSize: mappingData?.size 
    });
    
    if (!orders?.length) {
      console.log('📊 [StatusBar] Nenhum pedido na página');
      return { total: 0, prontosBaixa: 0, mapeamentoPendente: 0, baixados: 0, semEstoque: 0, skuNaoCadastrado: 0 };
    }

    // ✅ LÓGICA SIMPLES: Se quickFilter está ativo, todos os pedidos pertencem a essa categoria
    if (quickFilter === 'pronto_baixar') {
      console.log('📊 [StatusBar] Modo pronto_baixar - todos os pedidos são prontos');
      return {
        total: orders.length,
        prontosBaixa: orders.length,
        mapeamentoPendente: 0,
        baixados: 0,
        semEstoque: 0,
        skuNaoCadastrado: 0
      };
    }
    
    if (quickFilter === 'mapear_incompleto') {
      console.log('📊 [StatusBar] Modo mapear_incompleto - todos os pedidos são pendentes');
      return {
        total: orders.length,
        prontosBaixa: 0,
        mapeamentoPendente: orders.length,
        baixados: 0,
        semEstoque: 0,
        skuNaoCadastrado: 0
      };
    }
    
    if (quickFilter === 'baixado') {
      console.log('📊 [StatusBar] Modo baixado - todos os pedidos são baixados');
      return {
        total: orders.length,
        prontosBaixa: 0,
        mapeamentoPendente: 0,
        baixados: orders.length,
        semEstoque: 0,
        skuNaoCadastrado: 0
      };
    }
    
    if (quickFilter === 'sem_estoque') {
      return {
        total: orders.length,
        prontosBaixa: 0,
        mapeamentoPendente: 0,
        baixados: 0,
        semEstoque: orders.length,
        skuNaoCadastrado: 0
      };
    }
    
    if (quickFilter === 'sku_nao_cadastrado') {
      return {
        total: orders.length,
        prontosBaixa: 0,
        mapeamentoPendente: 0,
        baixados: 0,
        semEstoque: 0,
        skuNaoCadastrado: orders.length
      };
    }

    // ✅ MODO 'ALL': Calcular contadores reais
    let prontosBaixa = 0;
    let mapeamentoPendente = 0;
    let baixados = 0;
    let semEstoque = 0;
    let skuNaoCadastrado = 0;

    for (const order of orders) {
      // 🔍 PRIMEIRO: Verificar se já foi baixado (histórico)
      const jaProcessado = isPedidoProcessado?.(order);
      if (jaProcessado) {
        baixados++;
        continue;
      }
      
      // 🗂️ SEGUNDO: Verificar mapeamento e status
      const mapping = mappingData?.get?.(order.id);
      const statusBaixa = mapping?.statusBaixa;
      
      if (statusBaixa === 'sku_nao_cadastrado') {
        skuNaoCadastrado++;
      } else if (statusBaixa === 'sem_estoque') {
        semEstoque++;
      } else if (mapping && (mapping.skuEstoque || mapping.skuKit)) {
        prontosBaixa++;
      } else {
        mapeamentoPendente++;
      }
    }

    const result = {
      total: orders.length,
      prontosBaixa,
      mapeamentoPendente,
      baixados,
      semEstoque,
      skuNaoCadastrado
    };
    
    console.log('📊 [StatusBar] Contadores da página atual:', result);
    return result;
  }, [orders, mappingData, isPedidoProcessado, quickFilter]);

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
      key: 'sem_estoque',
      label: 'Sem Estoque',
      count: counters.semEstoque,
      icon: XCircle,
      variant: 'outline' as const,
      color: 'destructive'
    },
    {
      key: 'sku_nao_cadastrado',
      label: 'SKU sem cadastro no Estoque',
      count: counters.skuNaoCadastrado,
      icon: Database,
      variant: 'outline' as const,
      color: 'warning'
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