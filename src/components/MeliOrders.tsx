import { useEffect, useState } from 'react';
import { listOrders } from '@/services/orders';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, Package } from 'lucide-react';

type Props = { accountId?: string };

const DEFAULT_ACCOUNT_ID = '5740f717-1771-4298-b8c9-464ffb8d8dce'; // conta com vendas

export default function MeliOrders({ accountId = DEFAULT_ACCOUNT_ID }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const pageSize = 50;

  async function load(pageOffset = 0, append = false) {
    setLoading(true);
    try {
      const res = await listOrders({
        integration_account_id: accountId,
        status: 'paid',
        limit: pageSize,
        offset: pageOffset,
        fonte: 'mercadolivre', // Only ML orders
      });
      setItems((prev) => (append ? [...prev, ...res.results] : res.results));
      setOffset(pageOffset);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(0, false);
  }, [accountId]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          onClick={() => load(0, false)}
          disabled={loading}
          size="sm"
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Carregando...' : 'Atualizar'}
        </Button>
        <Button
          onClick={() => load(offset + pageSize, true)}
          disabled={loading}
          size="sm"
          variant="ghost"
        >
          Carregar mais
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {items.length === 0 && !loading && (
              <div className="p-4 text-center">
                <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Sem resultados para esta conta/filtros.
                </p>
              </div>
            )}
            {items.map((o) => (
              <div key={o.id} className="p-4">
                <div className="font-medium">Pedido #{o.id}</div>
                <div className="text-sm text-muted-foreground">
                  Status: {o.status} · {o?.buyer?.nickname ?? 'sem buyer'} · Total: {o.total_amount} {o.currency_id}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Itens: {o.order_items?.map((it: any) => it.item?.title).filter(Boolean).join(' | ') || '—'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}