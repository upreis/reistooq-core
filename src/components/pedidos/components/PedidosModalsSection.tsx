/**
 * 🚀 PASSO 7: SEÇÃO DE MODAIS - Migração Gradual
 * Gerencia todos os modais (export, baixa, configurações, etc.)
 */

import { memo } from 'react';
import { ExportModal } from '../ExportModal';
import { SavedFiltersManager } from '../SavedFiltersManager';
import { ColumnManager } from '@/features/pedidos/components/ColumnManager';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';

interface PedidosModalsSectionProps {
  // Export Modal
  onExport: (format: string, filters?: any) => Promise<void>;
  totalRecords: number;
  isLoading: boolean;
  
  // Saved Filters
  savedFilters: any[];
  onSaveFilters: (name: string) => void;
  onLoadFilters: (filters: any) => void;
  hasActiveFilters: boolean;
  
  // Column Manager
  columnManager: any;
  
  // Additional modals can be added here
  showExportModal?: boolean;
  setShowExportModal?: (show: boolean) => void;
}

export const PedidosModalsSection = memo(({
  onExport,
  totalRecords,
  isLoading,
  savedFilters,
  onSaveFilters,
  onLoadFilters,
  hasActiveFilters,
  columnManager,
  showExportModal = false,
  setShowExportModal
}: PedidosModalsSectionProps) => {
  
  return (
    <>
      {/* 🚀 MODAL DE EXPORTAÇÃO */}
      <ExportModal
        onExport={onExport}
        totalRecords={totalRecords}
        isLoading={isLoading}
      />

      {/* 💾 GERENCIADOR DE FILTROS SALVOS */}
      <SavedFiltersManager
        savedFilters={savedFilters}
        onSaveFilters={onSaveFilters}
        onLoadFilters={onLoadFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* 🔧 GERENCIADOR DE COLUNAS */}
      <ColumnManager manager={columnManager} />

      {/* 🔮 PLACEHOLDER para outros modais futuros */}
      {/* Outros modais podem ser adicionados aqui conforme necessário */}
    </>
  );
});

PedidosModalsSection.displayName = 'PedidosModalsSection';