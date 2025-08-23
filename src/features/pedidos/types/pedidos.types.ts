export interface PedidoItem {
  sku: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

export interface Pedido {
  id: string;
  numero: string;
  id_unico: string;
  nome_cliente: string;
  cpf_cnpj: string | null;
  data_pedido: string;
  data_prevista?: string | null;
  situacao: string;
  valor_total: number;
  valor_frete: number;
  valor_desconto: number;
  numero_ecommerce?: string | null;
  numero_venda?: string | null;
  empresa: string;
  cidade?: string | null;
  uf?: string | null;
  codigo_rastreamento?: string | null;
  url_rastreamento?: string | null;
  obs?: string | null;
  obs_interna?: string | null;
  integration_account_id: string;
  created_at: string;
  updated_at: string;
  
  // Campos auxiliares
  itens: PedidoItem[];
  total_itens: number;
  sku_estoque?: string | null;
  sku_kit?: string | null;
  qtd_kit?: number | null;
  status_estoque: 'pronto_baixar' | 'sem_estoque' | 'pedido_baixado';
  tem_mapeamento: boolean;
}

export interface PedidosFilters {
  search?: string;
  situacao?: string[];
  empresas?: string[];
  dataInicio?: Date;
  dataFim?: Date;
  cidade?: string;
  uf?: string;
  valorMin?: number;
  valorMax?: number;
  temMapeamento?: boolean;
  statusEstoque?: string[];
}

export interface PedidosResponse {
  data: Pedido[];
  total: number;
  has_next_page: boolean;
  page: number;
}

export interface PedidosAnalytics {
  total_pedidos: number;
  total_receita: number;
  pedidos_hoje: number;
  receita_hoje: number;
  status_distribution: Record<string, number>;
  top_produtos: Array<{
    sku: string;
    nome: string;
    quantidade: number;
    receita: number;
  }>;
  revenue_trend: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  mapping_stats: {
    total: number;
    mapeados: number;
    sem_mapeamento: number;
    percentage: number;
  };
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: PedidosFilters;
  created_at: string;
  is_default?: boolean;
}

export interface BulkAction {
  id: string;
  type: 'baixa_estoque' | 'export' | 'update_status';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  total: number;
  error?: string;
  result?: any;
  created_at: string;
}