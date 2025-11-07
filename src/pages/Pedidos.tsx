// 🛡️ PÁGINA PROTEGIDA - Sistema Blindado Ativo
import { PedidosGuard } from '@/core/pedidos/guards/PedidosGuard';
import OMS from './OMS';

export default function Pedidos() {
  return (
    <PedidosGuard>
      <OMS />
    </PedidosGuard>
  );
}
