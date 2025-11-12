/**
 * 🔧 CONFIGURAÇÃO DE COLUNAS - DEVOLUÇÕES ML
 * Define quais colunas são visíveis por padrão e sua prioridade
 */

import type { ColumnDefinition, ColumnProfile } from '@/features/pedidos/types/columns.types';

export const DEVOLUCAO_COLUMN_DEFINITIONS: ColumnDefinition[] = [
  // COLUNAS ESSENCIAIS - Sempre visíveis
  { key: 'order_id', label: 'Order ID', category: 'basic', priority: 'essential', visible: true, default: true, width: 120, sortable: true },
  { key: 'data_venda', label: 'Data Venda', category: 'basic', priority: 'essential', visible: true, default: true, width: 140, sortable: true },
  { key: 'produto_titulo', label: 'Produto', category: 'basic', priority: 'essential', visible: true, default: true, width: 200 },
  { key: 'claim_id', label: 'Claim ID', category: 'basic', priority: 'essential', visible: true, default: true, width: 120, sortable: true },
  { key: 'sku', label: 'SKU', category: 'basic', priority: 'important', visible: true, default: true, width: 100 },
  { key: 'comprador_nome', label: 'Comprador', category: 'basic', priority: 'important', visible: true, default: true, width: 120 },
  { key: 'quantidade', label: 'Qtd', category: 'basic', priority: 'important', visible: true, default: true, width: 60 },
  { key: 'valor_retido', label: 'Valor Retido', category: 'financial', priority: 'essential', visible: true, default: true, width: 100, sortable: true },
  { key: 'status_claim', label: 'Status', category: 'basic', priority: 'essential', visible: true, default: true, width: 100 },
  { key: 'conta_ml_nome', label: 'Conta ML', category: 'basic', priority: 'important', visible: true, default: true, width: 120 },

  // COLUNAS ORIGINAIS - Importantes
  { key: 'status_resumo_claim', label: 'Claim', category: 'basic', priority: 'important', visible: true, default: true, width: 120 },
  { key: 'status_resumo_return', label: 'Return', category: 'shipping', priority: 'important', visible: true, default: true, width: 120 },
  { key: 'mediacao_id', label: 'Mediação', category: 'basic', priority: 'optional', visible: true, default: false, width: 120 },
  { key: 'claim_attachments', label: 'Anexos', category: 'basic', priority: 'optional', visible: true, default: false, width: 120 },
  { key: 'acao_manual_required', label: 'Ação Manual', category: 'basic', priority: 'important', visible: true, default: true, width: 80 },

  // MENSAGENS E COMUNICAÇÃO
  { key: 'mensagens_totais', label: 'Total Msgs', category: 'basic', priority: 'optional', visible: true, default: false, width: 80 },
  { key: 'mensagens_nao_lidas', label: 'Não Lidas', category: 'basic', priority: 'optional', visible: true, default: false, width: 80 },
  { key: 'status_moderacao', label: 'Moderação', category: 'basic', priority: 'optional', visible: false, default: false, width: 90, description: '❌ Dado nunca disponível - ML API não fornece' },
  { key: 'data_ultima_mensagem', label: 'Última Msg', category: 'basic', priority: 'optional', visible: true, default: false, width: 120 },
  { key: 'ultima_mensagem_texto', label: 'Texto Última Msg', category: 'basic', priority: 'optional', visible: true, default: false, width: 250 },
  { key: 'qualidade_comunicacao', label: 'Qualidade Com.', category: 'basic', priority: 'optional', visible: false, default: false, width: 100, description: '❌ Dado nunca disponível - ML API não fornece métricas de qualidade' },

  // DATAS E PRAZOS
  { key: 'dias_restantes_acao', label: 'Dias Restantes', category: 'basic', priority: 'optional', visible: false, default: false, width: 80, description: '❌ Cálculo não implementado - requer timestamps granulares' },
  { key: 'data_vencimento_acao', label: 'Venc. Ação', category: 'basic', priority: 'optional', visible: true, default: false, width: 120 },
  { key: 'data_estimada_troca', label: 'Est. Troca', category: 'shipping', priority: 'optional', visible: true, default: false, width: 120 },
  { key: 'data_limite_troca', label: 'Lim. Troca', category: 'shipping', priority: 'optional', visible: true, default: false, width: 120 },
  { key: 'prazo_revisao_dias', label: 'Prazo Revisão', category: 'basic', priority: 'optional', visible: false, default: false, width: 80, description: '❌ Cálculo não implementado' },

  // RASTREAMENTO E LOGÍSTICA
  { key: 'codigo_rastreio', label: 'Rastreio', category: 'shipping', priority: 'important', visible: true, default: true, width: 120 },
  { key: 'transportadora', label: 'Transportadora', category: 'shipping', priority: 'optional', visible: true, default: false, width: 100 },
  { key: 'status_envio', label: 'Status Envio', category: 'shipping', priority: 'important', visible: true, default: true, width: 100 },
  { key: 'tempo_transito_dias', label: 'Tempo Trânsito', category: 'shipping', priority: 'optional', visible: false, default: false, width: 80, description: '❌ Dado nunca disponível - ML API só fornece status básico' },

  // CUSTOS E FINANCEIRO
  { key: 'custo_envio', label: 'Custo Envio', category: 'financial', priority: 'optional', visible: false, default: false, width: 100, description: '❌ Dado nunca disponível - ML API não detalha custos' },
  { key: 'custo_handling', label: 'Custo Handling', category: 'financial', priority: 'optional', visible: false, default: false, width: 100, description: '❌ Dado nunca disponível - ML API não detalha custos' },
  { key: 'valor_compensacao', label: 'Compensação', category: 'financial', priority: 'optional', visible: true, default: false, width: 100 },
  { key: 'moeda', label: 'Moeda', category: 'financial', priority: 'optional', visible: true, default: false, width: 80 },
  { key: 'responsavel_custo', label: 'Resp. Custo', category: 'financial', priority: 'optional', visible: true, default: false, width: 100 },

  // CLASSIFICAÇÃO
  { key: 'tipo_reclamacao', label: 'Tipo', category: 'basic', priority: 'important', visible: true, default: true, width: 100 },
  { key: 'subtipo_reclamacao', label: 'Subtipo', category: 'basic', priority: 'optional', visible: true, default: false, width: 100 },
  { key: 'em_mediacao', label: 'Em Mediação', category: 'basic', priority: 'optional', visible: true, default: false, width: 80 },
  { key: 'metodo_resolucao', label: 'Método Resolução', category: 'basic', priority: 'optional', visible: true, default: false, width: 120 },
  { key: 'prioridade_caso', label: 'Prioridade', category: 'basic', priority: 'optional', visible: true, default: false, width: 80 },

  // MÉTRICAS E KPIS (com dados reais)
  { key: 'total_evidencias', label: 'Evidências', category: 'basic', priority: 'optional', visible: true, default: false, width: 80 },
  { key: 'requer_acao', label: 'Ação Req.', category: 'basic', priority: 'important', visible: true, default: true, width: 80 },

  // ESTADOS E FLAGS
  { key: 'e_troca', label: 'É Troca', category: 'basic', priority: 'optional', visible: true, default: false, width: 60 },
  { key: 'expedited_ml', label: 'Expedited ML', category: 'ml', priority: 'optional', visible: true, default: false, width: 60 },

  // MÉTRICAS TEMPORAIS - SEM DADOS
  { key: 'tempo_primeira_resposta_vendedor', label: '1ª Resp Vend.', category: 'meta', priority: 'optional', visible: false, default: false, width: 100, description: '❌ Dado nunca disponível - ML API não fornece timestamps granulares' },
  { key: 'tempo_resposta_comprador', label: 'Resp. Comprador', category: 'meta', priority: 'optional', visible: false, default: false, width: 100, description: '❌ Dado nunca disponível - ML API não fornece timestamps granulares' },
  { key: 'tempo_analise_ml', label: 'Análise ML', category: 'meta', priority: 'optional', visible: false, default: false, width: 100, description: '❌ Dado nunca disponível - ML API não fornece timestamps granulares' },
  { key: 'tempo_resposta_medio', label: 'Tempo Médio', category: 'meta', priority: 'optional', visible: false, default: false, width: 100, description: '❌ Dado nunca disponível - ML API não fornece timestamps granulares' },
  { key: 'dias_ate_resolucao', label: 'Dias Resolução', category: 'meta', priority: 'optional', visible: true, default: false, width: 100 },
  { key: 'dentro_sla', label: 'SLA OK', category: 'meta', priority: 'optional', visible: true, default: false, width: 80 },

  // SATISFAÇÃO - SEM DADOS (removidas colunas inexistentes na API)
  { key: 'score_satisfacao', label: 'Score Satisf.', category: 'meta', priority: 'optional', visible: true, default: false, width: 100 },
  { key: 'eficiencia_resolucao', label: 'Eficiência', category: 'meta', priority: 'optional', visible: true, default: false, width: 100 },
  { key: 'resultado_final', label: 'Resultado', category: 'basic', priority: 'optional', visible: true, default: false, width: 100 },
  { key: 'feedback_comprador_final', label: 'Feedback Comp.', category: 'meta', priority: 'optional', visible: false, default: false, width: 150, description: '❌ Dado nunca disponível - não existe na ML API' },
  { key: 'feedback_vendedor', label: 'Feedback Vend.', category: 'meta', priority: 'optional', visible: false, default: false, width: 150, description: '❌ Dado nunca disponível - não existe na ML API' },

  // GESTÃO (removidas colunas duplicadas/inexistentes)
  { key: 'revisor_caso', label: 'Revisor', category: 'basic', priority: 'optional', visible: true, default: false, width: 100 },

  // FINANCEIRO AVANÇADO
  { key: 'valor_reembolso_total', label: 'Reemb. Total', category: 'financial', priority: 'optional', visible: true, default: false, width: 100 },
  { key: 'desconto_aplicado', label: 'Desconto', category: 'financial', priority: 'optional', visible: true, default: false, width: 100 },
  { key: 'valor_frete_original', label: 'Frete Orig.', category: 'financial', priority: 'optional', visible: true, default: false, width: 100 },
];

