// F5.4: Sistema de atalhos de teclado melhorado
import { useEffect, useCallback } from "react";
import { useToastFeedback } from "@/hooks/useToastFeedback";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
  category?: string;
  enabled?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const { showInfo } = useToastFeedback();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Não executar atalhos se estiver em um input, textarea ou contenteditable
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      return;
    }

    for (const shortcut of shortcuts) {
      if (shortcut.enabled === false) continue;

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

  const showShortcutsHelp = useCallback(() => {
    const categories = shortcuts.reduce((acc, shortcut) => {
      const category = shortcut.category || 'Geral';
      if (!acc[category]) acc[category] = [];
      acc[category].push(shortcut);
      return acc;
    }, {} as Record<string, KeyboardShortcut[]>);

    const helpText = Object.entries(categories)
      .map(([category, shortcuts]) => {
        const shortcutList = shortcuts
          .map(s => {
            const keys = [];
            if (s.ctrl) keys.push('Ctrl');
            if (s.shift) keys.push('Shift');
            if (s.alt) keys.push('Alt');
            if (s.meta) keys.push('Cmd');
            keys.push(s.key.toUpperCase());
            return `${keys.join('+')} - ${s.description}`;
          })
          .join('\n');
        return `${category}:\n${shortcutList}`;
      })
      .join('\n\n');

    showInfo(helpText, { 
      title: "Atalhos de Teclado Disponíveis",
      duration: 8000
    });
  }, [shortcuts, showInfo]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { showShortcutsHelp };
}

// Atalhos globais da aplicação
export function useGlobalShortcuts({
  onSearch,
  onRefresh,
  onHelp,
}: {
  onSearch?: () => void;
  onRefresh?: () => void;
  onHelp?: () => void;
}) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'f',
      ctrl: true,
      action: () => onSearch?.(),
      description: 'Buscar',
      category: 'Navegação'
    },
    {
      key: 'r',
      ctrl: true,
      action: () => {
        if (onRefresh) {
          onRefresh();
        }
      },
      description: 'Atualizar página',
      category: 'Navegação'
    },
    {
      key: 'Escape',
      action: () => {
        // Fechar modais, dropdowns, etc.
        const backdrop = document.querySelector('[data-radix-popper-content-wrapper]');
        if (backdrop) {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        }
      },
      description: 'Fechar modais',
      category: 'Navegação'
    },
    {
      key: '?',
      shift: true,
      action: () => onHelp?.(),
      description: 'Mostrar ajuda',
      category: 'Geral'
    }
  ];

  const { showShortcutsHelp } = useKeyboardShortcuts(shortcuts);

  return { showShortcutsHelp };
}

// Atalhos específicos para pedidos
export function usePedidosShortcuts({
  onNew,
  onExport,
  onBulkAction,
  onSelectAll,
  onClearSelection,
}: {
  onNew?: () => void;
  onExport?: () => void;
  onBulkAction?: () => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
}) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'n',
      ctrl: true,
      action: () => onNew?.(),
      description: 'Novo pedido',
      category: 'Pedidos'
    },
    {
      key: 'e',
      ctrl: true,
      action: () => onExport?.(),
      description: 'Exportar pedidos',
      category: 'Pedidos'
    },
    {
      key: 'a',
      ctrl: true,
      action: () => onSelectAll?.(),
      description: 'Selecionar todos',
      category: 'Seleção'
    },
    {
      key: 'Escape',
      action: () => onClearSelection?.(),
      description: 'Limpar seleção',
      category: 'Seleção'
    },
    {
      key: 'b',
      ctrl: true,
      action: () => onBulkAction?.(),
      description: 'Ações em lote',
      category: 'Pedidos'
    }
  ];

  const { showShortcutsHelp } = useKeyboardShortcuts(shortcuts);

  return { showShortcutsHelp };
}