// Constantes do sistema de histórico
export const HISTORICO_CONSTANTS = {
  // Paginação
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 50,
    MAX_PAGE_SIZE: 1000,
    MIN_PAGE_SIZE: 10,
    PREFETCH_PAGES: 2,
    VIRTUAL_ITEM_HEIGHT: 60,
    OVERSCAN: 5
  },

  // Cache
  CACHE: {
    TTL_DATA: 5 * 60 * 1000, // 5 minutos
    TTL_FILTERS: 30 * 60 * 1000, // 30 minutos
    TTL_ANALYTICS: 15 * 60 * 1000, // 15 minutos
    TTL_EXPORT: 60 * 60 * 1000, // 1 hora
    MAX_ITEMS: 100,
    STORAGE_KEY: 'historico_cache'
  },

  // Debounce
  DEBOUNCE: {
    SEARCH: 300,
    FILTERS: 500,
    RESIZE: 100,
    SCROLL: 16
  },

  // Export
  EXPORT: {
    MAX_RECORDS_IMMEDIATE: 10000,
    MAX_RECORDS_BACKGROUND: 1000000,
    BATCH_SIZE: 5000,
    FORMATS: {
      CSV: { ext: 'csv', mime: 'text/csv' },
      XLSX: { ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      PDF: { ext: 'pdf', mime: 'application/pdf' },
      JSON: { ext: 'json', mime: 'application/json' }
    },
    COMPRESSION_THRESHOLD: 1024 * 1024 // 1MB
  },

  // Filtros
  FILTERS: {
    MAX_CONDITIONS: 20,
    MAX_PRESETS: 50,
    AUTO_SAVE_DELAY: 2000,
    QUICK_FILTERS: [
      { id: 'today', label: 'Hoje', days: 0 },
      { id: 'yesterday', label: 'Ontem', days: 1 },
      { id: 'last7days', label: 'Últimos 7 dias', days: 7 },
      { id: 'last30days', label: 'Últimos 30 dias', days: 30 },
      { id: 'thisMonth', label: 'Este mês', type: 'month' },
      { id: 'lastMonth', label: 'Mês passado', type: 'lastMonth' }
    ]
  },

  // Keyboard shortcuts
  SHORTCUTS: {
    SEARCH: 'Ctrl+F',
    EXPORT: 'Ctrl+E',
    FILTERS: 'Ctrl+Shift+F',
    REFRESH: 'F5',
    SELECT_ALL: 'Ctrl+A',
    CLEAR_FILTERS: 'Ctrl+Shift+C',
    NEW_PRESET: 'Ctrl+Shift+P'
  },

  // Validação
  VALIDATION: {
    MIN_SEARCH_LENGTH: 2,
    MAX_SEARCH_LENGTH: 100,
    DATE_FORMAT: 'YYYY-MM-DD',
    DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
    CURRENCY_DECIMALS: 2,
    PERCENTAGE_DECIMALS: 1
  },

  // Performance
  PERFORMANCE: {
    VIRTUALIZATION_THRESHOLD: 100,
    LAZY_LOAD_THRESHOLD: 50,
    ANIMATION_DURATION: 200,
    TRANSITION_TIMING: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },

  // Analytics
  ANALYTICS: {
    CHART_COLORS: [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
      '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
    ],
    DEFAULT_CHART_HEIGHT: 300,
    MAX_CHART_POINTS: 100,
    ANIMATION_DELAY: 50
  },

  // Localização
  LOCALE: {
    CURRENCY: 'BRL',
    LANGUAGE: 'pt-BR',
    TIMEZONE: 'America/Sao_Paulo',
    DATE_FORMAT: 'dd/MM/yyyy',
    DATETIME_FORMAT: 'dd/MM/yyyy HH:mm',
    NUMBER_FORMAT: '#,##0.00'
  },

  // Mensagens
  MESSAGES: {
    LOADING: 'Carregando dados...',
    NO_DATA: 'Nenhum dado encontrado',
    ERROR_GENERAL: 'Ocorreu um erro inesperado',
    ERROR_NETWORK: 'Erro de conexão. Verifique sua internet.',
    ERROR_PERMISSION: 'Você não tem permissão para esta ação',
    EXPORT_SUCCESS: 'Exportação concluída com sucesso',
    EXPORT_ERROR: 'Erro na exportação. Tente novamente.',
    FILTERS_SAVED: 'Filtros salvos com sucesso',
    PRESET_CREATED: 'Preset criado com sucesso'
  },

  // Colunas padrão
  DEFAULT_COLUMNS: [
    { key: 'data_pedido', label: 'Data', width: 120, sortable: true, visible: true },
    { key: 'numero_pedido', label: 'Pedido', width: 150, sortable: true, visible: true },
    { key: 'cliente_nome', label: 'Cliente', width: 200, sortable: true, visible: true },
    { key: 'sku_produto', label: 'SKU', width: 120, sortable: true, visible: true },
    { key: 'descricao', label: 'Produto', width: 250, sortable: false, visible: true },
    { key: 'quantidade', label: 'Qtd', width: 80, sortable: true, visible: true, align: 'right' },
    { key: 'valor_unitario', label: 'Valor Unit.', width: 120, sortable: true, visible: true, align: 'right' },
    { key: 'valor_total', label: 'Total', width: 120, sortable: true, visible: true, align: 'right' },
    { key: 'status', label: 'Status', width: 100, sortable: true, visible: true },
    { key: 'cidade', label: 'Cidade', width: 150, sortable: true, visible: false },
    { key: 'uf', label: 'UF', width: 60, sortable: true, visible: false }
  ],

  // Status possíveis
  STATUS_OPTIONS: [
    { value: 'pendente', label: 'Pendente', color: '#f59e0b' },
    { value: 'processando', label: 'Processando', color: '#3b82f6' },
    { value: 'concluida', label: 'Concluída', color: '#10b981' },
    { value: 'cancelada', label: 'Cancelada', color: '#ef4444' },
    { value: 'devolvida', label: 'Devolvida', color: '#8b5cf6' }
  ],

  // Bulk operations
  BULK_OPERATIONS: [
    { id: 'export', label: 'Exportar Selecionados', icon: 'Download' },
    { id: 'update_status', label: 'Atualizar Status', icon: 'Edit' },
    { id: 'add_tags', label: 'Adicionar Tags', icon: 'Tag' },
    { id: 'delete', label: 'Excluir', icon: 'Trash', destructive: true }
  ]
} as const;

// Types derivados das constantes
export type HistoricoStatus = typeof HISTORICO_CONSTANTS.STATUS_OPTIONS[number]['value'];
export type HistoricoDatePresetId = typeof HISTORICO_CONSTANTS.FILTERS.QUICK_FILTERS[number]['id'];
export type HistoricoBulkOperation = typeof HISTORICO_CONSTANTS.BULK_OPERATIONS[number]['id'];
export type HistoricoColumnKey = typeof HISTORICO_CONSTANTS.DEFAULT_COLUMNS[number]['key'];