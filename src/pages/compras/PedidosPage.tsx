import { useState, useEffect } from "react";
import { PedidosCompraTab } from "@/components/compras/PedidosCompraTab";
import { ComprasHeader } from "@/components/compras/ComprasHeader";
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
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calcular estatísticas para o header
  const stats = {
    pedidos_pendentes: pedidosCompra.filter(p => p.status === 'pendente').length,
    fornecedores_ativos: fornecedores.filter(f => f.ativo).length,
    valor_total_mes: pedidosCompra.reduce((total, p) => total + (p.valor_total || 0), 0)
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header com navegação por abas */}
      <ComprasHeader stats={stats} />

      {/* Conteúdo da aba de Pedidos */}
      <PedidosCompraTab 
        pedidosCompra={pedidosCompra}
        fornecedores={fornecedores}
        searchTerm=""
        selectedStatus="all"
        selectedFornecedor="all"
        dateRange={{ start: "", end: "" }}
        onRefresh={loadData}
      />
    </div>
  );
}