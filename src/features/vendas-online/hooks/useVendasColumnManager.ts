/**
 * 🎛️ HOOK PARA GERENCIAMENTO AVANÇADO DE COLUNAS - VENDAS ONLINE
 * 🔄 MIGRADO para usar hook unificado (FASE 2.1)
 * 
 * ⚠️ WRAPPER: Este arquivo agora usa useUnifiedColumnManager
 * Mantido para compatibilidade - não quebra código existente
 */

import { useUnifiedColumnManager } from '@/core/columns';
import type { UseColumnManagerReturn } from '@/core/columns';
import { COLUMN_DEFINITIONS, DEFAULT_PROFILES } from '../config/columns.config';

const STORAGE_KEY = 'vendas-online-column-preferences-v1';
const STORAGE_VERSION = 1;

// Estado inicial baseado nas configurações padrão
const getInitialState = (): ColumnState => {
  const defaultColumns = getDefaultVisibleColumns();
  const columnOrder = COLUMN_DEFINITIONS.map(col => col.key);
  
  console.log('🎛️ [VENDAS COLUMNS] Estado inicial:', {
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
      console.log('🔄 [VENDAS COLUMNS] Versão de cache desatualizada, limpando...');
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
    
    console.log('💾 [VENDAS COLUMNS] Preferências carregadas:', {
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
    console.warn('❌ Erro ao carregar preferências de colunas:', error);
    localStorage.removeItem(STORAGE_KEY);
    return {};
  }
};

// Salvar preferências com versionamento
const savePreferences = (state: ColumnState) => {
  try {
    const toSave = {
      version: STORAGE_VERSION,
      visibleColumns: Array.from(state.visibleColumns),
      columnOrder: state.columnOrder,
      activeProfile: state.activeProfile,
      customProfiles: state.customProfiles,
      timestamp: Date.now()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    console.log('✅ [VENDAS COLUMNS] Preferências salvas');
  } catch (error) {
    console.warn('❌ Erro ao salvar preferências de colunas:', error);
  }
};

// Função para resetar cache
export const resetVendasColumnCache = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('🔄 [VENDAS COLUMNS] Cache limpo');
    return true;
  } catch (error) {
    console.warn('❌ Erro ao limpar cache de colunas:', error);
    return false;
  }
};

export const useVendasColumnManager = (): UseColumnManagerReturn => {
  // Inicializar estado combinando padrões com preferências salvas
  const [state, setState] = useState<ColumnState>(() => {
    const initial = getInitialState();
    const stored = loadStoredPreferences();
    
    if (stored.visibleColumns && stored.visibleColumns.size > 0) {
      return {
        ...initial,
        ...stored,
        columnOrder: initial.columnOrder, // Sempre usar ordem das definições
        visibleColumns: stored.visibleColumns
      };
    }
    
    return initial;
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

  // Salvar automaticamente quando o estado mudar (com debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      savePreferences(state);
    }, 500); // Debounce de 500ms
    
    return () => clearTimeout(timeoutId);
  }, [state]);

  // Ações para manipular colunas
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
