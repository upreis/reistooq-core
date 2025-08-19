
// src/pages/Pedidos.tsx
import MeliOrders from '@/components/MeliOrders';

export default function Pedidos() {
  // use o UUID da conta MeLi que tem pedidos
  const INTEGRATION_ACCOUNT_ID = '5740f717-1771-4298-b8c9-464ffb8d8dce';

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Pedidos</h1>

      <div className="mb-6">
        <MeliOrders integrationAccountId={INTEGRATION_ACCOUNT_ID} status="paid" limit={10} />
      </div>
    </div>
  );
}