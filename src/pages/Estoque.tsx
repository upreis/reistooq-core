import { Package } from "lucide-react";
import { EstoqueGuard } from '@/core/estoque/guards/EstoqueGuard';
import { EstoqueNav } from "@/features/estoque/components/EstoqueNav";
import { Routes, Route } from "react-router-dom";
import ControleEstoquePage from "./estoque/ControleEstoquePage";
import ComposicoesPage from "./estoque/ComposicoesPage";
import InsumosPage from "./estoque/InsumosPage";
import HistoricoMovimentacoesPage from "./estoque/HistoricoMovimentacoesPage";
import { MobileAppShell } from "@/components/mobile/standard/MobileAppShell";

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
        <EstoqueNav />
        
        <div className="mt-6">
          <Routes>
            <Route index element={<ControleEstoquePage />} />
            <Route path="composicoes" element={<ComposicoesPage />} />
            <Route path="insumos" element={<InsumosPage />} />
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