// Configuração unificada de colunas para histórico
export interface ColumnDefinition {
  key: string;
  label: string;
  category: 'basic' | 'products' | 'financial' | 'mapping' | 'shipping' | 'meta' | 'ml';
  default: boolean;
  width?: number;
}

export const HISTORICO_COLUMN_DEFINITIONS: ColumnDefinition[] = [
  // === BÁSICAS ===
  { key: 'numero_pedido', label: 'SKUs/Produtos', category: 'basic', default: true, width: 150 },
  { key: 'quantidade_total', label: 'Quantidade Total', category: 'basic', default: true, width: 120 },
  { key: 'titulo_produto', label: 'Título do Produto', category: 'basic', default: true, width: 200 },
  { key: 'valor_total', label: 'Valor Total', category: 'basic', default: true, width: 120 },
  
  // === FINANCEIRAS ===
  { key: 'receita_flex_bonus', label: 'Receita Flex (Bônus)', category: 'financial', default: true, width: 140 },
  { key: 'taxa_marketplace', label: 'Taxa Marketplace', category: 'financial', default: true, width: 140 },
  { key: 'custo_envio_seller', label: 'Custo Envio Seller', category: 'financial', default: true, width: 140 },
  { key: 'custo_fixo_meli', label: 'Custo Fixo Meli', category: 'financial', default: true, width: 120 },
  { key: 'valor_liquido_vendedor', label: 'Valor Líquido Vendedor', category: 'financial', default: true, width: 160 },
  { key: 'metodo_pagamento', label: 'Método Pagamento', category: 'financial', default: true, width: 140 },
  { key: 'status_pagamento', label: 'Status Pagamento', category: 'financial', default: true, width: 140 },
  { key: 'cpf_cnpj', label: 'CPF/CNPJ', category: 'basic', default: true, width: 150 },
  { key: 'sku_estoque', label: 'SKU Estoque', category: 'basic', default: true, width: 150 },
  
  // === MAPEAMENTO / KIT ===
  { key: 'sku_kit', label: 'SKU KIT', category: 'mapping', default: true, width: 120 },
  { key: 'quantidade_kit', label: 'Quantidade KIT', category: 'mapping', default: true, width: 130 },
  { key: 'total_itens', label: 'Total de Itens', category: 'mapping', default: true, width: 120 },
  { key: 'status_baixa', label: 'Status da Baixa', category: 'mapping', default: true, width: 130 },
  
  // === ENVIO ===
  { key: 'status_resumos', label: 'Status Resumos', category: 'shipping', default: true, width: 130 },
  { key: 'marketplace', label: 'Marketplace', category: 'ml', default: true, width: 130 },
  { key: 'local_estoque', label: 'Local de Estoque', category: 'shipping', default: true, width: 150 },
  { key: 'status_envio', label: 'Status do Envio', category: 'shipping', default: true, width: 140 },
  { key: 'tipo_logistico', label: 'Tipo Logístico', category: 'shipping', default: true, width: 130 },
  { key: 'medalha', label: 'Medalha', category: 'ml', default: true, width: 120 },
  { key: 'reputacao', label: 'Reputação', category: 'ml', default: true, width: 120 },
  { key: 'condicao', label: 'Condição', category: 'ml', default: true, width: 120 },
  
  // === ENDEREÇO ===
  { key: 'codigo_rastreamento', label: 'Código Rastreamento', category: 'shipping', default: true, width: 180 },
  { key: 'url_rastreamento', label: 'URL Rastreamento', category: 'shipping', default: true, width: 150 },
  { key: 'endereco_rua', label: 'Rua', category: 'shipping', default: true, width: 200 },
  { key: 'endereco_numero', label: 'Número', category: 'shipping', default: true, width: 100 },
  { key: 'endereco_bairro', label: 'Bairro', category: 'shipping', default: true, width: 150 },
  { key: 'endereco_cep', label: 'CEP', category: 'shipping', default: true, width: 120 },
  { key: 'endereco_cidade', label: 'Cidade', category: 'shipping', default: true, width: 150 },
  { key: 'endereco_uf', label: 'UF', category: 'shipping', default: true, width: 80 },
  
  // === METADADOS ML ===
  { key: 'data_criacao_ml', label: 'Data Criação ML', category: 'meta', default: true, width: 160 },
  { key: 'pack_id', label: 'Pack ID', category: 'meta', default: true, width: 120 },
  { key: 'pickup_id', label: 'Pickup ID', category: 'meta', default: true, width: 140 },
  { key: 'tags_pedido', label: 'Tags do Pedido', category: 'meta', default: true, width: 180 },
];

export function getDefaultVisibleColumns(): string[] {
  return HISTORICO_COLUMN_DEFINITIONS
    .filter(col => col.default)
    .map(col => col.key);
}
