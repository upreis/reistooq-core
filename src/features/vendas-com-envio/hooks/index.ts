/**
 * 📦 VENDAS COM ENVIO - Hooks Index
 * Exportação centralizada dos hooks
 */

// ✅ Hook unificado (padrão /pedidos) - RECOMENDADO
export { useVendasComEnvioFiltersUnified, DEFAULT_FILTERS } from './useVendasComEnvioFiltersUnified';
export { useVendasComEnvioFiltersSync } from './useVendasComEnvioFiltersSync';

// Hook antigo mantido para compatibilidade
export { useVendasComEnvioFilters } from './useVendasComEnvioFilters';

// Outros hooks
export { useVendasComEnvioData } from './useVendasComEnvioData';
export { useVendasComEnvioPolling } from './useVendasComEnvioPolling';
export { useVendasComEnvioAccounts } from './useVendasComEnvioAccounts';
export { useVendasComEnvioLocalCache } from './useVendasComEnvioLocalCache';
