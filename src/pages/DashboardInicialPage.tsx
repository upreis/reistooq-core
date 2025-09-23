import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import { DashboardInicialNav } from "@/features/dashboard/components/DashboardInicialNav";
import { DashboardInicialStats } from "@/features/dashboard/components/DashboardInicialStats";
import DashboardVisaoGeral from "./dashboard/DashboardVisaoGeral";
import DashboardVendas from "./dashboard/DashboardVendas";
import DashboardEstoque from "./dashboard/DashboardEstoque";
import DashboardAnalises from "./dashboard/DashboardAnalises";

const DashboardInicialContent = () => {
  return (
    <div className="space-y-6">
      {/* 1. Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <BarChart3 className="h-4 w-4" />
        <span>/</span>
        <span className="text-primary">Dashboard</span>
      </div>

      {/* 2. Navigation tabs */}
      <DashboardInicialNav />

      {/* 3. Stats cards */}
      <DashboardInicialStats />
      
      {/* 4. Conteúdo das rotas */}
      <div className="mt-6">
        <Routes>
          <Route index element={<Navigate to="visao-geral" replace />} />
          <Route path="visao-geral" element={<DashboardVisaoGeral />} />
          <Route path="vendas" element={<DashboardVendas />} />
          <Route path="estoque" element={<DashboardEstoque />} />
          <Route path="analises" element={<DashboardAnalises />} />
          <Route path="*" element={<Navigate to="visao-geral" replace />} />
        </Routes>
      </div>
    </div>
  );
};

const DashboardInicialPage: React.FC = () => {
  return <DashboardInicialContent />;
};

export default DashboardInicialPage;