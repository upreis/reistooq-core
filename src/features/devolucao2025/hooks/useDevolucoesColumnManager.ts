/**
 * 🎛️ HOOK PARA GERENCIAMENTO AVANÇADO DE COLUNAS - DEVOLUÇÕES DE VENDA
 * Inspirado na arquitetura de referência /pedidos
 * 
 * Features:
 * - Persistência automática em localStorage
 * - Versionamento de cache com cleanup
 * - Perfis pré-definidos e personalizados
 * - Sincronização com sistema de filtros
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ColumnState, ColumnActions, UseColumnManagerReturn, ColumnProfile, ColumnDefinition } from '../types/columns.types';
import { COLUMN_DEFINITIONS, DEFAULT_PROFILES, getDefaultVisibleColumns } from '../config/columns.config';
import { loadColumnPreferences, createDebouncedSave } from '@/core/columns';

const STORAGE_KEY = 'devolucoes-venda-column-preferences-v1';
const STORAGE_VERSION = 1;

// 💾 DEBOUNCED SAVE usando utility compartilhada
const savePreferences = createDebouncedSave({
  storageKey: STORAGE_KEY,
  version: STORAGE_VERSION,
}, 500);

// Estado inicial baseado nas configurações padrão usando utility compartilhada
const getInitialState = (): ColumnState => {
  const stored = loadColumnPreferences({
    storageKey: STORAGE_KEY,
    version: STORAGE_VERSION,
  });
  
  if (stored?.visibleColumns && stored.columnOrder) {
    console.log('🔄 [DEVOLUÇÕES COLUMNS] Restaurando do cache:', {
      visibleCount: stored.visibleColumns.size,
      profile: stored.activeProfile
    });
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
  
  console.log('✨ [DEVOLUÇÕES COLUMNS] Estado inicial padrão:', {
    defaultColumns: defaultColumns.map(col => col.key),
    totalDefinitions: COLUMN_DEFINITIONS.length,
    columnOrder
  });
  
  return {
    visibleColumns: new Set(defaultColumns.map(col => col.key)),
    columnOrder,
    activeProfile: 'standard',
    customProfiles: []
  };
};

/**
 * Hook principal de gerenciamento de colunas
 */
export function useDevolucoesColumnManager(): UseColumnManagerReturn {
  // Inicializar estado
  const [state, setState] = useState<ColumnState>(getInitialState);

  // Persistir mudanças automaticamente usando utility compartilhada
  useEffect(() => {
    savePreferences(state);
  }, [state]);

  // ====== AÇÕES ======

  const toggleColumn = useCallback((key: string) => {
    setState(prev => {
      const newVisible = new Set(prev.visibleColumns);
      if (newVisible.has(key)) {
        newVisible.delete(key);
        console.log(`🔄 [DEVOLUÇÕES COLUMNS] Coluna ocultada: ${key}`);
      } else {
        newVisible.add(key);
        console.log(`🔄 [DEVOLUÇÕES COLUMNS] Coluna exibida: ${key}`);
      }
      return { ...prev, visibleColumns: newVisible, activeProfile: null };
    });
  }, []);

  const showColumn = useCallback((key: string) => {
    setState(prev => {
      const newVisible = new Set(prev.visibleColumns);
      newVisible.add(key);
      console.log(`👁️ [DEVOLUÇÕES COLUMNS] Coluna exibida: ${key}`);
      return { ...prev, visibleColumns: newVisible, activeProfile: null };
    });
  }, []);

  const hideColumn = useCallback((key: string) => {
    setState(prev => {
      const newVisible = new Set(prev.visibleColumns);
      newVisible.delete(key);
      console.log(`🙈 [DEVOLUÇÕES COLUMNS] Coluna ocultada: ${key}`);
      return { ...prev, visibleColumns: newVisible, activeProfile: null };
    });
  }, []);

  const setVisibleColumns = useCallback((columns: string[]) => {
    setState(prev => ({
      ...prev,
      visibleColumns: new Set(columns),
      activeProfile: null
    }));
    console.log('🎛️ [DEVOLUÇÕES COLUMNS] Colunas visíveis definidas:', columns);
  }, []);

  const reorderColumns = useCallback((columnOrder: string[]) => {
    setState(prev => ({ ...prev, columnOrder }));
    console.log('🔄 [DEVOLUÇÕES COLUMNS] Colunas reordenadas');
  }, []);

  const loadProfile = useCallback((profileId: string) => {
    const profile = [...DEFAULT_PROFILES, ...state.customProfiles].find(p => p.id === profileId);
    
    if (profile) {
      setState(prev => ({
        ...prev,
        visibleColumns: new Set(profile.columns),
        activeProfile: profileId
      }));
      console.log(`📋 [DEVOLUÇÕES COLUMNS] Perfil carregado: ${profile.name}`);
    }
  }, [state.customProfiles]);

  const saveProfile = useCallback((profile: Omit<ColumnProfile, 'id'>) => {
    const newProfile: ColumnProfile = {
      ...profile,
      id: `custom_${Date.now()}`
    };
    
    setState(prev => ({
      ...prev,
      customProfiles: [...prev.customProfiles, newProfile],
      activeProfile: newProfile.id
    }));
    console.log(`💾 [DEVOLUÇÕES COLUMNS] Perfil salvo: ${newProfile.name}`);
  }, []);

  const deleteProfile = useCallback((profileId: string) => {
    setState(prev => ({
      ...prev,
      customProfiles: prev.customProfiles.filter(p => p.id !== profileId),
      activeProfile: prev.activeProfile === profileId ? null : prev.activeProfile
    }));
    console.log(`🗑️ [DEVOLUÇÕES COLUMNS] Perfil removido: ${profileId}`);
  }, []);

  const resetToDefault = useCallback(() => {
    const defaultProfile = DEFAULT_PROFILES.find(p => p.id === 'standard');
    if (defaultProfile) {
      setState(prev => ({
        ...prev,
        visibleColumns: new Set(defaultProfile.columns),
        activeProfile: 'standard'
      }));
      console.log('🔄 [DEVOLUÇÕES COLUMNS] Reset para perfil padrão');
    }
  }, []);

  const resetToEssentials = useCallback(() => {
    const essentialProfile = DEFAULT_PROFILES.find(p => p.id === 'essential');
    if (essentialProfile) {
      setState(prev => ({
        ...prev,
        visibleColumns: new Set(essentialProfile.columns),
        activeProfile: 'essential'
      }));
      console.log('🔄 [DEVOLUÇÕES COLUMNS] Reset para essenciais');
    }
  }, []);

  // ====== COMPUTADOS ======

  const visibleDefinitions = useMemo(() => {
    const defs: ColumnDefinition[] = [];
    for (const key of state.columnOrder) {
      if (state.visibleColumns.has(key)) {
        const def = COLUMN_DEFINITIONS.find(col => col.key === key);
        if (def) defs.push(def);
      }
    }
    return defs;
  }, [state.visibleColumns, state.columnOrder]);

  const allProfiles = useMemo(() => {
    return [...DEFAULT_PROFILES, ...state.customProfiles];
  }, [state.customProfiles]);

  return {
    state,
    actions: {
      toggleColumn,
      showColumn,
      hideColumn,
      setVisibleColumns,
      reorderColumns,
      loadProfile,
      saveProfile,
      deleteProfile,
      resetToDefault,
      resetToEssentials
    },
    definitions: COLUMN_DEFINITIONS,
    visibleDefinitions,
    profiles: allProfiles
  };
}
