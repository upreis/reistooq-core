/**
 * 🎯 CONFIGURAÇÃO DE COLUNAS PARA HISTÓRICO
 * Baseada na configuração de pedidos, mas adaptada para os dados de histórico
 */

import { ColumnDefinition, ColumnProfile } from '../../pedidos/types/columns.types';

// 🔸 COLUNAS DO HISTÓRICO (baseadas em pedidos + campos específicos)
export const HISTORICO_COLUMN_DEFINITIONS: ColumnDefinition[] = [
  // ====== BÁSICAS ======
  {
    key: 'id',
    label: 'ID',
    category: 'basic',
    priority: 'essential',
    visible: false,
    default: false,
    description: 'ID interno do registro',
    width: 100
  },
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
    description: 'Nome do comprador',
    width: 150
  },
  {
    key: 'nome_completo',
    label: 'Nome Completo',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Nome completo do destinatário',
    width: 150
  },
  {
    key: 'data_pedido',
    label: 'Data do Pedido',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Data de criação do pedido',
    width: 110,
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

  // ====== PRODUTOS ======
  {
    key: 'skus_produtos',
    label: 'SKUs/Produtos',
    category: 'products',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Lista de SKUs dos produtos',
    width: 180
  },
  {
    key: 'sku_produto',
    label: 'SKU Principal',
    category: 'products',
    priority: 'important',
    visible: true,
    default: false,
    description: 'SKU principal do produto',
    width: 120
  },
  {
    key: 'quantidade_itens',
    label: 'Quantidade Items',
    category: 'products',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Quantidade de itens vendidos',
    width: 100,
    sortable: true
  },
  {
    key: 'quantidade_total',
    label: 'Quantidade Total',
    category: 'products',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Quantidade total considerando kits',
    width: 110,
    sortable: true
  },
  {
    key: 'titulo_produto',
    label: 'Título do Produto',
    category: 'products',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Título do produto/anúncio',
    width: 200
  },
  {
    key: 'descricao',
    label: 'Descrição',
    category: 'products',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Descrição do produto',
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
    key: 'valor_pago',
    label: 'Valor Pago',
    category: 'financial',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Valor efetivamente pago',
    width: 100,
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
    width: 120,
    sortable: true
  },
  {
    key: 'receita_flex_bonus',
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
    key: 'desconto_cupom',
    label: 'Desconto Cupom',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Valor de desconto por cupom',
    width: 120,
    sortable: true
  },
  {
    key: 'taxa_marketplace',
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
    key: 'metodo_pagamento',
    label: 'Método Pagamento',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Método de pagamento utilizado',
    width: 130
  },
  {
    key: 'status_pagamento',
    label: 'Status Pagamento',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Status do pagamento',
    width: 120
  },
  {
    key: 'tipo_pagamento',
    label: 'Tipo Pagamento',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Tipo de pagamento',
    width: 120
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
    key: 'valor_unitario',
    label: 'Valor Unitário',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Valor unitário do produto',
    width: 120,
    sortable: true
  },
  {
    key: 'valor_frete',
    label: 'Valor Frete',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Valor do frete',
    width: 120,
    sortable: true
  },
  {
    key: 'valor_desconto',
    label: 'Valor Desconto',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Valor total de desconto',
    width: 120,
    sortable: true
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
    width: 120
  },
  {
    key: 'sku_kit',
    label: 'SKU KIT',
    category: 'mapping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'SKU do kit',
    width: 100
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
    width: 120
  },
  {
    key: 'status_mapeamento',
    label: 'Status Mapeamento',
    category: 'mapping',
    priority: 'important',
    visible: true,
    default: false,
    description: 'Status do mapeamento do produto',
    width: 130
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
    key: 'status_envio',
    label: 'Status do Envio',
    category: 'shipping',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Status específico do envio',
    width: 120
  },
  {
    key: 'logistic_mode_principal',
    label: 'Logistic Mode (Principal)',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Modo logístico principal',
    width: 150
  },
  {
    key: 'tipo_logistico',
    label: 'Tipo Logístico',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Tipo de logística',
    width: 120
  },
  {
    key: 'tipo_metodo_envio',
    label: 'Tipo Método Envio',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Tipo do método de envio',
    width: 160
  },
  {
    key: 'substatus_estado_atual',
    label: 'Substatus (Estado Atual)',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Sub-status detalhado atual',
    width: 160
  },
  {
    key: 'modo_envio_combinado',
    label: 'Modo de Envio (Combinado)',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Modo de envio combinado',
    width: 170
  },
  {
    key: 'metodo_envio_combinado',
    label: 'Método de Envio (Combinado)',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Método de envio combinado',
    width: 180
  },
  {
    key: 'delivery_type',
    label: 'Tipo de Entrega',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Tipo de entrega',
    width: 120
  },
  {
    key: 'substatus_detail',
    label: 'Substatus Detail',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Detalhes do substatus',
    width: 140
  },
  {
    key: 'shipping_method',
    label: 'Shipping Method',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Método de envio específico',
    width: 140
  },
  {
    key: 'shipping_mode',
    label: 'Shipping Mode',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Modo de envio específico',
    width: 140
  },

  // ====== ENDEREÇO ======
  {
    key: 'rua',
    label: 'Rua',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Rua do destinatário',
    width: 160
  },
  {
    key: 'numero',
    label: 'Número',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Número do endereço',
    width: 90
  },
  {
    key: 'bairro',
    label: 'Bairro',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Bairro do destinatário',
    width: 140
  },
  {
    key: 'cep',
    label: 'CEP',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'CEP do destinatário',
    width: 110,
    sortable: true
  },
  {
    key: 'cidade',
    label: 'Cidade',
    category: 'shipping',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Cidade do destinatário',
    width: 140
  },
  {
    key: 'uf',
    label: 'UF',
    category: 'shipping',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Estado (UF) do destinatário',
    width: 70
  },

  // ====== METADADOS ML ======
  {
    key: 'date_created',
    label: 'Data Criação ML',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Data de criação no ML',
    width: 120,
    sortable: true
  },
  {
    key: 'pack_id',
    label: 'Pack ID',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'ID do pacote',
    width: 100
  },
  {
    key: 'pickup_id',
    label: 'Pickup ID',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'ID de retirada',
    width: 100
  },
  {
    key: 'pack_status',
    label: 'Pack Status',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Status do pack',
    width: 120
  },
  {
    key: 'pack_status_detail',
    label: 'Pack Status Detail',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Detalhes do status do pack',
    width: 140
  },
  {
    key: 'tags',
    label: 'Tags',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Tags do ML',
    width: 120
  },

  // ====== SISTEMA ======
  {
    key: 'status',
    label: 'Status',
    category: 'basic',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Status do registro',
    width: 100
  },
  {
    key: 'created_at',
    label: 'Criado em',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Data de criação do registro',
    width: 130,
    sortable: true
  },
  {
    key: 'updated_at',
    label: 'Atualizado em',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Data de atualização do registro',
    width: 130,
    sortable: true
  },
  {
    key: 'ultima_atualizacao',
    label: 'Última Atualização',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Última atualização do pedido original',
    width: 150,
    sortable: true
  },
  {
    key: 'integration_account_id',
    label: 'Account ID',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'ID da conta de integração',
    width: 120
  },
  {
    key: 'created_by',
    label: 'Criado por',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Usuário que criou o registro',
    width: 120
  },

  // ====== CAMPOS EXTRAS/OBSERVAÇÕES ======
  {
    key: 'numero_ecommerce',
    label: 'Número E-commerce',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Número do pedido no e-commerce',
    width: 140
  },
  {
    key: 'numero_venda',
    label: 'Número Venda',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Número da venda',
    width: 120
  },
  {
    key: 'data_prevista',
    label: 'Data Prevista',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Data prevista de entrega',
    width: 120,
    sortable: true
  },
  {
    key: 'obs',
    label: 'Observações',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Observações do pedido',
    width: 200
  },
  {
    key: 'obs_interna',
    label: 'Obs. Interna',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Observações internas',
    width: 200
  },
  {
    key: 'codigo_rastreamento',
    label: 'Código Rastreamento',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Código de rastreamento da entrega',
    width: 160
  },
  {
    key: 'url_rastreamento',
    label: 'URL Rastreamento',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'URL para rastreamento da entrega',
    width: 160
  },
  {
    key: 'codigo_barras',
    label: 'Código de Barras',
    category: 'products',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Código de barras do produto',
    width: 130
  },
  {
    key: 'ncm',
    label: 'NCM',
    category: 'products',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Código NCM do produto',
    width: 100
  },
  {
    key: 'observacoes',
    label: 'Observações Gerais',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Observações gerais',
    width: 200
  },
  {
    key: 'pedido_id',
    label: 'Pedido ID',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'ID do pedido original',
    width: 120
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