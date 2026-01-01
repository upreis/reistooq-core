import { Package } from "lucide-react";
import { EstoqueGuard } from '@/core/estoque/guards/EstoqueGuard';
import { Routes, Route, useLocation } from "react-router-dom";
import ControleEstoquePage from "./estoque/ControleEstoquePage";
import ComposicoesUnificadasPage from "./estoque/ComposicoesUnificadasPage";
import HistoricoMovimentacoesPage from "./estoque/HistoricoMovimentacoesPage";
import DePara from "./DePara";
import { MobileAppShell } from "@/components/mobile/standard/MobileAppShell";
import { useIsMobile } from "@/hooks/use-mobile";

const EstoqueContent = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // De-Para tem seu próprio MobileAppShell, não envolver novamente
  const isDeParaRoute = location.pathname.includes('/de-para');
  
  const breadcrumb = (
    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
      <Package className="h-4 w-4" />
      <span>/</span>
      <span className="text-primary">Estoque</span>
    </div>
  );

  const routes = (
    <Routes>
      <Route index element={<ControleEstoquePage />} />
      <Route path="de-para" element={<DePara />} />
      <Route path="composicoes" element={<ComposicoesUnificadasPage />} />
      <Route path="insumos" element={<ComposicoesUnificadasPage />} />
      <Route path="historico" element={<HistoricoMovimentacoesPage />} />
    </Routes>
  );

  // No mobile, se estiver na rota de-para, não envolver com MobileAppShell
  if (isMobile && isDeParaRoute) {
    return routes;
  }

  return (
    <MobileAppShell 
      title="Estoque" 
      breadcrumb={breadcrumb}
    >
      {routes}
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