// 🛡️ PÁGINA PROTEGIDA - Sistema Blindado Ativo
import { PedidosGuard } from '@/core/pedidos/guards/PedidosGuard';
import SimplePedidosPage from '@/components/pedidos/SimplePedidosPage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DevolucaoAvancadasTab from "@/components/ml/DevolucaoAvancadasTab";

export default function Pedidos() {
  // Buscar contas ML disponíveis
  const { data: mlAccounts } = useQuery({
    queryKey: ["ml-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_accounts")
        .select("id, name, account_identifier, organization_id, is_active")
        .eq("provider", "mercadolivre")
        .eq("is_active", true)
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <PedidosGuard>
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="devolucoes">Devoluções de vendas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders">
          <SimplePedidosPage />
        </TabsContent>
        
        <TabsContent value="devolucoes">
          <DevolucaoAvancadasTab 
            mlAccounts={mlAccounts || []}
            refetch={async () => {}}
            existingDevolucoes={[]}
          />
        </TabsContent>
      </Tabs>
    </PedidosGuard>
  );
}
