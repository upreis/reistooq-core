import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { NavItem } from '../types/sidebar.types';
import { isRouteActive } from '../utils/sidebar-utils';

/**
 * Simplified hook that returns a function to check if an item has active children
 */
export const useActiveRoute = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const hasActiveChild = useMemo(
    () => (item: NavItem): boolean => {
      if (!item.children) return false;
      return item.children.some(child => {
        if (child.path && isRouteActive(currentPath, child.path)) return true;
        if (child.children) return hasActiveChild(child);
        return false;
      });
    },
    [currentPath]
  );

  return hasActiveChild;
};