import { ComposicoesEstoque } from "@/components/estoque/ComposicoesEstoque";
import { EstoqueStats } from "@/components/estoque/EstoqueStats";
import { useProducts } from "@/hooks/useProducts";
import { useState, useEffect } from "react";

export default function ComposicoesPage() {
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
    <div>
      {/* Stats Cards */}
      <EstoqueStats products={products} />
      
      {/* Componente de Composições */}
      <ComposicoesEstoque />
    </div>
  );
}