import { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { OMSNav } from "@/features/oms/components/OMSNav";
import { MLOrdersNav } from "@/features/ml/components/MLOrdersNav";
import OrdersPage from "@/pages/oms/OrdersPage";
import CustomersPage from "@/pages/oms/CustomersPage";
import SalesRepsPage from "@/pages/oms/SalesRepsPage";
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
        <Route path="/" element={<Navigate to="/oms/pedidos" replace />} />
        <Route path="/pedidos" element={<OrdersPage />} />
        <Route path="/clientes" element={<CustomersPage />} />
        <Route path="/vendedores" element={<SalesRepsPage />} />
        <Route path="/configuracoes" element={<OMSSettingsPage />} />
        <Route path="*" element={<Navigate to="/oms/pedidos" replace />} />
      </Routes>
    );
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb principal */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>📦</span>
        <span>/</span>
        <span className="text-primary">Vendas</span>
      </div>

      {/* Navegação principal */}
      <OMSNav />

      {/* Sub-navegação apenas para rotas de pedidos marketplace */}
      {isPedidosMarketplace && <MLOrdersNav />}
      
      <div className="mt-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default OMS;