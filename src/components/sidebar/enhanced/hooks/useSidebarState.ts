import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarState, SidebarConfig, PointerType, FlyoutPosition } from '../types/sidebar.types';

const DEFAULT_CONFIG: SidebarConfig = {
  expandedWidth: 264,
  collapsedWidth: 72,
  hoverOpenDelay: 120,
  hoverCloseDelay: 200,
  zIndexFlyout: 70,
  persistKey: 'ui.sidebar.expanded',
  animationDuration: 200
};

export function useSidebarState(config: Partial<SidebarConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const location = useLocation();

  // Core state
  const [state, setState] = useState<SidebarState>(() => ({
    expanded: (() => {
      try {
        const stored = localStorage.getItem(finalConfig.persistKey);
        return stored ? JSON.parse(stored) : true;
      } catch {
        return true;
      }
    })(),
    openGroups: (() => {
      try {
        const stored = localStorage.getItem(`${finalConfig.persistKey}.groups`);
        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    })(),
    hoveredItem: null,
    activeRoute: location.pathname,
    searchQuery: ''
  }));

  // Persist expanded state
  useEffect(() => {
    try {
      localStorage.setItem(finalConfig.persistKey, JSON.stringify(state.expanded));
    } catch {
      // Fail silently
    }
  }, [state.expanded, finalConfig.persistKey]);

  // Persist groups state
  useEffect(() => {
    try {
      localStorage.setItem(`${finalConfig.persistKey}.groups`, JSON.stringify(state.openGroups));
    } catch {
      // Fail silently
    }
  }, [state.openGroups, finalConfig.persistKey]);

  // Update active route
  useEffect(() => {
    setState(prev => ({ ...prev, activeRoute: location.pathname }));
  }, [location.pathname]);

  // Actions
  const actions = useMemo(() => ({
    toggleExpanded: () => {
      setState(prev => ({ ...prev, expanded: !prev.expanded }));
    },

    setExpanded: (expanded: boolean) => {
      setState(prev => ({ ...prev, expanded }));
    },

    toggleGroup: (groupId: string) => {
      setState(prev => ({
        ...prev,
        openGroups: {
          ...prev.openGroups,
          [groupId]: !prev.openGroups[groupId]
        }
      }));
    },

    setHoveredItem: (itemId: string | null) => {
      setState(prev => ({ ...prev, hoveredItem: itemId }));
    },

    setSearchQuery: (query: string) => {
      setState(prev => ({ ...prev, searchQuery: query }));
    }
  }), []);

  // Utilities
  const utils = useMemo(() => ({
    isActive: (path: string) => {
      return state.activeRoute === path || state.activeRoute.startsWith(path + '/');
    },

    getPointerType: (): PointerType => {
      if (window.matchMedia('(pointer: coarse)').matches) return 'touch';
      if (window.matchMedia('(pointer: fine)').matches) return 'mouse';
      return 'mouse'; // fallback
    },

    calculateFlyoutPosition: (element: HTMLElement): FlyoutPosition => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const flyoutMaxHeight = Math.min(300, viewportHeight - 40);
      
      return {
        top: Math.max(10, Math.min(rect.top, viewportHeight - flyoutMaxHeight - 10)),
        left: rect.right + 8,
        maxHeight: flyoutMaxHeight
      };
    }
  }), [state.activeRoute]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + B to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        actions.toggleExpanded();
      }
      
      // Escape to close flyouts
      if (e.key === 'Escape' && state.hoveredItem) {
        actions.setHoveredItem(null);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [actions, state.hoveredItem]);

  return {
    state,
    config: finalConfig,
    actions,
    utils
  };
}