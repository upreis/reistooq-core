import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { OMSNav } from "@/features/oms/components/OMSNav";
import OrdersPage from "@/pages/oms/OrdersPage";
import CustomersPage from "@/pages/oms/CustomersPage";
import OMSSettingsPage from "@/pages/oms/OMSSettingsPage";

const OMS = () => {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>🏢</span>
        <span>/</span>
        <span className="text-primary">Vendas</span>
      </div>

      <OMSNav />
      
      <div className="mt-6">
        <Routes>
          <Route path="/" element={<Navigate to="/oms/pedidos" replace />} />
          <Route path="/pedidos" element={<OrdersPage />} />
          <Route path="/clientes" element={<CustomersPage />} />
          <Route path="/configuracoes" element={<OMSSettingsPage />} />
          <Route path="*" element={<Navigate to="/oms/pedidos" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default OMS;