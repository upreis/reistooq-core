// 🎯 Página de configurações - redireciona para admin
// Mantida apenas para compatibilidade com links antigos

import { Navigate } from "react-router-dom";

export default function IntegracoesPage() {
  // Redireciona todas as rotas de configuracoes para admin
  return <Navigate to="/admin/alertas" replace />;
}