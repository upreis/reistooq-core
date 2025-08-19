export interface Pedido {
  id: string;
  numero: string;
  nome_cliente: string;
  cpf_cnpj: string | null;
  data_pedido: string;
  data_prevista: string | null;
  situacao: string;
  valor_total: number;
  valor_frete: number;
  valor_desconto: number;
  numero_ecommerce: string | null;
  numero_venda: string | null;
  empresa: string | null;
  cidade: string | null;
  uf: string | null;
  codigo_rastreamento: string | null;
  url_rastreamento: string | null;
  obs: string | null;
  obs_interna: string | null;
  integration_account_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PedidosResponse {
  data: Pedido[] | null;
  count: number | null;
  error: any;
}