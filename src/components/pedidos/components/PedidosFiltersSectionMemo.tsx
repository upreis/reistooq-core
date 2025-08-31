/**
 * 🚀 COMPONENTE OTIMIZADO - FILTROS MEMOIZADOS
 * Evita re-renders desnecessários nos filtros
 */

import { memo } from 'react';
import { PedidosFiltersSection } from './PedidosFiltersSection';

const PedidosFiltersSectionMemo = memo(PedidosFiltersSection, (prevProps, nextProps) => {
  // Comparação otimizada para evitar re-renders desnecessários
  return (
    JSON.stringify(prevProps.filters) === JSON.stringify(nextProps.filters) &&
    prevProps.loading === nextProps.loading &&
    prevProps.hasPendingChanges === nextProps.hasPendingChanges
  );
});

PedidosFiltersSectionMemo.displayName = 'PedidosFiltersSectionMemo';

export default PedidosFiltersSectionMemo;