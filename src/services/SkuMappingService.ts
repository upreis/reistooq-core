import { supabase } from "@/integrations/supabase/client";
import { SkuMapping, SkuMappingFilters, SkuMappingResponse, BulkActions } from "@/types/sku-mapping.types";

export class SkuMappingService {
  private static orgId: string | null = null;

  private static async getCurrentOrgId(): Promise<string> {
    if (this.orgId) return this.orgId;
    const { data, error } = await supabase.rpc('get_current_org_id');
    if (error || !data) {
      throw new Error('Não foi possível obter a organização atual.');
    }
    this.orgId = data as unknown as string;
    return this.orgId;
  }
  static async getSkuMappings(filters: SkuMappingFilters): Promise<SkuMappingResponse> {
    let query = supabase
      .from('mapeamentos_depara')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.search) {
      query = query.or(`sku_pedido.ilike.%${filters.search}%,sku_correspondente.ilike.%${filters.search}%,sku_simples.ilike.%${filters.search}%`);
    }

    if (filters.status !== 'todos') {
      query = query.eq('ativo', filters.status === 'ativos');
    }

    if (filters.preenchimento !== 'todos') {
      if (filters.preenchimento === 'pendentes') {
        query = query.or('sku_correspondente.is.null,sku_simples.is.null');
      } else {
        query = query.not('sku_correspondente', 'is', null);
      }
    }

    if (filters.dateRange?.start) {
      query = query.gte('created_at', filters.dateRange.start);
    }

    if (filters.dateRange?.end) {
      query = query.lte('created_at', filters.dateRange.end);
    }

    // Apply sorting
    query = query.order(filters.sortBy, { ascending: filters.sortDir === 'asc' });

    // Apply pagination
    const from = (filters.page - 1) * filters.pageSize;
    const to = from + filters.pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: data || [],
      total: count || 0,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil((count || 0) / filters.pageSize),
    };
  }

  static async createSkuMapping(mapping: Omit<SkuMapping, 'id' | 'created_at' | 'updated_at'>): Promise<SkuMapping> {
    const orgId = await this.getCurrentOrgId();

    const payload = {
      sku_pedido: mapping.sku_pedido,
      sku_correspondente: mapping.sku_correspondente,
      sku_simples: mapping.sku_simples,
      quantidade: mapping.quantidade ?? 1,
      ativo: mapping.ativo ?? true,
      observacoes: mapping.observacoes,
      organization_id: orgId,
    };

    const { data, error } = await supabase
      .from('mapeamentos_depara')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  static async updateSkuMapping(id: string, mapping: Partial<SkuMapping>): Promise<SkuMapping> {
    const { data, error } = await supabase
      .from('mapeamentos_depara')
      .update(mapping)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  static async deleteSkuMapping(id: string): Promise<void> {
    const orgId = await this.getCurrentOrgId();
    const { error } = await supabase
      .from('mapeamentos_depara')
      .delete()
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) {
      throw new Error(error.message);
    }
  }

  static async bulkActions(actions: BulkActions): Promise<void> {
    const orgId = await this.getCurrentOrgId();
    if (actions.action === 'delete') {
      const { error } = await supabase
        .from('mapeamentos_depara')
        .delete()
        .in('id', actions.ids)
        .eq('organization_id', orgId);

      if (error) {
        throw new Error(error.message);
      }
    } else {
      const { error } = await supabase
        .from('mapeamentos_depara')
        .update({ ativo: actions.action === 'activate' })
        .in('id', actions.ids)
        .eq('organization_id', orgId);

      if (error) {
        throw new Error(error.message);
      }
    }
  }

  static async validateSkuExists(sku: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('mapeamentos_depara')
      .select('id')
      .eq('sku_pedido', sku)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return !!data;
  }

  static async getStats() {
    const { data, error } = await supabase
      .from('mapeamentos_depara')
      .select('ativo, sku_correspondente');

    if (error) {
      throw new Error(error.message);
    }

    const total = data.length;
    const ativos = data.filter(item => item.ativo).length;
    const pendentes = data.filter(item => !item.sku_correspondente).length;
    const completos = total - pendentes;

    return { total, ativos, pendentes, completos };
  }
}