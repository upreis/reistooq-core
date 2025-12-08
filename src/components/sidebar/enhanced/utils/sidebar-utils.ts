import * as LucideIcons from 'lucide-react';

/**
 * Get Lucide icon component by name with fallback
 * @param iconName - Name of the Lucide icon (e.g., 'Home', 'Settings')
 * @returns Icon component or Package as fallback
 */
export const getIconComponent = (iconName: string) => {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || LucideIcons.Package;
};

/**
 * Check if a route is currently active
 * @param currentPath - Current location pathname
 * @param targetPath - Target route path to check
 * @param exactMatch - If true, only exact path match counts as active (for child items)
 * @returns true if route matches
 */
export const isRouteActive = (currentPath: string, targetPath: string, exactMatch: boolean = false): boolean => {
  if (exactMatch) {
    return currentPath === targetPath;
  }
  return currentPath === targetPath || currentPath.startsWith(targetPath + '/');
};

/**
 * Check if any child route is active (for parent menu items)
 * @param currentPath - Current location pathname  
 * @param children - Array of child nav items
 * @returns true if any child is active
 */
export const hasActiveChildRoute = (currentPath: string, children: Array<{ path?: string }>): boolean => {
  return children.some(child => child.path && isRouteActive(currentPath, child.path, true));
};
