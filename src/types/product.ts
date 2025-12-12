// =============================================================================
// PRODUCT TYPES - DEFINIÇÕES CENTRALIZADAS
// =============================================================================
// Este arquivo centraliza os tipos de produtos para evitar duplicação
// e facilitar manutenção. Importar de @/types/product em vez de @/hooks/useProducts
// quando precisar apenas dos tipos.
// =============================================================================

// Base product interface matching database columns
export interface BaseProduct {
  id: string;
  sku_interno: string;
  nome: string;
  categoria: string | null;
  descricao: string | null;
  codigo_barras: string | null;
  quantidade_atual: number;
  estoque_minimo: number;
  estoque_maximo: number;
  preco_custo: number | null;
  preco_venda: number | null;
  localizacao: string | null;
  unidade_medida_id: string | null;
  status: string;
  ativo: boolean;
  url_imagem: string | null;
  created_at: string;
  updated_at: string;
  ultima_movimentacao: string | null;
  organization_id: string | null;
  integration_account_id: string | null;
  sku_pai: string | null;
  eh_produto_pai?: boolean | null;
}

// Extended interface with additional fields for template import
export interface Product extends BaseProduct {
  // Additional fields from import template (optional for backwards compatibility)
  material?: string | null;
  cor?: string | null;
  peso_unitario_g?: number | null;
  peso_cx_master_kg?: number | null;
  comprimento_cm?: number | null;
  largura_cm?: number | null;
  altura_cm?: number | null;
  cbm_cubagem?: number | null;
  cubagem_cm3?: number | null;
  ncm?: string | null;
  pis?: number | null;
  cofins?: number | null;
  imposto_importacao?: number | null;
  ipi?: number | null;
  icms?: number | null;
  url_imagem_fornecedor?: string | null;
  package?: string | null;
  package_info?: string | null;
  observacoes?: string | null;
  unidade?: string | null;
  pcs_ctn?: number | null;
  // Novos campos adicionados via migration
  peso_bruto_kg?: number | null;
  peso_liquido_kg?: number | null;
  dias_preparacao?: number | null;
  tipo_embalagem?: string | null;
  codigo_cest?: string | null;
  origem?: number | null;
  sob_encomenda?: boolean | null;
  numero_volumes?: number | null;
  // Campos de categoria hierárquica
  categoria_principal?: string | null;
  categoria_nivel2?: string | null;
  subcategoria?: string | null;
  // Aliases para compatibilidade com código existente
  largura?: number | null; // Alias para largura_cm
  altura?: number | null; // Alias para altura_cm
  comprimento?: number | null; // Alias para comprimento_cm
}
