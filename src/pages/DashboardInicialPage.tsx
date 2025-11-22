import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardVisaoGeral from "./dashboard/DashboardVisaoGeral";
import DashboardVendas from "./dashboard/DashboardVendas";
import DashboardEstoque from "./dashboard/DashboardEstoque";
import DashboardAnalises from "./dashboard/DashboardAnalises";

const DashboardInicialContent = () => {
  return (
    <div className="space-y-6">
      {/* Conteúdo das rotas */}
      <Routes>
        <Route index element={<DashboardVisaoGeral />} />
        <Route path="vendas" element={<DashboardVendas />} />
        <Route path="estoque" element={<DashboardEstoque />} />
        <Route path="analises" element={<DashboardAnalises />} />
        <Route path="*" element={<Navigate to="/dashboardinicial" replace />} />
      </Routes>
    </div>
  );
};

const DashboardInicialPage: React.FC = () => {
  return <DashboardInicialContent />;
};

export default DashboardInicialPage;