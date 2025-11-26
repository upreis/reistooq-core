/**
 * 🎯 HOOK UNIFICADO DE COLUMN MANAGER
 * Hook genérico reutilizável para gerenciamento de colunas em todas as páginas
 * 
 * Consolidação de lógica duplicada de:
 * - useVendasColumnManager
 * - useReclamacoesColumnManager
 * - useDevolucoesColumnManager
 * 
 * ⚠️ IMPORTANTE: Este hook gerencia APENAS UI (visibilidade de colunas)
 * Não afeta: auth, tokens, API calls, edge functions
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ColumnDefinition,
  ColumnProfile,
  ColumnState,
  ColumnActions,
  UseColumnManagerReturn,
  ColumnManagerConfig
} from './types';

// 🛡️ VALIDAÇÃO DE STORAGE
interface StorageData {
  version: number;
  visibleColumns: string[];
  columnOrder: string[];
  activeProfile: string | null;
  customProfiles: ColumnProfile[];
  timestamp: number;
}

const validateStorageData = (data: any, expectedVersion: number): data is StorageData => {
  if (!data || typeof data !== 'object') return false;
  if (data.version !== expectedVersion) return false;
  if (!Array.isArray(data.visibleColumns)) return false;
  if (!Array.isArray(data.columnOrder)) return false;
  if (!Array.isArray(data.customProfiles)) return false;
  if (typeof data.timestamp !== 'number') return false;
  
  // Validar idade do cache (30 dias)
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  if (Date.now() - data.timestamp > thirtyDaysInMs) return false;
  
  return true;
};

// 💾 CARREGAR DO STORAGE
const loadFromStorage = (
  storageKey: string,
  storageVersion: number,
  featureName: string
): Partial<ColumnState> | null => {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    if (!validateStorageData(parsed, storageVersion)) {
      console.warn(`🗑️ [${featureName} ColumnManager] Cache inválido ou expirado, limpando...`);
      localStorage.removeItem(storageKey);
      return null;
    }

    return {
      visibleColumns: new Set(parsed.visibleColumns),
      columnOrder: parsed.columnOrder,
      activeProfile: parsed.activeProfile,
      customProfiles: parsed.customProfiles,
    };
  } catch (error) {
    console.error(`❌ [${featureName} ColumnManager] Erro ao carregar preferências:`, error);
    localStorage.removeItem(storageKey);
    return null;
  }
};

// 💾 SALVAR NO STORAGE (com debounce)
let saveTimeouts: Map<string, NodeJS.Timeout> = new Map();

const saveToStorage = (
  storageKey: string,
  storageVersion: number,
  state: ColumnState,
  featureName: string
) => {
  const existingTimeout = saveTimeouts.get(storageKey);
  if (existingTimeout) clearTimeout(existingTimeout);
  
  const timeout = setTimeout(() => {
    try {
      const data: StorageData = {
        version: storageVersion,
        visibleColumns: Array.from(state.visibleColumns),
        columnOrder: state.columnOrder,
        activeProfile: state.activeProfile,
        customProfiles: state.customProfiles,
        timestamp: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(data));
      console.log(`💾 [${featureName} ColumnManager] Preferências salvas`);
    } catch (error) {
      console.error(`❌ [${featureName} ColumnManager] Erro ao salvar:`, error);
    }
    saveTimeouts.delete(storageKey);
  }, 500); // 500ms debounce
  
  saveTimeouts.set(storageKey, timeout);
};

/**
 * 🎯 HOOK UNIFICADO DE COLUMN MANAGER
 */
