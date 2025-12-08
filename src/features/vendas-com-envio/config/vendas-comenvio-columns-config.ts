/**
 * 🎯 CONFIGURAÇÃO DE COLUNAS - VENDAS COM ENVIO
 * Replica exatamente as colunas de /vendas-canceladas
 */

import type { ColumnDefinition, ColumnProfile } from '@/features/vendas-online/types/columns.types';

// Mapa de categorias para labels
export const CATEGORY_LABELS: Record<string, string> = {
  basic: 'Básicas',
  dates: 'Datas',
  customer: 'Cliente',
  product: 'Produto',
  financial: 'Financeiras',
  shipping: 'Envio',
  meta: 'Metadados',
  actions: 'Ações'
};

// Colunas visíveis por padrão
export const VENDAS_COMENVIO_DEFAULT_VISIBLE_COLUMNS = [
  'status_analise',
  'anotacoes',
  'account_name',
  'order_id',
  'status',
  'date_created',
  'total_amount',
  'buyer_name',
  'item_title',
  'quantity',
  'seller_sku',
  'shipping_status',
  'logistic_type',
];

export const VENDAS_COMENVIO_COLUMN_DEFINITIONS: ColumnDefinition[] = [
  // ====== ANÁLISE ======
  {
    key: 'status_analise',
    label: 'Análise',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Status de análise interna',
    width: 180
  },
  {
    key: 'anotacoes',
    label: 'Anotações',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Anotações do pedido',
    width: 80
  },

  // ====== EMPRESA ======
  {
    key: 'account_name',
    label: 'Empresa',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Empresa/Conta do Mercado Livre',
    width: 150
  },

  // ====== IDENTIFICAÇÃO ======
  {
    key: 'order_id',
    label: 'ID Pedido',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Identificador único do pedido',
    width: 120
  },
  {
    key: 'pack_id',
    label: 'Pack ID',
    category: 'basic',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Pack ID do pedido',
    width: 100
  },

  // ====== STATUS ======
  {
    key: 'status',
    label: 'Status',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Status atual do pedido',
    width: 120
  },

  // ====== TIPO PEDIDO ======
  {
    key: 'order_type',
    label: 'Tipo Pedido',
    category: 'basic',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Tipo do pedido (Normal/Devolução)',
    width: 150
  },

  // ====== DATAS ======
  {
    key: 'date_created',
    label: 'Data Criação',
    category: 'dates',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Data de criação do pedido',
    width: 150,
    sortable: true
  },
  {
    key: 'last_updated',
    label: 'Última Atualização',
    category: 'dates',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Data da última atualização',
    width: 150,
    sortable: true
  },
  {
    key: 'expiration_date',
    label: 'Validade',
    category: 'dates',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Data de validade do pedido',
    width: 150
  },

  // ====== VALORES ======
  {
    key: 'total_amount',
    label: 'Total',
    category: 'financial',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Valor total do pedido',
    width: 120,
    sortable: true
  },
  {
    key: 'paid_amount',
    label: 'Produto',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Valor do produto',
    width: 120,
    sortable: true
  },
  {
    key: 'shipping_cost',
    label: 'Frete',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Valor do frete',
    width: 120,
    sortable: true
  },
  {
    key: 'discount',
    label: 'Desconto',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Valor do desconto/cupom',
    width: 120,
    sortable: true
  },
  {
    key: 'sale_fee',
    label: 'Taxa ML',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Taxa do Mercado Livre',
    width: 120,
    sortable: true
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
    key: 'list_cost',
    label: 'Custo Frete Listado',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Custo de frete listado',
    width: 120
  },

  // ====== COMPRADOR ======
  {
    key: 'buyer_id',
    label: 'ID Comprador',
    category: 'customer',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'ID do comprador',
    width: 100
  },
  {
    key: 'buyer_name',
    label: 'Nome Comprador',
    category: 'customer',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Nome do comprador',
    width: 150
  },

  // ====== PRODUTO ======
  {
    key: 'item_id',
    label: 'ID Item',
    category: 'product',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'ID do item/produto',
    width: 100
  },
  {
    key: 'item_title',
    label: 'Título Produto',
    category: 'product',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Título do produto vendido',
    width: 250
  },
  {
    key: 'quantity',
    label: 'Quantidade',
    category: 'product',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Quantidade de itens',
    width: 80,
    sortable: true
  },
  {
    key: 'seller_sku',
    label: 'SKU',
    category: 'product',
    priority: 'important',
    visible: true,
    default: true,
    description: 'SKU do produto',
    width: 200
  },
  {
    key: 'category_id',
    label: 'Categoria',
    category: 'product',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Categoria do produto',
    width: 120
  },

  // ====== ENVIO ======
  {
    key: 'shipping_id',
    label: 'ID Envio',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'ID do envio/shipment',
    width: 120
  },
  {
    key: 'shipping_status',
    label: 'Status Envio',
    category: 'shipping',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Status do envio',
    width: 120
  },
  {
    key: 'logistic_type',
    label: 'Tipo Logístico',
    category: 'shipping',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Tipo de logística do envio',
    width: 120
  },
  {
    key: 'substatus',
    label: 'Substatus',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Substatus do envio',
    width: 120
  },
  // Colunas removidas: shipping_method, estimated_delivery, status_history

  // ====== ENDEREÇO ======
  {
    key: 'city',
    label: 'Cidade',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Cidade de destino',
    width: 150
  },
  {
    key: 'state',
    label: 'Estado',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Estado de destino',
    width: 80
  },
  {
    key: 'zip_code',
    label: 'CEP',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'CEP de destino',
    width: 100
  },
  {
    key: 'address_line',
    label: 'Endereço',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Endereço completo de destino',
    width: 250
  },

  // ====== METADADOS ======
  {
    key: 'fulfilled',
    label: 'Fulfillment',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Indica se é fulfillment',
    width: 120
  },
  // Colunas removidas: mediations, dimensions

  // ====== AÇÕES ======
  {
    key: 'actions',
    label: 'Ações',
    category: 'actions',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Ações disponíveis',
    width: 80
  }
];

