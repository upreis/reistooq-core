// 🛡️ PÁGINA PROTEGIDA - Sistema Blindado Ativo
import { PedidosGuard } from '@/core/pedidos/guards/PedidosGuard';
import SimplePedidosPage from '@/components/pedidos/SimplePedidosPage';

export default function Pedidos() {
  return (
    <PedidosGuard>
      <SimplePedidosPage />
    </PedidosGuard>
  );
}
