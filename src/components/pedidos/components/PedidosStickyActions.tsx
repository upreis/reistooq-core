/**
 * 🔥 AÇÕES STICKY UNIFICADAS
 * Botão único baseado no filtro de "Prontos p/ baixar" + seleção global
 * + Estorno de vendas na aba histórico
 */

import { memo, useMemo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';
import { Download, Package, CheckSquare, Square, AlertCircle, Trash2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BaixaEstoqueModal } from '../BaixaEstoqueModal';
import { HistoricoDeleteService } from '@/features/historico/services/HistoricoDeleteService';
import { buildIdUnico } from '@/utils/idUnico';

interface PedidosStickyActionsProps {
  orders: any[];
  displayedOrders: any[];
  selectedOrders: Set<string>;
  setSelectedOrders: (orders: Set<string>) => void;
  mappingData: Map<string, any>;
  isPedidoProcessado: (order: any) => boolean;
  quickFilter: string;
  onBaixaConcluida?: () => void;
  /**
   * Aba ativa: 'pendentes' ou 'historico'
   */
  activeTab?: 'pendentes' | 'historico';
  /**
   * Callback após estornar (refetch).
   */
  onEstornoConcluido?: () => void;
  /**
   * Habilita exclusão em lote (ex.: pedidos importados da Shopee).
   * Por segurança, mantenha desligado para outras fontes.
   */
  enableBulkDelete?: boolean;
  /**
   * Nome da tabela do Supabase a ser apagada (ex.: 'pedidos_shopee').
   */
  deleteTableName?: 'pedidos_shopee';
  /**
   * Callback após excluir (refetch).
   */
  onDeleteConcluida?: () => void;
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
  activeTab = 'pendentes',
  onEstornoConcluido,
  enableBulkDelete = false,
  deleteTableName = 'pedidos_shopee',
  onDeleteConcluida,
  className
}) => {
  const [showBaixaModal, setShowBaixaModal] = useState(false);
  const [showFilterConfirm, setShowFilterConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEstornando, setIsEstornando] = useState(false);

  const handleBulkDelete = useCallback(async () => {
    if (!enableBulkDelete) return;
    if (selectedOrders.size === 0) return;

    setIsDeleting(true);
    try {
      const ids = Array.from(selectedOrders);
      const { error } = await supabase
        .from(deleteTableName)
        .delete()
        .in('id', ids);

      if (error) throw error;

      toast.success(`${ids.length} pedido(s) excluído(s) com sucesso.`);
      setSelectedOrders(new Set());
      onDeleteConcluida?.();
    } catch (err: any) {
      console.error('Erro ao excluir pedidos:', err);
      toast.error(err?.message || 'Não foi possível excluir os pedidos.');
    } finally {
      setIsDeleting(false);
    }
  }, [enableBulkDelete, selectedOrders, deleteTableName, setSelectedOrders, onDeleteConcluida]);

  // 🔄 ESTORNO: Reverter baixa de estoque para pedidos na aba histórico
  const handleEstorno = useCallback(async () => {
    if (activeTab !== 'historico') return;
    if (selectedOrders.size === 0) return;

    setIsEstornando(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const orderId of selectedOrders) {
        const order = displayedOrders.find(o => o.id === orderId);
        if (!order) continue;

        // 🔍 Gerar id_unico/número do pedido para buscar no histórico
        const idUnico = (order as any).id_unico || buildIdUnico(order);
        const numeroPedido = String(
          (order as any).numero ||
            (order as any).order_id ||
            (order as any).unified?.numero ||
            (order as any).unified?.order_id ||
            (order as any).id ||
            ''
        ).trim();

        console.log('🔄 Buscando histórico para estorno:', { orderId, idUnico, numero: numeroPedido });

        // 🔍 Buscar registro no histórico por número do pedido (mais confiável) e fallback no id_unico
        const { data: historicoData, error: searchError } = await supabase
          .rpc('get_historico_vendas_browse', {
            _limit: 10,
            _offset: 0,
            _search: numeroPedido || idUnico,
            _start: null,
            _end: null
          });

        if (searchError) {
          console.error('❌ Erro ao buscar histórico:', searchError);
          errorCount++;
          continue;
        }

        // 🔍 Encontrar registro correspondente
        const registroHistorico = historicoData?.find((h: any) =>
          h.id_unico === idUnico ||
          h.numero_pedido === numeroPedido
        );

        if (!registroHistorico) {
          console.warn('⚠️ Registro não encontrado no histórico para:', { orderId, idUnico });
          errorCount++;
          continue;
        }

        console.log('✅ Registro encontrado, estornando:', registroHistorico.id);

        // 🔄 Chamar service de exclusão que reverte o estoque
        const success = await HistoricoDeleteService.deleteItem(registroHistorico.id);
        
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} pedido(s) estornado(s) com sucesso. Estoque revertido.`);
        setSelectedOrders(new Set());
        onEstornoConcluido?.();
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} pedido(s) não puderam ser estornados.`);
      }
    } catch (err: any) {
      console.error('Erro ao estornar pedidos:', err);
      toast.error(err?.message || 'Não foi possível estornar os pedidos.');
    } finally {
      setIsEstornando(false);
    }
  }, [activeTab, selectedOrders, displayedOrders, setSelectedOrders, onEstornoConcluido]);

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

      const quantidadeOrderItems =
        order.order_items?.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0) || 0;
      const quantidadeItems =
        Array.isArray(order.items)
          ? order.items.reduce((sum: number, item: any) => sum + (Number(item?.quantity) || 0), 0)
          : 0;

      // ✅ Fallbacks (Shopee normalmente não tem order_items)
      const quantidadeBase =
        quantidadeOrderItems ||
        quantidadeItems ||
        (Number(order.total_itens) || 0) ||
        (Number(order.quantidade) || 0) ||
        (Number(order.quantidade_itens) || 0);

      const qtdKit = mapping?.quantidade || 1;

      // 🔍 DEBUG: Verificar se local_estoque_id está presente
      console.log('📦 Pedido preparado para baixa (sticky):', {
        numero: order.numero || order.id,
        local_estoque_id: order.local_estoque_id,
        local_estoque_nome: order.local_estoque_nome || order.local_estoque,
        sku_kit: mapping?.skuKit,
        quantidadeBase,
        qtdKit
      });

      return {
        ...order,
        sku_kit: mapping?.skuKit || null,
        total_itens: quantidadeBase * qtdKit
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

          {/* Ações */}
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

            {enableBulkDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isDeleting || stats.selected === 0}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir ({stats.selected})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir pedidos selecionados?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação remove permanentemente {stats.selected} pedido(s) importado(s).
                      Você pode importar novamente depois, se precisar.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button
                        variant="destructive"
                        onClick={handleBulkDelete}
                        disabled={isDeleting}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        {isDeleting ? 'Excluindo...' : 'Excluir'}
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* 🔄 ESTORNO: Apenas na aba histórico */}
            {activeTab === 'historico' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    disabled={isEstornando || stats.selected === 0}
                    className="gap-2 min-w-[200px] border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {isEstornando ? 'Estornando...' : `Estornar ${stats.selected} pedido(s)`}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Estornar vendas selecionadas?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação irá reverter a baixa de estoque de {stats.selected} pedido(s).
                      Os produtos voltarão ao estoque e os pedidos ficarão disponíveis para nova baixa.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isEstornando}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button
                        variant="default"
                        onClick={handleEstorno}
                        disabled={isEstornando}
                        className="gap-2 bg-orange-500 hover:bg-orange-600"
                      >
                        <RotateCcw className="h-4 w-4" />
                        {isEstornando ? 'Estornando...' : 'Confirmar Estorno'}
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* 📦 BAIXAR ESTOQUE: Apenas na aba pendentes */}
            {activeTab === 'pendentes' && (
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
            )}
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