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
 * @returns true if route matches exactly or is a sub-route
 */
export const isRouteActive = (currentPath: string, targetPath: string): boolean => {
  return currentPath === targetPath || currentPath.startsWith(targetPath + '/');
};
