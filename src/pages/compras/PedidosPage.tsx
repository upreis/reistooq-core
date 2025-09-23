import { useState, useEffect } from "react";
import { PedidosCompraTab } from "@/components/compras/PedidosCompraTab";
import { useCompras } from "@/hooks/useCompras";
import { useToast } from "@/hooks/use-toast";

export default function PedidosPage() {
  const [pedidosCompra, setPedidosCompra] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getPedidosCompra, getFornecedores } = useCompras();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pedidosData, fornecedoresData] = await Promise.all([
        getPedidosCompra(),
        getFornecedores()
      ]);
      setPedidosCompra(pedidosData);
      setFornecedores(fornecedoresData);
    } catch (error) {
      toast({
        title: "Erro ao carregar pedidos",
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
    <PedidosCompraTab 
      pedidosCompra={pedidosCompra}
      fornecedores={fornecedores}
      searchTerm=""
      selectedStatus="all"
      selectedFornecedor="all"
      dateRange={{ start: "", end: "" }}
      onRefresh={loadData}
    />
  );
}