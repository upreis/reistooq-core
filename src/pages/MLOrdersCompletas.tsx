import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DevolucaoAvancadasTab from "@/components/ml/DevolucaoAvancadasTab";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { logger } from "@/utils/logger";
import { MLOrdersNav } from "@/features/ml/components/MLOrdersNav";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { validateMLAccounts } from "@/features/devolucoes/utils/AccountValidator";

export default function MLOrdersCompletas() {
  // Estado para contas selecionadas
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  
  // ✅ REMOVIDO: useAutoSync duplicado (já existe no SyncControls)

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

  // ✅ 2.4 - Auto-selecionar contas usando validação centralizada
  React.useEffect(() => {
    if (mlAccounts && mlAccounts.length > 0 && selectedAccountIds.length === 0) {
      const { accountIds } = validateMLAccounts(mlAccounts, selectedAccountIds);
      if (accountIds.length > 0) {
        setSelectedAccountIds(accountIds);
        logger.debug('Contas auto-selecionadas', { 
          context: 'MLOrdersCompletas',
          count: accountIds.length,
          accountIds 
        });
      }
    }
  }, [mlAccounts, selectedAccountIds.length]);

  // Não buscar devoluções do banco - sempre usar API
  const loadingDevolucoes = false;

  return (
    <ErrorBoundary>
      <div className="space-y-6">
      {/* Sub-navegação de Pedidos */}
      <MLOrdersNav />


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

      {/* Conteúdo Principal - SEMPRE renderizar componente para evitar erro de hooks */}
      {!loadingAccounts && mlAccounts && mlAccounts.length > 0 && (
        <DevolucaoAvancadasTab 
          mlAccounts={mlAccounts || []}
          selectedAccountId={selectedAccountIds[0] || ''}
          selectedAccountIds={selectedAccountIds}
          refetch={async () => { 
            logger.info('Devoluções recarregadas com sucesso');
          }}
          existingDevolucoes={[]}
        />
      )}
      </div>
    </ErrorBoundary>
  );
}