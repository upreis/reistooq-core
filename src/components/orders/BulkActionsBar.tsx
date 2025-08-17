import React, { memo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, X, Download, Trash, RefreshCw } from "lucide-react";
import { OrderListParams } from '@/services/OrderService';

interface BulkActionsBarProps {
  selectedCount: number;
  eligibleCount: number;
  totalOrders: number;
  isProcessing: boolean;
  isExporting: boolean;
  filters: OrderListParams;
  onClearSelection: () => void;
  onBulkBaixarEstoque: () => void;
  onBulkCancelarPedidos: () => void;
  onExportCsv: () => void;
  onRefresh: () => void;
}

export const BulkActionsBar = memo<BulkActionsBarProps>(({
  selectedCount,
  eligibleCount,
  totalOrders,
  isProcessing,
  isExporting,
  filters,
  onClearSelection,
  onBulkBaixarEstoque,
  onBulkCancelarPedidos,
  onExportCsv,
  onRefresh,
}) => {
  const hasSelection = selectedCount > 0;
  const canProcess = eligibleCount > 0;
  
  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          {/* Selection info */}
          <div className="flex items-center gap-3">
            {hasSelection ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-primary/10 text-primary border-primary">
                    {selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}
                  </Badge>
                  {eligibleCount !== selectedCount && (
                    <Badge variant="outline" className="border-warning text-warning">
                      {eligibleCount} elegível{eligibleCount !== 1 ? 'is' : ''}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearSelection}
                  className="h-auto p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package className="h-4 w-4" />
                <span className="text-sm">
                  {totalOrders} pedido{totalOrders !== 1 ? 's' : ''} encontrado{totalOrders !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            
            {/* Export action - always available */}
            <Button
              variant="outline"
              size="sm"
              onClick={onExportCsv}
              disabled={isExporting || totalOrders === 0}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Exportando...' : 'Exportar CSV'}
            </Button>
            
            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            
            {/* Bulk actions - only when has selection */}
            {hasSelection && (
              <>
                <Separator orientation="vertical" className="h-6" />
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={onBulkBaixarEstoque}
                  disabled={!canProcess || isProcessing}
                  className="gap-2"
                >
                  <Package className="h-4 w-4" />
                  {isProcessing ? 'Processando...' : 'Baixar Estoque'}
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onBulkCancelarPedidos}
                  disabled={!canProcess || isProcessing}
                  className="gap-2"
                >
                  <Trash className="h-4 w-4" />
                  Cancelar Pedidos
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Processing indicator */}
        {isProcessing && (
          <div className="mt-3 p-2 bg-muted rounded-md text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Processando {selectedCount} pedido{selectedCount !== 1 ? 's' : ''}... Aguarde.
            </div>
          </div>
        )}
        
        {/* Export info */}
        {totalOrders > 5000 && (
          <div className="mt-3 p-2 bg-warning/10 border border-warning/20 rounded-md text-sm text-warning-foreground">
            ⚠️ Exportação de {totalOrders.toLocaleString()} pedidos será processada no servidor. 
            O download iniciará quando pronto.
          </div>
        )}
        
      </CardContent>
    </Card>
  );
});

BulkActionsBar.displayName = 'BulkActionsBar';