/**
 * 🔧 SEÇÃO DE AÇÕES EM MASSA - Componente Extraído
 * Gerencia seleção de pedidos e ações em lote (baixa de estoque, etc.)
 */

import { memo, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Square, Package, Download, Trash2 } from 'lucide-react';
import { BaixaEstoqueModal } from '../BaixaEstoqueModal';
import { cn } from '@/lib/utils';

interface PedidosBulkActionsSectionProps {
  orders: any[];
  selectedOrders: Set<string>;
  setSelectedOrders: (orders: Set<string>) => void;
  mappingData: Map<string, any>;
  isPedidoProcessado: (order: any) => boolean;
  showBaixaModal: boolean;
  setShowBaixaModal: (show: boolean) => void;
  onBaixaConcluida?: () => void;
  className?: string;
}

export const PedidosBulkActionsSection = memo<PedidosBulkActionsSectionProps>(({
  orders,
  selectedOrders,
  setSelectedOrders,
  mappingData,
  isPedidoProcessado,
  showBaixaModal,
  setShowBaixaModal,
  onBaixaConcluida,
  className
}) => {
  // PedidosBulkActionsSection rendering

  // Contadores de seleção
  const selectionStats = useMemo(() => {
    const selectedOrdersArray = Array.from(selectedOrders).map(id => 
      orders.find(o => o.id === id)
    ).filter(Boolean);

    const processedCount = selectedOrdersArray.filter(order => 
      isPedidoProcessado(order)
    ).length;

    const readyForBaixaCount = selectedOrdersArray.filter(order => {
      const mapping = mappingData.get(order.id);
      return mapping && mapping.skuEstoque && !isPedidoProcessado(order);
    }).length;

    return {
      total: selectedOrders.size,
      processed: processedCount,
      readyForBaixa: readyForBaixaCount,
      pending: selectedOrders.size - processedCount
    };
  }, [selectedOrders, orders, mappingData, isPedidoProcessado]);

  // Função para selecionar todos os pedidos visíveis
  const handleSelectAll = useCallback(() => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map(order => order.id)));
    }
  }, [orders, selectedOrders.size, setSelectedOrders]);

  // Função para limpar seleção
  const handleClearSelection = useCallback(() => {
    setSelectedOrders(new Set());
  }, [setSelectedOrders]);

  // Função para selecionar apenas pedidos prontos para baixa
  const handleSelectReadyForBaixa = useCallback(() => {
    const readyOrders = orders.filter(order => {
      const mapping = mappingData.get(order.id);
      return mapping && mapping.skuEstoque && !isPedidoProcessado(order);
    });
    setSelectedOrders(new Set(readyOrders.map(order => order.id)));
  }, [orders, mappingData, isPedidoProcessado, setSelectedOrders]);

  // Preparar dados para o modal de baixa
  const selectedPedidosForBaixa = useMemo(() => {
    return Array.from(selectedOrders).map(id => {
      const order = orders.find(o => o.id === id);
      if (!order) return null;
      
      const mapping = mappingData.get(order.id);
      const quantidadeItens = order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
      const qtdKit = mapping?.quantidade || 1;
      
      return {
        ...order,
        sku_kit: mapping?.skuKit || null,
        total_itens: quantidadeItens * qtdKit
      };
    }).filter(Boolean);
  }, [selectedOrders, orders, mappingData]);

  // Se não há pedidos selecionados, não mostra nada
  if (selectedOrders.size === 0) {
    return null;
  }

  return (
    <>
      <Card className={cn("p-4 bg-primary/5 border-primary/20", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {selectionStats.total} pedido{selectionStats.total !== 1 ? 's' : ''} selecionado{selectionStats.total !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {selectionStats.processed > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectionStats.processed} processado{selectionStats.processed !== 1 ? 's' : ''}
                </Badge>
              )}
              {selectionStats.readyForBaixa > 0 && (
                <Badge variant="default" className="text-xs">
                  {selectionStats.readyForBaixa} pronto{selectionStats.readyForBaixa !== 1 ? 's' : ''} para baixa
                </Badge>
              )}
              {selectionStats.pending > 0 && (
                <Badge variant="outline" className="text-xs">
                  {selectionStats.pending} pendente{selectionStats.pending !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botões de seleção */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="gap-2"
            >
              {selectedOrders.size === orders.length ? (
                <>
                  <Square className="h-4 w-4" />
                  Desmarcar Todos
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4" />
                  Selecionar Todos
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectReadyForBaixa}
              className="gap-2"
            >
              <Package className="h-4 w-4" />
              Selecionar Prontos
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleClearSelection}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Limpar Seleção
            </Button>

            {/* Ação principal: Baixa de Estoque */}
            {selectionStats.readyForBaixa > 0 && (
              <Button
                onClick={() => {
                  // Forçar re-montagem do modal para abrir automaticamente
                  setShowBaixaModal(false);
                  setTimeout(() => setShowBaixaModal(true), 0);
                }}
                className="gap-2"
                disabled={selectionStats.readyForBaixa === 0}
              >
                <Download className="h-4 w-4" />
                Baixar Estoque ({selectionStats.readyForBaixa})
              </Button>
            )}
          </div>
        </div>

        {/* Informação adicional */}
        {selectionStats.processed > 0 && (
          <div className="mt-2 text-sm text-muted-foreground">
            ℹ️ Pedidos já processados não podem ter baixa de estoque novamente.
          </div>
        )}
      </Card>

      {/* Modal de Baixa de Estoque - Abre automaticamente ao montar (sem trigger) */}
      {showBaixaModal && (
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

PedidosBulkActionsSection.displayName = 'PedidosBulkActionsSection';