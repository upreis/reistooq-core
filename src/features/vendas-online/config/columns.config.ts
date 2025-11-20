/**
 * 🎯 CONFIGURAÇÃO CENTRALIZADA DE COLUNAS - VENDAS ONLINE
 * Define todas as colunas disponíveis com metadados para gerenciamento avançado
 */

import { ColumnDefinition, ColumnProfile } from '../types/columns.types';

export const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  // ====== ESSENCIAIS ======
  {
    key: 'order_id',
    label: 'Order ID',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Identificador único do pedido',
    width: 150,
    sortable: true
  },
  {
    key: 'empresa',
    label: 'Empresa',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Empresa/Conta do Mercado Livre',
    width: 120
  },
  {
    key: 'data_compra',
    label: 'Data Compra',
    category: 'dates',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Data de realização da compra',
    width: 130,
    sortable: true
  },
  {
    key: 'status',
    label: 'Status',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Status atual do pedido',
    width: 150
  },
  {
    key: 'analise',
    label: 'Análise',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Status de análise interna',
    width: 150
  },

  // ====== IMPORTANTES ======
  {
    key: 'comprador',
    label: 'Comprador',
    category: 'customer',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Nome do comprador',
    width: 180
  },
  {
    key: 'produto',
    label: 'Produto',
    category: 'product',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Nome do produto vendido',
    width: 300
  },
  {
    key: 'quantidade',
    label: 'Quantidade',
    category: 'product',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Quantidade de itens',
    width: 100,
    sortable: true
  },
  {
    key: 'valor_total',
    label: 'Valor Total',
    category: 'financial',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Valor total do pedido',
    width: 130,
    sortable: true
  },
  {
    key: 'tipo_logistico',
    label: 'Tipo Logístico',
    category: 'shipping',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Tipo de logística do envio',
    width: 150
  },
  {
    key: 'sku_mapeado',
    label: 'SKU Mapeado',
    category: 'mapping',
    priority: 'important',
    visible: true,
    default: true,
    description: 'SKU mapeado no sistema',
    width: 150
  },

  // ====== OPCIONAIS ======
  {
    key: 'cpf_cnpj',
    label: 'CPF/CNPJ',
    category: 'customer',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Documento do comprador',
    width: 150
  },
  {
    key: 'marketplace',
    label: 'Marketplace',
    category: 'basic',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Marketplace de origem',
    width: 130
  },
  {
    key: 'valor_produto',
    label: 'Valor Produto',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Valor do produto sem frete',
    width: 130,
    sortable: true
  },
  {
    key: 'frete',
    label: 'Frete',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Valor do frete',
    width: 100,
    sortable: true
  },
  {
    key: 'taxas_ml',
    label: 'Taxas ML',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Taxas do Mercado Livre',
    width: 120,
    sortable: true
  },
  {
    key: 'lucro',
    label: 'Lucro',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Lucro líquido estimado',
    width: 110,
    sortable: true
  },
  {
    key: 'status_envio',
    label: 'Status Envio',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Status atual do envio',
    width: 140
  },
  {
    key: 'prazo_envio',
    label: 'Prazo Envio',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Prazo de entrega estimado',
    width: 130
  },
  {
    key: 'transportadora',
    label: 'Transportadora',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Transportadora responsável',
    width: 150
  },
  {
    key: 'status_mapeamento',
    label: 'Status Mapeamento',
    category: 'mapping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Status do mapeamento de SKU',
    width: 160
  }
];

// Perfis pré-definidos
export const DEFAULT_PROFILES: ColumnProfile[] = [
  {
    id: 'standard',
    name: 'Padrão',
    description: 'Visualização padrão com colunas essenciais e importantes',
    columns: COLUMN_DEFINITIONS.filter(col => col.default).map(col => col.key)
  },
  {
    id: 'essential',
    name: 'Essencial',
    description: 'Apenas colunas essenciais para análise rápida',
    columns: COLUMN_DEFINITIONS.filter(col => col.priority === 'essential').map(col => col.key)
  },
  {
    id: 'complete',
    name: 'Completo',
    description: 'Todas as colunas disponíveis',
    columns: COLUMN_DEFINITIONS.map(col => col.key)
  },
  {
    id: 'financial',
    name: 'Financeiro',
    description: 'Foco em valores e impacto financeiro',
    columns: COLUMN_DEFINITIONS.filter(col => 
      col.priority === 'essential' || col.category === 'financial'
    ).map(col => col.key)
  },
  {
    id: 'shipping',
    name: 'Logística',
    description: 'Foco em envio e logística',
    columns: COLUMN_DEFINITIONS.filter(col => 
      col.priority === 'essential' || col.category === 'shipping'
    ).map(col => col.key)
  }
];

// Mapa de categorias para labels
export const CATEGORY_LABELS: Record<string, string> = {
  basic: 'Básicas',
  dates: 'Datas',
  customer: 'Cliente',
  product: 'Produto',
  financial: 'Financeiras',
  shipping: 'Envio',
  mapping: 'Mapeamento',
  meta: 'Metadados',
  actions: 'Ações'
};

// Função auxiliar para obter colunas visíveis por padrão
export const getDefaultVisibleColumns = (): ColumnDefinition[] => {
  return COLUMN_DEFINITIONS.filter(col => col.default);
};
