/**
 * 🎯 TIPOS PARA DEVOLUÇÕES AVANÇADAS - FASE 5
 * Define interface completa para as 42 novas colunas + compatibilidade
 */

// ===== TIPOS BÁSICOS (COMPATIBILIDADE TOTAL) =====
export interface DevolucaoBasica {
  id: string;
  integration_account_id: string;
  order_id: string;
  claim_id?: string | null;
  status_devolucao?: string | null;
  produto_titulo?: string | null;
  sku?: string | null;
  quantidade?: number | null;
  valor_retido?: number | null;
  data_criacao?: string | null;
  dados_order?: any;
  dados_claim?: any;
  dados_mensagens?: any;
  dados_return?: any;
  created_at?: string;
  updated_at?: string;
  comprador_nickname?: string | null;
  claim_status?: string | null;
  numero_interacoes?: number | null;
}

// ===== TIPOS AVANÇADOS (42 NOVAS COLUNAS) =====
export interface DevolucaoAvancada extends DevolucaoBasica {
  // 📨 MENSAGENS E COMUNICAÇÃO (6 colunas)
  timeline_mensagens?: TimelineMessage[] | null;
  ultima_mensagem_data?: string | null;
  ultima_mensagem_remetente?: string | null;
  mensagens_nao_lidas?: number | null;
  anexos_count?: number | null;
  status_moderacao?: string | null;

  // 📅 DATAS E PRAZOS (5 colunas)
  data_estimada_troca?: string | null;
  data_limite_troca?: string | null;
  prazo_revisao_dias?: number | null;
  data_vencimento_acao?: string | null;
  dias_restantes_acao?: number | null;

  // 📦 RASTREAMENTO E LOGÍSTICA (4 colunas)
  codigo_rastreamento?: string | null;
  transportadora?: string | null;
  status_rastreamento?: string | null;
  url_rastreamento?: string | null;

  // 💰 CUSTOS E FINANCEIRO (4 colunas)
  custo_envio_devolucao?: number | null;
  valor_compensacao?: number | null;
  moeda_custo?: string | null;
  responsavel_custo?: string | null;

  // 🏷️ CLASSIFICAÇÃO E RESOLUÇÃO (5 colunas)
  tipo_claim?: string | null;
  subtipo_claim?: string | null;
  motivo_categoria?: string | null;
  nivel_prioridade?: string | null;
  tags_automaticas?: string[] | null;

  // 📊 MÉTRICAS E KPIS (4 colunas)
  tempo_resposta_medio?: number | null;
  tempo_total_resolucao?: number | null;
  total_evidencias?: number | null;
  taxa_satisfacao?: number | null;

  // 🚩 ESTADOS E FLAGS (3 colunas)
  escalado_para_ml?: boolean | null;
  em_mediacao?: boolean | null;
  acao_seller_necessaria?: boolean | null;

  // 📋 DADOS DETALHADOS E COMPLEMENTARES (15 colunas)
  data_inicio_mediacao?: string | null;
  data_primeira_acao?: string | null;
  endereco_destino?: any | null;
  descricao_custos?: any | null;
  metodo_resolucao?: string | null;
  resultado_final?: string | null;
  resultado_mediacao?: string | null;
  impacto_reputacao?: string | null;
  satisfacao_comprador?: string | null;
  seller_reputation?: any | null;
  buyer_reputation?: any | null;
  detalhes_mediacao?: any | null;
  historico_status?: StatusHistoryItem[] | null;
  proxima_acao_requerida?: string | null;
  produto_troca_id?: string | null;
  status_produto_novo?: string | null;
  mediador_ml?: string | null;
  usuario_ultima_acao?: string | null;
  marketplace_origem?: string | null;
  anexos_comprador?: any[] | null;
  anexos_vendedor?: any[] | null;
  anexos_ml?: any[] | null;
  eh_troca?: boolean | null;
  valor_diferenca_troca?: number | null;
  account_name?: string | null;
  
