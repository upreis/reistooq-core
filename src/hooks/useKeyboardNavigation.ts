// P4.2: Hook para navegação por teclado acessível
import { useEffect, useCallback } from 'react';

export interface KeyboardNavigationConfig {
  onEnter?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onSpace?: () => void;
  onTab?: () => void;
  disabled?: boolean;
}

export function useKeyboardNavigation(config: KeyboardNavigationConfig) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (config.disabled) return;

    switch (event.key) {
      case 'Enter':
        if (config.onEnter) {
          event.preventDefault();
          config.onEnter();
        }
        break;
      case 'Escape':
        if (config.onEscape) {
          event.preventDefault();
          config.onEscape();
        }
        break;
      case 'ArrowUp':
        if (config.onArrowUp) {
          event.preventDefault();
          config.onArrowUp();
        }
        break;
      case 'ArrowDown':
        if (config.onArrowDown) {
          event.preventDefault();
          config.onArrowDown();
        }
        break;
      case ' ':
        if (config.onSpace) {
          event.preventDefault();
          config.onSpace();
        }
        break;
      case 'Tab':
        if (config.onTab) {
          config.onTab();
        }
        break;
    }
  }, [config]);

  useEffect(() => {
    if (config.disabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, config.disabled]);
}