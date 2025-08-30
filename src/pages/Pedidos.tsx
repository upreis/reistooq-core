// 🛡️ PÁGINA PROTEGIDA - Sistema Blindado Ativo
import { PedidosGuard } from '@/core/pedidos/guards/PedidosGuard';
import SimplePedidosPageRefactored from '@/components/pedidos/SimplePedidosPageRefactored';

export default function Pedidos() {
  return (
    <PedidosGuard>
      <SimplePedidosPageRefactored />
    </PedidosGuard>
  );
}
