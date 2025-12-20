// P7.2: Constants centralizadas para evitar magic numbers
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 200, // Aumentado para suportar opções maiores
  EXPORT_LIMIT: 9999,
} as const;

export const CACHE = {
  VALIDITY_MS: 5 * 60 * 1000, // 5 minutos
} as const;

export const DEBOUNCE = {
  FILTER_DELAY_MS: 300, // ✅ REDUZIDO: 300ms para melhor UX
  SEARCH_DELAY_MS: 150, // ✅ REDUZIDO: 150ms para busca mais rápida
  MAPPINGS_DELAY_MS: 800, // ✅ NOVO: Debounce para mapeamentos
} as const;

export const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ready_to_ship: 'bg-blue-100 text-blue-800 border-blue-200',
  shipped: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  not_delivered: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
  default: 'bg-gray-100 text-gray-800 border-gray-200',
} as const;