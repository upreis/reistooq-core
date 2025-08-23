import { usePedidosStore } from '../../stores/usePedidosStore';
import { usePedidosInfiniteQuery } from '../../hooks/usePedidosQuery';
import { Card, CardContent } from '@/components/ui/card';

interface PedidosDataTableProps {
  integrationAccountId: string;
}

export function PedidosDataTable({ integrationAccountId }: PedidosDataTableProps) {
  const store = usePedidosStore();
  
  const query = usePedidosInfiniteQuery(integrationAccountId, store.appliedFilters);

  if (query.isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center text-muted-foreground">
          Tabela de pedidos será implementada em breve
        </div>
      </CardContent>
    </Card>
  );
}