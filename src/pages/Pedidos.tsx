
// src/pages/Pedidos.tsx
import { PedidosTable } from '@/components/pedidos/PedidosTable';

export default function Pedidos() {
  // TODO: Buscar INTEGRATION_ACCOUNT_ID de .env ou contexto
  const INTEGRATION_ACCOUNT_ID = '5740f717-1771-4298-b8c9-464ffb8d8dce';

  if (!INTEGRATION_ACCOUNT_ID) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-semibold mb-4">Pedidos</h1>
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <div className="font-medium text-destructive">
            Defina INTEGRATION_ACCOUNT_ID para carregar pedidos
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Pedidos</h1>
      
      <PedidosTable integrationAccountId={INTEGRATION_ACCOUNT_ID} />
    </div>
  );
}