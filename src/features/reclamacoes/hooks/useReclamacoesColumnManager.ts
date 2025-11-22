/**
 * 🎯 HOOK DE GERENCIAMENTO DE COLUNAS - RECLAMAÇÕES
 * Arquitetura gold standard baseada em /pedidos
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  ReclamacoesColumnDefinition,
  ReclamacoesColumnProfile,
  ReclamacoesColumnState,
  ReclamacoesColumnActions,
  UseReclamacoesColumnManagerReturn,
  RECLAMACOES_COLUMN_DEFINITIONS,
  RECLAMACOES_DEFAULT_PROFILES,
  RECLAMACOES_COLUMN_STORAGE_KEY,
  RECLAMACOES_COLUMN_STORAGE_VERSION,
} from '../types/column-definitions';

// 🛡️ VALIDAÇÃO DE STORAGE
interface StorageData {
  version: number;
  visibleColumns: string[];
  columnOrder: string[];
  activeProfile: string | null;
  customProfiles: ReclamacoesColumnProfile[];
  timestamp: number;
}

const validateStorageData = (data: any): data is StorageData => {
  if (!data || typeof data !== 'object') return false;
  if (data.version !== RECLAMACOES_COLUMN_STORAGE_VERSION) return false;
  if (!Array.isArray(data.visibleColumns)) return false;
  if (!Array.isArray(data.columnOrder)) return false;
  if (!Array.isArray(data.customProfiles)) return false;
  if (typeof data.timestamp !== 'number') return false;
  
  // Validar idade do cache (30 dias)
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  if (Date.now() - data.timestamp > thirtyDaysInMs) return false;
  
  return true;
};

const loadFromStorage = (): Partial<ReclamacoesColumnState> | null => {
  try {
    const stored = localStorage.getItem(RECLAMACOES_COLUMN_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    if (!validateStorageData(parsed)) {
      console.warn('🗑️ [ColumnManager] Cache inválido ou expirado, limpando...');
      localStorage.removeItem(RECLAMACOES_COLUMN_STORAGE_KEY);
      return null;
    }

    return {
      visibleColumns: new Set(parsed.visibleColumns),
      columnOrder: parsed.columnOrder,
      activeProfile: parsed.activeProfile,
      customProfiles: parsed.customProfiles,
    };
  } catch (error) {
    console.error('❌ [ColumnManager] Erro ao carregar preferências:', error);
    localStorage.removeItem(RECLAMACOES_COLUMN_STORAGE_KEY);
    return null;
  }
};

// 💾 DEBOUNCED SAVE
let saveTimeout: NodeJS.Timeout | null = null;

const saveToStorage = (state: ReclamacoesColumnState) => {
  if (saveTimeout) clearTimeout(saveTimeout);
  
  saveTimeout = setTimeout(() => {
    try {
      const data: StorageData = {
        version: RECLAMACOES_COLUMN_STORAGE_VERSION,
        visibleColumns: Array.from(state.visibleColumns),
        columnOrder: state.columnOrder,
        activeProfile: state.activeProfile,
        customProfiles: state.customProfiles,
        timestamp: Date.now(),
      };
      localStorage.setItem(RECLAMACOES_COLUMN_STORAGE_KEY, JSON.stringify(data));
      console.log('💾 [ColumnManager] Preferências salvas com sucesso');
    } catch (error) {
      console.error('❌ [ColumnManager] Erro ao salvar preferências:', error);
    }
  }, 500); // 500ms debounce
};

// 🎯 HOOK PRINCIPAL
export const useReclamacoesColumnManager = (): UseReclamacoesColumnManagerReturn => {
  const { toast } = useToast();

  // 📦 ESTADO INICIAL
  const getInitialState = useCallback((): ReclamacoesColumnState => {
    const stored = loadFromStorage();
    
    if (stored?.visibleColumns && stored.columnOrder) {
      return {
        visibleColumns: stored.visibleColumns,
        columnOrder: stored.columnOrder,
        activeProfile: stored.activeProfile || null,
        customProfiles: stored.customProfiles || [],
      };
    }

    // Default: todas as colunas marcadas como default
    const defaultColumns = RECLAMACOES_COLUMN_DEFINITIONS
      .filter(col => col.default)
      .map(col => col.key);

    return {
      visibleColumns: new Set(defaultColumns),
      columnOrder: RECLAMACOES_COLUMN_DEFINITIONS.map(col => col.key),
      activeProfile: 'padrao',
      customProfiles: [],
    };
  }, []);

  const [state, setState] = useState<ReclamacoesColumnState>(getInitialState);
  const [updateCounter, setUpdateCounter] = useState(0); // 🔄 Força re-render

  // 💾 AUTO-SAVE
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

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
    setUpdateCounter(c => c + 1); // 🔄 Força re-render
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
    const profile = [...RECLAMACOES_DEFAULT_PROFILES, ...state.customProfiles].find(
      p => p.id === profileId
    );

    if (!profile) {
      toast({
        title: 'Perfil não encontrado',
        description: `O perfil "${profileId}" não existe.`,
        variant: 'destructive',
      });
      return;
    }

    setState(prev => ({
      ...prev,
      visibleColumns: new Set(profile.columns),
      activeProfile: profileId,
    }));

    toast({
      title: 'Perfil carregado',
      description: `Perfil "${profile.name}" aplicado com sucesso.`,
    });
  }, [state.customProfiles, toast]);

  const saveProfile = useCallback((profile: Omit<ReclamacoesColumnProfile, 'id'>) => {
    const newProfile: ReclamacoesColumnProfile = {
      ...profile,
      id: `custom_${Date.now()}`,
    };

    setState(prev => ({
      ...prev,
      customProfiles: [...prev.customProfiles, newProfile],
      activeProfile: newProfile.id,
    }));

    toast({
      title: 'Perfil salvo',
      description: `Perfil "${profile.name}" criado com sucesso.`,
    });
  }, [toast]);

  const deleteProfile = useCallback((profileId: string) => {
    if (RECLAMACOES_DEFAULT_PROFILES.some(p => p.id === profileId)) {
      toast({
        title: 'Erro',
        description: 'Não é possível excluir perfis padrão.',
        variant: 'destructive',
      });
      return;
    }

    setState(prev => ({
      ...prev,
      customProfiles: prev.customProfiles.filter(p => p.id !== profileId),
      activeProfile: prev.activeProfile === profileId ? null : prev.activeProfile,
    }));

    toast({
      title: 'Perfil excluído',
      description: 'Perfil personalizado removido.',
    });
  }, [toast]);

  const resetToDefault = useCallback(() => {
    const defaultColumns = RECLAMACOES_COLUMN_DEFINITIONS
      .filter(col => col.default)
      .map(col => col.key);

    setState(prev => ({
      ...prev,
      visibleColumns: new Set(defaultColumns),
      activeProfile: 'padrao',
    }));

    toast({
      title: 'Colunas restauradas',
      description: 'Visualização padrão restaurada.',
    });
  }, [toast]);

  const resetToEssentials = useCallback(() => {
    const essentialProfile = RECLAMACOES_DEFAULT_PROFILES.find(p => p.id === 'essencial');
    if (essentialProfile) {
      setState(prev => ({
        ...prev,
        visibleColumns: new Set(essentialProfile.columns),
        activeProfile: 'essencial',
      }));

      toast({
        title: 'Visão essencial ativada',
        description: 'Apenas colunas críticas visíveis.',
      });
    }
  }, [toast]);

  // 📊 COMPUTED
  const visibleDefinitions = useMemo(() => {
    return state.columnOrder
      .map(key => RECLAMACOES_COLUMN_DEFINITIONS.find(def => def.key === key))
      .filter((def): def is ReclamacoesColumnDefinition => 
        def !== undefined && state.visibleColumns.has(def.key)
      );
  }, [state.visibleColumns, state.columnOrder]);

  const actions: ReclamacoesColumnActions = useMemo(() => ({
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
    ...RECLAMACOES_DEFAULT_PROFILES,
    ...state.customProfiles,
  ], [state.customProfiles]);

  return {
    state,
    actions,
    definitions: RECLAMACOES_COLUMN_DEFINITIONS,
    visibleDefinitions,
    profiles,
    updateCounter, // 🔄 Expõe contador para dependências
  };
};
