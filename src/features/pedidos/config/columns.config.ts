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
    width: 250,
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
    label: 'Atualizado',
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
    label: 'SKU',
    category: 'products',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Lista de SKUs dos produtos',
    width: 200
  },
  {
    key: 'quantidade_itens',
    label: 'Quantidade',
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
    width: 300
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
    key: 'receita_flex',
    label: 'Receita Flex',
    category: 'financial',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Receita adicional do Mercado Envios Flex',
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
    label: 'Custo Envio',
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
    label: 'Valor Líquido',
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
    key: 'power_seller_status',
    label: 'Medalha',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Status de Mercado Líder (Platinum, Gold, Silver)',
    width: 150
  },
  {
    key: 'level_id',
    label: 'Reputação',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Nível de reputação do vendedor',
    width: 120
  },
  {
    key: 'conditions',
    label: 'Condição',
    category: 'products',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Condição do produto (new, used, refurbished)',
    width: 100
  },
  {
    key: 'shipping_substatus',
    label: 'Substatus do Envio',
    category: 'shipping',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Substatus detalhado do envio (printed, picked_up, out_for_delivery, etc.)',
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
    label: 'Rastreamento',
    category: 'shipping',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Link para rastreamento do envio',
    width: 80
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
    width: 200
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
    width: 150
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
    key: 'tags',
    label: 'Tags do Pedido',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Tags do ML',
    width: 350
  },



];

// 🔍 VALIDAÇÃO: Detectar chaves duplicadas
const keys = COLUMN_DEFINITIONS.map(col => col.key);
const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
if (duplicates.length > 0) {
  console.error('🚨 COLUNAS DUPLICADAS DETECTADAS:', duplicates);
}
console.log('✅ Total de colunas definidas:', COLUMN_DEFINITIONS.length);

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
      'id', 'numero', 'nome_completo', 'data_pedido',
      'valor_total', 'paid_amount', 'receita_flex',
      'valor_liquido_vendedor', 'marketplace_fee', 
      'payment_method', 'payment_status'
    ]
  },
  {
    id: 'logistic',
    name: 'Logística',
    description: 'Foco em envio e rastreamento',
    columns: [
      'id', 'numero', 'nome_completo', 'data_pedido',
      'situacao', 'shipping_status', 'shipping_substatus', 'logistic_type',
      'codigo_rastreamento', 'url_rastreamento'
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