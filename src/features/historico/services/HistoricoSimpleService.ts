// Serviço simplificado para histórico - sem RPC, sem cache complexo
import { supabase } from "@/integrations/supabase/client";
import { HistoricoDataMapper } from './HistoricoDataMapper';

export interface HistoricoItem {
  id: string;
  // === Básicas ===
  id_unico: string;
  empresa?: string;
  numero_pedido: string;
  nome_cliente?: string;
  nome_completo?: string;
  data_pedido: string;
  ultima_atualizacao?: string;

  // === Produtos ===
  sku_produto: string;
  skus_produtos?: string;
  quantidade: number;
  quantidade_total?: number;
  titulo_produto?: string;
  descricao?: string;

  // === Financeiras ===
  valor_total: number;
  valor_unitario: number;
  valor_pago?: number;
  frete_pago_cliente?: number;
  receita_flex_bonus?: number;
  custo_envio_seller?: number;
  desconto_cupom?: number;
  taxa_marketplace?: number;
  valor_liquido_vendedor?: number;
  metodo_pagamento?: string;
  status_pagamento?: string;
  tipo_pagamento?: string;

  // === Mapeamento ===
  status_mapeamento?: string;
  sku_estoque?: string;
  sku_kit?: string;
  quantidade_kit?: number;
  total_itens?: number;
  status_baixa?: string;

  // === Envio ===
  status_envio?: string;
  logistic_mode?: string;
  tipo_logistico?: string;
  tipo_metodo_envio?: string;
  tipo_entrega?: string;
  substatus_estado_atual?: string;
  modo_envio_combinado?: string;
  metodo_envio_combinado?: string;

  // === Sistema ===
  status: string;
  created_at: string;
  cidade?: string;
  uf?: string;
  cliente_documento?: string;
  cpf_cnpj?: string;
  codigo_rastreamento?: string;
  url_rastreamento?: string;
  observacoes?: string;
  integration_account_id?: string;
}

export interface HistoricoFilters {
  search?: string;
  dataInicio?: string;
  dataFim?: string;
  status?: string;
}

export class HistoricoSimpleService {
  
  // Buscar dados reais do histórico via RPC segura (com RLS e máscara de PII)
  static async getHistorico(
    filters: HistoricoFilters = {},
    page: number = 1,
    limit: number = 50
  ): Promise<{
    data: HistoricoItem[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const params: any = {
        _limit: limit,
        _offset: (page - 1) * limit,
      };

      if (filters.search && String(filters.search).trim() !== '') {
        params._search = String(filters.search).trim();
      }
      if (filters.dataInicio) params._start = filters.dataInicio;
      if (filters.dataFim) params._end = filters.dataFim;

      const { data, error } = await supabase.rpc('get_historico_vendas_safe', params);

      if (error) {
        console.error('[Historico] RPC get_historico_vendas_safe erro:', error.message);
        return { data: [], total: 0, hasMore: false };
      }

      const rows = Array.isArray(data) ? data : [];
      const mapped: HistoricoItem[] = rows.map((r: any) => {
        // Usar o mapeador para converter dados do banco para o formato novo
        const mappedRecord = HistoricoDataMapper.mapDatabaseToNewFormat(r);
        
        // Aplicar validação e limpeza
        return HistoricoDataMapper.validateAndCleanData(mappedRecord);
      });

      // Como a RPC não retorna total, usamos um heurístico simples
      const total = (page - 1) * limit + mapped.length;
      const hasMore = mapped.length === limit;

      return { data: mapped, total, hasMore };
    } catch (error: any) {
      console.error('Erro ao buscar histórico:', error.message || error);
      return { data: [], total: 0, hasMore: false };
    }
  }

  // Buscar estatísticas simples
  static async getStats(): Promise<{
    totalVendas: number;
    valorTotal: number;
    ticketMedio: number;
  }> {
    try {
      // Por simplicidade, fazemos uma amostra do último page para calcular métricas básicas
      const { data, error } = await supabase.rpc('get_historico_vendas_safe', {
        _limit: 100,
        _offset: 0,
      });
      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      const totalVendas = rows.length;
      const valorTotal = rows.reduce((s: number, r: any) => s + Number(r?.valor_total || 0), 0);
      const ticketMedio = totalVendas > 0 ? valorTotal / totalVendas : 0;
      return { totalVendas, valorTotal, ticketMedio };
    } catch {
      return { totalVendas: 0, valorTotal: 0, ticketMedio: 0 };
    }
  }

  // Adicionar novo registro ao histórico
  static async addHistoricoItem(item: Partial<HistoricoItem>): Promise<boolean> {
    try {
      // Validar e limpar dados antes da inserção
      const cleanedItem = HistoricoDataMapper.validateAndCleanData(item);
      
      // Mapear para formato do banco
      const dbItem = HistoricoDataMapper.mapNewFormatToDatabase(cleanedItem);

      const { error } = await supabase.functions.invoke('registrar-historico-vendas', {
        body: dbItem
      });

      if (error) {
        console.error('Erro ao registrar no histórico:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao adicionar item ao histórico:', error);
      return false;
    }
  }
}