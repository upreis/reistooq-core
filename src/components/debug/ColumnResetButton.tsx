import { Button } from '@/components/ui/button';
import { resetColumnCache } from '@/features/pedidos/hooks/useColumnManager';

export function ColumnResetButton() {
  const handleReset = () => {
    console.log('🔄 Resetando cache de colunas...');
    resetColumnCache();
  };

  return (
    <Button 
      onClick={handleReset}
      variant="outline"
      size="sm"
      className="mb-4"
    >
      🔄 Reset Cache Colunas
    </Button>
  );
}