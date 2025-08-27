// Serviço simplificado para histórico - sem RPC, sem cache complexo
import { supabase } from "@/integrations/supabase/client";
import { listarHistoricoVendas } from '@/services/HistoricoService';

export interface HistoricoItem {
  id: string;
  
  // === SEÇÃO BÁSICAS ===
  id_unico: string;
  empresa?: string;
  numero_pedido: string;
  cliente_nome?: string;
  nome_completo?: string;
  data_pedido: string;
  ultima_atualizacao?: string;

  // === SEÇÃO PRODUTOS ===
  sku_produto: string;
  quantidade_total?: number;
  titulo_produto?: string;

  // === SEÇÃO FINANCEIRAS ===
  valor_total: number;
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

  // === SEÇÃO MAPEAMENTO ===
  status_mapeamento?: string;
  sku_estoque?: string;
  sku_kit?: string;
  quantidade_kit?: number;
  total_itens?: number;
  status_baixa?: string;

  // === SEÇÃO ENVIO ===
  status: string; // Status do pagamento ('baixado')
  status_envio?: string;
  logistic_mode_principal?: string;
  tipo_logistico?: string;
  tipo_metodo_envio?: string;
  tipo_entrega?: string;
  substatus_estado_atual?: string;
  modo_envio_combinado?: string;
  metodo_envio_combinado?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  cep?: string;
  cidade?: string;
  uf?: string;

  // === SISTEMA ===
  created_at: string;
  integration_account_id?: string;
}

export interface HistoricoFilters {
  search?: string;
  dataInicio?: string;
  dataFim?: string;
  status?: string;
}

export class HistoricoSimpleService {
  
  // Buscar registros de histórico com filtros opcionais
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
      console.log('🔍 Buscando histórico com filtros:', { filters, page, limit });

      // Usar SELECT direto da tabela historico_vendas (sem RPC)
      const result = await listarHistoricoVendas({ page, pageSize: limit });

      console.log('[HistoricoSimpleService] Resultado bruto:', result);

      // Mapear dados para o formato esperado
      const data: HistoricoItem[] = (result.data || []).map((item: any) => {
        console.log('[HistoricoSimpleService] Mapeando item:', { 
          id: item.id, 
          numero_pedido: item.numero_pedido,
          nome_cliente: item.nome_cliente,
          valor_total: item.valor_total
        });
        
        return {
          id: item.id,
          id_unico: item.id_unico || item.numero_pedido || '',
          numero_pedido: item.numero_pedido || '',
          cliente_nome: item.cliente_nome || item.nome_cliente || '',
          nome_completo: item.nome_completo || item.cliente_nome || '',
          sku_produto: item.sku_produto || '',
          sku_estoque: item.sku_estoque || '',
          sku_kit: item.sku_kit || '',
          quantidade_total: Number(item.quantidade_total) || Number(item.quantidade) || 0,
          qtd_kit: Number(item.qtd_kit) || 0,
          total_itens: Number(item.total_itens) || Number(item.itens) || 0,
          titulo_produto: item.titulo_produto || item.descricao || '',
          valor_total: Number(item.valor_total) || Number(item.total) || 0,
          valor_pago: Number(item.valor_pago) || 0,
          frete_pago_cliente: Number(item.frete_pago_cliente) || Number(item.valor_frete) || 0,
          receita_flex_bonus: Number(item.receita_flex_bonus) || 0,
          custo_envio_seller: Number(item.custo_envio_seller) || 0,
          desconto_cupom: Number(item.desconto_cupom) || Number(item.valor_desconto) || 0,
          taxa_marketplace: Number(item.taxa_marketplace) || 0,
          valor_liquido_vendedor: Number(item.valor_liquido_vendedor) || 0,
          metodo_pagamento: item.metodo_pagamento || '',
          status_pagamento: item.status_pagamento || '',
          tipo_pagamento: item.tipo_pagamento || '',
          status_mapeamento: item.status_mapeamento || '',
          status_baixa: item.status_baixa || '',
          status: item.status || 'baixado',
          status_envio: item.status_envio || '',
          // Campos de envio/endereço
          logistic_mode_principal: item.logistic_mode_principal || '',
          tipo_logistico: item.tipo_logistico || '',
          tipo_metodo_envio: item.tipo_metodo_envio || '',
          tipo_entrega: item.tipo_entrega || '',
          substatus_estado_atual: item.substatus_estado_atual || '',
          modo_envio_combinado: item.modo_envio_combinado || '',
          metodo_envio_combinado: item.metodo_envio_combinado || '',
          cidade: item.cidade || '',
          uf: item.uf || '',
          empresa: item.empresa || '',
          data_pedido: item.data_pedido || '',
          ultima_atualizacao: item.ultima_atualizacao || item.updated_at || '',
          created_at: item.created_at || '',
          integration_account_id: item.integration_account_id || ''
        };
      });

      const hasMore = data.length === limit;

      console.log('✅ Dados processados:', { total: result.total, hasMore, dataLength: data.length });

      return {
        data,
        total: result.total,
        hasMore
      };

    } catch (error: any) {
      console.error('❌ Erro ao buscar histórico:', error);
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
      console.log('📊 Buscando estatísticas do histórico');

      // Usar SELECT direto para stats
      const { data, error } = await supabase
        .from('historico_vendas')
        .select('total, valor_total');

      if (error) {
        console.error('❌ Erro ao buscar stats:', error);
        return { totalVendas: 0, valorTotal: 0, ticketMedio: 0 };
      }

      const totalVendas = data?.length || 0;
      const valorTotal = data?.reduce((sum: number, item: any) => 
        sum + (Number(item.total) || Number(item.valor_total) || 0), 0) || 0;
      const ticketMedio = totalVendas > 0 ? valorTotal / totalVendas : 0;

      console.log('📊 Stats calculadas:', { totalVendas, valorTotal, ticketMedio });

      return { totalVendas, valorTotal, ticketMedio };

    } catch (error: any) {
      console.error('❌ Erro ao calcular estatísticas:', error);
      return { totalVendas: 0, valorTotal: 0, ticketMedio: 0 };
    }
  }

  // Adicionar novo registro ao histórico
  static async addHistoricoItem(item: Partial<HistoricoItem>): Promise<boolean> {
    try {
      // Mapear para formato da tabela
      const dbItem = {
        numero_pedido: item.numero_pedido || '',
        id_unico: item.id_unico || item.numero_pedido || '',
        sku_produto: item.sku_produto || 'BAIXA_ESTOQUE',
        data_pedido: item.data_pedido || new Date().toISOString().split('T')[0],
        status: item.status || 'baixado',
        valor_total: item.valor_total || 0,
        cliente_nome: item.cliente_nome || '',
        created_by: null // Será definido pela RLS
      };

      const { error } = await supabase
        .from('historico_vendas')
        .insert(dbItem);

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