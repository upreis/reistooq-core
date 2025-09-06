export interface Cliente {
  id: string;
  nome_completo: string;
  cpf_cnpj?: string | null;
  email?: string | null;
  telefone?: string | null;
  endereco_rua?: string | null;
  endereco_numero?: string | null;
  endereco_bairro?: string | null;
  endereco_cidade?: string | null;
  endereco_uf?: string | null;
  endereco_cep?: string | null;
  data_primeiro_pedido?: string | null;
  data_ultimo_pedido?: string | null;
  total_pedidos: number;
  valor_total_gasto: number;
  ticket_medio: number;
  status_cliente: 'Regular' | 'VIP' | 'Premium' | 'Inativo';
  observacoes?: string | null;
  empresa?: string | null;
  integration_account_id?: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface ClientesFilters {
  search?: string;
  status?: string;
  cidade?: string;
  uf?: string;
}

export interface ClientesStats {
  total: number;
  ativos: number;
  vip: number;
  premium: number;
  ticket_medio: number;
  ltv_medio: number;
}