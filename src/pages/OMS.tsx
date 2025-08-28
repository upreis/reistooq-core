import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { OMSDashboard } from "@/features/oms/components/OMSDashboard";
import { OMSOrders } from "@/features/oms/components/OMSOrders";
import { OMSCustomers } from "@/features/oms/components/OMSCustomers";
import { OMSSuppliers } from "@/features/oms/components/OMSSuppliers";
import { OMSReports } from "@/features/oms/components/OMSReports";
import { OMSSettings } from "@/features/oms/components/OMSSettings";

const OMS = () => {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>🏢</span>
        <span>/</span>
        <span className="text-primary">Order Management System</span>
      </div>

      <Routes>
        <Route path="/" element={<OMSDashboard />} />
        <Route path="/pedidos" element={<OMSOrders />} />
        <Route path="/clientes" element={<OMSCustomers />} />
        <Route path="/fornecedores" element={<OMSSuppliers />} />
        <Route path="/relatorios" element={<OMSReports />} />
        <Route path="/configuracoes" element={<OMSSettings />} />
        <Route path="*" element={<Navigate to="/oms" replace />} />
      </Routes>
    </div>
  );
};

export default OMS;