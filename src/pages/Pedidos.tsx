import React from 'react';
import { PedidosGuard } from '@/core/pedidos/guards/PedidosGuard';
import SimplePedidosPage from '@/components/pedidos/SimplePedidosPage';
import { resetColumnCache } from '@/features/pedidos/hooks/useColumnManager';

export default function Pedidos() {
  // Limpar cache de colunas para garantir que as novas apareçam
  React.useEffect(() => {
    resetColumnCache();
  }, []);
  
  return (
    <PedidosGuard>
      <SimplePedidosPage />
    </PedidosGuard>
  );
}
