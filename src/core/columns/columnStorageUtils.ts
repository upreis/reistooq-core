/**
 * 🔧 COLUMN STORAGE UTILITIES
 * Utilities compartilhadas para persistência de preferências de coluna
 * Extraído da auditoria global - FASE 2.1
 */

export interface ColumnCacheData {
  version: number;
  visibleColumns: string[];
  columnOrder: string[];
  activeProfile: string | null;
  customProfiles: any[];
  timestamp: number;
}

export interface ColumnCacheOptions {
  storageKey: string;
  version: number;
  maxAgeInDays?: number;
}

/**
 * Validar estrutura e idade do cache
 */
export function validateColumnCache(
  data: any,
  expectedVersion: number,
  maxAgeInDays: number = 30
): data is ColumnCacheData {
  if (!data || typeof data !== 'object') return false;
  if (data.version !== expectedVersion) return false;
  if (!Array.isArray(data.visibleColumns)) return false;
  if (!Array.isArray(data.columnOrder)) return false;
  if (!Array.isArray(data.customProfiles)) return false;
  if (typeof data.timestamp !== 'number') return false;
  
  // Validar idade do cache
  const maxAgeInMs = maxAgeInDays * 24 * 60 * 60 * 1000;
  if (Date.now() - data.timestamp > maxAgeInMs) {
    console.warn('🗑️ Cache expirado (mais de', maxAgeInDays, 'dias)');
    return false;
  }
  
  return true;
}

/**
 * Carregar preferências de coluna do localStorage
 */
export function loadColumnPreferences(
  options: ColumnCacheOptions
): {
  visibleColumns: Set<string>;
  columnOrder: string[];
  activeProfile: string | null;
  customProfiles: any[];
} | null {
  try {
    const stored = localStorage.getItem(options.storageKey);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    if (!validateColumnCache(parsed, options.version, options.maxAgeInDays)) {
      console.warn('🗑️ Cache inválido ou expirado, limpando...', options.storageKey);
      localStorage.removeItem(options.storageKey);
      return null;
    }

    console.log('💾 Preferências carregadas:', options.storageKey, {
      visibleCount: parsed.visibleColumns.length,
      profile: parsed.activeProfile
    });

    return {
      visibleColumns: new Set(parsed.visibleColumns),
      columnOrder: parsed.columnOrder,
      activeProfile: parsed.activeProfile,
      customProfiles: parsed.customProfiles,
    };
  } catch (error) {
    console.error('❌ Erro ao carregar preferências de coluna:', error);
    localStorage.removeItem(options.storageKey);
    return null;
  }
}

/**
 * Salvar preferências de coluna no localStorage
 */
export function saveColumnPreferences(
  state: {
    visibleColumns: Set<string> | string[];
    columnOrder: string[];
    activeProfile: string | null;
    customProfiles: any[];
  },
  options: ColumnCacheOptions
): boolean {
  try {
    const data: ColumnCacheData = {
      version: options.version,
      visibleColumns: Array.isArray(state.visibleColumns) 
        ? state.visibleColumns 
        : Array.from(state.visibleColumns),
      columnOrder: state.columnOrder,
      activeProfile: state.activeProfile,
      customProfiles: state.customProfiles,
      timestamp: Date.now(),
    };
    
    localStorage.setItem(options.storageKey, JSON.stringify(data));
    console.log('💾 Preferências salvas:', options.storageKey);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar preferências de coluna:', error);
    return false;
  }
}

/**
 * Criar função de salvamento com debounce
 */
export function createDebouncedSave(
  options: ColumnCacheOptions,
  debounceMs: number = 500
) {
  let saveTimeout: NodeJS.Timeout | null = null;
  
  return (state: {
    visibleColumns: Set<string> | string[];
    columnOrder: string[];
    activeProfile: string | null;
    customProfiles: any[];
  }) => {
    if (saveTimeout) clearTimeout(saveTimeout);
    
    saveTimeout = setTimeout(() => {
      saveColumnPreferences(state, options);
    }, debounceMs);
  };
}

/**
 * Limpar cache de preferências
 */
export function clearColumnCache(storageKey: string): boolean {
  try {
    localStorage.removeItem(storageKey);
    console.log('🗑️ Cache limpo:', storageKey);
    return true;
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error);
    return false;
  }
}
