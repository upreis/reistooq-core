import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { NavItem, NavSection } from '../types/sidebar.types';
import { isRouteActive } from '../utils/sidebar-utils';

export function useActiveRoute(navItems: NavSection[]) {
  const location = useLocation();
  
  const activeInfo = useMemo(() => {
    const currentPath = location.pathname;
    
    // Find active item and its parent section/group
    let activeItem: NavItem | null = null;
    let activeParent: NavItem | null = null;
    let activeSection: NavSection | null = null;
    
    for (const section of navItems) {
      for (const item of section.items) {
        // Check if item itself is active
        if (item.path && (currentPath === item.path || currentPath.startsWith(item.path + '/'))) {
          activeItem = item;
          activeSection = section;
          break;
        }
        
        // Check children
        if (item.children) {
          for (const child of item.children) {
            if (child.path && (currentPath === child.path || currentPath.startsWith(child.path + '/'))) {
              activeItem = child;
              activeParent = item;
              activeSection = section;
              break;
            }
          }
        }
        
        if (activeItem) break;
      }
      if (activeItem) break;
    }
    
    return {
      activeItem,
      activeParent,
      activeSection,
      hasActiveChild: (item: NavItem) => {
        if (!item.children) return false;
        return item.children.some(child => 
          child.path && isRouteActive(currentPath, child.path)
        );
      },
      isActive: (path: string) => {
        return isRouteActive(currentPath, path);
      }
    };
  }, [location.pathname, navItems]);
  
  return activeInfo;
}