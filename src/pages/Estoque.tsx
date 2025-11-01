import { Package } from "lucide-react";
import { EstoqueGuard } from '@/core/estoque/guards/EstoqueGuard';
import { EstoqueNav } from "@/features/estoque/components/EstoqueNav";
import { Routes, Route } from "react-router-dom";
import ControleEstoquePage from "./estoque/ControleEstoquePage";
import ComposicoesUnificadasPage from "./estoque/ComposicoesUnificadasPage";
import HistoricoMovimentacoesPage from "./estoque/HistoricoMovimentacoesPage";
import { MobileAppShell } from "@/components/mobile/standard/MobileAppShell";
import { LocalEstoqueSelector } from "@/components/estoque/LocalEstoqueSelector";
import { GerenciarLocaisModal } from "@/components/estoque/GerenciarLocaisModal";

const EstoqueContent = () => {
  const breadcrumb = (
    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
      <Package className="h-4 w-4" />
      <span>/</span>
      <span className="text-primary">Gestão de Estoque</span>
    </div>
  );

  return (
    <MobileAppShell 
      title="Gestão de Estoque" 
      breadcrumb={breadcrumb}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 pb-4 border-b">
          <LocalEstoqueSelector />
          <GerenciarLocaisModal />
        </div>

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