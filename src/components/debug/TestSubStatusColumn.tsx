import { useColumnManager } from '@/features/pedidos/hooks/useColumnManager';
import { COLUMN_DEFINITIONS } from '@/features/pedidos/config/columns.config';

export function TestSubStatusColumn() {
  const { state, definitions } = useColumnManager();
  
  const subStatusColumn = definitions.find(col => col.key === 'shipping_substatus');
  const isVisible = state.visibleColumns.has('shipping_substatus');
  
  console.log('🧪 TEST SubStatus Column:', {
    found: !!subStatusColumn,
    label: subStatusColumn?.label,
    visible: isVisible,
    priority: subStatusColumn?.priority,
    default: subStatusColumn?.default,
    allVisibleColumns: Array.from(state.visibleColumns)
  });
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
      <h4 className="font-semibold mb-2">🧪 Teste SubStatus Column</h4>
      <div>
        <strong>Encontrada:</strong> {subStatusColumn ? '✅ Sim' : '❌ Não'}<br/>
        <strong>Label:</strong> {subStatusColumn?.label || 'N/A'}<br/>
        <strong>Visível:</strong> {isVisible ? '✅ Sim' : '❌ Não'}<br/>
        <strong>Priority:</strong> {subStatusColumn?.priority || 'N/A'}<br/>
        <strong>Default:</strong> {subStatusColumn?.default ? '✅ Sim' : '❌ Não'}<br/>
        <strong>Total Colunas Visíveis:</strong> {state.visibleColumns.size}
      </div>
    </div>
  );
}