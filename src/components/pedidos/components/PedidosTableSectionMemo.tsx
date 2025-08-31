/**
 * 🚀 COMPONENTE OTIMIZADO - TABELA DE PEDIDOS MEMOIZADA
 * Evita re-renders desnecessários na tabela principal
 */

import { memo } from 'react';
import { PedidosTableSection } from './PedidosTableSection';

const PedidosTableSectionMemo = memo(PedidosTableSection, (prevProps, nextProps) => {
  // Comparação otimizada para evitar re-renders desnecessários
  return (
    prevProps.orders?.length === nextProps.orders?.length &&
    prevProps.loading === nextProps.loading &&
    prevProps.selectedOrders.size === nextProps.selectedOrders.size &&
    JSON.stringify(prevProps.visibleColumns) === JSON.stringify(nextProps.visibleColumns)
  );
});

PedidosTableSectionMemo.displayName = 'PedidosTableSectionMemo';

export default PedidosTableSectionMemo;