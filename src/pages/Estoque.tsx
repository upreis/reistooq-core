import { Package } from "lucide-react";
import { EstoqueGuard } from '@/core/estoque/guards/EstoqueGuard';
import { EstoqueStats } from "@/components/estoque/EstoqueStats";
import { EstoqueNav } from "@/features/estoque/components/EstoqueNav";
import { useProducts } from "@/hooks/useProducts";
import { Routes, Route } from "react-router-dom";
import ControleEstoquePage from "./estoque/ControleEstoquePage";
import ComposicoesPage from "./estoque/ComposicoesPage";
import { useState, useEffect } from "react";

const Estoque = () => {
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
    <EstoqueGuard>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
        {/* Header moderno com melhor espaçamento - oculto no mobile */}
        <div className="hidden md:block relative overflow-hidden bg-gradient-to-r from-primary/3 via-primary/5 to-primary/3 border-b border-border/30">
          <div className="absolute inset-0 bg-grid-pattern opacity-3"></div>
          <div className="relative container mx-auto px-6 py-12">
            {/* Breadcrumb melhorado */}
            <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
              <Package className="h-4 w-4" />
              <span>/</span>
              <span className="text-foreground font-medium">Gestão de Estoque</span>
            </nav>

            {/* Navigation tabs */}
            <EstoqueNav />
          </div>
        </div>

        {/* Conteúdo das rotas */}
        <Routes>
          <Route index element={<ControleEstoquePage />} />
          <Route path="composicoes" element={<ComposicoesPage />} />
        </Routes>
      </div>
    </EstoqueGuard>
  );
};

export default Estoque;