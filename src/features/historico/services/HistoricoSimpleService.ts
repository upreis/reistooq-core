// Serviço simplificado para histórico - sem RPC, sem cache complexo
import { supabase } from "@/integrations/supabase/client";

export interface HistoricoItem {
  id: string;
  numero_pedido: string;
  sku_produto: string;
  descricao?: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  cliente_nome?: string;
  status: string;
  data_pedido: string;
  created_at: string;
  cidade?: string;
  uf?: string;
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
      // Dados mock para demonstração (substitua por query real conforme RLS permitir)
      const mockData: HistoricoItem[] = [
        {
          id: '1',
          numero_pedido: 'PED001',
          sku_produto: 'SKU123',
          descricao: 'Produto Teste 1',
          quantidade: 2,
          valor_unitario: 50.00,
          valor_total: 100.00,
          cliente_nome: 'Cliente A',
          status: 'concluida',
          data_pedido: '2024-08-26',
          created_at: '2024-08-26T10:00:00Z',
          cidade: 'São Paulo',
          uf: 'SP'
        },
        {
          id: '2',
          numero_pedido: 'PED002',
          sku_produto: 'SKU456',
          descricao: 'Produto Teste 2',
          quantidade: 1,
          valor_unitario: 75.00,
          valor_total: 75.00,
          cliente_nome: 'Cliente B',
          status: 'pendente',
          data_pedido: '2024-08-25',
          created_at: '2024-08-25T15:30:00Z',
          cidade: 'Rio de Janeiro',
          uf: 'RJ'
        }
      ];

      // Aplicar filtros simples
      let filtered = mockData;
      
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(item => 
          item.numero_pedido.toLowerCase().includes(search) ||
          item.sku_produto.toLowerCase().includes(search) ||
          item.descricao?.toLowerCase().includes(search) ||
          item.cliente_nome?.toLowerCase().includes(search)
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
      // Mock stats
      return {
        totalVendas: 150,
        valorTotal: 12500.00,
        ticketMedio: 83.33
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
          numero_pedido: item.numero_pedido,
          sku_produto: item.sku_produto,
          descricao: item.descricao,
          quantidade: item.quantidade || 0,
          valor_unitario: item.valor_unitario || 0,
          valor_total: item.valor_total || 0,
          cliente_nome: item.cliente_nome,
          status: item.status || 'baixado',
          data_pedido: item.data_pedido || new Date().toISOString().split('T')[0]
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