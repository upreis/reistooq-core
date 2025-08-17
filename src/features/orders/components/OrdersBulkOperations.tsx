import React, { memo, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Package, X, Download, Trash, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { BulkOperation } from '../types/orders-advanced.types';

interface OrdersBulkOperationsProps {
  selectedCount: number;
  eligibleCount: number;
  totalOrders: number;
  isProcessing: boolean;
  isExporting: boolean;
  currentOperation: BulkOperation | null;
  onClearSelection: () => void;
  onBulkLowStock: () => void;
  onBulkCancelOrders: () => void;
  onExport: (format: 'csv' | 'xlsx' | 'pdf') => void;
  onRefresh: () => void;
}

export const OrdersBulkOperations = memo<OrdersBulkOperationsProps>(({
  selectedCount,
  eligibleCount,
  totalOrders,
  isProcessing,
  isExporting,
  currentOperation,
  onClearSelection,
  onBulkLowStock,
  onBulkCancelOrders,
  onExport,
  onRefresh,
}) => {
  const hasSelection = selectedCount > 0;
  const canProcess = eligibleCount > 0;

  // Operation status display
  const operationStatus = useMemo(() => {
    if (!currentOperation) return null;

    const { status, progress, processed_items, total_items, error_message } = currentOperation;
    
    return {
      status,
      progress,
      processed: processed_items,
      total: total_items,
      error: error_message,
      isActive: ['pending', 'processing'].includes(status),
      isCompleted: status === 'completed',
      isFailed: status === 'failed',
    };
  }, [currentOperation]);

  return (
    <Card className="border-l-4 border-l-primary shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Operações em Lote
          </CardTitle>
          {hasSelection && (
            <Badge variant="default" className="bg-primary/10 text-primary border-primary">
              {selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Selection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {hasSelection ? (
              <>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {selectedCount} de {totalOrders} selecionados
                  </span>
                </div>
                {eligibleCount !== selectedCount && (
                  <Badge variant="outline" className="border-warning text-warning">
                    {eligibleCount} elegível{eligibleCount !== 1 ? 'is' : ''}
                  </Badge>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package className="h-4 w-4" />
                <span className="text-sm">
                  {totalOrders} pedido{totalOrders !== 1 ? 's' : ''} disponível{totalOrders !== 1 ? 'is' : ''}
                </span>
              </div>
            )}
          </div>

          {hasSelection && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="h-auto p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Operation Progress */}
        {operationStatus && operationStatus.isActive && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Processando operação...</span>
              <span className="text-muted-foreground">
                {operationStatus.processed}/{operationStatus.total}
              </span>
            </div>
            <Progress value={operationStatus.progress} className="h-2" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Aguarde enquanto processamos os pedidos selecionados</span>
            </div>
          </div>
        )}

        {/* Completed/Failed Status */}
        {operationStatus && (operationStatus.isCompleted || operationStatus.isFailed) && (
          <div className={`flex items-center gap-2 p-2 rounded-md ${
            operationStatus.isCompleted 
              ? 'bg-success/10 text-success border border-success/20' 
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}>
            {operationStatus.isCompleted ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {operationStatus.isCompleted 
                ? `Operação concluída: ${operationStatus.processed} pedidos processados`
                : `Operação falhou: ${operationStatus.error || 'Erro desconhecido'}`
              }
            </span>
          </div>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Export Actions */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">EXPORTAR</span>
            <div className="grid grid-cols-1 gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('csv')}
                disabled={isExporting || totalOrders === 0}
                className="justify-start text-xs"
              >
                <Download className="h-3 w-3 mr-1" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('xlsx')}
                disabled={isExporting || totalOrders === 0}
                className="justify-start text-xs"
              >
                <Download className="h-3 w-3 mr-1" />
                Excel
              </Button>
            </div>
          </div>

          {/* Bulk Operations */}
          {hasSelection && (
            <>
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">ESTOQUE</span>
                <Button
                  variant="default"
                  size="sm"
                  onClick={onBulkLowStock}
                  disabled={!canProcess || isProcessing}
                  className="w-full justify-start text-xs"
                >
                  <Package className="h-3 w-3 mr-1" />
                  Baixar Estoque
                </Button>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">CANCELAR</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onBulkCancelOrders}
                  disabled={!canProcess || isProcessing}
                  className="w-full justify-start text-xs"
                >
                  <Trash className="h-3 w-3 mr-1" />
                  Cancelar Pedidos
                </Button>
              </div>
            </>
          )}

          {/* Utility Actions */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">UTILITÁRIOS</span>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="w-full justify-start text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Large Export Warning */}
        {totalOrders > 5000 && (
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-warning-foreground">
                  Exportação de grande volume
                </p>
                <p className="text-warning-foreground/80 mt-1">
                  Exportação de {totalOrders.toLocaleString()} pedidos será processada no servidor. 
                  O download iniciará automaticamente quando pronto.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

OrdersBulkOperations.displayName = 'OrdersBulkOperations';