/**
 * 📦 VENDAS COM ENVIO - Feature Index
 * Exportação centralizada da feature
 */

// Components
export { VendasComEnvioPage } from './components';

// Hooks
export {
  useVendasComEnvioFilters,
  useVendasComEnvioData,
  useVendasComEnvioPolling,
} from './hooks';

// Store
export { useVendasComEnvioStore } from './store/useVendasComEnvioStore';

// Types
export type {
  VendaComEnvio,
  VendasComEnvioFilters,
  VendasComEnvioStats,
  ShippingStatus,
  PaymentStatus,
} from './types';

// Config
export {
  STORAGE_KEYS,
  CACHE_TTL_MS,
  POLLING_INTERVAL_MS,
  SHIPPING_STATUS_LABELS,
  SHIPPING_STATUS_COLORS,
} from './config';
