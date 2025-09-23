// 🎯 Página de configurações unificada - arquitetura otimizada
// Substitui a versão monolítica antiga com melhorias de performance e UX

import { Routes, Route, Navigate } from "react-router-dom";
import { ConfiguracoesNav } from "@/features/configuracoes/components/ConfiguracoesNav";
import ConfiguracoesIntegracoes from "./ConfiguracoesIntegracoes";
import AnunciosPage from "./AnunciosPage";
import AdministracaoPage from "./AdministracaoPage";

const ConfiguracoesContent = () => {
  return (
    <div className="space-y-6">
      {/* 1. Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>📦</span>
        <span>/</span>
        <span className="text-primary">Configurações</span>
      </div>

      {/* 2. Navigation tabs */}
      <ConfiguracoesNav />
      
      {/* 3. Conteúdo das rotas */}
      <div className="mt-6">
        <Routes>
          <Route path="/" element={<Navigate to="/configuracoes/integracoes" replace />} />
          <Route path="/integracoes" element={<ConfiguracoesIntegracoes />} />
          <Route path="/anuncios" element={<AnunciosPage />} />
          <Route path="/administracao" element={<AdministracaoPage />} />
          <Route path="*" element={<Navigate to="/configuracoes/integracoes" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default function IntegracoesPage() {
  return <ConfiguracoesContent />;
}