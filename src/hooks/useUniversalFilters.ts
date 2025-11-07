/**
 * 🔍 UNIVERSAL FILTERS HOOK
 * Sistema universal de persistência de filtros via URL params
 * Mantém filtros ao navegar entre páginas
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface UniversalFilterConfig<T = any> {
  key: string;
  defaultValue: T;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
}

export function useUniversalFilters<T extends Record<string, any>>(
  configs: UniversalFilterConfig[]
) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Ler filtros da URL
  const filters = useMemo(() => {
    const result: Record<string, any> = {};
    
    configs.forEach(config => {
      const urlValue = searchParams.get(config.key);
      
      if (urlValue !== null) {
        result[config.key] = config.deserialize 
          ? config.deserialize(urlValue)
          : urlValue;
      } else {
        result[config.key] = config.defaultValue;
      }
    });
    
    return result as T;
  }, [searchParams, configs]);

  // Atualizar filtros na URL
  const updateFilters = useCallback((updates: Partial<T>) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      
      Object.entries(updates).forEach(([key, value]) => {
        const config = configs.find(c => c.key === key);
        if (!config) return;
        
        // Se for valor default, remover da URL
        if (value === config.defaultValue) {
          newParams.delete(key);
        } else {
          const serialized = config.serialize 
            ? config.serialize(value)
            : String(value);
          newParams.set(key, serialized);
        }
      });
      
      return newParams;
    }, { replace: true });
  }, [configs, setSearchParams]);

  // Limpar todos os filtros
  const clearFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  // Verificar se tem filtros ativos
  const hasActiveFilters = useMemo(() => {
    return configs.some(config => {
      const currentValue = filters[config.key];
      return currentValue !== config.defaultValue;
    });
  }, [filters, configs]);

  return {
    filters,
    updateFilters,
    clearFilters,
    hasActiveFilters,
  };
}

// Helper para serializar arrays
export const serializeArray = (arr: string[]): string => arr.join(',');
export const deserializeArray = (str: string): string[] => 
  str ? str.split(',').filter(Boolean) : [];

// Helper para serializar booleanos
export const serializeBoolean = (val: boolean): string => val ? '1' : '0';
export const deserializeBoolean = (str: string): boolean => str === '1';
