// Serviço simplificado para histórico - sem RPC, sem cache complexo
import { supabase } from "@/integrations/supabase/client";

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
  
  // Buscar dados do histórico usando tabela direta (quando possível) ou fallback
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
      // Dados mock com todas as colunas para demonstração
      const mockData: HistoricoItem[] = [
        {
          id: '1',
          // Básicas
          id_unico: 'PED001-001',
          empresa: 'Loja ABC',
          numero_pedido: 'PED001',
          nome_cliente: 'Cliente A',
          nome_completo: 'Cliente A Silva',
          data_pedido: '2024-08-26',
          ultima_atualizacao: '2024-08-26T10:30:00Z',

          // Produtos
          sku_produto: 'SKU123',
          skus_produtos: 'SKU123, SKU124',
          quantidade: 2,
          quantidade_total: 2,
          titulo_produto: 'Produto Teste 1',
          descricao: 'Descrição detalhada do produto',

          // Financeiras
          valor_total: 100.00,
          valor_unitario: 50.00,
          valor_pago: 100.00,
          frete_pago_cliente: 15.00,
          receita_flex_bonus: 5.00,
          custo_envio_seller: 10.00,
          desconto_cupom: 0.00,
          taxa_marketplace: 12.00,
          valor_liquido_vendedor: 78.00,
          metodo_pagamento: 'Cartão de Crédito',
          status_pagamento: 'Aprovado',
          tipo_pagamento: 'credit_card',

          // Mapeamento
          status_mapeamento: 'Mapeado',
          sku_estoque: 'EST123',
          sku_kit: 'KIT123',
          quantidade_kit: 1,
          total_itens: 2,
          status_baixa: 'Baixado',

          // Envio
          status_envio: 'Enviado',
          logistic_mode: 'me2',
          tipo_logistico: 'Mercado Envios',
          tipo_metodo_envio: 'Standard',
          tipo_entrega: 'Domicílio',
          substatus_estado_atual: 'Em trânsito',
          modo_envio_combinado: 'Padrão',
          metodo_envio_combinado: 'Correios',

          // Sistema
          status: 'concluida',
          created_at: '2024-08-26T10:00:00Z',
          cidade: 'São Paulo',
          uf: 'SP',
          cliente_documento: '123.456.789-00',
          cpf_cnpj: '123.456.789-00',
          codigo_rastreamento: 'BR123456789BR',
          url_rastreamento: 'https://rastreamento.correios.com.br',
          observacoes: 'Pedido processado automaticamente',
          integration_account_id: 'acc-123'
        },
        {
          id: '2',
          // Básicas
          id_unico: 'PED002-001',
          empresa: 'Loja XYZ',
          numero_pedido: 'PED002',
          nome_cliente: 'Cliente B',
          nome_completo: 'Cliente B Santos',
          data_pedido: '2024-08-25',
          ultima_atualizacao: '2024-08-25T15:45:00Z',

          // Produtos
          sku_produto: 'SKU456',
          skus_produtos: 'SKU456',
          quantidade: 1,
          quantidade_total: 1,
          titulo_produto: 'Produto Teste 2',
          descricao: 'Outro produto para teste',

          // Financeiras
          valor_total: 75.00,
          valor_unitario: 75.00,
          valor_pago: 75.00,
          frete_pago_cliente: 12.00,
          receita_flex_bonus: 3.00,
          custo_envio_seller: 8.00,
          desconto_cupom: 5.00,
          taxa_marketplace: 9.00,
          valor_liquido_vendedor: 58.00,
          metodo_pagamento: 'PIX',
          status_pagamento: 'Aprovado',
          tipo_pagamento: 'pix',

          // Mapeamento
          status_mapeamento: 'Pendente',
          sku_estoque: 'EST456',
          sku_kit: null,
          quantidade_kit: 0,
          total_itens: 1,
          status_baixa: 'Pendente',

          // Envio
          status_envio: 'Preparando',
          logistic_mode: 'fulfillment',
          tipo_logistico: 'Full',
          tipo_metodo_envio: 'Express',
          tipo_entrega: 'Retirada',
          substatus_estado_atual: 'Preparando envio',
          modo_envio_combinado: 'Expresso',
          metodo_envio_combinado: 'Transportadora',

          // Sistema
          status: 'pendente',
          created_at: '2024-08-25T15:30:00Z',
          cidade: 'Rio de Janeiro',
          uf: 'RJ',
          cliente_documento: '987.654.321-00',
          cpf_cnpj: '987.654.321-00',
          codigo_rastreamento: null,
          url_rastreamento: null,
          observacoes: 'Aguardando mapeamento',
          integration_account_id: 'acc-456'
        }
      ];

      // Aplicar filtros simples
      let filtered = mockData;
      
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(item => 
          item.numero_pedido.toLowerCase().includes(search) ||
          item.sku_produto.toLowerCase().includes(search) ||
          item.titulo_produto?.toLowerCase().includes(search) ||
          item.descricao?.toLowerCase().includes(search) ||
          item.nome_cliente?.toLowerCase().includes(search) ||
          item.nome_completo?.toLowerCase().includes(search) ||
          item.empresa?.toLowerCase().includes(search) ||
          item.sku_estoque?.toLowerCase().includes(search) ||
          item.codigo_rastreamento?.toLowerCase().includes(search)
        );
      }

      if (filters.status) {
        filtered = filtered.filter(item => item.status === filters.status);
      }

      if (filters.dataInicio) {
        filtered = filtered.filter(item => item.data_pedido >= filters.dataInicio!);
      }

      if (filters.dataFim) {
        filtered = filtered.filter(item => item.data_pedido <= filters.dataFim!);
      }

      // Paginação simples
      const offset = (page - 1) * limit;
      const paginatedData = filtered.slice(offset, offset + limit);
      
      return {
        data: paginatedData,
        total: filtered.length,
        hasMore: offset + limit < filtered.length
      };

    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      return {
        data: [],
        total: 0,
        hasMore: false
      };
    }
  }

  // Buscar estatísticas simples
  static async getStats(): Promise<{
    totalVendas: number;
    valorTotal: number;
    ticketMedio: number;
  }> {
    try {
      // Mock stats baseados nos dados completos
      return {
        totalVendas: 2,
        valorTotal: 175.00,
        ticketMedio: 87.50
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        totalVendas: 0,
        valorTotal: 0,
        ticketMedio: 0
      };
    }
  }

  // Adicionar novo registro ao histórico
  static async addHistoricoItem(item: Partial<HistoricoItem>): Promise<boolean> {
    try {
      // Tentar usar edge function se disponível
      const { error } = await supabase.functions.invoke('registrar-historico-vendas', {
        body: {
          // Básicas
          id_unico: item.id_unico,
          empresa: item.empresa,
          numero_pedido: item.numero_pedido,
          cliente_nome: item.nome_cliente || item.nome_completo,

          // Produtos
          sku_produto: item.sku_produto,
          descricao: item.titulo_produto || item.descricao,
          quantidade: item.quantidade || 0,
          valor_unitario: item.valor_unitario || 0,
          valor_total: item.valor_total || 0,

          // Financeiras
          valor_frete: item.frete_pago_cliente || 0,
          valor_desconto: item.desconto_cupom || 0,

          // Mapeamento
          sku_estoque: item.sku_estoque,
          sku_kit: item.sku_kit,
          qtd_kit: item.quantidade_kit || 0,
          total_itens: item.total_itens || 0,

          // Sistema
          status: item.status || 'baixado',
          data_pedido: item.data_pedido || new Date().toISOString().split('T')[0],
          cpf_cnpj: item.cpf_cnpj || item.cliente_documento,
          cidade: item.cidade,
          uf: item.uf,
          codigo_rastreamento: item.codigo_rastreamento,
          url_rastreamento: item.url_rastreamento,
          observacoes: item.observacoes,
          integration_account_id: item.integration_account_id
        }
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