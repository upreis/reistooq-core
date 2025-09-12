/**
 * 🔍 TESTE TEMPORÁRIO - Debug das colunas Status vs SubStatus
 */
import { Badge } from '@/components/ui/badge';
import { mapMLStatus, getStatusBadgeVariant } from '@/utils/mlStatusMapping';
import { translateShippingSubstatus } from '@/utils/pedidos-translations';
import { Button } from '@/components/ui/button';

export function ColumnDebugTest() {
  // Simular dados como estão chegando
  const testData = [
    {
      shipping_status: 'ready_to_ship',
      shipping_substatus: 'printed'
    },
    {
      shipping_status: 'ready_to_ship', 
      shipping_substatus: 'in_warehouse'
    }
  ];

  const handleClearCache = () => {
    // Limpar todo o cache relacionado às colunas
    const keys = ['pedidos:columnState', 'pedidos:lastSearch', 'pedidos_unified_filters', 'pedidos_persistent_state'];
    keys.forEach(key => localStorage.removeItem(key));
    window.location.reload();
  };

  return (
    <div className="border border-orange-400 bg-orange-50 p-4 rounded-lg mb-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-orange-800">🔍 Debug: Status vs SubStatus</h3>
        <Button onClick={handleClearCache} size="sm" variant="outline">
          Limpar Cache & Reload
        </Button>
      </div>
      <div className="space-y-2">
        {testData.map((data, i) => (
          <div key={i} className="flex gap-4 items-center">
            <div className="w-32">
              <strong>Status do Envio:</strong>
              <Badge variant={getStatusBadgeVariant(data.shipping_status)}>
                {mapMLStatus(data.shipping_status)}
              </Badge>
            </div>
            <div className="w-32">
              <strong>SubStatus:</strong>
              <Badge variant={getStatusBadgeVariant('', data.shipping_substatus)}>
                {translateShippingSubstatus(data.shipping_substatus)}
              </Badge>
            </div>
            <div className="text-sm text-gray-600">
              Raw: status='{data.shipping_status}', substatus='{data.shipping_substatus}'
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}