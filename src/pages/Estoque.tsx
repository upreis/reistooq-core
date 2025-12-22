import { Package } from "lucide-react";
import { EstoqueGuard } from '@/core/estoque/guards/EstoqueGuard';
import { EstoqueNav } from "@/features/estoque/components/EstoqueNav";
import { Routes, Route } from "react-router-dom";
import ControleEstoquePage from "./estoque/ControleEstoquePage";
import ComposicoesUnificadasPage from "./estoque/ComposicoesUnificadasPage";
import HistoricoMovimentacoesPage from "./estoque/HistoricoMovimentacoesPage";
import DePara from "./DePara";
import { MobileAppShell } from "@/components/mobile/standard/MobileAppShell";
import { EstoqueLocationTabs } from "@/components/estoque/EstoqueLocationTabs";

const EstoqueContent = () => {
  const breadcrumb = (
    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
      <Package className="h-4 w-4" />
      <span>/</span>
      <span className="text-primary">Estoque</span>
    </div>
  );

  return (
    <MobileAppShell 
      title="Estoque" 
      breadcrumb={breadcrumb}
    >
      <div className="space-y-4">
        {/* Navegação de abas acima */}
        <EstoqueNav />
        
        {/* Seletor de locais com layout separado */}
        <EstoqueLocationTabs />
        
        {/* Conteúdo das páginas */}
        <Routes>
          <Route index element={<ControleEstoquePage />} />
          <Route path="de-para" element={<DePara />} />
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