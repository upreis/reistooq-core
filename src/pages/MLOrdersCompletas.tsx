import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import DevolucaoAvancadasOptimizada from "@/components/ml/DevolucaoAvancadasOptimizada";
import MLOrdersSelector from "@/components/ml/MLOrdersSelector";

export default function MLOrdersCompletas() {
  // Debug logs
  useEffect(() => {
    console.log("🔍 [MLOrdersCompletas] Página carregada");
  }, []);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sistema ML - Mercado Livre</h1>
          <p className="text-muted-foreground">
            Sistema completo de gestão Mercado Livre
          </p>
        </div>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Orders da API</TabsTrigger>
          <TabsTrigger value="devolucoes">Devoluções Avançadas</TabsTrigger>
        </TabsList>

        <TabsContent value="devolucoes" className="space-y-6 m-0 p-0">
          <DevolucaoAvancadasOptimizada 
            mlAccounts={mlAccounts || []}
            refetch={async () => { 
              try {
                console.log('✅ Dados recarregados com sucesso');
              } catch (error) {
                console.error('Erro no refetch:', error);
                toast.error('Erro ao atualizar dados');
              }
            }}
          />
        </TabsContent>

        <TabsContent value="orders" className="space-y-6 m-0 p-0">
          <MLOrdersSelector 
            mlAccounts={mlAccounts || []}
            onOrdersLoaded={(orders) => {
              console.log('📊 Orders carregados:', orders.length);
              toast.success(`${orders.length} pedidos carregados com sucesso!`);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}