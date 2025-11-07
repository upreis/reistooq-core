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
import AdminPerfil from "./admin/AdminPerfil";

const AdminContent = () => {
  return (
    <div className="space-y-6">
      {/* Stats cards */}
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
          <Route path="perfil" element={<AdminPerfil />} />
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