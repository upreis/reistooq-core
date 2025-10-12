import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DevolucaoAvancadasTab from "@/components/ml/DevolucaoAvancadasTab";
import { ProviderSelector } from "@/components/pedidos/components/ProviderSelector";
import { toast } from "sonner";
import { logger } from "@/utils/logger";

export default function MLOrdersCompletas() {
  // Estado para provider e contas selecionadas
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
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

  // Handler para mudança de provider
  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    if (provider === 'all' && mlAccounts) {
      setSelectedAccountIds(mlAccounts.map(acc => acc.id));
    } else if (mlAccounts) {
      const filtered = mlAccounts.filter(acc => acc.provider === provider);
      setSelectedAccountIds(filtered.map(acc => acc.id));
    }
  };

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

      {/* Seletor de Provider/Contas */}
      <div className="bg-card rounded-lg border p-4">
        <ProviderSelector
          selectedProvider={selectedProvider}
          onProviderChange={handleProviderChange}
          accounts={mlAccounts || []}
          loading={loadingAccounts}
        />
        
        {selectedAccountIds.length > 0 && (
          <div className="mt-2 text-sm text-muted-foreground">
            {selectedAccountIds.length === 1 
              ? `1 conta selecionada` 
              : `${selectedAccountIds.length} contas selecionadas`}
          </div>
        )}
      </div>

      <DevolucaoAvancadasTab 
        mlAccounts={mlAccounts || []}
        selectedAccountId={selectedAccountIds[0] || ''}
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