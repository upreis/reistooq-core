/**
 * 🎯 CONFIGURAÇÃO CENTRALIZADA DE COLUNAS - RECLAMAÇÕES
 * Define todas as colunas disponíveis com metadados para gerenciamento avançado
 * Baseado nas colunas reais da ReclamacoesTableColumns.tsx
 */

import { ColumnDefinition, ColumnProfile } from '../types/columns.types';

export const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  // ====== BÁSICAS (7 colunas) ======
  {
    key: 'status_analise',
    label: 'Análise',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Status de análise da reclamação',
    width: 180,
    sortable: false
  },
  {
    key: 'anotacoes',
    label: 'Anotações',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Anotações internas da reclamação',
    width: 80
  },
  {
    key: 'account_name',
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
  {
    key: 'stage',
    label: 'Estagio da Reclamação',
    category: 'basic',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Estágio atual do processo',
    width: 180
  },

  // ====== PRODUTO (5 colunas) ======
  {
    key: 'produto',
    label: 'Produto',
    category: 'product',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Informações do produto com imagem',
    width: 350
  },
  {
    key: 'order_item_quantity',
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
    key: 'order_item_unit_price',
    label: 'Valor do Produto',
    category: 'product',
    priority: 'important',
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
    key: 'order_item_title',
    label: 'Nome do Produto',
    category: 'product',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Título completo do produto',
    width: 300
  },

  // ====== CLIENTE (1 coluna) ======
  {
    key: 'buyer_nickname',
    label: 'Comprador',
    category: 'customer',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Nome/apelido do comprador',
    width: 150
  },

  // ====== DATAS (5 colunas) ======
  {
    key: 'order_date_created',
    label: 'Data da Venda',
    category: 'dates',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Data de criação do pedido',
    width: 130,
    sortable: true
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
    key: 'prazo_analise',
    label: 'Prazo Análise',
    category: 'dates',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Prazo para análise da reclamação',
    width: 130,
    sortable: true
  },
  {
    key: 'resolution_date',
    label: 'Data da Resolução',
    category: 'dates',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Data de resolução da reclamação',
    width: 140,
    sortable: true
  },

  // ====== FINANCEIRAS (3 colunas) ======
  {
    key: 'order_total',
    label: 'Total da Venda',
    category: 'financial',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Valor total do pedido',
    width: 130,
    sortable: true
  },
  {
    key: 'amount_value',
    label: 'Valor na Reclamação',
    category: 'financial',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Valor reclamado',
    width: 140,
    sortable: true
  },
  {
    key: 'impacto_financeiro',
    label: 'Impacto Financeiro',
    category: 'financial',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Impacto financeiro da reclamação',
    width: 150,
    sortable: true
  },

  // ====== RAZÃO (4 colunas) ======
  {
    key: 'reason_id',
    label: 'N.º da Razão da Reclamação',
    category: 'reason',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'ID da razão da reclamação',
    width: 150
  },
  {
    key: 'reason_name',
    label: 'Nome da Razão',
    category: 'reason',
    priority: 'optional',
    visible: false,
    default: false,
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
    key: 'reason_category',
    label: 'Categoria da Razão',
    category: 'reason',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Categoria da razão da reclamação',
    width: 150
  },

  // ====== RECURSO (2 colunas) ======
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

  // ====== RESOLUÇÃO (2 colunas) ======
  {
    key: 'resolution_benefited',
    label: 'Resolução Beneficiada',
    category: 'resolution',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Quem foi beneficiado na resolução',
    width: 130
  },
  {
    key: 'resolution_reason',
    label: 'Razão da Resolução',
    category: 'resolution',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Razão da resolução final',
    width: 200
  },

  // ====== METADADOS (6 colunas) ======
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
    label: 'Trocas',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Indica se há trocas relacionadas',
    width: 110
  },
  {
    key: 'tem_mediacao',
    label: 'Mediação',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Indica se há mediação',
    width: 130
  },
  {
    key: 'order_id',
    label: 'N.º da Venda',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Número do pedido original',
    width: 150
  },
  {
    key: 'order_status',
    label: 'Status da Venda',
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

  // ====== AÇÕES (1 coluna) ======
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
  },
  {
    id: 'analysis',
    name: 'Análise Completa',
    description: 'Todas as informações para análise detalhada',
    columns: COLUMN_DEFINITIONS.filter(col => 
      col.priority === 'essential' || col.priority === 'important'
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
