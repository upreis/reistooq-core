/**
 * 🎯 CONFIGURAÇÃO DE COLUNAS PARA HISTÓRICO
 * ✅ SINCRONIZADA COM /PEDIDOS - Mesmas colunas disponíveis
 */

import { ColumnDefinition, ColumnProfile } from '../../pedidos/types/columns.types';

// 🔸 COLUNAS DO HISTÓRICO - SINCRONIZADAS COM PEDIDOS
export const HISTORICO_COLUMN_DEFINITIONS: ColumnDefinition[] = [
  // ====== BÁSICAS ======
  {
    key: 'id',
    label: 'ID-Único',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Identificador único do pedido',
    width: 250,
    sortable: true
  },
  {
    key: 'id_unico',
    label: 'ID-Único (Legacy)',
    category: 'basic',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Identificador único legado',
    width: 120,
    sortable: true
  },
  {
    key: 'empresa',
    label: 'Empresa',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Nome da conta/empresa dona do pedido',
    width: 120
  },
  {
    key: 'numero_pedido',
    label: 'Número do Pedido',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Número identificador do pedido',
    width: 120,
    sortable: true
  },
  {
    key: 'cliente_nome',
    label: 'Nome do Cliente',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Nome do cliente',
    width: 180,
    sortable: true
  },
  {
    key: 'nome_completo',
    label: 'Nome Completo',
    category: 'basic',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Nome completo do cliente',
    width: 200,
    sortable: true
  },
  {
    key: 'data_pedido',
    label: 'Data do Pedido',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Data em que o pedido foi criado',
    width: 120,
    sortable: true
  },
  {
    key: 'last_updated',
    label: 'Última Atualização',
    category: 'basic',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Data da última atualização',
    width: 130,
    sortable: true
  },
  {
    key: 'updated_at',
    label: 'Atualização DB',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Timestamp de atualização no banco',
    width: 140,
    sortable: true
  },

  // ====== PRODUTOS ======
  {
    key: 'skus_produtos',
    label: 'SKUs/Produtos',
    category: 'products',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Lista de SKUs dos produtos',
    width: 200
  },
  {
    key: 'quantidade_itens',
    label: 'Quantidade Total',
    category: 'products',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Quantidade total de itens',
    width: 100,
    sortable: true
  },
  {
    key: 'quantidade_total',
    label: 'Qtd Total (Legacy)',
    category: 'products',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Quantidade total legado',
    width: 120,
    sortable: true
  },
  {
    key: 'titulo_anuncio',
    label: 'Título do Produto',
    category: 'products',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Título do produto/anúncio',
    width: 300
  },
  {
    key: 'titulo_produto',
    label: 'Título (Legacy)',
    category: 'products',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Título legado',
    width: 200
  },

  // ====== FINANCEIRAS ======
  {
    key: 'valor_total',
    label: 'Valor Total',
    category: 'financial',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Valor total do pedido',
    width: 100,
    sortable: true
  },
  {
    key: 'receita_flex',
    label: 'Receita Flex (Bônus)',
    category: 'financial',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Receita adicional do Mercado Envios Flex',
    width: 140,
    sortable: true
  },
  {
    key: 'receita_flex_bonus',
    label: 'Receita Flex (Legacy)',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Receita Flex legado',
    width: 140,
    sortable: true
  },
  {
    key: 'marketplace_fee',
    label: 'Taxa Marketplace',
    category: 'financial',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Taxa cobrada pelo marketplace',
    width: 120,
    sortable: true
  },
  {
    key: 'custo_envio_seller',
    label: 'Custo Envio Seller',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Custo de envio pago pelo vendedor',
    width: 130,
    sortable: true
  },
  {
    key: 'custo_fixo_meli',
    label: 'Custo Fixo Meli',
    category: 'financial',
    priority: 'important',
    visible: false,
    default: false,
    description: 'Custo fixo adicional para produtos abaixo de R$ 79',
    width: 130,
    sortable: true
  },
  {
    key: 'valor_liquido_vendedor',
    label: 'Valor Líquido Vendedor',
    category: 'financial',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Valor líquido recebido pelo vendedor',
    width: 150,
    sortable: true
  },
  {
    key: 'payment_method',
    label: 'Método Pagamento',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Método de pagamento utilizado',
    width: 150
  },
  {
    key: 'payment_status',
    label: 'Status Pagamento',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Status do pagamento',
    width: 120
  },

  // ====== MAPEAMENTO ======
  {
    key: 'cpf_cnpj',
    label: 'CPF/CNPJ',
    category: 'mapping',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'CPF ou CNPJ do cliente',
    width: 130
  },
  {
    key: 'sku_estoque',
    label: 'SKU Estoque',
    category: 'mapping',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'SKU correspondente no estoque',
    width: 200
  },
  {
    key: 'sku_kit',
    label: 'SKU KIT',
    category: 'mapping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'SKU do kit',
    width: 200
  },
  {
    key: 'qtd_kit',
    label: 'Quantidade KIT',
    category: 'mapping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Quantidade do kit',
    width: 100,
    sortable: true
  },
  {
    key: 'total_itens',
    label: 'Total de Itens',
    category: 'mapping',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Total de itens (qtd vendida x quantidade KIT)',
    width: 110,
    sortable: true
  },
  {
    key: 'status_baixa',
    label: 'Status da Baixa',
    category: 'mapping',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Status da baixa de estoque',
    width: 130
  },
  {
    key: 'status_insumos',
    label: 'Status Insumos',
    category: 'mapping',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Status de validação dos insumos (matéria-prima)',
    width: 130
  },
  {
    key: 'marketplace_origem',
    label: 'Marketplace',
    category: 'mapping',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Origem do pedido (Mercado Livre, Shopee, Tiny ou Interno)',
    width: 150
  },
  {
    key: 'local_estoque',
    label: 'Local de Estoque',
    category: 'mapping',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Local de onde o estoque será retirado',
    width: 200
  },

  // ====== ENVIO/SHIPPING ======
  {
    key: 'situacao',
    label: 'Situação do Pedido',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Situação geral do pedido',
    width: 110
  },
  {
    key: 'shipping_status',
    label: 'Status do Envio',
    category: 'shipping',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Status específico do envio',
    width: 120
  },
  {
    key: 'logistic_type',
    label: 'Tipo Logístico',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Tipo de logística',
    width: 120
  },
  {
    key: 'shipping_substatus',
    label: 'Substatus do Envio',
    category: 'shipping',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Substatus detalhado do envio',
    width: 160,
    filterable: true
  },
  {
    key: 'codigo_rastreamento',
    label: 'Código Rastreamento',
    category: 'shipping',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Código de rastreamento do envio',
    width: 150
  },
  {
    key: 'url_rastreamento',
    label: 'URL Rastreamento',
    category: 'shipping',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Link para rastreamento do envio',
    width: 80
  },

  // ====== ENDEREÇO ======
  {
    key: 'endereco_rua',
    label: 'Rua',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Rua do destinatário',
    width: 200
  },
  {
    key: 'endereco_numero',
    label: 'Número',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Número do endereço',
    width: 80
  },
  {
    key: 'endereco_bairro',
    label: 'Bairro',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Bairro do destinatário',
    width: 150
  },
  {
    key: 'endereco_cep',
    label: 'CEP',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'CEP do endereço',
    width: 100
  },
  {
    key: 'cidade',
    label: 'Cidade',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Cidade do destinatário',
    width: 150
  },
  {
    key: 'uf',
    label: 'UF',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Estado/UF',
    width: 60
  },

  // ====== MERCADO LIVRE ======
  {
    key: 'date_created',
    label: 'Data Criação ML',
    category: 'ml',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Data de criação no Mercado Livre',
    width: 130,
    sortable: true
  },
  {
    key: 'pack_id',
    label: 'Pack ID',
    category: 'ml',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'ID do pacote ML',
    width: 100
  },
  {
    key: 'pickup_id',
    label: 'Pickup ID',
    category: 'ml',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'ID do pickup ML',
    width: 100
  },
  {
    key: 'tags',
    label: 'Tags',
    category: 'ml',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Tags do pedido',
    width: 120
  },
  {
    key: 'pack_status',
    label: 'Pack Status',
    category: 'ml',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Status do pacote',
    width: 110
  },
  {
    key: 'pack_status_detail',
    label: 'Pack Status Detail',
    category: 'ml',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Detalhe do status do pacote',
    width: 150
  }
];

