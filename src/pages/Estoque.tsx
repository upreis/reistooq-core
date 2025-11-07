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
    >
      <div className="space-y-6">
        {/* Navegação de tabs agora no topo */}
        <EstoqueNav />
        
        <div className="mt-6">
          <Routes>
            <Route index element={<ControleEstoquePage />} />
            <Route path="composicoes" element={<ComposicoesUnificadasPage />} />
            <Route path="insumos" element={<ComposicoesUnificadasPage />} />
            <Route path="historico" element={<HistoricoMovimentacoesPage />} />
          </Routes>
        </div>
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