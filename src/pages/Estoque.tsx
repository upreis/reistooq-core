import { Package } from "lucide-react";
import { EstoqueGuard } from '@/core/estoque/guards/EstoqueGuard';
import { EstoqueStats } from "@/components/estoque/EstoqueStats";
import { EstoqueNav } from "@/features/estoque/components/EstoqueNav";
import { useProducts } from "@/hooks/useProducts";
import { Routes, Route } from "react-router-dom";
import ControleEstoquePage from "./estoque/ControleEstoquePage";
import ComposicoesPage from "./estoque/ComposicoesPage";
import { useState, useEffect } from "react";

const EstoqueContent = () => {
  const { getProducts } = useProducts();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await getProducts({ limit: 1000 });
        setProducts(data);
      } catch (error) {
        console.error("Error loading products:", error);
      }
    };
    loadProducts();
  }, [getProducts]);

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
          <Route index element={<ControleEstoquePage />} />
          <Route path="composicoes" element={<ComposicoesPage />} />
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