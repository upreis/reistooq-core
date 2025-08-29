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
  const [state, setState] = useState<SidebarState>(() => {
    const stored = localStorage.getItem(`${finalConfig.persistKey}.expanded`);
    const storedGroups = localStorage.getItem(`${finalConfig.persistKey}.openGroups`);
    const storedExpandedGroups = localStorage.getItem(`${finalConfig.persistKey}.expandedGroups`);
    
    return {
      expanded: stored ? JSON.parse(stored) : true,
      openGroups: storedGroups ? JSON.parse(storedGroups) : {},
      expandedGroups: new Set(storedExpandedGroups ? JSON.parse(storedExpandedGroups) : []),
      pinnedFlyouts: new Map(),
      hoveredItem: null,
      activeRoute: location.pathname,
      searchQuery: ''
    };
  });

  // Persist expanded state
  useEffect(() => {
    localStorage.setItem(`${finalConfig.persistKey}.expanded`, JSON.stringify(state.expanded));
  }, [state.expanded, finalConfig.persistKey]);

  // Persist open groups
  useEffect(() => {
    localStorage.setItem(`${finalConfig.persistKey}.openGroups`, JSON.stringify(state.openGroups));
  }, [state.openGroups, finalConfig.persistKey]);

  // Persist expanded groups
  useEffect(() => {
    localStorage.setItem(`${finalConfig.persistKey}.expandedGroups`, JSON.stringify(Array.from(state.expandedGroups)));
  }, [state.expandedGroups, finalConfig.persistKey]);

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

    openGroup: (groupId: string) => {
      setState(prev => {
        const newExpandedGroups = new Set(prev.expandedGroups);
        newExpandedGroups.add(groupId);
        return {
          ...prev,
          expandedGroups: newExpandedGroups,
          openGroups: { ...prev.openGroups, [groupId]: true }
        };
      });
    },

    closeGroup: (groupId: string) => {
      setState(prev => {
        const newExpandedGroups = new Set(prev.expandedGroups);
        newExpandedGroups.delete(groupId);
        return {
          ...prev,
          expandedGroups: newExpandedGroups,
          openGroups: { ...prev.openGroups, [groupId]: false }
        };
      });
    },

    isGroupOpen: (groupId: string) => {
      return state.expandedGroups.has(groupId) || state.openGroups[groupId] || false;
    },

    openFlyout: (itemId: string, options?: { pinned?: boolean; ttlMs?: number }) => {
      setState(prev => {
        const newPinnedFlyouts = new Map(prev.pinnedFlyouts);
        if (options?.pinned && options?.ttlMs) {
          newPinnedFlyouts.set(itemId, { expiry: Date.now() + options.ttlMs });
        }
        return { ...prev, pinnedFlyouts: newPinnedFlyouts };
      });
    },

    closeFlyout: (itemId: string) => {
      setState(prev => {
        const newPinnedFlyouts = new Map(prev.pinnedFlyouts);
        newPinnedFlyouts.delete(itemId);
        return { ...prev, pinnedFlyouts: newPinnedFlyouts };
      });
    },

    isFlyoutOpen: (itemId: string) => {
      const flyout = state.pinnedFlyouts.get(itemId);
      if (!flyout) return false;
      if (Date.now() > flyout.expiry) {
        // Clean up expired flyout
        setTimeout(() => {
          setState(prev => {
            const newPinnedFlyouts = new Map(prev.pinnedFlyouts);
            newPinnedFlyouts.delete(itemId);
            return { ...prev, pinnedFlyouts: newPinnedFlyouts };
          });
        }, 0);
        return false;
      }
      return true;
    },
    
    setHoveredItem: (itemId: string | null) => {
      setState(prev => ({ ...prev, hoveredItem: itemId }));
    },
    
    setSearchQuery: (query: string) => {
      setState(prev => ({ ...prev, searchQuery: query }));
    }
  }), [state.expandedGroups, state.openGroups, state.pinnedFlyouts]);

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