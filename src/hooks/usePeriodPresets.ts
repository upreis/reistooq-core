/**
 * 🗓️ HOOK DE PRESETS DE PERÍODO - Gestão Inteligente de Datas
 * Fornece presets inteligentes, persistência e otimizações de performance
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  startOfDay, 
  endOfDay, 
  subDays, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  startOfYear, 
  endOfYear, 
  subYears,
  isToday,
  isThisWeek,
  isThisMonth,
  isThisYear,
  isEqual,
  format
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface PeriodPreset {
  id: string;
  label: string;
  shortLabel: string;
  category: 'recent' | 'calendar' | 'extended';
  getValue: () => DateRange;
  isActive: (start?: Date, end?: Date) => boolean;
  icon?: string;
}

// Presets organizados por categoria para melhor UX
const PERIOD_PRESETS: PeriodPreset[] = [
  // Categoria: Recentes (mais usados)
  {
    id: 'today',
    label: 'Hoje',
    shortLabel: 'Hoje',
    category: 'recent',
    icon: '📅',
    getValue: () => ({
      start: startOfDay(new Date()),
      end: endOfDay(new Date())
    }),
    isActive: (start, end) => {
      if (!start || !end) return false;
      const today = new Date();
      return isEqual(startOfDay(start), startOfDay(today)) && 
             isEqual(endOfDay(end), endOfDay(today));
    }
  },
  {
    id: 'yesterday',
    label: 'Ontem',
    shortLabel: 'Ontem',
    category: 'recent',
    icon: '📆',
    getValue: () => {
      const yesterday = subDays(new Date(), 1);
      return {
        start: startOfDay(yesterday),
        end: endOfDay(yesterday)
      };
    },
    isActive: (start, end) => {
      if (!start || !end) return false;
      const yesterday = subDays(new Date(), 1);
      return isEqual(startOfDay(start), startOfDay(yesterday)) && 
             isEqual(endOfDay(end), endOfDay(yesterday));
    }
  },
  {
    id: 'last_7_days',
    label: 'Últimos 7 dias',
    shortLabel: '7 dias',
    category: 'recent',
    icon: '📊',
    getValue: () => ({
      start: startOfDay(subDays(new Date(), 6)),
      end: endOfDay(new Date())
    }),
    isActive: (start, end) => {
      if (!start || !end) return false;
      const expectedStart = startOfDay(subDays(new Date(), 6));
      const expectedEnd = endOfDay(new Date());
      return isEqual(startOfDay(start), expectedStart) && 
             isEqual(endOfDay(end), expectedEnd);
    }
  },
  {
    id: 'last_30_days',
    label: 'Últimos 30 dias',
    shortLabel: '30 dias',
    category: 'recent',
    icon: '📈',
    getValue: () => ({
      start: startOfDay(subDays(new Date(), 29)),
      end: endOfDay(new Date())
    }),
    isActive: (start, end) => {
      if (!start || !end) return false;
      const expectedStart = startOfDay(subDays(new Date(), 29));
      const expectedEnd = endOfDay(new Date());
      return isEqual(startOfDay(start), expectedStart) && 
             isEqual(endOfDay(end), expectedEnd);
    }
  },

  // Categoria: Períodos do calendário
  {
    id: 'this_week',
    label: 'Esta semana',
    shortLabel: 'Semana',
    category: 'calendar',
    icon: '🗓️',
    getValue: () => ({
      start: startOfWeek(new Date(), { locale: ptBR }),
      end: endOfWeek(new Date(), { locale: ptBR })
    }),
    isActive: (start, end) => {
      if (!start || !end) return false;
      const expectedStart = startOfWeek(new Date(), { locale: ptBR });
      const expectedEnd = endOfWeek(new Date(), { locale: ptBR });
      return isEqual(startOfDay(start), startOfDay(expectedStart)) && 
             isEqual(endOfDay(end), endOfDay(expectedEnd));
    }
  },
  {
    id: 'this_month',
    label: 'Este mês',
    shortLabel: 'Mês',
    category: 'calendar',
    icon: '📅',
    getValue: () => ({
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date())
    }),
    isActive: (start, end) => {
      if (!start || !end) return false;
      const expectedStart = startOfMonth(new Date());
      const expectedEnd = endOfMonth(new Date());
      return isEqual(startOfDay(start), startOfDay(expectedStart)) && 
             isEqual(endOfDay(end), endOfDay(expectedEnd));
    }
  },
  {
    id: 'last_month',
    label: 'Mês passado',
    shortLabel: 'Mês anterior',
    category: 'calendar',
    icon: '📆',
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth)
      };
    },
    isActive: (start, end) => {
      if (!start || !end) return false;
      const lastMonth = subMonths(new Date(), 1);
      const expectedStart = startOfMonth(lastMonth);
      const expectedEnd = endOfMonth(lastMonth);
      return isEqual(startOfDay(start), startOfDay(expectedStart)) && 
             isEqual(endOfDay(end), endOfDay(expectedEnd));
    }
  },

  // Categoria: Períodos estendidos
  {
    id: 'this_year',
    label: 'Este ano',
    shortLabel: 'Ano',
    category: 'extended',
    icon: '🗓️',
    getValue: () => ({
      start: startOfYear(new Date()),
      end: endOfYear(new Date())
    }),
    isActive: (start, end) => {
      if (!start || !end) return false;
      const expectedStart = startOfYear(new Date());
      const expectedEnd = endOfYear(new Date());
      return isEqual(startOfDay(start), startOfDay(expectedStart)) && 
             isEqual(endOfDay(end), endOfDay(expectedEnd));
    }
  },
  {
    id: 'last_year',
    label: 'Ano passado',
    shortLabel: 'Ano anterior',
    category: 'extended',
    icon: '📆',
    getValue: () => {
      const lastYear = subYears(new Date(), 1);
      return {
        start: startOfYear(lastYear),
        end: endOfYear(lastYear)
      };
    },
    isActive: (start, end) => {
      if (!start || !end) return false;
      const lastYear = subYears(new Date(), 1);
      const expectedStart = startOfYear(lastYear);
      const expectedEnd = endOfYear(lastYear);
      return isEqual(startOfDay(start), startOfDay(expectedStart)) && 
             isEqual(endOfDay(end), endOfDay(expectedEnd));
    }
  }
];

const STORAGE_KEY = 'period_filter_state';
const RECENT_PRESETS_KEY = 'recent_period_presets';

interface StoredPeriodState {
  lastUsedPreset?: string;
  customRange?: {
    start: string;
    end: string;
  };
  recentPresets: string[];
}

export function usePeriodPresets() {
  const [recentPresets, setRecentPresets] = useState<string[]>([]);
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  
  // Carregar estado persistido
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredPeriodState = JSON.parse(stored);
        setRecentPresets(parsed.recentPresets || []);
        
        if (parsed.customRange) {
          setCustomRange({
            start: new Date(parsed.customRange.start),
            end: new Date(parsed.customRange.end)
          });
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar período persistido:', error);
    }
  }, []);

  // Salvar estado
  const saveState = useCallback((state: Partial<StoredPeriodState>) => {
    try {
      const current = localStorage.getItem(STORAGE_KEY);
      const currentState: StoredPeriodState = current ? JSON.parse(current) : { recentPresets: [] };
      
      const newState: StoredPeriodState = {
        ...currentState,
        ...state
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.warn('Erro ao salvar período:', error);
    }
  }, []);

  // Obter preset por ID
  const getPresetById = useCallback((id: string): PeriodPreset | undefined => {
    return PERIOD_PRESETS.find(preset => preset.id === id);
  }, []);

  // Detectar preset ativo baseado nas datas
  const getActivePreset = useCallback((start?: Date, end?: Date): PeriodPreset | null => {
    if (!start || !end) return null;
    
    return PERIOD_PRESETS.find(preset => preset.isActive(start, end)) || null;
  }, []);

  // Aplicar preset
  const applyPreset = useCallback((presetId: string): DateRange | null => {
    const preset = getPresetById(presetId);
    if (!preset) return null;
    
    const range = preset.getValue();
    
    // Atualizar lista de recentes
    setRecentPresets(prev => {
      const updated = [presetId, ...prev.filter(id => id !== presetId)].slice(0, 3);
      saveState({ recentPresets: updated });
      return updated;
    });
    
    console.log('🗓️ Preset aplicado:', preset.label, range);
    return range;
  }, [getPresetById, saveState]);

  // Aplicar range customizado
  const applyCustomRange = useCallback((range: DateRange) => {
    setCustomRange(range);
    saveState({
      customRange: {
        start: range.start.toISOString(),
        end: range.end.toISOString()
      }
    });
    
    console.log('🎯 Range customizado aplicado:', range);
  }, [saveState]);

  // Formatar range para display
  const formatDateRange = useCallback((start?: Date, end?: Date): string => {
    if (!start && !end) return 'Período';
    
    if (start && end) {
      // Verificar se é o mesmo dia
      if (isEqual(startOfDay(start), startOfDay(end))) {
        return format(start, 'dd/MM/yyyy', { locale: ptBR });
      }
      
      // Verificar se é um preset conhecido
      const activePreset = getActivePreset(start, end);
      if (activePreset) {
        return activePreset.shortLabel;
      }
      
      // Range customizado
      return `${format(start, 'dd/MM', { locale: ptBR })} - ${format(end, 'dd/MM', { locale: ptBR })}`;
    }
    
    if (start) {
      return `A partir de ${format(start, 'dd/MM', { locale: ptBR })}`;
    }
    
    if (end) {
      return `Até ${format(end, 'dd/MM', { locale: ptBR })}`;
    }
    
    return 'Período';
  }, [getActivePreset]);

  // Presets organizados por categoria
  const presetsByCategory = useMemo(() => ({
    recent: PERIOD_PRESETS.filter(p => p.category === 'recent'),
    calendar: PERIOD_PRESETS.filter(p => p.category === 'calendar'),
    extended: PERIOD_PRESETS.filter(p => p.category === 'extended')
  }), []);

  // Presets recentes baseados no uso
  const recentlyUsedPresets = useMemo(() => {
    return recentPresets
      .map(id => getPresetById(id))
      .filter((preset): preset is PeriodPreset => preset !== undefined)
      .slice(0, 3);
  }, [recentPresets, getPresetById]);

  // Limpar filtros
  const clearPeriod = useCallback(() => {
    setCustomRange(null);
    saveState({ customRange: undefined });
  }, [saveState]);

  return {
    // Presets
    allPresets: PERIOD_PRESETS,
    presetsByCategory,
    recentlyUsedPresets,
    
    // Estado atual
    customRange,
    
    // Ações
    applyPreset,
    applyCustomRange,
    clearPeriod,
    
    // Utilitários
    getPresetById,
    getActivePreset,
    formatDateRange
  };
}