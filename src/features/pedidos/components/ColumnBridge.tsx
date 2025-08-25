/**
 * 🌉 BRIDGE PARA COMPATIBILIDADE COM SISTEMA EXISTENTE
 * Conecta o novo ColumnManager com o código legado
 * Mantém 100% de compatibilidade
 */

import { useColumnManager } from '../hooks/useColumnManager';
import { ColumnManager } from './ColumnManager';
import { DEFAULT_COLUMNS } from '@/components/pedidos/ColumnSelector';
import type { ColumnConfig } from '@/components/pedidos/ColumnSelector';

interface ColumnBridgeProps {
  // Props do sistema antigo (ColumnSelector)
  columns?: ColumnConfig[];
  onColumnsChange?: (columns: ColumnConfig[]) => void;
  
  // Props do sistema novo (ColumnManager)
  onVisibleColumnsChange?: (visibleColumnKeys: string[]) => void;
}

/**
 * Bridge que converte entre os dois sistemas:
 * - Sistema antigo: ColumnConfig[] com visible boolean
 * - Sistema novo: string[] com keys das colunas visíveis
 */
export function ColumnBridge({ 
  columns = DEFAULT_COLUMNS,
  onColumnsChange,
  onVisibleColumnsChange 
}: ColumnBridgeProps) {
  const { state } = useColumnManager();

  // Converter sistema antigo para novo quando necessário
  const handleLegacyColumnsChange = (newColumns: ColumnConfig[]) => {
    if (onColumnsChange) {
      onColumnsChange(newColumns);
    }
    
    // Também notificar sistema novo
    if (onVisibleColumnsChange) {
      const visibleKeys = newColumns
        .filter(col => col.visible)
        .map(col => col.key);
      onVisibleColumnsChange(visibleKeys);
    }
  };

  // Converter sistema novo para antigo quando necessário
  const handleNewColumnsChange = (visibleColumnKeys: string[]) => {
    if (onVisibleColumnsChange) {
      onVisibleColumnsChange(visibleColumnKeys);
    }
    
    // Também notificar sistema antigo
    if (onColumnsChange) {
      const newColumns = columns.map(col => ({
        ...col,
        visible: visibleColumnKeys.includes(col.key)
      }));
      onColumnsChange(newColumns);
    }
  };

  return (
    <ColumnManager 
      onColumnsChange={handleNewColumnsChange}
    />
  );
}

/**
 * Hook para compatibilidade - converte estado novo para formato antigo
 */
export function useLegacyColumnConfig(): ColumnConfig[] {
  const { state, definitions } = useColumnManager();
  
  return definitions.map(def => ({
    key: def.key,
    label: def.label,
    visible: state.visibleColumns.has(def.key),
    category: def.category as any // Cast para manter compatibilidade
  }));
}

/**
 * Função utilitária para migrar configurações antigas
 */
export function migrateLegacyColumns(legacyColumns: ColumnConfig[]): string[] {
  return legacyColumns
    .filter(col => col.visible)
    .map(col => col.key);
}