export const DEVOLUCAO_DEFAULT_PROFILES: ColumnProfile[] = [
  {
    id: 'essential',
    name: 'Essencial',
    description: 'Colunas mínimas para gestão diária',
    columns: [
      'order_id',
      'data_venda',
      'produto_titulo',
      'claim_id',
      'comprador_nome',
      'quantidade',
      'valor_retido',
      'status_claim',
      'conta_ml_nome',
      'tipo_reclamacao',
      'status_envio',
      'codigo_rastreio'
    ]
  },
  {
    id: 'standard',
    name: 'Padrão',
    description: 'Visão balanceada para operação',
    columns: [
      'order_id',
      'data_venda',
      'produto_titulo',
      'claim_id',
      'sku',
      'comprador_nome',
      'quantidade',
      'valor_retido',
      'status_claim',
      'conta_ml_nome',
      'status_resumo_claim',
      'status_resumo_return',
      'tipo_reclamacao',
      'status_envio',
      'codigo_rastreio',
      'acao_manual_required',
      'requer_acao'
    ]
  },
  {
    id: 'financial',
    name: 'Financeiro',
    description: 'Foco em valores e custos',
    columns: [
      'order_id',
      'claim_id',
      'produto_titulo',
      'quantidade',
      'valor_retido',
      'valor_compensacao',
      'valor_reembolso_total',
      'desconto_aplicado',
      'valor_frete_original',
      'moeda',
      'responsavel_custo',
      'status_claim'
    ]
  },
  {
    id: 'logistic',
    name: 'Logística',
    description: 'Rastreamento e envios',
    columns: [
      'order_id',
      'claim_id',
      'produto_titulo',
      'codigo_rastreio',
      'transportadora',
      'status_envio',
      'data_estimada_troca',
      'data_limite_troca',
      'e_troca',
      'status_resumo_return',
      'expedited_ml'
    ]
  },
  {
    id: 'complete',
    name: 'Completo',
    description: 'Todas as colunas com dados reais (exclui campos sem dados)',
    columns: DEVOLUCAO_COLUMN_DEFINITIONS
      .filter(col => col.visible !== false && !col.description?.includes('❌'))
      .map(col => col.key)
  }
];

// Helper functions
export const getDevolucaoColumnsByCategory = (category: string) => {
  return DEVOLUCAO_COLUMN_DEFINITIONS.filter(col => col.category === category);
};

export const getDevolucaoEssentialColumns = () => {
  return DEVOLUCAO_COLUMN_DEFINITIONS.filter(col => col.priority === 'essential');
};

export const getDevolucaoDefaultVisibleColumns = () => {
  return DEVOLUCAO_COLUMN_DEFINITIONS.filter(col => col.default === true);
};

export const getDevolucaoColumnDefinition = (key: string) => {
  return DEVOLUCAO_COLUMN_DEFINITIONS.find(col => col.key === key);
};
