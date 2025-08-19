
// src/pages/Pedidos.tsx
import MeliOrders from '@/components/MeliOrders';

export default function Pedidos() {
  // use o UUID da conta MeLi que tem pedidos
  const INTEGRATION_ACCOUNT_ID = '5740f717-1771-4298-b8c9-464ffb8d8dce';

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Pedidos</h1>
        <p className="text-muted-foreground mt-1">
          Visualize e gerencie todos os seus pedidos do Mercado Livre
        </p>
      </div>

      <MeliOrders 
        integrationAccountId={INTEGRATION_ACCOUNT_ID} 
        status="paid" 
        limit={100} 
      />
    </div>
  );
}