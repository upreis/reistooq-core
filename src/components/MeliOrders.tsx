import { useEffect, useState } from 'react';
import { fetchUnifiedOrders } from '@/services/orders';

type Order = any;

type Props = {
  integrationAccountId: string;
  status?: string;
  limit?: number;
};

export default function MeliOrders({ integrationAccountId, status = 'paid', limit = 10 }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // Blindagem: não buscar se integrationAccountId estiver vazio
    if (!integrationAccountId?.trim()) {
      setOrders([]);
      setLoading(false);
      setErr(null);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const { results } = await fetchUnifiedOrders({
          integration_account_id: integrationAccountId,
          status,
          limit,
        });
        setOrders(Array.isArray(results) ? results : []);
      } catch (e: any) {
        setErr(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [integrationAccountId, status, limit]);

  if (!integrationAccountId?.trim()) {
    return <div className="text-muted-foreground text-sm">Conecte uma conta do Mercado Livre para ver os pedidos.</div>;
  }
  
  if (loading) return <div>Carregando pedidos…</div>;
  if (err) return <div className="text-red-600">Erro ao buscar pedidos: {err}</div>;
  if (!orders.length) return <div>Nenhum pedido encontrado.</div>;

  return (
    <div className="space-y-3">
      {orders.map((o: any) => (
        <div key={o.id} className="rounded-lg border border-gray-600 p-3">
          <div className="font-medium">Pedido #{o.id}</div>
          <div>Status: {o.status}</div>
          <div>Total: {o.total_amount} {o.currency_id}</div>
          {o?.order_items?.length ? (
            <div className="text-sm opacity-80">
              Itens: {o.order_items.map((it: any) => it?.item?.title).filter(Boolean).join(' · ')}
            </div>
          ) : null}
          {o?.payments?.length ? (
            <div className="text-xs opacity-70">
              Pagamento: {o.payments[0]?.payment_method_id} · {o.payments[0]?.status}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}