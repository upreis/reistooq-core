import { supabase } from "@/integrations/supabase/client";

interface SyncOrdersResponse {
  success: boolean;
  message: string;
  orders_synced?: number;
  orders_in_db?: number;
}

export async function syncMLOrders(integrationAccountId: string): Promise<SyncOrdersResponse> {
  try {
    console.log(`🔄 Iniciando sincronização para conta: ${integrationAccountId}`);
    
    const { data, error } = await supabase.functions.invoke('sync-ml-orders', {
      body: {
        integration_account_id: integrationAccountId
      }
    });
    
    if (error) {
      console.error('❌ Erro ao sincronizar pedidos:', error);
      throw new Error(error.message || 'Erro na sincronização');
    }
    
    console.log('✅ Resultado da sincronização:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}