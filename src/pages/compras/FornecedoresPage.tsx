import { useState, useEffect } from "react";
import { FornecedoresTab } from "@/components/compras/FornecedoresTab";
import { useCompras } from "@/hooks/useCompras";
import { useToast } from "@/hooks/use-toast";

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getFornecedores } = useCompras();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getFornecedores();
      setFornecedores(data);
    } catch (error) {
      toast({
        title: "Erro ao carregar fornecedores",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <FornecedoresTab 
      fornecedores={fornecedores}
      searchTerm=""
      selectedStatus="all"
      onRefresh={loadData}
    />
  );
}