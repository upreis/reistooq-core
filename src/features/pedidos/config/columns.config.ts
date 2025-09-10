/**
 * 🎯 CONFIGURAÇÃO CENTRALIZADA DE COLUNAS
 * Baseada nas imagens fornecidas - mantém todas as colunas existentes
 */

import { ColumnDefinition, ColumnProfile } from '../types/columns.types';

// 🔸 TODAS AS COLUNAS BASEADAS NAS IMAGENS
export const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  // ====== BÁSICAS (da imagem 1) ======
  {
    key: 'id',
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
    key: 'numero',
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
    key: 'nome_cliente',
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

  // ====== PRODUTOS (da imagem 1) ======
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
    key: 'titulo_anuncio',
    label: 'Título do Produto',
    category: 'products',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Título do produto/anúncio',
    width: 200
  },

  // ====== FINANCEIRAS (da imagem 2) ======
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
    key: 'paid_amount',
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
    key: 'coupon_amount',
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
    width: 130
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
  {
    key: 'payment_type',
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

  // ====== MAPEAMENTO (das imagens 2 e 3) ======
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

  // ====== ENVIO/SHIPPING (da imagem 3) ======
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
    key: 'logistic_mode',
    label: 'Logistic Mode (Principal)',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Modo logístico principal',
    width: 150
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
    key: 'shipping_method_type',
    label: 'Tipo Método Envio',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Tipo do método de envio',
    width: 160
  },
  {
    key: 'delivery_type',
    label: 'Tipo Entrega',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Tipo de entrega',
    width: 120
  },
  {
    key: 'substatus_detail',
    label: 'Substatus (Estado Atual)',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Sub-status detalhado atual',
    width: 160
  },
  {
    key: 'shipping_mode',
    label: 'Modo de Envio (Combinado)',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Modo de envio combinado',
    width: 170
  },
  {
    key: 'shipping_method',
    label: 'Método de Envio (Combinado)',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Método de envio combinado',
    width: 180
  },

  // ====== ENDEREÇO (novo) ======
  {
    key: 'endereco_rua',
    label: 'Rua',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Rua do destinatário',
    width: 160
  },
  {
    key: 'endereco_numero',
    label: 'Número',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Número do endereço',
    width: 90
  },
  {
    key: 'endereco_bairro',
    label: 'Bairro',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Bairro do destinatário',
    width: 140
  },
  {
    key: 'endereco_cep',
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
    key: 'endereco_cidade',
    label: 'Cidade',
    category: 'shipping',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Cidade do destinatário',
    width: 140
  },
  {
    key: 'endereco_uf',
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
    key: 'manufacturing_ending_date',
    label: 'Data Fim Fabricação',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Data limite de fabricação',
    width: 150,
    sortable: true
  },
  {
    key: 'comment',
    label: 'Comentário ML',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Comentários do pedido',
    width: 150
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

  // ====== PACK DATA (Novos campos da documentação ML) ======
  {
    key: 'pack_status',
    label: 'Status Pack',
    category: 'ml',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Status do pack ML',
    width: 120
  },
  {
    key: 'pack_buyer_id',
    label: 'Pack Buyer ID',
    category: 'ml',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'ID do comprador do pack',
    width: 120
  },
  {
    key: 'pack_date_created',
    label: 'Pack Data Criação',
    category: 'ml',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Data de criação do pack',
    width: 140
  },
  {
    key: 'pack_last_updated',
    label: 'Pack Última Atualização',
    category: 'ml',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Última atualização do pack',
    width: 160
  },
  {
    key: 'pack_order_ids',
    label: 'Pack Order IDs',
    category: 'ml',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'IDs dos pedidos no pack',
    width: 140
  },

  // ====== CONTEXT & CHANNEL ======
  {
    key: 'buying_mode',
    label: 'Modo de Compra',
    category: 'ml',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Modo de compra do pedido',
    width: 120
  },
  {
    key: 'channel',
    label: 'Canal',
    category: 'ml',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Canal do pedido',
    width: 100
  },
  {
    key: 'context_channel',
    label: 'Context Channel',
    category: 'ml',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Canal do contexto',
    width: 120
  },
  {
    key: 'context_flow',
    label: 'Context Flow',
    category: 'ml',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Fluxo do contexto',
    width: 120
  },

  // ====== SELLER/BUYER DETAILS ======
  {
    key: 'seller_user_type',
    label: 'Tipo Usuário Vendedor',
    category: 'ml',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Tipo de usuário do vendedor',
    width: 160
  },
  {
    key: 'seller_tags',
    label: 'Tags Vendedor',
    category: 'ml',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Tags do vendedor',
    width: 120
  },
  {
    key: 'seller_status',
    label: 'Status Vendedor',
    category: 'ml',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Status do vendedor',
    width: 120
  },
  {
    key: 'buyer_user_type',
    label: 'Tipo Usuário Comprador',
    category: 'ml',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Tipo de usuário do comprador',
    width: 170
  },
  {
    key: 'buyer_tags',
    label: 'Tags Comprador',
    category: 'ml',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Tags do comprador',
    width: 120
  },
  {
    key: 'buyer_status',
    label: 'Status Comprador',
    category: 'ml',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Status do comprador',
    width: 130
  },

  // ====== MULTI-ORIGEM STOCK ======
  {
    key: 'stock_warehouses',
    label: 'Armazéns Stock',
    category: 'ml',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Armazéns de origem do stock',
    width: 140
  },
  {
    key: 'stock_fulfillment',
    label: 'Stock Fulfillment',
    category: 'ml',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Tipo de fulfillment do stock',
    width: 140
  },

  // ====== ADVANCED FINANCIALS ======
  {
    key: 'marketplace_fee_detail',
    label: 'Detalhes Taxa Marketplace',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Detalhamento das taxas do marketplace',
    width: 180
  },
  {
    key: 'payment_issuer',
    label: 'Emissor Pagamento',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Emissor do pagamento',
    width: 130
  },
  {
    key: 'refund_data',
    label: 'Dados Reembolso',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Informações de reembolso',
    width: 140
  },
  {
    key: 'installments',
    label: 'Parcelas',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Número de parcelas',
    width: 100
  },
  {
    key: 'installment_amount',
    label: 'Valor Parcela',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Valor de cada parcela',
    width: 110
  },

  // ====== TAGS & FEEDBACK ======
  {
    key: 'order_tags',
    label: 'Order Tags',
    category: 'ml',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Tags específicas do pedido',
    width: 120
  },
  {
    key: 'feedback_purchase',
    label: 'Feedback Compra',
    category: 'ml',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Feedback da compra',
    width: 130
  },
  {
    key: 'feedback_sale',
    label: 'Feedback Venda',
    category: 'ml',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Feedback da venda',
    width: 120
  },
  {
    key: 'mediations',
    label: 'Mediações',
    category: 'ml',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Mediações do pedido',
    width: 120
  },

  // ====== DETAILED PRODUCTS ======
  {
    key: 'product_categories',
    label: 'Categorias Produto',
    category: 'products',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Categorias dos produtos',
    width: 150
  },
  {
    key: 'product_attributes',
    label: 'Atributos Produto',
    category: 'products',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Atributos dos produtos',
    width: 150
  },
  {
    key: 'product_variations',
    label: 'Variações Produto',
    category: 'products',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Variações dos produtos',
    width: 150
  },
  {
    key: 'product_warranty',
    label: 'Garantia Produto',
    category: 'products',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Informações de garantia',
    width: 140
  },
  {
    key: 'manufacturing_days',
    label: 'Dias Fabricação',
    category: 'products',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Dias para fabricação',
    width: 130
  }
];

