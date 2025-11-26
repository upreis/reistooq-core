/**
 * 🔧 FILTER UTILITIES
 * Utilities compartilhadas para lógica de filtros
 * Extraído da auditoria global - FASE 2.2
 */

/**
 * Atualizar um único filtro e resetar página se não for paginação
 */
export function updateSingleFilter<T extends Record<string, any>>(
  currentFilters: T,
  key: keyof T,
  value: any,
  isPaginationKey: (key: keyof T) => boolean
): T {
  const newFilters = { ...currentFilters, [key]: value };
  
  // Reset página se não for mudança de paginação/tab
  if (!isPaginationKey(key)) {
    return { ...newFilters, currentPage: 1 } as T;
  }
  
  return newFilters;
}

/**
 * Atualizar múltiplos filtros de uma vez
 */
export function updateMultipleFilters<T extends Record<string, any>>(
  currentFilters: T,
  updates: Partial<T>,
  isPaginationKey: (key: keyof T) => boolean
): T {
  const newFilters = { ...currentFilters, ...updates };
  
  // Verificar se alguma mudança não é de paginação/tab
  const hasNonPaginationChange = Object.keys(updates).some(
    key => !isPaginationKey(key as keyof T)
  );
  
  // Reset página se houver mudanças não-paginação
  if (hasNonPaginationChange && !updates.hasOwnProperty('currentPage')) {
    return { ...newFilters, currentPage: 1 } as T;
  }
  
  return newFilters;
}

/**
 * Resetar filtros de busca mantendo paginação
 */
export function resetSearchFilters<T extends Record<string, any>>(
  defaultFilters: T,
  searchKeys: (keyof T)[]
): Partial<T> {
  const resetValues: any = { currentPage: 1 };
  
  searchKeys.forEach(key => {
    resetValues[key] = defaultFilters[key];
  });
  
  return resetValues as Partial<T>;
}

/**
 * Verificar se há filtros ativos (diferentes dos defaults)
 */
export function hasActiveFilters<T extends Record<string, any>>(
  currentFilters: T,
  defaultFilters: T,
  excludeKeys: (keyof T)[] = []
): boolean {
  return Object.keys(defaultFilters).some(key => {
    if (excludeKeys.includes(key as keyof T)) return false;
    
    const current = currentFilters[key];
    const defaultVal = defaultFilters[key];
    
    // Comparação especial para arrays
    if (Array.isArray(current) && Array.isArray(defaultVal)) {
      return current.length !== defaultVal.length || 
             current.some((v, i) => v !== defaultVal[i]);
    }
    
    return current !== defaultVal;
  });
}

/**
 * Contar quantos filtros estão ativos
 */
export function countActiveFilters<T extends Record<string, any>>(
  currentFilters: T,
  defaultFilters: T,
  excludeKeys: (keyof T)[] = []
): number {
  return Object.keys(defaultFilters).reduce((count, key) => {
    if (excludeKeys.includes(key as keyof T)) return count;
    
    const current = currentFilters[key];
    const defaultVal = defaultFilters[key];
    
    // Comparação especial para arrays
    if (Array.isArray(current) && Array.isArray(defaultVal)) {
      const isActive = current.length !== defaultVal.length || 
                      current.some((v, i) => v !== defaultVal[i]);
      return count + (isActive ? 1 : 0);
    }
    
    return count + (current !== defaultVal ? 1 : 0);
  }, 0);
}
