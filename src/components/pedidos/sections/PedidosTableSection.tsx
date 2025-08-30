import { memo, useCallback } from 'react';
import { PedidosTableMemo } from '../PedidosTableMemo';
import { PedidosTablePagination } from '../PedidosTablePagination';
import { ColumnManager } from '@/features/pedidos/components/ColumnManager';
import { Card } from '@/components/ui/card';
import { Row } from '@/services/orders';
import { MapeamentoVerificacao } from '@/services/MapeamentoService';
import { ColumnConfig } from '../ColumnSelector';
import { ColumnManagerState, ColumnManagerActions } from '@/features/pedidos/hooks/useColumnManager';

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
  columnManager: {
    state: ColumnManagerState;
    actions: ColumnManagerActions;
  };
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

  return (
    <div className="space-y-4">
      {/* Column Manager */}
      <Card className="p-4">
        <ColumnManager
          state={columnManager.state}
          actions={columnManager.actions}
        />
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
          visibleColumns={columnManager.state.visibleColumns}
          debugInfo={{
            selectedOrders: selectedOrders.size,
            totalPages,
            hasNextPage,
            hasPrevPage
          }}
        />
      </Card>

      {/* Pagination */}
      <PedidosTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        total={total}
        hasNextPage={hasNextPage}
        hasPrevPage={hasPrevPage}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        onPreviousPage={handlePreviousPage}
        onNextPage={handleNextPage}
      />
    </div>
  );
});

PedidosTableSection.displayName = 'PedidosTableSection';