// Perfis pré-definidos
export const VENDAS_COMENVIO_DEFAULT_PROFILES: ColumnProfile[] = [
  {
    id: 'standard',
    name: 'Padrão',
    description: 'Visualização padrão com colunas essenciais',
    columns: VENDAS_COMENVIO_COLUMN_DEFINITIONS.filter(col => col.default).map(col => col.key)
  },
  {
    id: 'essential',
    name: 'Essencial',
    description: 'Apenas colunas essenciais',
    columns: VENDAS_COMENVIO_COLUMN_DEFINITIONS.filter(col => col.priority === 'essential').map(col => col.key)
  },
  {
    id: 'complete',
    name: 'Completo',
    description: 'Todas as colunas disponíveis',
    columns: VENDAS_COMENVIO_COLUMN_DEFINITIONS.map(col => col.key)
  },
  {
    id: 'financial',
    name: 'Financeiro',
    description: 'Foco em valores e impacto financeiro',
    columns: VENDAS_COMENVIO_COLUMN_DEFINITIONS.filter(col => 
      col.priority === 'essential' || col.category === 'financial'
    ).map(col => col.key)
  },
  {
    id: 'shipping',
    name: 'Logística',
    description: 'Foco em envio e logística',
    columns: VENDAS_COMENVIO_COLUMN_DEFINITIONS.filter(col => 
      col.priority === 'essential' || col.category === 'shipping'
    ).map(col => col.key)
  }
];

// Função auxiliar para obter colunas visíveis por padrão
export const getDefaultVisibleColumns = (): ColumnDefinition[] => {
  return VENDAS_COMENVIO_COLUMN_DEFINITIONS.filter(col => col.default);
};
