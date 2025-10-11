// 🛡️ PÁGINA PROTEGIDA - Sistema Blindado Ativo
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { PedidosGuard } from '@/core/pedidos/guards/PedidosGuard';
import SimplePedidosPage from '@/components/pedidos/SimplePedidosPage';
import { PedidosNav } from '@/features/pedidos/components/PedidosNav';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DevolucaoAvancadasTab from "@/components/ml/DevolucaoAvancadasTab";
import { toast } from "sonner";
import { logger } from "@/utils/logger";

export default function Pedidos() {
  const location = useLocation();

  // Buscar contas ML disponíveis para a aba de devoluções
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

  const renderContent = () => {
    if (location.pathname === "/pedidos/devolucoes") {
      return (
        <DevolucaoAvancadasTab 
          mlAccounts={mlAccounts || []}
          refetch={async () => { 
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
      );
    }
    
    return <SimplePedidosPage />;
  };

  return (
    <PedidosGuard>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>📦</span>
          <span>/</span>
          <span className="text-primary">Pedidos</span>
        </div>

        <PedidosNav />
        
        <div className="mt-6">
          {renderContent()}
        </div>
      </div>
    </PedidosGuard>
  );
}
