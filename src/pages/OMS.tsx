import { Routes, Route, Navigate } from "react-router-dom";
import { OMSNav } from "@/features/oms/components/OMSNav";
import OrdersPage from "@/pages/oms/OrdersPage";
import CustomersPage from "@/pages/oms/CustomersPage";
import SalesRepsPage from "@/pages/oms/SalesRepsPage";
import OMSSettingsPage from "@/pages/oms/OMSSettingsPage";

const OMS = () => {
  return (
    <div className="space-y-6">
      <OMSNav />
      <Routes>
        <Route index element={<Navigate to="pedidos" replace />} />
        <Route path="pedidos" element={<OrdersPage />} />
        <Route path="clientes" element={<CustomersPage />} />
        <Route path="vendedores" element={<SalesRepsPage />} />
        <Route path="configuracoes" element={<OMSSettingsPage />} />
      </Routes>
    </div>
  );
};

export default OMS;