export function useUnifiedColumnManager<TDefinition extends ColumnDefinition = ColumnDefinition>(
  config: ColumnManagerConfig<TDefinition>
): UseColumnManagerReturn<TDefinition> {
  const {
    storageKey,
    storageVersion,
    columnDefinitions,
    defaultProfiles,
    featureName = 'UNIFIED'
  } = config;

  // 📦 ESTADO INICIAL
  const getInitialState = useCallback((): ColumnState => {
    const stored = loadFromStorage(storageKey, storageVersion, featureName);
    
    if (stored?.visibleColumns && stored.columnOrder) {
      console.log(`🔄 [${featureName} ColumnManager] Restaurando cache:`, {
        visibleCount: stored.visibleColumns.size,
        profile: stored.activeProfile
      });
      return {
        visibleColumns: stored.visibleColumns,
        columnOrder: stored.columnOrder,
        activeProfile: stored.activeProfile || null,
        customProfiles: stored.customProfiles || [],
      };
    }

    // Default: colunas marcadas como default
    const defaultColumns = columnDefinitions
      .filter(col => col.default)
      .map(col => col.key);

    console.log(`✨ [${featureName} ColumnManager] Estado inicial padrão:`, {
      defaultCount: defaultColumns.length,
      total: columnDefinitions.length
    });

    return {
      visibleColumns: new Set(defaultColumns),
      columnOrder: columnDefinitions.map(col => col.key),
      activeProfile: defaultProfiles[0]?.id || null,
      customProfiles: [],
    };
  }, [storageKey, storageVersion, columnDefinitions, defaultProfiles, featureName]);

  const [state, setState] = useState<ColumnState>(getInitialState);

  // 💾 AUTO-SAVE quando estado muda
  useEffect(() => {
    saveToStorage(storageKey, storageVersion, state, featureName);
  }, [state, storageKey, storageVersion, featureName]);

  // 🔄 RECONCILIAR novas colunas adicionadas após cache
  useEffect(() => {
    setState(prev => {
      const currentOrderSet = new Set(prev.columnOrder);
      const newDefs = columnDefinitions.filter(def => !currentOrderSet.has(def.key));
      if (newDefs.length === 0) return prev;

      const newOrder = [...prev.columnOrder, ...newDefs.map(d => d.key)];
      const newVisible = new Set(prev.visibleColumns);
      newDefs.forEach(def => {
        if (def.default) newVisible.add(def.key);
      });

      console.log(`🔄 [${featureName}] Novas colunas adicionadas:`, newDefs.map(d => d.key));

      return {
        ...prev,
        columnOrder: newOrder,
        visibleColumns: newVisible,
      };
    });
  }, [columnDefinitions, featureName]);

  // 🎬 AÇÕES
  const toggleColumn = useCallback((key: string) => {
    setState(prev => {
      const newVisible = new Set(prev.visibleColumns);
      if (newVisible.has(key)) {
        newVisible.delete(key);
      } else {
        newVisible.add(key);
      }
      return { ...prev, visibleColumns: newVisible, activeProfile: null };
    });
  }, []);

  const showColumn = useCallback((key: string) => {
    setState(prev => ({
      ...prev,
      visibleColumns: new Set([...prev.visibleColumns, key]),
      activeProfile: null,
    }));
  }, []);

  const hideColumn = useCallback((key: string) => {
    setState(prev => {
      const newVisible = new Set(prev.visibleColumns);
      newVisible.delete(key);
      return { ...prev, visibleColumns: newVisible, activeProfile: null };
    });
  }, []);

  const setVisibleColumns = useCallback((columns: string[]) => {
    setState(prev => ({
      ...prev,
      visibleColumns: new Set(columns),
      activeProfile: null,
    }));
  }, []);

  const reorderColumns = useCallback((columnOrder: string[]) => {
    setState(prev => ({ ...prev, columnOrder }));
  }, []);

  const loadProfile = useCallback((profileId: string) => {
    const profile = [...defaultProfiles, ...state.customProfiles].find(
      p => p.id === profileId
    );

    if (!profile) {
      console.warn(`⚠️ [${featureName}] Perfil não encontrado: ${profileId}`);
      return;
    }

    setState(prev => ({
      ...prev,
      visibleColumns: new Set(profile.columns),
      activeProfile: profileId,
    }));

    console.log(`✅ [${featureName}] Perfil "${profile.name}" carregado`);
  }, [state.customProfiles, defaultProfiles, featureName]);

  const saveProfile = useCallback((profile: Omit<ColumnProfile, 'id'>) => {
    const newProfile: ColumnProfile = {
      ...profile,
      id: `custom_${Date.now()}`,
    };

    setState(prev => ({
      ...prev,
      customProfiles: [...prev.customProfiles, newProfile],
      activeProfile: newProfile.id,
    }));

    console.log(`✅ [${featureName}] Perfil "${profile.name}" salvo`);
  }, [featureName]);

  const deleteProfile = useCallback((profileId: string) => {
    if (defaultProfiles.some(p => p.id === profileId)) {
      console.warn(`⚠️ [${featureName}] Não pode deletar perfil padrão: ${profileId}`);
      return;
    }

    setState(prev => ({
      ...prev,
      customProfiles: prev.customProfiles.filter(p => p.id !== profileId),
      activeProfile: prev.activeProfile === profileId ? null : prev.activeProfile,
    }));

    console.log(`🗑️ [${featureName}] Perfil ${profileId} deletado`);
  }, [defaultProfiles, featureName]);

  const resetToDefault = useCallback(() => {
    const defaultColumns = columnDefinitions
      .filter(col => col.default)
      .map(col => col.key);

    setState(prev => ({
      ...prev,
      visibleColumns: new Set(defaultColumns),
      activeProfile: defaultProfiles[0]?.id || null,
    }));

    console.log(`🔄 [${featureName}] Reset para padrão`);
  }, [columnDefinitions, defaultProfiles, featureName]);

  const resetToEssentials = useCallback(() => {
    const essentialProfile = defaultProfiles.find(p => p.id === 'essencial' || p.id === 'essential');
    if (essentialProfile) {
      setState(prev => ({
        ...prev,
        visibleColumns: new Set(essentialProfile.columns),
        activeProfile: essentialProfile.id,
      }));
      console.log(`🔄 [${featureName}] Reset para essenciais`);
    }
  }, [defaultProfiles, featureName]);

  // 📊 COMPUTED VALUES
  const visibleDefinitions = useMemo(() => {
    return state.columnOrder
      .map(key => columnDefinitions.find(def => def.key === key))
      .filter((def): def is TDefinition => 
        def !== undefined && state.visibleColumns.has(def.key)
      );
  }, [state.visibleColumns, state.columnOrder, columnDefinitions]);

  const visibleColumnKeys = useMemo(() => {
    return Array.from(state.visibleColumns);
  }, [state.visibleColumns]);

  const actions: ColumnActions = useMemo(() => ({
    toggleColumn,
    showColumn,
    hideColumn,
    setVisibleColumns,
    reorderColumns,
    loadProfile,
    saveProfile,
    deleteProfile,
    resetToDefault,
    resetToEssentials,
  }), [
    toggleColumn,
    showColumn,
    hideColumn,
    setVisibleColumns,
    reorderColumns,
    loadProfile,
    saveProfile,
    deleteProfile,
    resetToDefault,
    resetToEssentials,
  ]);

  const profiles = useMemo(() => [
    ...defaultProfiles,
    ...state.customProfiles,
  ], [defaultProfiles, state.customProfiles]);

  return {
    state,
    visibleColumnKeys,
    actions,
    definitions: columnDefinitions,
    visibleDefinitions,
    profiles,
  };
}

/**
 * 🧹 FUNÇÃO HELPER PARA LIMPAR CACHE
 */
export const resetColumnCache = (storageKey: string) => {
  try {
    localStorage.removeItem(storageKey);
    console.log(`🔄 Cache ${storageKey} limpo`);
    return true;
  } catch (error) {
    console.warn('❌ Erro ao limpar cache:', error);
    return false;
  }
};
