/**
 * Hook para persistência de devoluções no localStorage
 * DEPRECATED - mantido apenas para compatibilidade
 */
export function useDevolucoesPersistence() {
  return {
    saveToStorage: () => {},
    loadFromStorage: () => null,
    clearStorage: () => {}
  };
}