  // ⏱️ ANÁLISE TEMPORAL E PERFORMANCE (Novas colunas)
  tempo_primeira_resposta_vendedor?: number | null;
  tempo_resposta_comprador?: number | null;
  tempo_analise_ml?: number | null;
  dias_ate_resolucao?: number | null;
  sla_cumprido?: boolean | null;
  tempo_limite_acao?: string | null;
  score_satisfacao_final?: number | null;
  eficiencia_resolucao?: string | null;
  
  // 🔍 REVIEW E QUALIDADE (Novas colunas - FASE 2)
  review_id?: string | null;
  review_status?: string | null;
  review_result?: string | null;
  problemas_encontrados?: any[] | null;
  acoes_necessarias_review?: any[] | null;
  data_inicio_review?: string | null;
  score_qualidade?: number | null;
  necessita_acao_manual?: boolean | null;
  revisor_responsavel?: string | null;
  
  // 💵 FINANCEIRO AVANÇADO (9 novas colunas - FASE 4)
  valor_reembolso_total?: number | null;
  valor_reembolso_produto?: number | null;
  valor_reembolso_frete?: number | null;
  taxa_ml_reembolso?: number | null;
  custo_logistico_total?: number | null;
  impacto_financeiro_vendedor?: number | null;
  moeda_reembolso?: string | null;
  metodo_reembolso?: string | null;
  data_processamento_reembolso?: string | null;
  
  // 📋 DADOS TÉCNICOS (3 novas colunas)
  dados_incompletos?: boolean | null;
  campos_faltantes?: string[] | null;
  ultima_sincronizacao?: string | null;
  
  // 📊 TIMELINE CONSOLIDADO
  timeline_consolidado?: any | null;
  
  // ========== 60 COLUNAS FALTANTES DO BANCO ==========
  
  // RASTREAMENTO DETALHADO
  codigo_rastreamento_devolucao?: string | null;
  transportadora_devolucao?: string | null;
  localizacao_atual?: string | null;
  status_transporte_atual?: string | null;
  shipment_id?: string | null;
  data_ultima_movimentacao?: string | null;
  previsao_entrega_vendedor?: string | null;
  tempo_transito_dias?: number | null;
  
  // CATEGORIAS E COMPLEXIDADE
  categoria_problema?: string | null;
  subcategoria_problema?: string | null;
  nivel_complexidade?: string | null;
  
  // FEEDBACK E COMUNICAÇÃO
  feedback_comprador_final?: string | null;
  feedback_vendedor?: string | null;
  qualidade_comunicacao?: string | null;
  
  // TIMELINE E EVENTOS
  timeline_events?: any[] | null;
  data_criacao_claim?: string | null;
  data_inicio_return?: string | null;
  data_finalizacao_timeline?: string | null;
  eventos_sistema?: any[] | null;
  marcos_temporais?: any | null;
  
  // TRACKING DETALHADO
  tracking_history?: any[] | null;
  shipment_costs?: any | null;
  shipment_delays?: any[] | null;
  carrier_info?: any | null;
  tracking_events?: any[] | null;
  historico_localizacoes?: any[] | null;
  
  // REVIEW DETALHADO
  observacoes_review?: string | null;
  
  // ORIGEM E TÉCNICO
  fonte_dados_primaria?: string | null;
  origem_timeline?: string | null;
  hash_verificacao?: string | null;
  confiabilidade_dados?: string | null;
  versao_api_utilizada?: string | null;
}

// ===== TIPOS AUXILIARES =====
export interface TimelineMessage {
  timestamp: string;
  remetente: 'buyer' | 'seller' | 'ml' | 'system';
  tipo: 'mensagem' | 'resposta' | 'acao' | 'status_change' | 'system_update';
  conteudo: string;
  anexos?: TimelineAttachment[];
  metadata?: {
    message_id?: string;
    read?: boolean;
    sender_id?: string;
    urgente?: boolean;
    automatica?: boolean;
  };
}

