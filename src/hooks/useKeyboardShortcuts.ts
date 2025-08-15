import { useEffect, useCallback } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    for (const shortcut of shortcuts) {
      const { key, ctrl, shift, alt, meta, action } = shortcut;
      
      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        (ctrl === undefined || event.ctrlKey === ctrl) &&
        (shift === undefined || event.shiftKey === shift) &&
        (alt === undefined || event.altKey === alt) &&
        (meta === undefined || event.metaKey === meta)
      ) {
        event.preventDefault();
        action();
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export function useSkuMapShortcuts({
  onNew,
  onSave,
  onDelete,
  onSelectAll,
  onBulkEdit,
}: {
  onNew?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  onSelectAll?: () => void;
  onBulkEdit?: () => void;
}) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'n',
      ctrl: true,
      action: () => onNew?.(),
      description: 'Novo mapeamento'
    },
    {
      key: 's',
      ctrl: true,
      action: () => onSave?.(),
      description: 'Salvar'
    },
    {
      key: 'Delete',
      action: () => onDelete?.(),
      description: 'Excluir selecionados'
    },
    {
      key: 'a',
      ctrl: true,
      action: () => onSelectAll?.(),
      description: 'Selecionar todos'
    },
    {
      key: 'e',
      ctrl: true,
      action: () => onBulkEdit?.(),
      description: 'Editar em lote'
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}