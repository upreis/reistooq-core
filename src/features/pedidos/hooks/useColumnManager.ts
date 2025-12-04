/**
 * 🎛️ HOOK PARA GERENCIAMENTO UNIFICADO DE COLUNAS
 * Mantém estado, persistência e ações centralizadas
 * 
 * ✅ ÚLTIMA ATUALIZAÇÃO: 2025-11-04 - Adicionadas colunas de reputação
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ColumnState, ColumnActions, UseColumnManagerReturn, ColumnProfile } from '../types/columns.types';
import { COLUMN_DEFINITIONS, DEFAULT_PROFILES, getDefaultVisibleColumns } from '../config/columns.config';

const STORAGE_KEY = 'pedidos-column-preferences-v5'; // ← Incrementado: remoção de 5 colunas
const isDev = process.env.NODE_ENV === 'development';

// Estado inicial baseado nas configurações padrão
const getInitialState = (): ColumnState => {
  const defaultColumns = getDefaultVisibleColumns();
  
  // 🔧 CORREÇÃO: Garantir que columnOrder segue a ordem do COLUMN_DEFINITIONS
  const columnOrder = COLUMN_DEFINITIONS.map(col => col.key);
  
  if (isDev) {
    console.log('🔧 [INITIAL STATE] Configurando estado inicial das colunas:', {
      defaultColumns: defaultColumns.map(col => col.key),
      totalDefinitions: COLUMN_DEFINITIONS.length,
      columnOrder: columnOrder
    });
  }
  
  return {
    visibleColumns: new Set(defaultColumns.map(col => col.key)),
    columnOrder: columnOrder,
    activeProfile: 'standard',
    customProfiles: []
  };
};

// 💾 Carregar preferências com prioridade para última consulta
const loadStoredPreferences = (): Partial<ColumnState> => {
  // 🚨 COLUNAS REMOVIDAS - filtrar estas do cache
  const removedColumns = new Set([
    'marketplace_fee_detail', 'payment_issuer', 'refund_data', 'installments', 'installment_amount',
    'product_categories', 'product_attributes', 'product_variations', 'product_warranty', 'manufacturing_days',
    'nome_cliente', 'shipping_method', 'tracking_method', 'status_history', 'pack_status', 'pack_status_detail',
    'frete_pago_cliente', 'flex_payment_value', 'coupon_amount', 'payment_type', 'shipping_mode'
  ]);
  
  const validColumnKeys = new Set(COLUMN_DEFINITIONS.map(col => col.key));
  
  try {
    // 🚨 INTEGRADO: Tentar carregar da última consulta primeiro
    const lastSearch = localStorage.getItem('pedidos:lastSearch');
      if (lastSearch) {
        const parsed = JSON.parse(lastSearch);
      if (parsed.visibleColumns && Object.keys(parsed.visibleColumns).length > 0) {
          if (isDev) {
            console.log('💾 [COLUMNS DEBUG] Restaurando colunas da última consulta:', {
              saved: parsed.visibleColumns,
              availableDefinitions: COLUMN_DEFINITIONS.map(col => col.key)
            });
          }
        // Converter objeto para Set se necessário
        const visibleSet = typeof parsed.visibleColumns === 'object' && parsed.visibleColumns.constructor === Object
          ? new Set(Object.keys(parsed.visibleColumns).filter(key => parsed.visibleColumns[key]) as string[])
          : new Set(Array.isArray(parsed.visibleColumns) ? parsed.visibleColumns.map(String) : []);
        
        // 🔁 Remapear chaves legadas e filtrar colunas removidas
        const aliasMap: Record<string, string> = {
          cidade: 'endereco_cidade',
          uf: 'endereco_uf',
          rua: 'endereco_rua',
          bairro: 'endereco_bairro',
          cep: 'endereco_cep',
          numero: 'endereco_numero'
        };
        const remapped = new Set<string>();
        (visibleSet as Set<string>).forEach((k) => {
          const mappedKey = aliasMap[k as string] ?? (k as string);
          if (validColumnKeys.has(mappedKey) && !removedColumns.has(mappedKey)) {
            remapped.add(mappedKey);
          }
        });
        
        return {
          visibleColumns: remapped,
          columnOrder: COLUMN_DEFINITIONS.map(col => col.key),
          activeProfile: null,
          customProfiles: []
        };
      }
    }
    
    // Fallback para configuração separada
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    
    const parsed = JSON.parse(stored);
    
    // Validar se os dados são válidos
    if (!parsed || typeof parsed !== 'object') return {};
    
    const rawSet = new Set(Array.isArray(parsed.visibleColumns) ? parsed.visibleColumns.map(String) : []);
    // 🔁 Remapear chaves legadas e filtrar colunas removidas
    const aliasMap: Record<string, string> = {
      cidade: 'endereco_cidade',
      uf: 'endereco_uf',
      rua: 'endereco_rua',
      bairro: 'endereco_bairro',
      cep: 'endereco_cep',
      numero: 'endereco_numero'
    };
    const remapped = new Set<string>();
    (rawSet as Set<string>).forEach((k) => {
      const mappedKey = aliasMap[k as string] ?? (k as string);
      if (validColumnKeys.has(mappedKey) && !removedColumns.has(mappedKey)) {
        remapped.add(mappedKey);
      }
    });
    
    // Filtrar ordem das colunas também
    const filteredOrder = Array.isArray(parsed.columnOrder) 
      ? parsed.columnOrder.filter((key: string) => validColumnKeys.has(key) && !removedColumns.has(key))
      : COLUMN_DEFINITIONS.map(col => col.key);
    
    return {
      visibleColumns: remapped,
      columnOrder: filteredOrder,
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
    localStorage.removeItem('pedidos:lastSearch'); // Limpar última pesquisa também
    return {};
  }
};

// 💾 Salvar preferências com integração da última consulta
const savePreferences = (state: ColumnState) => {
  try {
    const toSave = {
      visibleColumns: Array.from(state.visibleColumns),
      columnOrder: state.columnOrder,
      activeProfile: state.activeProfile,
      customProfiles: state.customProfiles,
      timestamp: Date.now() // Para debug e versionamento
    };
    
    // Salvar configuração separada
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    
    // 🚨 INTEGRADO: Atualizar também na última consulta se existir
    const lastSearch = localStorage.getItem('pedidos:lastSearch');
    if (lastSearch) {
      const parsed = JSON.parse(lastSearch);
      // Converter Set para objeto para manter compatibilidade
      const visibleObject = Array.from(state.visibleColumns).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as Record<string, boolean>);
      
      parsed.visibleColumns = visibleObject;
      localStorage.setItem('pedidos:lastSearch', JSON.stringify(parsed));
      if (isDev) console.log('💾 Colunas atualizadas na última consulta também');
    }
    
    if (isDev) console.log('✅ Preferências de colunas salvas:', toSave);
  } catch (error) {
    console.warn('❌ Erro ao salvar preferências de colunas:', error);
  }
};

// 🔄 Função para limpar cache e forçar reset
export const resetColumnCache = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('pedidos:lastSearch'); // Limpar também o cache da última pesquisa
    if (isDev) console.log('🔄 Cache de colunas limpo completamente');
    
    // NÃO recarregar a página automaticamente - deixar o React atualizar
    // window.location.reload();
    
    return true;
  } catch (error) {
    console.warn('❌ Erro ao limpar cache de colunas:', error);
    return false;
  }
};

export const useColumnManager = (): UseColumnManagerReturn => {
  // Inicializar estado combinando padrões com preferências salvas
  const [state, setState] = useState<ColumnState>(() => {
    const initial = getInitialState();
    const stored = loadStoredPreferences();
    
    if (isDev) {
      console.log('🔧 [COLUMNS INIT] Inicializando sistema de colunas:', {
        initial: Array.from(initial.visibleColumns),
        stored: stored.visibleColumns ? Array.from(stored.visibleColumns) : 'none',
        totalDefinitions: COLUMN_DEFINITIONS.length,
        definitionKeys: COLUMN_DEFINITIONS.map(d => d.key)
      });
    }
    
    // 🔧 Se tem preferências salvas, usar elas (priorizar escolha do usuário)
    if (stored.visibleColumns && stored.visibleColumns.size > 0) {
      const finalState: ColumnState = {
        ...initial,
        ...stored,
        // Sempre usar columnOrder do COLUMN_DEFINITIONS (fonte única da verdade)
        columnOrder: initial.columnOrder,
        // Garantir que visibleColumns seja sempre um Set<string>
        visibleColumns: stored.visibleColumns instanceof Set 
          ? new Set<string>(Array.from(stored.visibleColumns).filter((k): k is string => typeof k === 'string'))
          : new Set<string>(Array.from(stored.visibleColumns as any).filter((k: any): k is string => typeof k === 'string'))
      };
      
      if (isDev) {
        console.log('✅ Usando preferências do usuário:', {
          visible: Array.from(finalState.visibleColumns),
          total: finalState.visibleColumns.size,
          definitions: COLUMN_DEFINITIONS.length
        });
      }
      
      return finalState;
    }
    
    // Se não tem preferências salvas, usar padrão
    if (isDev) {
      console.log('✅ Usando configuração padrão (primeira vez):', {
        definitions: COLUMN_DEFINITIONS.length
      });
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
  }, [COLUMN_DEFINITIONS]);

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