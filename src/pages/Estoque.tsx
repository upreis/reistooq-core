import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { EstoqueGuard } from '@/core/estoque/guards/EstoqueGuard';
import { EstoqueNav } from "@/features/estoque/components/EstoqueNav";
import { EstoqueStats } from "@/components/estoque/EstoqueStats";
import { useProducts } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { Package } from "lucide-react";
import ControleEstoquePage from "@/pages/estoque/ControleEstoquePage";
import ComposicoesPage from "@/pages/estoque/ComposicoesPage";

const EstoqueContent = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { getProducts } = useProducts();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const productsData = await getProducts({});
      setProducts(productsData);
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados de estoque.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Package className="h-4 w-4" />
        <span>/</span>
        <span className="text-primary">Gestão de Estoque</span>
      </div>

      <EstoqueNav />

      {/* Cards de Resumo */}
      <EstoqueStats products={products} />
      
      <div className="mt-6">
        <Routes>
          <Route path="/" element={<ControleEstoquePage />} />
          <Route path="/composicoes" element={<ComposicoesPage />} />
          <Route path="*" element={<Navigate to="/estoque" replace />} />
        </Routes>
      </div>
    </div>
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