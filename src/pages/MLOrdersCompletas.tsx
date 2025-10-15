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

  // Auto-selecionar TODAS as contas quando carregar
  React.useEffect(() => {
    if (mlAccounts && mlAccounts.length > 0 && selectedAccountIds.length === 0) {
      setSelectedAccountIds(mlAccounts.map(acc => acc.id));
    }
  }, [mlAccounts, selectedAccountIds.length]);

  // Não buscar devoluções do banco - sempre usar API
  const loadingDevolucoes = false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sistema ML - Mercado Livre</h1>
        <p className="text-muted-foreground">
          Sistema de gestão Mercado Livre - Devoluções Avançadas
        </p>
      </div>

      {/* Seletor de Contas ML com Múltipla Seleção */}
      {!loadingAccounts && mlAccounts && mlAccounts.length > 0 && (
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Contas Mercado Livre ({selectedAccountIds.length} de {mlAccounts.length} selecionadas)
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedAccountIds(mlAccounts.map(acc => acc.id))}
                  className="text-xs px-2 py-1 rounded border hover:bg-accent"
                  disabled={selectedAccountIds.length === mlAccounts.length}
                >
                  Selecionar Todas
                </button>
                <button
                  onClick={() => setSelectedAccountIds([])}
                  className="text-xs px-2 py-1 rounded border hover:bg-accent"
                  disabled={selectedAccountIds.length === 0}
                >
                  Limpar Seleção
                </button>
              </div>
            </div>
            
            <div className="grid gap-2">
              {mlAccounts.map((account) => (
                <label 
                  key={account.id}
                  className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-accent transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedAccountIds.includes(account.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAccountIds([...selectedAccountIds, account.id]);
                      } else {
                        setSelectedAccountIds(selectedAccountIds.filter(id => id !== account.id));
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{account.name}</div>
                    <div className="text-xs text-muted-foreground">{account.account_identifier}</div>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${
                    account.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {account.is_active ? 'Ativa' : 'Inativa'}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </Card>
      )}

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
      {!loadingAccounts && mlAccounts && mlAccounts.length > 0 && selectedAccountIds.length > 0 && (
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
      
      {/* Alerta quando nenhuma conta selecionada */}
      {!loadingAccounts && mlAccounts && mlAccounts.length > 0 && selectedAccountIds.length === 0 && (
        <Card className="p-6 border-yellow-200 bg-yellow-50">
          <div className="text-center">
            <p className="font-medium text-yellow-800">Selecione pelo menos uma conta para visualizar as devoluções</p>
          </div>
        </Card>
      )}
    </div>
  );
}