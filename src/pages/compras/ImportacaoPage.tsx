import { useState, useEffect } from "react";
import { ImportacaoTab } from "@/components/compras/ImportacaoTab";
import { useCompras } from "@/hooks/useCompras";

export default function ImportacaoPage() {
  const [fornecedores, setFornecedores] = useState([]);
  const { getFornecedores } = useCompras();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getFornecedores();
      setFornecedores(data);
    } catch (error) {
      console.error("Erro ao carregar fornecedores:", error);
    }
  };

  return (
    <ImportacaoTab 
      onImportSuccess={loadData}
      fornecedores={fornecedores}
    />
  );
}