// 🎯 PERFIS PRÉ-DEFINIDOS
export const DEFAULT_PROFILES: ColumnProfile[] = [
  {
    id: 'essential',
    name: 'Essencial',
    description: 'Apenas colunas essenciais para operação básica',
    columns: COLUMN_DEFINITIONS
      .filter(col => col.priority === 'essential')
      .map(col => col.key)
  },
  {
    id: 'standard',
    name: 'Padrão',
    description: 'Configuração padrão atual (baseada nas imagens)',
    columns: COLUMN_DEFINITIONS
      .filter(col => col.default === true)
      .map(col => col.key)
  },
  {
    id: 'financial',
    name: 'Financeiro',
    description: 'Foco em informações financeiras e pagamentos',
    columns: [
      'id', 'numero', 'nome_cliente', 'data_pedido',
      'valor_total', 'paid_amount', 'frete_pago_cliente', 'receita_flex',
      'valor_liquido_vendedor', 'marketplace_fee', 'payment_method',
      'payment_status', 'payment_type', 'coupon_amount'
    ]
  },
  {
    id: 'logistic',
    name: 'Logística',
    description: 'Foco em envio e rastreamento',
    columns: [
      'id', 'numero', 'nome_cliente', 'nome_completo', 'data_pedido',
      'situacao', 'shipping_status', 'logistic_mode', 'logistic_type',
      'shipping_method_type', 'delivery_type', 'substatus_detail'
    ]
  },
  {
    id: 'mapping',
    name: 'Mapeamento',
    description: 'Foco em mapeamento e gestão de estoque',
    columns: [
      'id', 'numero', 'skus_produtos', 'quantidade_itens',
      'mapeamento', 'sku_estoque', 'sku_kit', 'qtd_kit', 'total_itens', 'status_baixa'
    ]
  },
  {
    id: 'complete',
    name: 'Completo',
    description: 'Todas as colunas disponíveis',
    columns: COLUMN_DEFINITIONS.map(col => col.key)
  }
];

// 🔧 CATEGORIAS E SUAS LABELS
export const CATEGORY_LABELS = {
  basic: 'Básicas',
  products: 'Produtos', 
  financial: 'Financeiras',
  mapping: 'Mapeamento',
  shipping: 'Envio',
  meta: 'Metadados ML',
  ml: 'Mercado Livre'
} as const;

// 📊 HELPERS
export const getColumnsByCategory = (category: keyof typeof CATEGORY_LABELS) => {
  return COLUMN_DEFINITIONS.filter(col => col.category === category);
};

export const getEssentialColumns = () => {
  return COLUMN_DEFINITIONS.filter(col => col.priority === 'essential');
};

export const getDefaultVisibleColumns = () => {
  return COLUMN_DEFINITIONS.filter(col => col.default === true);
};

export const getColumnDefinition = (key: string) => {
  return COLUMN_DEFINITIONS.find(col => col.key === key);
};