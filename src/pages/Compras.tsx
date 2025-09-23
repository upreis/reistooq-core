import { Routes, Route, Navigate } from "react-router-dom";
import { ComprasGuard } from '@/core/compras/guards/ComprasGuard';
import { ComprasNav } from "@/features/compras/components/ComprasNav";
import FornecedoresPage from "@/pages/compras/FornecedoresPage";
import PedidosPage from "@/pages/compras/PedidosPage";
import CotacoesPage from "@/pages/compras/CotacoesPage";
import ImportacaoPage from "@/pages/compras/ImportacaoPage";

const ComprasContent = () => {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>🛒</span>
        <span>/</span>
        <span className="text-primary">Compras</span>
      </div>

      <ComprasNav />
      
      <div className="mt-6">
        <Routes>
          <Route path="/" element={<Navigate to="/compras/fornecedores" replace />} />
          <Route path="/fornecedores" element={<FornecedoresPage />} />
          <Route path="/pedidos" element={<PedidosPage />} />
          <Route path="/cotacoes" element={<CotacoesPage />} />
          <Route path="/importacao" element={<ImportacaoPage />} />
          <Route path="*" element={<Navigate to="/compras/fornecedores" replace />} />
        </Routes>
      </div>
    </div>
  );
};

const Compras = () => {
  return (
    <ComprasGuard>
      <ComprasContent />
    </ComprasGuard>
  );
};

export default Compras;