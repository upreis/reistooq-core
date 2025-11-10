/**
 * 🌐 DEVOLUCAO PROVIDER - FASE 4
 * Context Provider para gerenciar estado global de devoluções
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DevolucaoFilters, PaginationParams } from '../services/DevolucaoService';

interface DevolucaoContextState {
  // Filtros
  filters: DevolucaoFilters;
  setFilters: (filters: DevolucaoFilters) => void;
  
  // Paginação
  pagination: PaginationParams;
  setPagination: (pagination: PaginationParams) => void;
  
  // Seleção
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  
  // View Mode
  viewMode: 'ativas' | 'historico';
  setViewMode: (mode: 'ativas' | 'historico') => void;
}

const DevolucaoContext = createContext<DevolucaoContextState | undefined>(undefined);

export function DevolucaoProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<DevolucaoFilters>({});
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 50,
    sortBy: 'data_criacao_claim',
    sortOrder: 'desc',
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'ativas' | 'historico'>('ativas');

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const value: DevolucaoContextState = {
    filters,
    setFilters,
    pagination,
    setPagination,
    selectedIds,
    setSelectedIds,
    toggleSelection,
    clearSelection,
    viewMode,
    setViewMode,
  };

  return (
    <DevolucaoContext.Provider value={value}>
      {children}
    </DevolucaoContext.Provider>
  );
}

export function useDevolucaoContext() {
  const context = useContext(DevolucaoContext);
  if (!context) {
    throw new Error('useDevolucaoContext deve ser usado dentro de DevolucaoProvider');
  }
  return context;
}
