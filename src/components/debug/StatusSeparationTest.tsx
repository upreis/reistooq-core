import { Badge } from '@/components/ui/badge';
import { mapMLStatus, mapMLShippingSubstatus } from '@/utils/mlStatusMapping';

export function StatusSeparationTest() {
  // Exemplo de dados da API
  const testData = {
    shipping_status: 'ready_to_ship',
    shipping_substatus: 'printed'
  };

  const mappedStatus = mapMLStatus(testData.shipping_status);
  const mappedSubstatus = mapMLShippingSubstatus(testData.shipping_substatus);

  return (
    <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
      <h3 className="font-semibold">🧪 Teste Separação Status/SubStatus</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Status do Envio (ready_to_ship):</label>
          <div className="mt-1">
            <Badge variant="secondary">{mappedStatus}</Badge>
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium">SubStatus (printed):</label>
          <div className="mt-1">
            <Badge variant="outline">{mappedSubstatus}</Badge>
          </div>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground">
        ✅ Status principais separados dos substatus
      </div>
    </div>
  );
}