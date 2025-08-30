import { memo, useCallback } from 'react';
import { PedidosTableMemo } from '../PedidosTableMemo';
import { ColumnManager } from '@/features/pedidos/components/ColumnManager';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Row } from '@/services/orders';
import { MapeamentoVerificacao } from '@/services/MapeamentoService';
import { useColumnManager } from '@/features/pedidos/hooks/useColumnManager';

interface PedidosTableSectionProps {
  orders: Row[];
  total: number;
  loading: boolean;
  error: string | null;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  selectedOrders: Set<string>;
  mapeamentosVerificacao: Map<string, MapeamentoVerificacao>;
  columnManager: ReturnType<typeof useColumnManager>;
  onRefresh: () => void;
  onSelectionChange: (selectedRows: Row[]) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const PedidosTableSection = memo<PedidosTableSectionProps>(({
  orders,
  total,
  loading,
  error,
  currentPage,
  pageSize,
  totalPages,
  hasNextPage,
  hasPrevPage,
  selectedOrders,
  mapeamentosVerificacao,
  columnManager,
  onRefresh,
  onSelectionChange,
  onPageChange,
  onPageSizeChange
}) => {
  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange]);

  const handleNextPage = useCallback(() => {
    if (hasNextPage) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, hasNextPage, onPageChange]);

  // Converter Set para array de ColumnConfig para compatibilidade
  const visibleColumnsArray = Array.from(columnManager.state.visibleColumns).map(key => ({
    key,
    label: key,
    visible: true,
    category: 'basic' as const
  }));

  return (
    <div className="space-y-4">
      {/* Column Manager */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Gerenciar Colunas</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // Resetar para colunas padrão se disponível
              console.log('Reset columns clicked');
            }}
          >
            Resetar
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-6">
        <PedidosTableMemo
          rows={orders}
          total={total}
          loading={loading}
          error={error}
          onRefresh={onRefresh}
          onSelectionChange={onSelectionChange}
          currentPage={currentPage}
          onPageChange={onPageChange}
          mapeamentosVerificacao={mapeamentosVerificacao}
          visibleColumns={visibleColumnsArray}
          debugInfo={{
            selectedOrders: selectedOrders.size,
            totalPages,
            hasNextPage,
            hasPrevPage
          }}
        />
      </Card>

      {/* Simplified Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Página {currentPage} de {totalPages} • {total} itens
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={!hasPrevPage || loading}
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={!hasNextPage || loading}
          >
            Próxima
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});

PedidosTableSection.displayName = 'PedidosTableSection';