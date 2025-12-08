import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ColumnDefinition, ColumnProfile, ColumnState, ColumnActions, UseColumnManagerReturn } from '@/core/columns';
import { VENDAS_COMENVIO_COLUMN_DEFINITIONS, VENDAS_COMENVIO_DEFAULT_PROFILES, VENDAS_COMENVIO_DEFAULT_VISIBLE_COLUMNS } from '../config/vendas-comenvio-columns-config';
import { loadColumnPreferences, createDebouncedSave } from '@/core/columns';

const STORAGE_KEY = 'vendas-com-envio-column-preferences';
const STORAGE_VERSION = 3; // v3: nomes colunas atualizados

const savePreferences = createDebouncedSave({
  storageKey: STORAGE_KEY,
  version: STORAGE_VERSION,
}, 500);

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

  const columnOrder = VENDAS_COMENVIO_COLUMN_DEFINITIONS.map(col => col.key);
  
  return {
    visibleColumns: new Set(VENDAS_COMENVIO_DEFAULT_VISIBLE_COLUMNS),
    columnOrder,
    activeProfile: 'standard',
    customProfiles: []
  };
};

export function useVendasComEnvioColumnManager(): UseColumnManagerReturn {
  const [state, setState] = useState<ColumnState>(getInitialState);

  useEffect(() => {
    setState(prev => {
      const currentOrderSet = new Set(prev.columnOrder);
      const newDefs = VENDAS_COMENVIO_COLUMN_DEFINITIONS.filter(def => !currentOrderSet.has(def.key));
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

  useEffect(() => {
    savePreferences(state);
  }, [state]);

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
    const allProfiles = [...VENDAS_COMENVIO_DEFAULT_PROFILES, ...state.customProfiles];
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
    setState(prev => ({
      ...prev,
      visibleColumns: new Set(VENDAS_COMENVIO_DEFAULT_VISIBLE_COLUMNS),
      activeProfile: 'standard'
    }));
  }, []);

  const resetToEssentials = useCallback(() => {
    setState(prev => ({
      ...prev,
      visibleColumns: new Set(
        VENDAS_COMENVIO_COLUMN_DEFINITIONS.filter(col => col.priority === 'essential').map(col => col.key)
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

  const visibleDefinitions = useMemo(() => {
    return state.columnOrder
      .map(key => VENDAS_COMENVIO_COLUMN_DEFINITIONS.find(col => col.key === key))
      .filter((col): col is NonNullable<typeof col> => 
        col !== undefined && state.visibleColumns.has(col.key)
      );
  }, [state.visibleColumns, state.columnOrder]);

  const visibleColumnKeys = useMemo(() => {
    return Array.from(state.visibleColumns);
  }, [state.visibleColumns]);

  const profiles = useMemo(() => {
    return [...VENDAS_COMENVIO_DEFAULT_PROFILES, ...state.customProfiles];
  }, [state.customProfiles]);

  return {
    state,
    actions,
    definitions: VENDAS_COMENVIO_COLUMN_DEFINITIONS,
    visibleDefinitions,
    profiles,
    visibleColumnKeys
  } as UseColumnManagerReturn & { visibleColumnKeys: string[] };
}
