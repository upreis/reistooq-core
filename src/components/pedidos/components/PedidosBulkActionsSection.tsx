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
  displayedOrders: any[]; // ✅ NOVO: Pedidos enriquecidos com local_estoque_id
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
  displayedOrders, // ✅ NOVO: Receber pedidos enriquecidos
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

  // ✅ CORREÇÃO CRÍTICA: Usar displayedOrders (enriquecidos com local_estoque_id)
  const selectedPedidosForBaixa = useMemo(() => {
    return Array.from(selectedOrders).map(id => {
      // ✅ USAR displayedOrders (tem local_estoque_id) em vez de orders
      const order = displayedOrders.find(o => o.id === id);
      if (!order) return null;
      
      const mapping = mappingData.get(order.id);
      const quantidadeItens = order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
      const qtdKit = mapping?.quantidade || 1;
      
      // 🔍 DEBUG: Verificar se local_estoque_id está presente
      console.log('📦 Pedido preparado para baixa:', {
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

  // Sempre mostrar a barra, mesmo sem seleção
  const hasSelection = selectedOrders.size > 0;

  return (
    <>
      <Card className={cn("p-4 border-l-4 border-l-primary", hasSelection ? "bg-primary/5 border-primary/20" : "bg-muted/30", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {hasSelection ? (
                <>
                  <CheckSquare className="h-5 w-5 text-primary" />
                  <span className="font-medium">
                    {selectionStats.total} pedido{selectionStats.total !== 1 ? 's' : ''} selecionado{selectionStats.total !== 1 ? 's' : ''}
                  </span>
                </>
              ) : (
                <>
                  <Square className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">
                    Nenhum pedido selecionado
                  </span>
                </>
              )}
            </div>
            
            {hasSelection && (
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
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Botões de seleção - sempre visíveis */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="gap-2"
              disabled={orders.length === 0}
            >
              {selectedOrders.size === orders.length && orders.length > 0 ? (
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
              disabled={orders.length === 0}
            >
              <Package className="h-4 w-4" />
              Selecionar Prontos
            </Button>

            {hasSelection && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Limpar Seleção
              </Button>
            )}

            {/* Ação principal: Baixa de Estoque - só aparece quando há seleção */}
            {hasSelection && selectionStats.readyForBaixa > 0 && (
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
        {hasSelection && selectionStats.processed > 0 && (
          <div className="mt-2 text-sm text-muted-foreground">
            ℹ️ Pedidos já processados não podem ter baixa de estoque novamente.
          </div>
        )}

        {/* Removido: Instrução desnecessária quando não há seleção */}
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