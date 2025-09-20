import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DevolucaoAvancadasTab from "@/components/ml/DevolucaoAvancadasTab";
import { toast } from "sonner";
import { logger } from "@/utils/logger";

export default function MLOrdersCompletas() {
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
            Sistema de gestão Mercado Livre - Devoluções Avançadas
          </p>
        </div>
      </div>

      <DevolucaoAvancadasTab 
        mlAccounts={mlAccounts || []}
        refetch={async () => { 
          // Buscar devoluções atualizadas sem reload da página
          try {
            const { data: devolucoes, error } = await supabase
              .from('devolucoes_avancadas')
              .select('*')
              .order('created_at', { ascending: false });
            
            if (error) {
              logger.error('Erro ao recarregar devoluções:', error);
              toast.error('Erro ao atualizar dados');
            } else {
              logger.info('Devoluções recarregadas com sucesso');
            }
          } catch (error) {
            console.error('Erro no refetch:', error);
          }
        }}
        existingDevolucoes={[]}
      />
    </div>
  );
}