import { Package } from "lucide-react";
import { EstoqueGuard } from '@/core/estoque/guards/EstoqueGuard';
import { EstoqueNav } from "@/features/estoque/components/EstoqueNav";
import { Routes, Route } from "react-router-dom";
import ControleEstoquePage from "./estoque/ControleEstoquePage";
import ComposicoesUnificadasPage from "./estoque/ComposicoesUnificadasPage";
import HistoricoMovimentacoesPage from "./estoque/HistoricoMovimentacoesPage";
import { MobileAppShell } from "@/components/mobile/standard/MobileAppShell";

const EstoqueContent = () => {
  return (
    <MobileAppShell 
      title="Gestão de Estoque"
      headerActions={
        <div className="absolute left-1/2 -translate-x-1/2">
          <EstoqueNav />
        </div>
      }
    >
      <div className="space-y-6">
        <Routes>
          <Route index element={<ControleEstoquePage />} />
          <Route path="composicoes" element={<ComposicoesUnificadasPage />} />
          <Route path="insumos" element={<ComposicoesUnificadasPage />} />
          <Route path="historico" element={<HistoricoMovimentacoesPage />} />
        </Routes>
      </div>
    </MobileAppShell>
  );
};

const Estoque = () => {
  return (
    <EstoqueGuard>
      <EstoqueContent />
    </EstoqueGuard>
  );
};

export default Estoque;