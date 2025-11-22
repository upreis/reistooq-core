/**
 * 📋 DEFINIÇÕES DE COLUNAS - RECLAMAÇÕES
 * Sistema de gerenciamento de visibilidade de colunas
 */

// 📦 STORAGE CONSTANTS
export const RECLAMACOES_COLUMN_STORAGE_KEY = 'reclamacoes_column_preferences';
export const RECLAMACOES_COLUMN_STORAGE_VERSION = 1;

export type ColumnCategory = 
  | 'essential'    // Colunas essenciais (sempre importantes)
  | 'financial'    // Informações financeiras
  | 'temporal'     // Datas e prazos
  | 'details'      // Detalhes da reclamação
  | 'resolution'   // Informações de resolução
  | 'metadata'     // Metadados adicionais
  | 'operational'; // Informações operacionais

export type ColumnPriority = 'essential' | 'important' | 'optional';

export interface ReclamacoesColumnDefinition {
  key: string;
  label: string;
  category: ColumnCategory;
  priority: ColumnPriority;
  visible: boolean;
  default: boolean;
  description?: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
}

export interface ReclamacoesColumnProfile {
  id: string;
  name: string;
  description: string;
  columns: string[]; // Array de keys das colunas
}

export interface ReclamacoesColumnState {
  visibleColumns: Set<string>;
  columnOrder: string[];
  activeProfile: string | null;
  customProfiles: ReclamacoesColumnProfile[];
}

export interface ReclamacoesColumnActions {
  toggleColumn: (key: string) => void;
  showColumn: (key: string) => void;
  hideColumn: (key: string) => void;
  setVisibleColumns: (columns: string[]) => void;
  reorderColumns: (columnOrder: string[]) => void;
  loadProfile: (profileId: string) => void;
  saveProfile: (profile: Omit<ReclamacoesColumnProfile, 'id'>) => void;
  deleteProfile: (profileId: string) => void;
  resetToDefault: () => void;
  resetToEssentials: () => void;
}

export interface UseReclamacoesColumnManagerReturn {
  state: ReclamacoesColumnState;
  visibleColumnKeys: string[]; // 🎯 Array de keys visíveis (conversão automática do Set)
  actions: ReclamacoesColumnActions;
  definitions: ReclamacoesColumnDefinition[];
  visibleDefinitions: ReclamacoesColumnDefinition[];
  profiles: ReclamacoesColumnProfile[];
}

