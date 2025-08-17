/**
 * Type definitions for safe database views
 * Used to avoid TypeScript errors when accessing masked/safe views
 */

export interface ProfilesSafeRow {
  id: string;
  nome_completo: string | null;
  nome_exibicao: string | null;
  telefone: string | null; // Masked with ****XXXX format
  cargo: string | null;
  departamento: string | null;
  organizacao_id: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  onboarding_banner_dismissed: boolean;
  configuracoes_notificacao: any;
}

export interface HistoricoVendasSafeRow {
  id: string;
  id_unico: string;
  numero_pedido: string;
  sku_produto: string;
  descricao: string | null;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  status: string;
  observacoes: string | null;
  data_pedido: string;
  created_at: string;
  updated_at: string;
  ncm: string | null;
  codigo_barras: string | null;
  pedido_id: string | null;
  valor_frete: number | null;
  data_prevista: string | null;
  obs: string | null;
  obs_interna: string | null;
  cidade: string | null;
  uf: string | null;
  url_rastreamento: string | null;
  situacao: string | null;
  codigo_rastreamento: string | null;
  numero_ecommerce: string | null;
  valor_desconto: number | null;
  numero_venda: string | null;
  sku_estoque: string | null;
  sku_kit: string | null;
  qtd_kit: number | null;
  total_itens: number | null;
}

// Extend the Supabase Database type to include safe views
declare module '@/integrations/supabase/types' {
  interface Database {
    public: {
      Tables: {
        profiles_safe: {
          Row: ProfilesSafeRow;
          Insert: never; // Safe views are read-only
          Update: never;
        };
        historico_vendas_safe: {
          Row: HistoricoVendasSafeRow;
          Insert: never;
          Update: never;
        };
      };
    };
  }
}