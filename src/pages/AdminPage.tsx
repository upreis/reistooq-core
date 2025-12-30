import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminVisaoGeral } from "./admin/AdminVisaoGeral";
import AdminUsuarios from "./admin/AdminUsuarios";
import AdminConvites from "./admin/AdminConvites";
import AdminAlertas from "./admin/AdminAlertas";
import AdminSeguranca from "./admin/AdminSeguranca";
import AdminPerfil from "./admin/AdminPerfil";
import ConfiguracoesIntegracoes from "./configuracoes/ConfiguracoesIntegracoes";

const AdminContent = () => {
  return (
    <div className="space-y-6">
      <Routes>
        <Route index element={<AdminVisaoGeral />} />
        <Route path="usuarios" element={<AdminUsuarios />} />
        <Route path="cargos" element={<Navigate to="/admin/usuarios" replace />} />
        <Route path="convites" element={<AdminConvites />} />
        <Route path="alertas" element={<AdminAlertas />} />
        <Route path="seguranca" element={<AdminSeguranca />} />
        <Route path="integracoes" element={<ConfiguracoesIntegracoes />} />
        <Route path="perfil" element={<AdminPerfil />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </div>
  );
};

const AdminPage: React.FC = () => {
  return <AdminContent />;
};

export default AdminPage;