/**
 * 🔧 CORE COLUMNS MODULE
 * Utilities compartilhadas para sistema de colunas
 * FASE 2.1 - Consolidação de Column Manager System
 */

export {
  validateColumnCache,
  loadColumnPreferences,
  saveColumnPreferences,
  createDebouncedSave,
  clearColumnCache,
  type ColumnCacheData,
  type ColumnCacheOptions,
} from './columnStorageUtils';
