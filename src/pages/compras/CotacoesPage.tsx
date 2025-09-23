import { useState, useEffect } from "react";
import { CotacoesTab } from "@/components/compras/CotacoesTab";
import { useCompras } from "@/hooks/useCompras";
import { useToast } from "@/hooks/use-toast";

export default function CotacoesPage() {
  const [cotacoes, setCotacoes] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getCotacoes, getFornecedores } = useCompras();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cotacoesData, fornecedoresData] = await Promise.all([
        getCotacoes(),
        getFornecedores()
      ]);
      setCotacoes(cotacoesData);
      setFornecedores(fornecedoresData);
    } catch (error) {
      toast({
        title: "Erro ao carregar cotações",
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
    <CotacoesTab 
      cotacoes={cotacoes}
      onRefresh={loadData}
    />
  );
}