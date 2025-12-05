import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ColumnDefinition, ColumnProfile, ColumnState, ColumnActions, UseColumnManagerReturn } from '../types/columns.types';
import { COLUMN_DEFINITIONS, DEFAULT_PROFILES } from '../config/columns.config';
import { loadColumnPreferences, createDebouncedSave } from '@/core/columns';

const STORAGE_KEY = 'vendas-column-preferences';
const STORAGE_VERSION = 1;

// 💾 DEBOUNCED SAVE usando utility compartilhada
const savePreferences = createDebouncedSave({
  storageKey: STORAGE_KEY,
  version: STORAGE_VERSION,
}, 500);

// 🔧 DEFAULT VISIBLE COLUMNS (keys only)
const getDefaultVisibleColumns = (): string[] => [
  'order_id',
  'empresa',
  'data_compra',
  'comprador',
  'produto',
  'quantidade',
  'valor_total',
  'status',
  'analise',
  'tipo_logistico',
  'sku_mapeado',
];

// 🔧 INITIAL STATE usando utility compartilhada
const getInitialState = (): ColumnState => {
  const stored = loadColumnPreferences({
    storageKey: STORAGE_KEY,
    version: STORAGE_VERSION,
  });
  
  if (stored?.visibleColumns && stored.columnOrder) {
    return {
      visibleColumns: stored.visibleColumns,
      columnOrder: stored.columnOrder,
      activeProfile: stored.activeProfile || 'standard',
      customProfiles: stored.customProfiles || [],
    };
  }

  // Default
  const defaultColumns = getDefaultVisibleColumns();
  const columnOrder = COLUMN_DEFINITIONS.map(col => col.key);
  
  return {
    visibleColumns: new Set(defaultColumns),
    columnOrder,
    activeProfile: 'standard',
    customProfiles: []
  };
};

// 🔄 RESET CACHE
export const resetVendasColumnCache = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    return false;
  }
};

export function useVendasColumnManager(): UseColumnManagerReturn {
  // 🔄 STATE - Initialize
  const [state, setState] = useState<ColumnState>(getInitialState);

  // 📥 RECONCILE NEW COLUMNS
  useEffect(() => {
    setState(prev => {
      const currentOrderSet = new Set(prev.columnOrder);
      const newDefs = COLUMN_DEFINITIONS.filter(def => !currentOrderSet.has(def.key));
      if (newDefs.length === 0) return prev;

      const newOrder = [...prev.columnOrder, ...newDefs.map(d => d.key)];
      const newVisible = new Set(prev.visibleColumns);
      newDefs.forEach(def => {
        if (def.default) newVisible.add(def.key);
      });

      return {
        ...prev,
        columnOrder: newOrder,
        visibleColumns: newVisible,
      };
    });
  }, []);

  // 💾 AUTO-SAVE usando utility compartilhada
  useEffect(() => {
    savePreferences(state);
  }, [state]);

  // 🎬 ACTIONS
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
      activeProfile: null
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
      activeProfile: null
    }));
  }, []);

  const reorderColumns = useCallback((columnOrder: string[]) => {
    setState(prev => ({
      ...prev,
      columnOrder,
      activeProfile: null
    }));
  }, []);

  const loadProfile = useCallback((profileId: string) => {
    const allProfiles = [...DEFAULT_PROFILES, ...state.customProfiles];
    const profile = allProfiles.find(p => p.id === profileId);
    if (profile) {
      setState(prev => ({
        ...prev,
        visibleColumns: new Set(profile.columns),
        activeProfile: profileId
      }));
    }
  }, [state.customProfiles]);

  const saveProfile = useCallback((profile: Omit<ColumnProfile, 'id'>) => {
    const newProfile: ColumnProfile = { ...profile, id: `custom_${Date.now()}` };
    setState(prev => ({
      ...prev,
      customProfiles: [...prev.customProfiles, newProfile]
    }));
  }, []);

  const deleteProfile = useCallback((profileId: string) => {
    setState(prev => ({
      ...prev,
      customProfiles: prev.customProfiles.filter(p => p.id !== profileId),
      activeProfile: prev.activeProfile === profileId ? null : prev.activeProfile
    }));
  }, []);

  const resetToDefault = useCallback(() => {
    const defaultColumns = getDefaultVisibleColumns();
    setState(prev => ({
      ...prev,
      visibleColumns: new Set(defaultColumns),
      activeProfile: 'standard'
    }));
  }, []);

  const resetToEssentials = useCallback(() => {
    setState(prev => ({
      ...prev,
      visibleColumns: new Set(
        COLUMN_DEFINITIONS.filter(col => col.priority === 'essential').map(col => col.key)
      ),
      activeProfile: 'essential'
    }));
  }, []);

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

  // 🔍 DERIVED STATE
  const visibleDefinitions = useMemo(() => {
    return state.columnOrder
      .map(key => COLUMN_DEFINITIONS.find(col => col.key === key))
      .filter((col): col is NonNullable<typeof col> => 
        col !== undefined && state.visibleColumns.has(col.key)
      );
  }, [state.visibleColumns, state.columnOrder]);

  const profiles = useMemo(() => {
    return [...DEFAULT_PROFILES, ...state.customProfiles];
  }, [state.customProfiles]);

  return {
    state,
    actions,
    definitions: COLUMN_DEFINITIONS,
    visibleDefinitions,
    profiles
  };
}
