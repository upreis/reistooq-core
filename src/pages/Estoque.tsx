import { Package } from "lucide-react";
import { EstoqueGuard } from '@/core/estoque/guards/EstoqueGuard';
import { EstoqueStats } from "@/components/estoque/EstoqueStats";
import { EstoqueNav } from "@/features/estoque/components/EstoqueNav";
import { useProducts } from "@/hooks/useProducts";
import { Routes, Route } from "react-router-dom";
import ControleEstoquePage from "./estoque/ControleEstoquePage";
import ComposicoesPage from "./estoque/ComposicoesPage";
import { useState, useEffect } from "react";
import { MobileAppShell } from "@/components/mobile/standard/MobileAppShell";

const EstoqueContent = () => {
  const { getProducts } = useProducts();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        console.log('🔄 Estoque: Carregando produtos do componente pai...');
        const data = await getProducts({ limit: 1000 });
        console.log('✅ Estoque: Produtos carregados:', data.length);
        setProducts(data);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [getProducts]);

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

        {/* Cards de Resumo */}
        <EstoqueStats products={products} />
        
        <div className="mt-6">
          <Routes>
            <Route index element={<ControleEstoquePage initialProducts={products} initialLoading={loading} />} />
            <Route path="composicoes" element={<ComposicoesPage />} />
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