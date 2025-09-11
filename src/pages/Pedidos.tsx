// 🛡️ PÁGINA PROTEGIDA - Sistema Blindado Ativo
import React from 'react';
import { PedidosGuard } from '@/core/pedidos/guards/PedidosGuard';
import SimplePedidosPage from '@/components/pedidos/SimplePedidosPage';

export default function Pedidos() {
  console.log('🔍 [DEBUG] Página Pedidos renderizando...');
  
  // Limpar cache de colunas para garantir que as novas apareçam
  React.useEffect(() => {
    const { resetColumnCache } = require('@/features/pedidos/hooks/useColumnManager');
    resetColumnCache();
    console.log('🔄 Cache de colunas limpo para incluir novas colunas de devolução');
  }, []);
  
  return (
    <div style={{ minHeight: '100vh', padding: '20px', backgroundColor: '#f0f0f0' }}>
      <h1 style={{ color: 'black', fontSize: '24px', marginBottom: '20px' }}>
        🔍 DEBUG: Página Pedidos Carregada - Novas Colunas Adicionadas!
      </h1>
      <div style={{ backgroundColor: 'white', padding: '20px', border: '1px solid #ccc' }}>
        <p style={{ color: 'black' }}>✅ Novas colunas de devolução ML foram adicionadas ao sistema.</p>
        <p style={{ color: 'black' }}>📋 Acesse o menu de colunas para ativar as novas colunas de devolução.</p>
        <PedidosGuard>
          <SimplePedidosPage />
        </PedidosGuard>
      </div>
    </div>
  );
}
