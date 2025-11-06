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
  loadingCounts?: boolean;
  totalRecords?: number;
  mappingData?: Map<string, any>;
  isPedidoProcessado?: (order: any) => boolean;
  hasActiveFilters?: boolean; // ✅ NOVO: Indica se há filtros aplicados (período, busca, etc.)
}

export const PedidosStatusBar = memo<PedidosStatusBarProps>(({ 
  orders,
  quickFilter,
  onQuickFilterChange,
  className,
  globalCounts,
  loadingCounts,
  totalRecords,
  mappingData,
  isPedidoProcessado,
  hasActiveFilters = false // ✅ NOVO: Padrão = sem filtros
}) => {
  // ✅ Usar totalRecords (total de todas as páginas) quando disponível, senão usar orders da página atual
  const counters = useMemo(() => {
    // 🎯 SOLUÇÃO: Só usar globalCounts quando NÃO há filtros ativos
    // Se há filtros de período, busca, etc., usar totalRecords que vem da API já filtrado
    if (globalCounts && typeof globalCounts.total === 'number' && quickFilter === 'all' && !hasActiveFilters) {
      return {
        total: globalCounts.total || 0,
        prontosBaixa: globalCounts.prontosBaixa || 0,
        mapeamentoPendente: globalCounts.mapeamentoPendente || 0,
        baixados: globalCounts.baixados || 0,
        semEstoque: 0,
        skuNaoCadastrado: 0
      };
    }
    
    if (!orders?.length) {
      return { total: 0, prontosBaixa: 0, mapeamentoPendente: 0, baixados: 0, semEstoque: 0, skuNaoCadastrado: 0 };
    }

    // ✅ LÓGICA SIMPLES: Se quickFilter está ativo, todos os pedidos pertencem a essa categoria
    // Usar totalRecords se disponível (representa todas as páginas), senão usar orders.length
    const totalCount = totalRecords || orders.length;
    
    if (quickFilter === 'pronto_baixar') {
      return {
        total: totalCount,
        prontosBaixa: totalCount,
        mapeamentoPendente: 0,
        baixados: 0,
        semEstoque: 0,
        skuNaoCadastrado: 0
      };
    }
    
    if (quickFilter === 'mapear_incompleto') {
      return {
        total: totalCount,
        prontosBaixa: 0,
        mapeamentoPendente: totalCount,
        baixados: 0,
        semEstoque: 0,
        skuNaoCadastrado: 0
      };
    }
    
    if (quickFilter === 'baixado') {
      return {
        total: totalCount,
        prontosBaixa: 0,
        mapeamentoPendente: 0,
        baixados: totalCount,
        semEstoque: 0,
        skuNaoCadastrado: 0
      };
    }
    
    if (quickFilter === 'sem_estoque') {
      return {
        total: totalCount,
        prontosBaixa: 0,
        mapeamentoPendente: 0,
        baixados: 0,
        semEstoque: totalCount,
        skuNaoCadastrado: 0
      };
    }
    
    if (quickFilter === 'sku_nao_cadastrado') {
      return {
        total: totalCount,
        prontosBaixa: 0,
        mapeamentoPendente: 0,
        baixados: 0,
        semEstoque: 0,
        skuNaoCadastrado: totalCount
      };
    }

    // ✅ MODO 'ALL': Calcular contadores reais da página atual
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

    return {
      total: totalCount,
      prontosBaixa,
      mapeamentoPendente,
      baixados,
      semEstoque,
      skuNaoCadastrado
    };
  }, [orders, mappingData, isPedidoProcessado, quickFilter, globalCounts, totalRecords]);

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

  // 🎯 Indicador de totais vs página atual
  const isShowingGlobalCounts = globalCounts && typeof globalCounts.total === 'number' && quickFilter === 'all';

  return (
    <Card className={cn("sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="p-4 space-y-3">
        {/* Indicadores removidos conforme solicitado */}
        
        {!isShowingGlobalCounts && orders.length > 0 && quickFilter === 'all' && (
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800" style={{ display: 'none' }}>
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>
              Contadores da <strong>página atual</strong> apenas ({orders.length} pedidos)
            </span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
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
      </div>
    </Card>
  );
});

PedidosStatusBar.displayName = 'PedidosStatusBar';