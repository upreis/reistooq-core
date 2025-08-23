import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Package, Trash2 } from 'lucide-react';
import { usePedidosStore } from '../../stores/usePedidosStore';

export function BulkActionsToolbar() {
  const { selectedIds, clearSelection } = usePedidosStore();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} pedido(s) selecionado(s)
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Package className="h-4 w-4 mr-1" />
              Baixar Estoque
            </Button>
            
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </Button>
            
            <Button variant="outline" size="sm" onClick={clearSelection}>
              <Trash2 className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}