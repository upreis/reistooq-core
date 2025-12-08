/**
 * 🔧 CORE COLUMNS MODULE
 * Utilities e tipos compartilhados para sistema de colunas
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

// Tipos compartilhados de colunas
export {
  type ColumnCategory,
  type ColumnPriority,
  type ColumnDefinition,
  type ColumnProfile,
  type ColumnState,
  type ColumnActions,
  type UseColumnManagerReturn,
} from './types';
