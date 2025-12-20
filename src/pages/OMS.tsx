import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import OrdersPage from "@/pages/oms/OrdersPage";
import CadastroPage from "@/pages/oms/CadastroPage";
import OMSSettingsPage from "@/pages/oms/OMSSettingsPage";
import SimplePedidosPage from "@/components/pedidos/SimplePedidosPage";

const OMS = () => {
  const location = useLocation();
  
  // Verificar se está na rota de pedidos marketplace
  const isPedidosMarketplace = location.pathname === "/pedidos";
  
  // Determina qual conteúdo mostrar baseado na rota atual
  const renderContent = () => {
    if (isPedidosMarketplace) {
      return <SimplePedidosPage />;
    }
    
    return (
      <Routes>
        <Route index element={<Navigate to="pedidos" replace />} />
        <Route path="pedidos" element={<OrdersPage />} />
        <Route path="cadastro" element={<CadastroPage />} />
        {/* Redirect old routes to new unified page */}
        <Route path="clientes" element={<Navigate to="/oms/cadastro?tab=clientes" replace />} />
        <Route path="vendedores" element={<Navigate to="/oms/cadastro?tab=vendedores" replace />} />
        <Route path="configuracoes" element={<OMSSettingsPage />} />
        <Route path="*" element={<Navigate to="pedidos" replace />} />
      </Routes>
    );
  };

  return (
    <div className="space-y-6">
      {/* Renderizar conteúdo baseado na rota */}
      {renderContent()}
    </div>
  );
};

export default OMS;