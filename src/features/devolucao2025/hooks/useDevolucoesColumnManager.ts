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

const STORAGE_KEY = 'devolucoes-venda-column-preferences-v1';
const STORAGE_VERSION = 1;

// Estado inicial baseado nas configurações padrão
const getInitialState = (): ColumnState => {
  const defaultColumns = getDefaultVisibleColumns();
  const columnOrder = COLUMN_DEFINITIONS.map(col => col.key);
  
  console.log('🎛️ [DEVOLUÇÕES COLUMNS] Estado inicial:', {
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

// Carregar preferências persistidas
const loadStoredPreferences = (): Partial<ColumnState> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    
    const parsed = JSON.parse(stored);
    
    // Validar versão
    if (parsed.version !== STORAGE_VERSION) {
      console.log('🔄 [DEVOLUÇÕES COLUMNS] Versão de cache desatualizada, limpando...');
      localStorage.removeItem(STORAGE_KEY);
      return {};
    }
    
    // Validar estrutura
    if (!parsed || typeof parsed !== 'object') return {};
    
    const validColumnKeys = new Set(COLUMN_DEFINITIONS.map(col => col.key));
    
    // Filtrar colunas que não existem mais
    const visibleSet = new Set<string>(
      Array.isArray(parsed.visibleColumns) 
        ? parsed.visibleColumns.filter((key: string) => validColumnKeys.has(key))
        : []
    );
    
    const filteredOrder = Array.isArray(parsed.columnOrder)
      ? parsed.columnOrder.filter((key: string) => validColumnKeys.has(key))
      : COLUMN_DEFINITIONS.map(col => col.key);
    
    console.log('💾 [DEVOLUÇÕES COLUMNS] Preferências carregadas:', {
      visible: Array.from(visibleSet),
      order: filteredOrder,
      profile: parsed.activeProfile
    });
    
    return {
      visibleColumns: visibleSet,
      columnOrder: filteredOrder,
      activeProfile: typeof parsed.activeProfile === 'string' ? parsed.activeProfile : null,
      customProfiles: Array.isArray(parsed.customProfiles) ? parsed.customProfiles : []
    };
  } catch (error) {
    console.warn('❌ [DEVOLUÇÕES COLUMNS] Erro ao carregar preferências:', error);
    return {};
  }
};

// Salvar preferências
const savePreferences = (state: ColumnState) => {
  try {
    const toSave = {
      version: STORAGE_VERSION,
      visibleColumns: Array.from(state.visibleColumns),
      columnOrder: state.columnOrder,
      activeProfile: state.activeProfile,
      customProfiles: state.customProfiles
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    console.log('💾 [DEVOLUÇÕES COLUMNS] Preferências salvas');
  } catch (error) {
    console.warn('❌ [DEVOLUÇÕES COLUMNS] Erro ao salvar preferências:', error);
  }
};

/**
 * Hook principal de gerenciamento de colunas
 */
export function useDevolucoesColumnManager(): UseColumnManagerReturn {
  // Inicializar estado com preferências salvas ou padrões
  const [state, setState] = useState<ColumnState>(() => {
    const initial = getInitialState();
    const stored = loadStoredPreferences();
    
    return {
      ...initial,
      ...stored,
      visibleColumns: stored.visibleColumns || initial.visibleColumns,
      columnOrder: stored.columnOrder || initial.columnOrder
    };
  });

  // Persistir mudanças automaticamente
  useEffect(() => {
    const timer = setTimeout(() => {
      savePreferences(state);
    }, 500); // Debounce de 500ms
    
    return () => clearTimeout(timer);
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
