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
  return (
    <div className="space-y-6">
      <OMSNav />
      <Routes>
        <Route index element={<Navigate to="/oms/pedidos" replace />} />
        <Route path="pedidos" element={<OrdersPage />} />
        <Route path="clientes" element={<CustomersPage />} />
        <Route path="vendedores" element={<SalesRepsPage />} />
        <Route path="configuracoes" element={<OMSSettingsPage />} />
      </Routes>
    </div>
  );
};

export default OMS;