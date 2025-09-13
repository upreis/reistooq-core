import { useEffect, useState } from 'react';
import { fetchPedidosRealtime } from '@/services/orders';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

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
        const { rows } = await fetchPedidosRealtime({
          integration_account_id: integrationAccountId,
          status,
          limit,
        });
        setOrders(rows.map(r => r.unified).filter(Boolean));
      } catch (e: any) {
        const errorMsg = e?.message ?? String(e);
        setErr(errorMsg);
        
        // Toast específico para token ausente
        if (errorMsg.includes('Token ausente') || errorMsg.includes('Token missing')) {
          toast({
            title: "Conta desconectada",
            description: "Conecte sua conta do Mercado Livre para buscar pedidos",
            variant: "destructive"
          });
        }
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
          
          {/* NOVAS INFORMAÇÕES DE DEVOLUÇÕES */}
          {o.return_status && (
            <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
              <div className="text-sm font-medium text-orange-700 dark:text-orange-300">
                🔄 Status Devolução: {o.return_status}
              </div>
              {o.return_id && (
                <div className="text-xs text-orange-600 dark:text-orange-400">
                  ID: {o.return_id}
                </div>
              )}
              {o.return_reason && (
                <div className="text-xs text-orange-600 dark:text-orange-400">
                  Motivo: {o.return_reason}
                </div>
              )}
              {o.return_date && (
                <div className="text-xs text-orange-600 dark:text-orange-400">
                  Data: {new Date(o.return_date).toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>
          )}
          
          {/* CLAIMS INFORMATION */}
          {o.claims_count > 0 && (
            <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
              📋 {o.claims_count} reclamação(ões) • {o.detailed_returns_count} devolução(ões) detalhada(s)
            </div>
          )}
          
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