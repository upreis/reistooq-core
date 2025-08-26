// 🛡️ PÁGINA PROTEGIDA - Sistema Blindado Ativo
import { PedidosGuard } from '@/core/pedidos/guards/PedidosGuard';
import PedidosPageWithFilters from '@/components/pedidos/PedidosPageWithFilters';

export default function Pedidos() {
  return (
    <PedidosGuard>
      <PedidosPageWithFilters />
    </PedidosGuard>
  );
}
