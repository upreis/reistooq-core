// 🛡️ PÁGINA PROTEGIDA - Sistema Blindado Ativo
import { PedidosGuard } from '@/core/pedidos/guards/PedidosGuard';
import SimplePedidosPage from '@/components/pedidos/SimplePedidosPage';
import { OMSNav } from "@/features/oms/components/OMSNav";
import { MLOrdersNav } from "@/features/ml/components/MLOrdersNav";

export default function Pedidos() {
  return (
    <PedidosGuard>
      <div className="space-y-6">
        {/* Navegação principal */}
        <OMSNav />

        {/* Sub-navegação */}
        <MLOrdersNav />

        <div className="mt-6">
          <SimplePedidosPage />
        </div>
      </div>
    </PedidosGuard>
  );
}
