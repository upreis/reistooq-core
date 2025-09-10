/**
 * 🎯 CONFIGURAÇÃO DE COLUNAS PARA HISTÓRICO
 * Baseada na configuração de pedidos, mas adaptada para os dados de histórico
 */

import { ColumnDefinition, ColumnProfile } from '../../pedidos/types/columns.types';

// 🔸 COLUNAS DO HISTÓRICO (baseadas em pedidos + campos específicos)
export const HISTORICO_COLUMN_DEFINITIONS: ColumnDefinition[] = [
  // ====== BÁSICAS ======
  {
    key: 'id_unico',
    label: 'ID-Único',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Identificador único do pedido',
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
    key: 'updated_at',
    label: 'Última Atualização',
    category: 'basic',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Data da última atualização do pedido',
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
    description: 'SKUs dos produtos no pedido',
    width: 150
  },
  {
    key: 'quantidade_total',
    label: 'Quantidade Total',
    category: 'products',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Quantidade total de itens',
    width: 120,
    sortable: true
  },
  {
    key: 'titulo_produto',
    label: 'Título do Produto',
    category: 'products',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Título/nome do produto',
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
    width: 120,
    sortable: true
  },
  {
    key: 'valor_pago',
    label: 'Valor Pago',
    category: 'financial',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Valor efetivamente pago',
    width: 120,
    sortable: true
  },
  {
    key: 'frete_pago_cliente',
    label: 'Frete Pago Cliente',
    category: 'financial',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Valor do frete pago pelo cliente',
    width: 140,
    sortable: true
  },
  {
    key: 'receita_flex_bonus',
    label: 'Receita Flex (Bônus)',
    category: 'financial',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Receita de bônus flex',
    width: 140,
    sortable: true
  },
  {
    key: 'desconto_cupom',
    label: 'Desconto Cupom',
    category: 'financial',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Valor do desconto aplicado por cupom',
    width: 120,
    sortable: true
  },
  {
    key: 'taxa_marketplace',
    label: 'Taxa Marketplace',
    category: 'financial',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Taxa cobrada pelo marketplace',
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
    width: 160,
    sortable: true
  },
  {
    key: 'metodo_pagamento',
    label: 'Método Pagamento',
    category: 'financial',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Método de pagamento utilizado',
    width: 140
  },
  {
    key: 'status_pagamento',
    label: 'Status Pagamento',
    category: 'financial',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Status atual do pagamento',
    width: 130
  },
  {
    key: 'tipo_pagamento',
    label: 'Tipo Pagamento',
    category: 'financial',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Tipo de pagamento',
    width: 120
  },
  {
    key: 'custo_envio_seller',
    label: 'Custo Envio Seller',
    category: 'financial',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Custo de envio para o vendedor',
    width: 140,
    sortable: true
  },

  // ====== MAPEAMENTO ======
  {
    key: 'cpf_cnpj',
    label: 'CPF/CNPJ',
    category: 'mapping',
    priority: 'important',
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
    description: 'SKU mapeado para controle de estoque',
    width: 120
  },
  {
    key: 'sku_kit',
    label: 'SKU KIT',
    category: 'mapping',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'SKU do kit (se aplicável)',
    width: 100
  },
  {
    key: 'qtd_kit',
    label: 'Quantidade KIT',
    category: 'mapping',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Quantidade do kit',
    width: 120,
    sortable: true
  },
  {
    key: 'total_itens',
    label: 'Total de Itens',
    category: 'mapping',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Total de itens no pedido',
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
    width: 120
  },

  // ====== ENVIO ======
  {
    key: 'situacao',
    label: 'Situação do Pedido',
    category: 'shipping',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Situação atual do pedido',
    width: 140
  },
  {
    key: 'status_envio',
    label: 'Status do Envio',
    category: 'shipping',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Status atual do envio',
    width: 120
  },
  {
    key: 'logistic_mode_principal',
    label: 'Logistic Mode (Principal)',
    category: 'shipping',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Modo logístico principal',
    width: 160
  },
  {
    key: 'tipo_logistico',
    label: 'Tipo Logístico',
    category: 'shipping',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Tipo de logística utilizada',
    width: 120
  },
  {
    key: 'tipo_metodo_envio',
    label: 'Tipo Método Envio',
    category: 'shipping',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Tipo do método de envio',
    width: 140
  },
  {
    key: 'substatus_estado_atual',
    label: 'Substatus (Estado Atual)',
    category: 'shipping',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Substatus do estado atual',
    width: 170
  },
  {
    key: 'modo_envio_combinado',
    label: 'Modo de Envio (Combinado)',
    category: 'shipping',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Modo de envio combinado',
    width: 180
  },
  {
    key: 'metodo_envio_combinado',
    label: 'Método de Envio (Combinado)',
    category: 'shipping',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Método de envio combinado',
    width: 190
  },
  {
    key: 'rua',
    label: 'Rua',
    category: 'shipping',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Endereço - Rua',
    width: 150
  },
  {
    key: 'numero',
    label: 'Número',
    category: 'shipping',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Endereço - Número',
    width: 80
  },
  {
    key: 'bairro',
    label: 'Bairro',
    category: 'shipping',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Endereço - Bairro',
    width: 120
  },
  {
    key: 'cep',
    label: 'CEP',
    category: 'shipping',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Código postal',
    width: 100
  },
  {
    key: 'cidade',
    label: 'Cidade',
    category: 'shipping',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Cidade de entrega',
    width: 120
  },
  {
    key: 'uf',
    label: 'UF',
    category: 'shipping',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Estado/UF de entrega',
    width: 60
  },

  // ====== MERCADO LIVRE ======
  {
    key: 'date_created',
    label: 'Data Criação ML',
    category: 'ml',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Data de criação no Mercado Livre',
    width: 130,
    sortable: true
  },
  {
    key: 'pack_id',
    label: 'Pack ID',
    category: 'ml',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'ID do pacote ML',
    width: 100
  },
  {
    key: 'pickup_id',
    label: 'Pickup ID',
    category: 'ml',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'ID do pickup ML',
    width: 100
  },
  {
    key: 'tags',
    label: 'Tags',
    category: 'ml',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Tags do pedido',
    width: 120
  },
  {
    key: 'pack_status',
    label: 'Pack Status',
    category: 'ml',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Status do pacote',
    width: 110
  },
  {
    key: 'pack_status_detail',
    label: 'Pack Status Detail',
    category: 'ml',
    priority: 'optional',
    visible: true,
    default: true,
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