export interface TimelineAttachment {
  id: string;
  nome: string;
  tipo: 'image' | 'document' | 'video' | 'audio' | 'other';
  url: string;
  tamanho?: number;
  descricao?: string;
}

export interface StatusHistoryItem {
  status_anterior: string;
  status_novo: string;
  timestamp: string;
  motivo?: string;
  usuario?: string;
  observacoes?: string;
}

// ===== TIPOS PARA MÉTRICAS =====
export interface DevolucaoMetrics {
  total_count: number;
  by_priority: Record<string, number>;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  avg_response_time: number;
  avg_resolution_time: number;
  avg_satisfaction: number;
  escalation_rate: number;
  mediation_rate: number;
  high_priority_count: number;
  unread_messages_count: number;
  overdue_actions_count: number;
  total_value: number;
  financial_impact: {
    shipping_costs: number;
    compensation_costs: number;
    refund_amounts: number;
  };
}

// ===== TIPOS PARA FILTROS =====
export interface DevolucaoFiltrosAvancados {
  // Filtros básicos (compatibilidade)
  search?: string;
  status?: string;
  dataInicio?: string;
  dataFim?: string;
  accountIds?: string[];

  // Filtros avançados (novas colunas)
  nivel_prioridade?: ('low' | 'medium' | 'high' | 'critical')[];
  status_moderacao?: string[];
  tags_automaticas?: string[];
  escalado_para_ml?: boolean | null;
  em_mediacao?: boolean | null;
  acao_seller_necessaria?: boolean | null;
  impacto_reputacao?: ('low' | 'medium' | 'high' | 'critical')[];
  mensagens_nao_lidas_min?: number;
  tempo_resposta_max?: number;
  valor_retido_min?: number;
  valor_retido_max?: number;
  has_tracking?: boolean | null;
  has_attachments?: boolean | null;
  overdue_actions?: boolean | null;
}

// ===== TIPOS PARA AÇÕES =====
export interface DevolucaoAcao {
  id: string;
  tipo: 'responder' | 'escalar' | 'resolver' | 'marcar_lida' | 'adicionar_nota' | 'atualizar_status';
  label: string;
  icon?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  disabled?: boolean;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

// ===== TIPOS PARA CONFIGURAÇÃO DA FASE 2 =====
export interface DevolucoesFase2Config {
  integration_account_id: string;
  auto_enrich: boolean;
  batch_size: number;
  enable_real_time: boolean;
  show_advanced_columns: boolean;
  default_view_mode: 'cards' | 'table' | 'timeline';
  enable_notifications: boolean;
  auto_mark_read: boolean;
}

// ===== TIPOS PARA VIEWS =====
export type DevolucaoViewMode = 'cards' | 'table' | 'timeline' | 'kanban';

export interface DevolucaoViewConfig {
  mode: DevolucaoViewMode;
  columns_visible: string[];
  cards_per_page: number;
  table_page_size: number;
  sort_field: string;
  sort_direction: 'asc' | 'desc';
  group_by?: string;
  compact_mode: boolean;
}

// ===== TIPOS PARA NOTIFICAÇÕES =====
export interface DevolucaoNotification {
  id: string;
  devolucao_id: string;
  tipo: 'nova_mensagem' | 'status_mudou' | 'prazo_vencendo' | 'escalacao' | 'resolucao';
  titulo: string;
  mensagem: string;
  urgencia: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  read: boolean;
  action_required: boolean;
  metadata?: any;
}

// ===== EXPORTAÇÕES PRINCIPAIS =====
export type {
  DevolucaoBasica as DevolucaoMLCompativel, // Alias para compatibilidade
  TimelineMessage as MensagemTimeline,
  StatusHistoryItem as ItemHistoricoStatus,
  DevolucaoMetrics as MetricasDevolucao,
  DevolucaoFiltrosAvancados as FiltrosAvancados,
  DevolucaoAcao as AcaoDevolucao
};