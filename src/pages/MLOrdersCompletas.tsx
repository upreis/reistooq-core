import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DevolucaoAvancadasTab from "@/components/ml/DevolucaoAvancadasTab";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { logger } from "@/utils/logger";

export default function MLOrdersCompletas() {
  // Estado para contas selecionadas
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);

  // Buscar contas ML disponíveis
  const { data: mlAccounts, isLoading: loadingAccounts } = useQuery({
    queryKey: ["ml-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_accounts")
        .select("id, name, account_identifier, organization_id, is_active, provider")
        .eq("provider", "mercadolivre")
        .eq("is_active", true)
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Auto-selecionar a primeira conta quando carregar
  React.useEffect(() => {
    if (mlAccounts && mlAccounts.length > 0 && selectedAccountIds.length === 0) {
      setSelectedAccountIds([mlAccounts[0].id]);
    }
  }, [mlAccounts, selectedAccountIds.length]);

  // Buscar devoluções existentes filtradas pela conta selecionada
  const { data: existingDevolucoes, isLoading: loadingDevolucoes, refetch: refetchDevolucoes } = useQuery({
    queryKey: ["devolucoes-avancadas", selectedAccountIds[0]],
    queryFn: async () => {
      if (!selectedAccountIds[0]) return [];
      
      const { data, error } = await supabase
        .from("devolucoes_avancadas")
        .select("*")
        .eq("integration_account_id", selectedAccountIds[0])
        .order("created_at", { ascending: false });
      
      if (error) {
        logger.error("Erro ao buscar devoluções:", error);
        toast.error("Erro ao carregar devoluções");
        throw error;
      }
      
      logger.info(`${data?.length || 0} devoluções carregadas da conta ${selectedAccountIds[0]}`);
      return (data || []) as any[];
    },
    enabled: !!selectedAccountIds[0], // Só busca se tiver conta selecionada
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sistema ML - Mercado Livre</h1>
        <p className="text-muted-foreground">
          Sistema de gestão Mercado Livre - Devoluções Avançadas
        </p>
      </div>

      {/* Loading States */}
      {(loadingAccounts || loadingDevolucoes) && (
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">
              {loadingAccounts ? 'Carregando contas...' : 'Carregando devoluções...'}
            </p>
          </div>
        </div>
      )}

      {/* Erro: Sem contas */}
      {!loadingAccounts && (!mlAccounts || mlAccounts.length === 0) && (
        <Card className="p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-yellow-100 p-3">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Nenhuma conta ML encontrada</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Configure uma conta do Mercado Livre para começar a gerenciar devoluções
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Conteúdo Principal */}
      {!loadingAccounts && mlAccounts && mlAccounts.length > 0 && (
        <DevolucaoAvancadasTab 
          mlAccounts={mlAccounts || []}
          selectedAccountId={selectedAccountIds[0] || ''}
          refetch={async () => { 
            await refetchDevolucoes();
            logger.info('Devoluções recarregadas com sucesso');
          }}
          existingDevolucoes={existingDevolucoes || []}
        />
      )}
    </div>
  );
}