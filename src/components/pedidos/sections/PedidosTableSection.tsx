import { memo, useCallback, useMemo } from 'react';
import { PedidosTableMemo } from '../PedidosTableMemo';
import { PedidosTablePagination } from './PedidosTablePagination';
import { ColumnManager } from '@/features/pedidos/components/ColumnManager';
import { COLUMN_DEFINITIONS } from '@/features/pedidos/config/columns.config';
import { Card } from '@/components/ui/card';
import { Row } from '@/services/orders';
import { MapeamentoVerificacao } from '@/services/MapeamentoService';
import { ColumnConfig } from '../ColumnSelector';
// Column manager types
type ColumnManagerState = any;
type ColumnManagerActions = any;

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

  const visibleColumnsList = useMemo<ColumnConfig[]>(() => {
    const keys = Array.isArray(columnManager.state?.visibleColumns)
      ? columnManager.state.visibleColumns
      : Array.from(columnManager.state?.visibleColumns || []);
    return keys.map((key: string) => {
      const def = (COLUMN_DEFINITIONS as any[]).find(d => d.key === key);
      return {
        key,
        label: def?.label || key,
        visible: true,
        category: (def?.category || 'basic') as any,
      } as ColumnConfig;
    });
  }, [columnManager.state?.visibleColumns]);

  return (
    <div className="space-y-4">
      {/* Column Manager */}
      <Card className="p-4">
        <div className="text-sm text-muted-foreground">
          Gerenciador de colunas em desenvolvimento...
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
          visibleColumns={visibleColumnsList}
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
        hasNextPage={hasNextPage}
        hasPrevPage={hasPrevPage}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
});

PedidosTableSection.displayName = 'PedidosTableSection';