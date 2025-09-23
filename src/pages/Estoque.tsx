import { Routes, Route, Navigate } from "react-router-dom";
import { EstoqueGuard } from '@/core/estoque/guards/EstoqueGuard';
import { EstoqueNav } from "@/features/estoque/components/EstoqueNav";
import ControleEstoquePage from "@/pages/estoque/ControleEstoquePage";
import ComposicoesPage from "@/pages/estoque/ComposicoesPage";

const Estoque = () => {
  return (
    <EstoqueGuard>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>📦</span>
          <span>/</span>
          <span className="text-primary">Gestão de Estoque</span>
        </div>

        <EstoqueNav />
        
        <div className="mt-6">
          <Routes>
            <Route path="/" element={<Navigate to="/estoque/controle" replace />} />
            <Route path="/controle" element={<ControleEstoquePage />} />
            <Route path="/composicoes" element={<ComposicoesPage />} />
            <Route path="*" element={<Navigate to="/estoque/controle" replace />} />
          </Routes>
        </div>
      </div>
    </EstoqueGuard>
  );
};

export default Estoque;