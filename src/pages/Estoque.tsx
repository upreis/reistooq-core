import { Package } from "lucide-react";
import { EstoqueGuard } from '@/core/estoque/guards/EstoqueGuard';
import { EstoqueNav } from "@/features/estoque/components/EstoqueNav";
import { Routes, Route } from "react-router-dom";
import ControleEstoquePage from "./estoque/ControleEstoquePage";
import ComposicoesUnificadasPage from "./estoque/ComposicoesUnificadasPage";
import HistoricoMovimentacoesPage from "./estoque/HistoricoMovimentacoesPage";
import { MobileAppShell } from "@/components/mobile/standard/MobileAppShell";

const EstoqueContent = () => {
  const breadcrumb = (
    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
      <Package className="h-4 w-4" />
      <span>/</span>
      <span className="text-primary">Estoque Principal</span>
    </div>
  );

  return (
    <MobileAppShell 
      title="Estoque Principal" 
      breadcrumb={breadcrumb}
    >
      <Routes>
        <Route index element={<ControleEstoquePage />} />
        <Route path="composicoes" element={<ComposicoesUnificadasPage />} />
        <Route path="insumos" element={<ComposicoesUnificadasPage />} />
        <Route path="historico" element={<HistoricoMovimentacoesPage />} />
      </Routes>
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