// 📋 TODAS AS 36 COLUNAS DISPONÍVEIS
export const RECLAMACOES_COLUMN_DEFINITIONS: ReclamacoesColumnDefinition[] = [
  // ✅ ESSENCIAIS
  {
    key: 'status_analise',
    label: 'Análise',
    category: 'essential',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Status de análise da reclamação',
    sortable: true,
  },
  {
    key: 'anotacoes',
    label: 'Anotações',
    category: 'essential',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Anotações internas',
    sortable: false,
  },
  {
    key: 'account_name',
    label: 'Empresa',
    category: 'essential',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Nome da conta/empresa',
    sortable: true,
    filterable: true,
  },
  {
    key: 'produto',
    label: 'Produto',
    category: 'essential',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Informações do produto com imagem',
    width: 350,
    sortable: true,
  },
  {
    key: 'buyer_nickname',
    label: 'Comprador',
    category: 'essential',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Nome do comprador',
    sortable: true,
  },
  {
    key: 'claim_id',
    label: 'N.º da Reclamação',
    category: 'essential',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Número identificador da reclamação',
    sortable: true,
  },
  {
    key: 'type',
    label: 'Tipo de Reclamação',
    category: 'essential',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Tipo da reclamação (mediação, devolução, etc)',
    sortable: true,
    filterable: true,
  },
  {
    key: 'status',
    label: 'Status da Reclamação',
    category: 'essential',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Status atual da reclamação',
    sortable: true,
    filterable: true,
  },
  {
    key: 'actions',
    label: 'Ações',
    category: 'essential',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Ações disponíveis',
    sortable: false,
  },

  // 💰 FINANCEIRO
  {
    key: 'order_item_unit_price',
    label: 'Valor do Produto',
    category: 'financial',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Valor unitário do produto',
    sortable: true,
  },
  {
    key: 'order_total',
    label: 'Total da Venda',
    category: 'financial',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Valor total da venda',
    sortable: true,
  },
  {
    key: 'amount_value',
    label: 'Valor na Reclamação',
    category: 'financial',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Valor contestado na reclamação',
    sortable: true,
  },
  {
    key: 'impacto_financeiro',
    label: 'Impacto Financeiro',
    category: 'financial',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Impacto financeiro da reclamação',
    sortable: true,
  },

  // 📅 TEMPORAL
  {
    key: 'order_date_created',
    label: 'Data da Venda',
    category: 'temporal',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Data de criação da venda',
    sortable: true,
  },
  {
    key: 'date_created',
    label: 'Data Criação',
    category: 'temporal',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Data de criação da reclamação',
    sortable: true,
  },
  {
    key: 'last_updated',
    label: 'Última Atualização',
    category: 'temporal',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Data da última atualização',
    sortable: true,
  },
  {
    key: 'prazo_analise',
    label: 'Prazo Análise',
    category: 'temporal',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Prazo para análise da reclamação',
    sortable: true,
  },
  {
    key: 'resolution_date',
    label: 'Data da Resolução',
    category: 'temporal',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Data de resolução da reclamação',
    sortable: true,
  },

  // 🔍 DETALHES
  {
    key: 'order_item_seller_sku',
    label: 'SKU',
    category: 'details',
    priority: 'important',
    visible: true,
    default: true,
    description: 'SKU do produto',
    sortable: true,
  },
  {
    key: 'reason_id',
    label: 'N.º da Razão da Reclamação',
    category: 'details',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'ID da razão da reclamação',
    sortable: true,
  },
  {
    key: 'reason_name',
    label: 'Nome da Razão',
    category: 'details',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Nome descritivo da razão',
    sortable: true,
  },
  {
    key: 'reason_detail',
    label: 'Detalhe da Razão',
    category: 'details',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Detalhes adicionais da razão',
    sortable: true,
  },
  {
    key: 'reason_category',
    label: 'Categoria da Razão',
    category: 'details',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Categoria da razão da reclamação',
    sortable: true,
    filterable: true,
  },
  {
    key: 'resource_id',
    label: 'N.º do Recurso Origem',
    category: 'details',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'ID do recurso de origem',
    sortable: true,
  },
  {
    key: 'resource',
    label: 'Tipo do Recurso',
    category: 'details',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Tipo do recurso (pedido, envio, etc)',
    sortable: true,
  },

  // ✔️ RESOLUÇÃO
  {
    key: 'stage',
    label: 'Estagio da Reclamação',
    category: 'resolution',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Estágio atual do processo',
    sortable: true,
  },
  {
    key: 'resolution_benefited',
    label: 'Resolução Beneficiada',
    category: 'resolution',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Quem foi beneficiado na resolução',
    sortable: true,
  },
  {
    key: 'resolution_reason',
    label: 'Razão da Resolução',
    category: 'resolution',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Razão da resolução final',
    sortable: true,
  },

  // 📋 METADATA
  {
    key: 'order_item_quantity',
    label: 'Quantidade',
    category: 'metadata',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Quantidade de itens',
    sortable: true,
  },
  {
    key: 'site_id',
    label: 'Site ID',
    category: 'metadata',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Identificador do site ML',
    sortable: true,
  },
  {
    key: 'order_item_title',
    label: 'Nome do Produto',
    category: 'metadata',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Nome completo do produto',
    sortable: true,
  },
  {
    key: 'tem_trocas',
    label: 'Trocas',
    category: 'metadata',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Indica se há trocas',
    sortable: false,
  },
  {
    key: 'tem_mediacao',
    label: 'Mediação',
    category: 'metadata',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Indica se está em mediação',
    sortable: false,
  },
  {
    key: 'order_id',
    label: 'N.º da Venda',
    category: 'metadata',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Número da venda',
    sortable: true,
  },
  {
    key: 'order_status',
    label: 'Status da Venda',
    category: 'metadata',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Status do pedido',
    sortable: true,
  },
  {
    key: 'tracking_number',
    label: 'Número de Rastreio',
    category: 'metadata',
    priority: 'optional',
    visible: true,
    default: true,
    description: 'Código de rastreamento',
    sortable: true,
  },
];

// 🎯 PERFIS PRÉ-DEFINIDOS
export const RECLAMACOES_DEFAULT_PROFILES: ReclamacoesColumnProfile[] = [
  {
    id: 'padrao',
    name: 'Padrão',
    description: 'Visualização padrão com colunas essenciais e importantes',
    columns: RECLAMACOES_COLUMN_DEFINITIONS
      .filter(col => col.default)
      .map(col => col.key),
  },
  {
    id: 'essencial',
    name: 'Essencial',
    description: 'Apenas colunas críticas para análise rápida',
    columns: [
      'status_analise',
      'anotacoes',
      'account_name',
      'produto',
      'buyer_nickname',
      'claim_id',
      'type',
      'status',
      'date_created',
      'actions',
    ],
  },
  {
    id: 'completo',
    name: 'Completo',
    description: 'Todas as 36 colunas visíveis',
    columns: RECLAMACOES_COLUMN_DEFINITIONS.map(col => col.key),
  },
  {
    id: 'financeiro',
    name: 'Financeiro',
    description: 'Foco em impacto financeiro e valores',
    columns: [
      'status_analise',
      'account_name',
      'produto',
      'buyer_nickname',
      'claim_id',
      'order_item_unit_price',
      'order_total',
      'amount_value',
      'impacto_financeiro',
      'type',
      'status',
      'resolution_benefited',
      'actions',
    ],
  },
  {
    id: 'detalhado',
    name: 'Detalhado',
    description: 'Visão completa com detalhes e resolução',
    columns: [
      'status_analise',
      'anotacoes',
      'account_name',
      'produto',
      'buyer_nickname',
      'claim_id',
      'type',
      'status',
      'stage',
      'date_created',
      'last_updated',
      'prazo_analise',
      'order_item_seller_sku',
      'amount_value',
      'impacto_financeiro',
      'reason_name',
      'reason_detail',
      'reason_category',
      'resolution_benefited',
      'resolution_reason',
      'resolution_date',
      'actions',
    ],
  },
];
