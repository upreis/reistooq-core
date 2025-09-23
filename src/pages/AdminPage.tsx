import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { AdminNav } from "@/features/admin/components/AdminNav";
import { AdminStats } from "@/features/admin/components/AdminStats";
import { AdminVisaoGeral } from "./admin/AdminVisaoGeral";
import AdminUsuarios from "./admin/AdminUsuarios";
import AdminCargos from "./admin/AdminCargos";
import AdminConvites from "./admin/AdminConvites";
import AdminAlertas from "./admin/AdminAlertas";
import AdminSeguranca from "./admin/AdminSeguranca";
import AdminAuditoria from "./admin/AdminAuditoria";

const AdminContent = () => {
  return (
    <div className="space-y-6">
      {/* 1. Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4" />
        <span>/</span>
        <span className="text-primary">Administração</span>
      </div>

      {/* 2. Navigation tabs */}
      <AdminNav />

      {/* 3. Stats cards */}
      <AdminStats />
      
      {/* 4. Conteúdo das rotas */}
      <div className="mt-6">
        <Routes>
          <Route index element={<AdminVisaoGeral />} />
          <Route path="usuarios" element={<AdminUsuarios />} />
          <Route path="cargos" element={<AdminCargos />} />
          <Route path="convites" element={<AdminConvites />} />
          <Route path="alertas" element={<AdminAlertas />} />
          <Route path="seguranca" element={<AdminSeguranca />} />
          <Route path="auditoria" element={<AdminAuditoria />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </div>
  );
};

const AdminPage: React.FC = () => {
  return <AdminContent />;
};

export default AdminPage;