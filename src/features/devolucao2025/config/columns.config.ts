/**
 * 🎯 CONFIGURAÇÃO CENTRALIZADA DE COLUNAS - DEVOLUÇÕES DE VENDA
 * Define todas as colunas disponíveis com metadados para gerenciamento avançado
 */

import { ColumnDefinition, ColumnProfile } from '../types/columns.types';

export const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  // ====== ESSENCIAIS ======
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
    key: 'order_id',
    label: 'Pedido',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Número do pedido',
    width: 150,
    sortable: true
  },
  {
    key: 'comprador',
    label: 'Comprador',
    category: 'customer',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Nome do comprador',
    width: 180
  },
  {
    key: 'produto',
    label: 'Produto',
    category: 'product',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Nome do produto',
    width: 300
  },
  {
    key: 'status_dev',
    label: 'Status Dev',
    category: 'status',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Status da devolução',
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
    key: 'claim_id',
    label: 'Claim ID',
    category: 'basic',
    priority: 'important',
    visible: true,
    default: true,
    description: 'ID do claim',
    width: 120
  },
  {
    key: 'data_criacao',
    label: 'Data Criação',
    category: 'dates',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Data de criação da devolução',
    width: 130,
    sortable: true
  },
  {
    key: 'valor_total',
    label: 'Valor Total',
    category: 'financial',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Valor total da devolução',
    width: 120,
    sortable: true
  },
  {
    key: 'status_return',
    label: 'Status Return',
    category: 'status',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Status do return',
    width: 150
  },

  // ====== OPCIONAIS ======
  {
    key: 'sku',
    label: 'SKU',
    category: 'product',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'SKU do produto',
    width: 120
  },
  {
    key: 'quantidade',
    label: 'Qtd',
    category: 'product',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Quantidade',
    width: 80
  },
  {
    key: 'valor_produto',
    label: 'Valor Produto',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Valor do produto',
    width: 120
  },
  {
    key: 'status_entrega',
    label: 'Status Entrega',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Status da entrega',
    width: 150
  },
  {
    key: 'destino',
    label: 'Destino',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Destino da devolução',
    width: 150
  },
  {
    key: 'resolucao',
    label: 'Resolução',
    category: 'status',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Resolução do caso',
    width: 150
  },
  {
    key: 'data_venda',
    label: 'Data Venda',
    category: 'dates',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Data da venda original',
    width: 130
  },
  {
    key: 'data_fechamento',
    label: 'Data Fechamento',
    category: 'dates',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Data de fechamento',
    width: 130
  },
  {
    key: 'data_inicio_return',
    label: 'Início Return',
    category: 'dates',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Data de início do return',
    width: 130
  },
  {
    key: 'data_atualizacao_return',
    label: 'Última Atualização Return',
    category: 'dates',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Última atualização do return',
    width: 180
  },
  {
    key: 'prazo_analise',
    label: 'Prazo Análise',
    category: 'dates',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Prazo para análise',
    width: 130
  },
  {
    key: 'data_chegada',
    label: 'Data Chegada',
    category: 'dates',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Data de chegada do produto',
    width: 130
  },
  {
    key: 'ultima_msg',
    label: 'Última Msg',
    category: 'dates',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Data da última mensagem',
    width: 130
  },
  {
    key: 'codigo_rastreio',
    label: 'Código Rastreio',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Código de rastreamento',
    width: 150
  },
  {
    key: 'tipo_logistica',
    label: 'Tipo Logística',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Tipo de logística',
    width: 150
  },
  {
    key: 'eh_troca',
    label: 'É Troca',
    category: 'status',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Indica se é troca',
    width: 100
  },
  {
    key: 'num_interacoes',
    label: 'Nº Interações',
    category: 'communication',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Número de interações',
    width: 120
  },
  {
    key: 'qualidade_com',
    label: 'Qualidade Com',
    category: 'communication',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Qualidade da comunicação',
    width: 120
  },
  {
    key: 'custo_envio_orig',
    label: 'Custo Envio Orig',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Custo de envio original',
    width: 150
  }
];

// PERFIS PRÉ-DEFINIDOS
export const DEFAULT_PROFILES: ColumnProfile[] = [
  {
    id: 'standard',
    name: 'Padrão',
    description: 'Colunas essenciais e importantes',
    columns: COLUMN_DEFINITIONS
      .filter(col => col.default)
      .map(col => col.key)
  },
  {
    id: 'essential',
    name: 'Essencial',
    description: 'Apenas colunas essenciais',
    columns: COLUMN_DEFINITIONS
      .filter(col => col.priority === 'essential')
      .map(col => col.key)
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
    description: 'Foco em dados financeiros',
    columns: [
      'account_name',
      'order_id',
      'comprador',
      'produto',
      'valor_total',
      'valor_produto',
      'custo_envio_orig',
      'status_dev',
      'analise'
    ]
  },
  {
    id: 'tracking',
    name: 'Rastreamento',
    description: 'Foco em logística e tracking',
    columns: [
      'account_name',
      'order_id',
      'comprador',
      'produto',
      'status_dev',
      'status_return',
      'status_entrega',
      'codigo_rastreio',
      'tipo_logistica',
      'destino',
      'data_criacao',
      'data_chegada',
      'analise'
    ]
  }
];

// LABELS DAS CATEGORIAS
export const CATEGORY_LABELS: Record<string, string> = {
  basic: 'Básico',
  dates: 'Datas',
  customer: 'Cliente',
  product: 'Produto',
  financial: 'Financeiro',
  shipping: 'Logística',
  status: 'Status',
  communication: 'Comunicação',
  meta: 'Metadados',
  actions: 'Ações'
};

// HELPER: Retorna colunas marcadas como default
export function getDefaultVisibleColumns(): ColumnDefinition[] {
  return COLUMN_DEFINITIONS.filter(col => col.default);
}
