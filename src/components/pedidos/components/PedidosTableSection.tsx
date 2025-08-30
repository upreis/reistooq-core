/**
 * 🛡️ SEÇÃO DA TABELA PEDIDOS - MIGRAÇÃO GRADUAL FASE 1.3
 * Extraído do SimplePedidosPage para testar funcionalidade
 * GARANTIA: Mantém 100% da funcionalidade da tabela
 */

import { memo } from 'react';
import { PedidosTableMemo } from '../PedidosTableMemo';
import { Row } from '@/services/orders';
import { MapeamentoVerificacao } from '@/services/MapeamentoService';
import { ColumnConfig } from '../ColumnSelector';

interface PedidosTableSectionProps {
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

export const PedidosTableSection = memo(function PedidosTableSection({
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
}: PedidosTableSectionProps) {
  return (
    <PedidosTableMemo
      rows={rows}
      total={total}
      loading={loading}
      error={error}
      onRefresh={onRefresh}
      onSelectionChange={onSelectionChange}
      currentPage={currentPage}
      onPageChange={onPageChange}
      mapeamentosVerificacao={mapeamentosVerificacao}
      visibleColumns={visibleColumns}
      debugInfo={debugInfo}
    />
  );
});