export interface ItemPedido {
  sku: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

export interface Pedido {
  id: string;
  numero: string;
  nome_cliente: string;
  cpf_cnpj: string | null;
  data_pedido: string;
  situacao: string;
  valor_total: number;
  valor_frete: number;
  valor_desconto: number;
  numero_ecommerce: string | null;
  numero_venda: string | null;
  empresa: string | null;
  cidade: string | null;
  uf: string | null;
  obs: string | null;
  
  // Campos calculados/derivados
  id_unico?: string;  // SKU + numero
  itens?: ItemPedido[];
  
  // Status de mapeamento e estoque
  sku_estoque?: string | null;
  sku_kit?: string | null;
  qtd_kit?: number | null;
  total_itens?: number;
  status_estoque?: 'pronto_baixar' | 'sem_estoque' | 'pedido_baixado';
  
  // Campos mantidos para compatibilidade
  integration_account_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PedidosResponse {
  data: Pedido[] | null;
  count: number | null;
  error: any;
}