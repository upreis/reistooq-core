/**
 * 💾 HOOK - PREFERÊNCIAS DE COLUNAS
 * Gerencia estado e persistência de colunas visíveis
 */

import { useState, useEffect } from 'react';
import { ColumnConfig } from '../components/ColumnSelector';

const STORAGE_KEY = 'devolucoes-visible-columns';

export const useColumnPreferences = (allColumns: ColumnConfig[]) => {
  // Inicializar com todas as colunas visíveis por padrão
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return allColumns.map(col => col.id);
      }
    }
    return allColumns.map(col => col.id);
  });

  // Salvar no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  return {
    visibleColumns,
    setVisibleColumns
  };
};
