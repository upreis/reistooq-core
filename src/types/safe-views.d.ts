// Types for secure views created by security hardening

export interface ProfileSafe {
  id: string;
  nome_completo: string;
  nome_exibicao: string;
  telefone: string; // Masked as ****XXXX
  cargo: string;
  departamento: string;
  organizacao_id: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
  onboarding_banner_dismissed: boolean;
  configuracoes_notificacao: any;
}

export interface HistoricoVendasSafe {
  id: string;
  id_unico: string;
  numero_pedido: string;
  sku_produto: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  status: string;
  observacoes: string;
  data_pedido: string;
  created_at: string;
  updated_at: string;
  ncm: string;
  codigo_barras: string;
  pedido_id: string;
  valor_frete: number;
  data_prevista: string;
  obs: string;
  obs_interna: string;
  cidade: string;
  uf: string;
  url_rastreamento: string;
  situacao: string;
  codigo_rastreamento: string;
  numero_ecommerce: string;
  valor_desconto: number;
  numero_venda: string;
  sku_estoque: string;
  sku_kit: string;
  qtd_kit: number;
  total_itens: number;
}