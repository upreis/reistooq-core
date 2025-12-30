// 🎯 Página de configurações unificada - arquitetura otimizada
// Substitui a versão monolítica antiga com melhorias de performance e UX

import { Routes, Route, Navigate } from "react-router-dom";
import AnunciosPage from "./AnunciosPage";

const ConfiguracoesContent = () => {
  return (
    <div className="space-y-6">
      {/* Conteúdo das rotas */}
      <div>
        <Routes>
          {/* Redirect integrações para admin */}
          <Route index element={<Navigate to="/admin/integracoes" replace />} />
          <Route path="integracoes" element={<Navigate to="/admin/integracoes" replace />} />
          <Route path="anuncios" element={<AnunciosPage />} />
          <Route path="*" element={<Navigate to="anuncios" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default function IntegracoesPage() {
  return <ConfiguracoesContent />;
}