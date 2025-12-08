import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { NavItem } from '../types/sidebar.types';
import { isRouteActive } from '../utils/sidebar-utils';

/**
 * Simplified hook that returns a function to check if an item has active children
 * Uses exact match for child items to prevent multiple items being marked active
 */
export const useActiveRoute = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const hasActiveChild = useMemo(
    () => (item: NavItem): boolean => {
      if (!item.children) return false;
      return item.children.some(child => {
        // Use exact match for child items
        if (child.path && isRouteActive(currentPath, child.path, true)) return true;
        if (child.children) return hasActiveChild(child);
        return false;
      });
    },
    [currentPath]
  );

  return hasActiveChild;
};
