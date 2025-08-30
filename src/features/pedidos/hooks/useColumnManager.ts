/**
 * 🎛️ HOOK PARA GERENCIAMENTO UNIFICADO DE COLUNAS
 * Mantém estado, persistência e ações centralizadas
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ColumnState, ColumnActions, UseColumnManagerReturn, ColumnProfile } from '../types/columns.types';
import { COLUMN_DEFINITIONS, DEFAULT_PROFILES, getDefaultVisibleColumns } from '../config/columns.config';

const STORAGE_KEY = 'pedidos-column-preferences';

// Estado inicial baseado nas configurações padrão
const getInitialState = (): ColumnState => {
  const defaultColumns = getDefaultVisibleColumns();
  
  return {
    visibleColumns: new Set(defaultColumns.map(col => col.key)),
    columnOrder: COLUMN_DEFINITIONS.map(col => col.key),
    activeProfile: 'standard',
    customProfiles: []
  };
};

// Carregar preferências do localStorage
const loadStoredPreferences = (): Partial<ColumnState> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    
    const parsed = JSON.parse(stored);
    
    // Validar se os dados são válidos
    if (!parsed || typeof parsed !== 'object') return {};
    
    return {
      visibleColumns: new Set(Array.isArray(parsed.visibleColumns) ? parsed.visibleColumns : []),
      columnOrder: Array.isArray(parsed.columnOrder) 
        ? parsed.columnOrder 
        : COLUMN_DEFINITIONS.map(col => col.key),
      activeProfile: typeof parsed.activeProfile === 'string' 
        ? parsed.activeProfile 
        : null,
      customProfiles: Array.isArray(parsed.customProfiles) 
        ? parsed.customProfiles 
        : []
    };
  } catch (error) {
    console.warn('Erro ao carregar preferências de colunas:', error);
    localStorage.removeItem(STORAGE_KEY); // Limpar dados corrompidos
    return {};
  }
};

// Salvar preferências no localStorage
const savePreferences = (state: ColumnState) => {
  try {
    const toSave = {
      visibleColumns: Array.from(state.visibleColumns),
      columnOrder: state.columnOrder,
      activeProfile: state.activeProfile,
      customProfiles: state.customProfiles,
      timestamp: Date.now() // Para debug e versionamento
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    console.log('✅ Preferências de colunas salvas:', toSave);
  } catch (error) {
    console.warn('❌ Erro ao salvar preferências de colunas:', error);
  }
};

export const useColumnManager = (): UseColumnManagerReturn => {
  // 🔧 CORREÇÃO CRÍTICA: Inicialização mais simples para evitar erro React
  const [state, setState] = useState<ColumnState>(() => {
    try {
      const initial = getInitialState();
      const stored = loadStoredPreferences();
      
      // Validação mais robusta
      if (!stored || Object.keys(stored).length === 0) {
        return initial;
      }
      
      // Merge seguro dos dados
      const mergedState: ColumnState = {
        visibleColumns: stored.visibleColumns 
          ? new Set(Array.isArray(stored.visibleColumns) ? stored.visibleColumns : Array.from(initial.visibleColumns))
          : initial.visibleColumns,
        columnOrder: Array.isArray(stored.columnOrder) ? stored.columnOrder : initial.columnOrder,
        activeProfile: typeof stored.activeProfile === 'string' ? stored.activeProfile : initial.activeProfile,
        customProfiles: Array.isArray(stored.customProfiles) ? stored.customProfiles : initial.customProfiles
      };
      
      return mergedState;
    } catch (error) {
      console.warn('❌ Erro na inicialização do columnManager, usando padrão:', error);
      return getInitialState();
    }
  });
 
  // Reconciliar novas colunas adicionadas após preferências salvas
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

  // Salvar automaticamente quando o estado mudar
  useEffect(() => {
    savePreferences(state);
  }, [state]);

  // Ações para manipular colunas
  const toggleColumn = useCallback((key: string) => {
    setState(prev => {
      const newVisible = new Set(prev.visibleColumns);
      if (newVisible.has(key)) newVisible.delete(key); else newVisible.add(key);
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
    setState(prev => ({ ...prev, customProfiles: [...prev.customProfiles, newProfile] }));
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
      visibleColumns: new Set(defaultColumns.map(col => col.key)),
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


  // Definições de colunas visíveis na ordem correta
  const visibleDefinitions = useMemo(() => {
    return state.columnOrder
      .map(key => COLUMN_DEFINITIONS.find(col => col.key === key))
      .filter((col): col is NonNullable<typeof col> => 
        col !== undefined && state.visibleColumns.has(col.key)
      );
  }, [state.visibleColumns, state.columnOrder]);

  // Todos os perfis disponíveis
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
};