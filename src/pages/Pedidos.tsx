// 🛡️ PÁGINA PROTEGIDA - Sistema Blindado Ativo
import { PedidosGuard } from '@/core/pedidos/guards/PedidosGuard';
import SimplePedidosPage from '@/components/pedidos/SimplePedidosPage';

export default function Pedidos() {
  console.log('🔍 [DEBUG] Página Pedidos renderizando...');
  
  return (
    <div style={{ minHeight: '100vh', padding: '20px', backgroundColor: '#f0f0f0' }}>
      <h1 style={{ color: 'black', fontSize: '24px', marginBottom: '20px' }}>
        🔍 DEBUG: Página Pedidos Carregada
      </h1>
      <div style={{ backgroundColor: 'white', padding: '20px', border: '1px solid #ccc' }}>
        <p style={{ color: 'black' }}>Se você está vendo esta mensagem, o componente está renderizando.</p>
        <PedidosGuard>
          <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e0e0e0' }}>
            <p style={{ color: 'black' }}>Guard passou - renderizando SimplePedidosPage...</p>
            <SimplePedidosPage />
          </div>
        </PedidosGuard>
      </div>
    </div>
  );
}
