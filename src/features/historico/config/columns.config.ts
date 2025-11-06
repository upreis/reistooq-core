// Configuração EXATA de 45 colunas para histórico
export interface ColumnDefinition {
  key: string;
  label: string;
  category: 'basic' | 'products' | 'financial' | 'mapping' | 'shipping' | 'meta' | 'ml';
  default: boolean;
  width?: number;
}

export const HISTORICO_COLUMN_DEFINITIONS: ColumnDefinition[] = [
  // 1-6: IDENTIFICAÇÃO E DATAS
  { key: 'id_unico', label: 'ID-Único', category: 'basic', default: true, width: 150 },
  { key: 'empresa', label: 'Empresa', category: 'basic', default: true, width: 120 },
  { key: 'numero_pedido', label: 'Número do Pedido', category: 'basic', default: true, width: 150 },
  { key: 'nome_completo', label: 'Nome Completo', category: 'basic', default: true, width: 200 },
  { key: 'data_pedido', label: 'Data do Pedido', category: 'basic', default: true, width: 130 },
  { key: 'ultima_atualizacao', label: 'Última Atualização', category: 'basic', default: true, width: 160 },
  
  // 7-9: PRODUTOS
  { key: 'sku_produto', label: 'SKUs/Produtos', category: 'products', default: true, width: 150 },
  { key: 'quantidade_total', label: 'Quantidade Total', category: 'products', default: true, width: 130 },
  { key: 'titulo_produto', label: 'Título do Produto', category: 'products', default: true, width: 250 },
  
  // 10-17: FINANCEIRAS
  { key: 'valor_total', label: 'Valor Total', category: 'financial', default: true, width: 120 },
  { key: 'receita_flex_bonus', label: 'Receita Flex (Bônus)', category: 'financial', default: true, width: 150 },
  { key: 'taxa_marketplace', label: 'Taxa Marketplace', category: 'financial', default: true, width: 140 },
  { key: 'custo_envio_seller', label: 'Custo Envio Seller', category: 'financial', default: true, width: 150 },
  { key: 'custo_fixo_meli', label: 'Custo Fixo Meli', category: 'financial', default: true, width: 140 },
  { key: 'valor_liquido_vendedor', label: 'Valor Líquido Vendedor', category: 'financial', default: true, width: 170 },
  { key: 'metodo_pagamento', label: 'Método Pagamento', category: 'financial', default: true, width: 150 },
  { key: 'status_pagamento', label: 'Status Pagamento', category: 'financial', default: true, width: 150 },
  
  // 18-23: MAPEAMENTO / ESTOQUE
  { key: 'cpf_cnpj', label: 'CPF/CNPJ', category: 'mapping', default: true, width: 140 },
  { key: 'sku_estoque', label: 'SKU Estoque', category: 'mapping', default: true, width: 130 },
  { key: 'sku_kit', label: 'SKU KIT', category: 'mapping', default: true, width: 120 },
  { key: 'quantidade_kit', label: 'Quantidade KIT', category: 'mapping', default: true, width: 130 },
  { key: 'total_itens', label: 'Total de Itens', category: 'mapping', default: true, width: 120 },
  { key: 'status_baixa', label: 'Status da Baixa', category: 'mapping', default: true, width: 140 },
  
  // 24-33: STATUS E ENVIO
  { key: 'status_resumos', label: 'Status Insumos', category: 'shipping', default: true, width: 140 },
  { key: 'marketplace', label: 'Marketplace', category: 'ml', default: true, width: 130 },
  { key: 'local_estoque', label: 'Local de Estoque', category: 'shipping', default: true, width: 150 },
  { key: 'status', label: 'Situação do Pedido', category: 'shipping', default: true, width: 150 },
  { key: 'status_envio', label: 'Status do Envio', category: 'shipping', default: true, width: 140 },
  { key: 'tipo_logistico', label: 'Tipo Logístico', category: 'shipping', default: true, width: 130 },
  { key: 'medalha', label: 'Medalha', category: 'ml', default: true, width: 110 },
  { key: 'reputacao', label: 'Reputação', category: 'ml', default: true, width: 120 },
  { key: 'condicao', label: 'Condição', category: 'ml', default: true, width: 110 },
  { key: 'substatus_detail', label: 'Substatus do Envio', category: 'shipping', default: true, width: 160 },
  
  // 34-35: RASTREAMENTO
  { key: 'codigo_rastreamento', label: 'Código Rastreamento', category: 'shipping', default: true, width: 180 },
  { key: 'url_rastreamento', label: 'URL Rastreamento', category: 'shipping', default: true, width: 150 },
  
  // 36-41: ENDEREÇO
  { key: 'endereco_rua', label: 'Rua', category: 'shipping', default: true, width: 200 },
  { key: 'endereco_numero', label: 'Número', category: 'shipping', default: true, width: 90 },
  { key: 'endereco_bairro', label: 'Bairro', category: 'shipping', default: true, width: 150 },
  { key: 'endereco_cep', label: 'CEP', category: 'shipping', default: true, width: 110 },
  { key: 'endereco_cidade', label: 'Cidade', category: 'shipping', default: true, width: 150 },
  { key: 'endereco_uf', label: 'UF', category: 'shipping', default: true, width: 70 },
  
  // 42-45: METADADOS ML
  { key: 'data_criacao_ml', label: 'Data Criação ML', category: 'meta', default: true, width: 150 },
  { key: 'pack_id', label: 'Pack ID', category: 'meta', default: true, width: 120 },
  { key: 'pickup_id', label: 'Pickup ID', category: 'meta', default: true, width: 130 },
  { key: 'tags_pedido', label: 'Tags do Pedido', category: 'meta', default: true, width: 180 },
];

export function getDefaultVisibleColumns(): string[] {
  return HISTORICO_COLUMN_DEFINITIONS
    .filter(col => col.default)
    .map(col => col.key);
}
