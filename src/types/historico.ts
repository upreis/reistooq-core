// Tipagem pública para histórico de vendas (sem dados sensíveis)
export type HistoricoVendaPublic = {
  id: string;
  id_unico: string;
  numero_pedido: string;
  sku_produto: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  cliente_nome: string; // Mascarado via RLS
  cliente_documento: string; // Mascarado via RLS
  status: string;
  observacoes?: string;
  data_pedido: string;
  created_at: string;
  updated_at: string;
  ncm?: string;
  codigo_barras?: string;
  pedido_id?: string;
  cpf_cnpj?: string; // Mascarado via RLS
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
};

// Colunas seguras para SELECT explícito (sem dados sensíveis)
export const HISTORICO_SAFE_COLUMNS = [
  'id',
  'id_unico', 
  'numero_pedido',
  'sku_produto',
  'descricao',
  'quantidade',
  'valor_unitario',
  'valor_total',
  'status',
  'observacoes',
  'data_pedido',
  'created_at',
  'updated_at',
  'ncm',
  'codigo_barras',
  'pedido_id',
  'valor_frete',
  'data_prevista',
  'obs',
  'obs_interna',
  'cidade',
  'uf',
  'url_rastreamento',
  'situacao',
  'codigo_rastreamento',
  'numero_ecommerce',
  'valor_desconto',
  'numero_venda',
  'sku_estoque',
  'sku_kit',
  'qtd_kit',
  'total_itens'
] as const;

export type HistoricoSafeColumn = typeof HISTORICO_SAFE_COLUMNS[number];