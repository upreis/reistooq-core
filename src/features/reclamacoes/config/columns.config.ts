/**
 * 🎯 CONFIGURAÇÃO CENTRALIZADA DE COLUNAS - RECLAMAÇÕES
 * Define todas as colunas disponíveis com metadados para gerenciamento avançado
 */

import { ColumnDefinition, ColumnProfile } from '../types/columns.types';

export const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  // ====== ESSENCIAIS ======
  {
    key: 'status_analise',
    label: 'Análise',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Status de análise da reclamação',
    width: 150,
    sortable: false
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
    key: 'claim_id',
    label: 'N.º da Reclamação',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Número identificador da reclamação',
    width: 150,
    sortable: true
  },
  {
    key: 'type',
    label: 'Tipo de Reclamação',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Tipo da reclamação (Mediação, Devolução, Cancelamento)',
    width: 160
  },
  {
    key: 'status',
    label: 'Status da Reclamação',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Status atual da reclamação',
    width: 180
  },

  // ====== IMPORTANTES ======
  {
    key: 'anotacoes',
    label: 'Anotações',
    category: 'basic',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Anotações internas da reclamação',
    width: 120
  },
  {
    key: 'stage',
    label: 'Estágio da Reclamação',
    category: 'basic',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Estágio atual do processo',
    width: 180
  },
  {
    key: 'date_created',
    label: 'Data Criação',
    category: 'dates',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Data de criação da reclamação',
    width: 130,
    sortable: true
  },
  {
    key: 'last_updated',
    label: 'Última Atualização',
    category: 'dates',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Data da última atualização',
    width: 160,
    sortable: true
  },
  {
    key: 'buyer_nickname',
    label: 'Apelido Comprador',
    category: 'customer',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Nome/apelido do comprador',
    width: 150
  },
  {
    key: 'order_item_title',
    label: 'Título Item',
    category: 'product',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Título do produto',
    width: 300
  },
  {
    key: 'amount_value',
    label: 'Valor Reclamado',
    category: 'financial',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Valor total reclamado',
    width: 140,
    sortable: true
  },

  // ====== OPCIONAIS ======
  {
    key: 'resource_id',
    label: 'N.º do Recurso Origem',
    category: 'resource',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'ID do recurso de origem',
    width: 150
  },
  {
    key: 'resource',
    label: 'Tipo do Recurso',
    category: 'resource',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Tipo do recurso relacionado',
    width: 150
  },
  {
    key: 'reason_id',
    label: 'N.º da Razão',
    category: 'reason',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'ID da razão da reclamação',
    width: 120
  },
  {
    key: 'reason_name',
    label: 'Nome da Razão',
    category: 'reason',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Nome descritivo da razão',
    width: 200
  },
  {
    key: 'reason_detail',
    label: 'Detalhe da Razão',
    category: 'reason',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Detalhes adicionais da razão',
    width: 250
  },
  {
    key: 'order_date_created',
    label: 'Data Criação Pedido',
    category: 'dates',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Data de criação do pedido original',
    width: 160,
    sortable: true
  },
  {
    key: 'resolution_date',
    label: 'Data Resolução',
    category: 'dates',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Data de resolução da reclamação',
    width: 140,
    sortable: true
  },
  {
    key: 'order_item_quantity',
    label: 'Quantidade',
    category: 'product',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Quantidade de itens',
    width: 100,
    sortable: true
  },
  {
    key: 'order_item_unit_price',
    label: 'Preço Unitário',
    category: 'product',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Preço unitário do item',
    width: 130,
    sortable: true
  },
  {
    key: 'order_item_seller_sku',
    label: 'SKU',
    category: 'product',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'SKU do vendedor',
    width: 150
  },
  {
    key: 'order_total',
    label: 'Total Pedido',
    category: 'financial',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Valor total do pedido',
    width: 130,
    sortable: true
  },
  {
    key: 'impacto_financeiro',
    label: 'Impacto Financeiro',
    category: 'financial',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Impacto financeiro da reclamação',
    width: 150,
    sortable: true
  },
  {
    key: 'resolution_benefited',
    label: 'Beneficiado',
    category: 'resolution',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Quem foi beneficiado na resolução',
    width: 130
  },
  {
    key: 'resolution_reason',
    label: 'Razão Resolução',
    category: 'resolution',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Razão da resolução final',
    width: 200
  },
  {
    key: 'site_id',
    label: 'Site ID',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'ID do site do Mercado Livre',
    width: 100
  },
  {
    key: 'tem_trocas',
    label: 'Tem Trocas',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Indica se há trocas relacionadas',
    width: 110
  },
  {
    key: 'tem_mediacao',
    label: 'Tem Mediação',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Indica se há mediação',
    width: 130
  },
  {
    key: 'order_id',
    label: 'N.º Pedido',
    category: 'meta',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Número do pedido original',
    width: 150
  },
  {
    key: 'order_status',
    label: 'Status Pedido',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Status do pedido original',
    width: 140
  },
  {
    key: 'tracking_number',
    label: 'Número de Rastreio',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Código de rastreamento',
    width: 160
  },
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
  }
];

// Mapa de categorias para labels
export const CATEGORY_LABELS: Record<string, string> = {
  basic: 'Básicas',
  dates: 'Datas',
  customer: 'Cliente',
  product: 'Produto',
  financial: 'Financeiras',
  resource: 'Recurso',
  reason: 'Razão',
  resolution: 'Resolução',
  meta: 'Metadados',
  actions: 'Ações'
};

// Função auxiliar para obter colunas visíveis por padrão
export const getDefaultVisibleColumns = (): ColumnDefinition[] => {
  return COLUMN_DEFINITIONS.filter(col => col.default);
};
