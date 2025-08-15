// Types para o sistema de histórico de vendas otimizado
export interface HistoricoVenda {
  id: string;
  id_unico: string;
  numero_pedido: string;
  sku_produto: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  cliente_nome: string;
  cliente_documento: string;
  status: string;
  observacoes?: string;
  data_pedido: string;
  created_at: string;
  updated_at: string;
  ncm?: string;
  codigo_barras?: string;
  pedido_id?: string;
  cpf_cnpj?: string;
  valor_frete?: number;
  data_prevista?: string;
  obs?: string;
  obs_interna?: string;
  cidade?: string;
  uf?: string;
  url_rastreamento?: string;
  situacao?: string;
  codigo_rastreamento?: string;
  numero_ecommerce?: string;
  valor_desconto?: number;
  numero_venda?: string;
  sku_estoque?: string;
  sku_kit?: string;
  qtd_kit?: number;
  total_itens?: number;
}

export interface HistoricoFilters {
  search?: string;
  dataInicio?: string;
  dataFim?: string;
  status?: string[];
  valorMin?: number;
  valorMax?: number;
  cidades?: string[];
  uf?: string[];
  situacao?: string[];
  cliente?: string;
  sku?: string;
  integrationAccount?: string;
}

export interface HistoricoFiltersState extends HistoricoFilters {
  isActive: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface HistoricoPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface HistoricoResponse {
  data: HistoricoVenda[];
  pagination: HistoricoPagination;
  summary: HistoricoSummary;
}

export interface HistoricoSummary {
  totalVendas: number;
  valorTotalVendas: number;
  ticketMedio: number;
  quantidadeTotalItens: number;
  clientesUnicos: number;
  produtosUnicos: number;
}

export interface HistoricoAnalytics {
  vendas: {
    hoje: number;
    ontem: number;
    semana: number;
    mes: number;
    crescimentoDiario: number;
    crescimentoSemanal: number;
    crescimentoMensal: number;
  };
  produtos: {
    topVendidos: Array<{
      sku: string;
      nome: string;
      quantidade: number;
      valor: number;
    }>;
    categorias: Array<{
      categoria: string;
      quantidade: number;
      valor: number;
    }>;
  };
  geografico: {
    estados: Array<{
      uf: string;
      vendas: number;
      valor: number;
    }>;
    cidades: Array<{
      cidade: string;
      uf: string;
      vendas: number;
      valor: number;
    }>;
  };
  temporal: {
    diario: Array<{
      data: string;
      vendas: number;
      valor: number;
    }>;
    semanal: Array<{
      semana: string;
      vendas: number;
      valor: number;
    }>;
    mensal: Array<{
      mes: string;
      vendas: number;
      valor: number;
    }>;
  };
}

export interface BulkOperation {
  action: 'delete' | 'update_status' | 'export' | 'tag';
  ids: string[];
  payload?: Record<string, any>;
  confirmationRequired: boolean;
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
  summary: string;
}

export type SortableFields = 
  | 'data_pedido'
  | 'valor_total'
  | 'quantidade'
  | 'cliente_nome'
  | 'status'
  | 'created_at';

export interface TableColumn {
  key: keyof HistoricoVenda;
  label: string;
  sortable: boolean;
  visible: boolean;
  width?: number;
  align?: 'left' | 'center' | 'right';
  formatter?: (value: any) => string;
}

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf';
  includeFilters: boolean;
  columns: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}