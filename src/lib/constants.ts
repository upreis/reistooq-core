// P7.2: Constants centralizadas para evitar magic numbers
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 25,
  EXPORT_LIMIT: 9999,
} as const;

export const CACHE = {
  VALIDITY_MS: 5 * 60 * 1000, // 5 minutos
} as const;

export const DEBOUNCE = {
  FILTER_DELAY_MS: 800, // P2.2: Aumentado para 800ms para APIs externas
  SEARCH_DELAY_MS: 300,
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