// 🎯 PERFIS PRÉ-DEFINIDOS PARA HISTÓRICO
export const HISTORICO_DEFAULT_PROFILES: ColumnProfile[] = [
  {
    id: 'essential',
    name: 'Essencial',
    description: 'Apenas colunas essenciais para análise básica do histórico',
    columns: HISTORICO_COLUMN_DEFINITIONS
      .filter(col => col.priority === 'essential')
      .map(col => col.key)
  },
  {
    id: 'standard',
    name: 'Padrão',
    description: 'Configuração padrão para histórico de vendas',
    columns: HISTORICO_COLUMN_DEFINITIONS
      .filter(col => col.default === true)
      .map(col => col.key)
  },
  {
    id: 'financial',
    name: 'Financeiro',
    description: 'Foco em análise financeira e de pagamentos',
    columns: [
      'id_unico', 'numero_pedido', 'cliente_nome', 'data_pedido',
      'valor_total', 'valor_pago', 'frete_pago_cliente', 'receita_flex_bonus',
      'valor_liquido_vendedor', 'taxa_marketplace', 'metodo_pagamento',
      'status_pagamento', 'tipo_pagamento', 'desconto_cupom'
    ]
  },
  {
    id: 'logistic',
    name: 'Logística',
    description: 'Foco em envio e rastreamento',
    columns: [
      'id_unico', 'numero_pedido', 'cliente_nome', 'nome_completo', 'data_pedido',
      'situacao', 'status_envio', 'logistic_mode_principal', 'tipo_logistico',
      'tipo_metodo_envio', 'delivery_type', 'substatus_estado_atual',
      'cidade', 'uf', 'codigo_rastreamento'
    ]
  },
  {
    id: 'mapping',
    name: 'Mapeamento',
    description: 'Foco em análise de mapeamento e baixa de estoque',
    columns: [
      'id_unico', 'numero_pedido', 'skus_produtos', 'quantidade_itens',
      'status_mapeamento', 'sku_estoque', 'sku_kit', 'qtd_kit', 'total_itens', 'status_baixa'
    ]
  },
  {
    id: 'complete',
    name: 'Completo',
    description: 'Todas as colunas disponíveis',
    columns: HISTORICO_COLUMN_DEFINITIONS.map(col => col.key)
  }
];

// 🔧 HELPERS PARA HISTÓRICO
export const getHistoricoColumnsByCategory = (category: keyof typeof import('../../pedidos/config/columns.config').CATEGORY_LABELS) => {
  return HISTORICO_COLUMN_DEFINITIONS.filter(col => col.category === category);
};

export const getHistoricoEssentialColumns = () => {
  return HISTORICO_COLUMN_DEFINITIONS.filter(col => col.priority === 'essential');
};

export const getHistoricoDefaultVisibleColumns = () => {
  return HISTORICO_COLUMN_DEFINITIONS.filter(col => col.default === true);
};

export const getHistoricoColumnDefinition = (key: string) => {
  return HISTORICO_COLUMN_DEFINITIONS.find(col => col.key === key);
};