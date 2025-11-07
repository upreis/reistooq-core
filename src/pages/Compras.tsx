import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { ComprasGuard } from '@/core/compras/guards/ComprasGuard';
import { ComprasNav } from "@/features/compras/components/ComprasNav";

import { useCompras } from "@/hooks/useCompras";
import { useToast } from "@/hooks/use-toast";
import FornecedoresPage from "@/pages/compras/FornecedoresPage";
import PedidosPage from "@/pages/compras/PedidosPage";
import CotacoesPage from "@/pages/compras/CotacoesPage";
import ImportacaoPage from "@/pages/compras/ImportacaoPage";

const ComprasContent = () => {
  const [fornecedores, setFornecedores] = useState([]);
  const [pedidosCompra, setPedidosCompra] = useState([]);
  const [cotacoes, setCotacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { getFornecedores, getPedidosCompra, getCotacoes } = useCompras();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fornecedoresData, pedidosData, cotacoesData] = await Promise.all([
        getFornecedores(),
        getPedidosCompra(),
        getCotacoes()
      ]);
      
      setFornecedores(fornecedoresData);
      setPedidosCompra(pedidosData);
      setCotacoes(cotacoesData);
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados de compras.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mt-6">
        <Routes>
          <Route path="/" element={<Navigate to="/compras/pedidos" replace />} />
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