/**
 * 🔄 DEVOLUCAO SERVICE - FASE 4
 * Serviço centralizado para comunicação com Edge Functions de devoluções
 */

import { supabase } from '@/integrations/supabase/client';

export interface DevolucaoFilters {
  search?: string;
  status?: string;
  status_devolucao?: string;
  dateFrom?: string;
  dateTo?: string;
  integrationAccountId?: string;
  claimId?: string;
  orderId?: string;
  buyerId?: number;
  itemId?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DevolucaoResponse {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats?: {
    total: number;
    by_status: Record<string, number>;
    total_amount: number;
  };
}

export interface SyncResponse {
  success: boolean;
  syncId: string;
  totalProcessed: number;
  totalCreated: number;
  totalUpdated: number;
  durationMs: number;
}

export interface EnrichResponse {
  success: boolean;
  processed: number;
  enriched: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

class DevolucaoService {
  /**
   * 📋 Buscar devoluções com filtros e paginação
   */
  async getDevolucoes(
    filters: DevolucaoFilters,
    pagination: PaginationParams = {},
    options: { includeStats?: boolean } = {}
  ): Promise<DevolucaoResponse> {
    // Mapear camelCase para snake_case conforme esperado pela Edge Function
    const body: any = {
      filters: {
        integration_account_id: filters.integrationAccountId,
        search: filters.search,
        status: filters.status,
        status_devolucao: filters.status_devolucao,
        date_from: filters.dateFrom,
        date_to: filters.dateTo,
        claim_id: filters.claimId,
        order_id: filters.orderId,
        buyer_id: filters.buyerId,
        item_id: filters.itemId,
      },
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        sort_by: pagination.sortBy,
        sort_order: pagination.sortOrder,
      },
      includeStats: options.includeStats ?? false,
    };

    const { data, error } = await supabase.functions.invoke('get-devolucoes', {
      body,
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || 'Erro ao buscar devoluções');

    return data;
  }

  /**
   * 🔄 Sincronizar devoluções do Mercado Livre
   */
  async syncDevolucoes(
    integrationAccountId: string,
    batchSize: number = 100
  ): Promise<SyncResponse> {
    const { data, error } = await supabase.functions.invoke('sync-devolucoes', {
      body: {
        integration_account_id: integrationAccountId,
        batch_size: batchSize,
      },
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || 'Erro ao sincronizar devoluções');

    return data;
  }

  /**
   * ✨ REMOVIDO: enrichDevolucoes - agora sync-devolucoes faz tudo inline (FASE 1 e 2)
   * O enriquecimento de reviews via /reviews agora acontece dentro de sync-devolucoes
   */

  /**
   * 📊 Buscar estatísticas de sincronização
   */
  async getSyncStatus(integrationAccountId: string) {
    const { data, error } = await supabase
      .from('devolucoes_sync_status')
      .select('*')
      .eq('integration_account_id', integrationAccountId)
      .order('last_sync_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * 📈 Buscar histórico de sincronizações
   */
  async getSyncHistory(integrationAccountId: string, limit: number = 10) {
    const { data, error } = await supabase
      .from('devolucoes_sync_status')
      .select('*')
      .eq('integration_account_id', integrationAccountId)
      .order('last_sync_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}

export const devolucaoService = new DevolucaoService();
