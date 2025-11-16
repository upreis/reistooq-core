// 🎯 Página de configurações unificada - arquitetura otimizada
// Substitui a versão monolítica antiga com melhorias de performance e UX

import { Settings } from "lucide-react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ConfiguracoesNav } from "@/features/configuracoes/components/ConfiguracoesNav";
import ConfiguracoesIntegracoes from "./ConfiguracoesIntegracoes";
import AnunciosPage from "./AnunciosPage";

const ConfiguracoesContent = () => {
  return (
    <div className="space-y-6">
      {/* Navegação */}
      <ConfiguracoesNav />
      
      {/* Conteúdo das rotas */}
      <div className="mt-6">
        <Routes>
          <Route index element={<Navigate to="integracoes" replace />} />
          <Route path="integracoes" element={<ConfiguracoesIntegracoes />} />
          <Route path="anuncios" element={<AnunciosPage />} />
          <Route path="*" element={<Navigate to="integracoes" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default function IntegracoesPage() {
  return <ConfiguracoesContent />;
}