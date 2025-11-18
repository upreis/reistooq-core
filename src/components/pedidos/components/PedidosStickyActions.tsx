/**
 * 🔥 AÇÕES STICKY UNIFICADAS
 * Botão único baseado no filtro de "Prontos p/ baixar" + seleção global
 */

import { memo, useMemo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Package, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BaixaEstoqueModal } from '../BaixaEstoqueModal';

interface PedidosStickyActionsProps {
  orders: any[];
  displayedOrders: any[];
  selectedOrders: Set<string>;
  setSelectedOrders: (orders: Set<string>) => void;
  mappingData: Map<string, any>;
  isPedidoProcessado: (order: any) => boolean;
  quickFilter: string;
  onBaixaConcluida?: () => void;
  className?: string;
}

export const PedidosStickyActions = memo<PedidosStickyActionsProps>(({
  orders,
  displayedOrders,
  selectedOrders,
  setSelectedOrders,
  mappingData,
  isPedidoProcessado,
  quickFilter,
  onBaixaConcluida,
  className
}) => {
  const [showBaixaModal, setShowBaixaModal] = useState(false);
  const [showFilterConfirm, setShowFilterConfirm] = useState(false);

  // Contadores baseados no filtro atual
  const stats = useMemo(() => {
    const total = displayedOrders.length;
    const selected = selectedOrders.size;
    
    // Contar prontos para baixa no filtro atual
    const readyCount = displayedOrders.filter(order => {
      const id = order?.id || order?.numero || order?.unified?.id;
      const mapping = mappingData?.get?.(id);
      return mapping && (mapping.skuEstoque || mapping.skuKit) && !isPedidoProcessado(order);
    }).length;

    // Contar prontos para baixa selecionados
    const selectedReadyCount = Array.from(selectedOrders)
      .map(id => displayedOrders.find(o => o.id === id))
      .filter(Boolean)
      .filter(order => {
        const id = order?.id || order?.numero || order?.unified?.id;
        const mapping = mappingData?.get?.(id);
        return mapping && (mapping.skuEstoque || mapping.skuKit) && !isPedidoProcessado(order);
      }).length;

    return {
      total,
      selected,
      readyCount,
      selectedReadyCount,
      allSelected: selected > 0 && selected === total,
      someSelected: selected > 0 && selected < total,
      noneSelected: selected === 0
    };
  }, [displayedOrders, selectedOrders, mappingData, isPedidoProcessado]);

  // Controle de seleção
  const handleSelectAll = useCallback(() => {
    if (stats.allSelected) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(displayedOrders.map(order => order.id)));
    }
  }, [stats.allSelected, displayedOrders, setSelectedOrders]);

  const handleSelectAllReady = useCallback(() => {
    const readyOrders = displayedOrders.filter(order => {
      const id = order?.id || order?.numero || order?.unified?.id;
      const mapping = mappingData?.get?.(id);
      return mapping && (mapping.skuEstoque || mapping.skuKit) && !isPedidoProcessado(order);
    });
    setSelectedOrders(new Set(readyOrders.map(order => order.id)));
  }, [displayedOrders, mappingData, isPedidoProcessado, setSelectedOrders]);

  // ✅ CORREÇÃO CRÍTICA: Pedidos já vêm enriquecidos com local_estoque_id
  const selectedPedidosForBaixa = useMemo(() => {
    return Array.from(selectedOrders).map(id => {
      // ✅ displayedOrders já tem local_estoque_id do hook useLocalEstoqueEnriquecimento
      const order = displayedOrders.find(o => o.id === id);
      if (!order) return null;
      
      const mapping = mappingData.get(order.id);
      const quantidadeItens = order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
      const qtdKit = mapping?.quantidade || 1;
      
      // 🔍 DEBUG: Verificar se local_estoque_id está presente
      console.log('📦 Pedido preparado para baixa (sticky):', {
        numero: order.numero || order.id,
        local_estoque_id: order.local_estoque_id,
        local_estoque_nome: order.local_estoque_nome || order.local_estoque,
        sku_kit: mapping?.skuKit
      });
      
      return {
        ...order,
        sku_kit: mapping?.skuKit || null,
        total_itens: quantidadeItens * qtdKit
      };
    }).filter(Boolean);
  }, [selectedOrders, displayedOrders, mappingData]);

  // Estados do checkbox principal
  const checkboxState = stats.allSelected ? 'checked' : stats.someSelected ? 'indeterminate' : 'unchecked';

  // Não renderizar se nenhum item estiver selecionado
  if (stats.selected === 0) {
    return null;
  }

  return (
    <>
      <Card className={cn(
        "fixed bottom-4 left-4 right-4 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-primary/20 shadow-lg border-l-4 border-l-primary",
        className
      )}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            {/* Seleção global */}
            <div className="flex items-center gap-3">
              <Checkbox
                checked={checkboxState === 'checked'}
                ref={(el: any) => {
                  if (el) el.indeterminate = checkboxState === 'indeterminate';
                }}
                onCheckedChange={handleSelectAll}
                className="data-[state=checked]:bg-primary"
              />
              
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  {stats.selected > 0 ? (
                    <>
                      <CheckSquare className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {stats.selected} de {stats.total} selecionados
                      </span>
                    </>
                  ) : (
                    <>
                      <Square className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Selecionar pedidos ({stats.total} visíveis)
                      </span>
                    </>
                  )}
                </div>
                
                {/* Mostrar link para selecionar todos do filtro se há mais que N prontos */}
                {!showFilterConfirm && quickFilter === 'all' && stats.readyCount > 0 && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShowFilterConfirm(true)}
                    className="h-auto p-0 text-xs text-foreground hover:bg-brand-hover"
                  >
                    Selecionar todos os {stats.readyCount} prontos para baixa?
                  </Button>
                )}
                
                {showFilterConfirm && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllReady}
                      className="h-6 text-xs"
                    >
                      Sim, selecionar {stats.readyCount}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFilterConfirm(false)}
                      className="h-6 text-xs"
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Estatísticas da seleção */}
            {stats.selected > 0 && (
              <div className="flex items-center gap-2">
                {stats.selectedReadyCount > 0 && (
                  <Badge variant="default" className="text-xs">
                    <Package className="h-3 w-3 mr-1" />
                    {stats.selectedReadyCount} prontos p/ baixa
                  </Badge>
                )}
                {stats.selected - stats.selectedReadyCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {stats.selected - stats.selectedReadyCount} outros
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Ação principal: Baixar estoque */}
          <div className="flex items-center gap-2">
            {stats.selected > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedOrders(new Set())}
                className="text-muted-foreground hover:text-foreground"
              >
                Limpar seleção
              </Button>
            )}
            
            <Button
              onClick={() => {
                setShowBaixaModal(false);
                setTimeout(() => setShowBaixaModal(true), 0);
              }}
              disabled={stats.selectedReadyCount === 0}
              className="gap-2 min-w-[200px]"
              size="lg"
            >
              <Download className="h-4 w-4" />
              {stats.selectedReadyCount > 0 
                ? `Baixar estoque de ${stats.selectedReadyCount} pedidos`
                : 'Selecione pedidos prontos para baixa'
              }
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal de baixa - abre automaticamente */}
      {showBaixaModal && stats.selectedReadyCount > 0 && (
        <BaixaEstoqueModal 
          pedidos={selectedPedidosForBaixa}
          contextoDaUI={{
            mappingData,
          }}
        />
      )}
    </>
  );
});

PedidosStickyActions.displayName = 'PedidosStickyActions';