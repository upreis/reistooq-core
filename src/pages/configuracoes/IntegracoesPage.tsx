// 🎯 Página de configurações unificada - arquitetura otimizada
// Substitui a versão monolítica antiga com melhorias de performance e UX

import { Routes, Route, Navigate } from "react-router-dom";
import ConfiguracoesIntegracoes from "./ConfiguracoesIntegracoes";
import AnunciosPage from "./AnunciosPage";
import Alertas from "@/pages/Alertas";

const ConfiguracoesContent = () => {
  return (
    <div className="space-y-6">
      {/* Conteúdo das rotas */}
      <div>
        <Routes>
          <Route index element={<Navigate to="integracoes" replace />} />
          <Route path="integracoes" element={<ConfiguracoesIntegracoes />} />
          <Route path="anuncios" element={<AnunciosPage />} />
          <Route path="alertas" element={<Alertas />} />
          <Route path="*" element={<Navigate to="integracoes" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default function IntegracoesPage() {
  return <ConfiguracoesContent />;
}