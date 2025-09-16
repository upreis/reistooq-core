// P2.1: Versão memoizada da tabela para melhor performance
import React, { memo, useMemo } from 'react';
import { PedidosTable } from './PedidosTable';
import { Row } from '@/services/orders';
import { MapeamentoVerificacao } from '@/services/MapeamentoService';
import { ColumnConfig } from './ColumnSelector';

interface PedidosTableMemoProps {
  rows: Row[];
  total: number;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onSelectionChange?: (selectedRows: Row[]) => void;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  mapeamentosVerificacao?: Map<string, MapeamentoVerificacao>;
  visibleColumns: ColumnConfig[];
  debugInfo?: any;
}

// P2.1: Comparação memoizada para otimizar renders
const areEqual = (prevProps: PedidosTableMemoProps, nextProps: PedidosTableMemoProps) => {
  // Shallow comparison para props críticas
  return (
    prevProps.rows.length === nextProps.rows.length &&
    prevProps.total === nextProps.total &&
    prevProps.loading === nextProps.loading &&
    prevProps.error === nextProps.error &&
    prevProps.currentPage === nextProps.currentPage &&
    prevProps.visibleColumns.length === nextProps.visibleColumns.length &&
    // Comparação profunda apenas se necessário
    JSON.stringify(prevProps.rows.map(r => r.unified?.id)) === 
    JSON.stringify(nextProps.rows.map(r => r.unified?.id))
  );
};

// P2.1: Componente memoizado para evitar re-renders desnecessários
export const PedidosTableMemo = memo<PedidosTableMemoProps>(({
  rows,
  total,
  loading,
  error,
  onRefresh,
  onSelectionChange,
  currentPage,
  onPageChange,
  mapeamentosVerificacao,
  visibleColumns,
  debugInfo
}) => {
  // P2.1: Memoizar props computadas pesadas
  const memoizedVisibleColumns = useMemo(() => 
    visibleColumns.filter(col => col.visible), 
    [visibleColumns]
  );

  const memoizedMappings = useMemo(() =>
    mapeamentosVerificacao || new Map(), 
    [mapeamentosVerificacao]
  );

  return (
    <PedidosTable
      rows={rows}
      total={total}
      loading={loading}
      error={error}
      onRefresh={onRefresh}
      onSelectionChange={onSelectionChange}
      currentPage={currentPage}
      onPageChange={onPageChange}
      mapeamentosVerificacao={memoizedMappings}
      visibleColumns={memoizedVisibleColumns}
      debugInfo={debugInfo}
    />
  );
}, areEqual);