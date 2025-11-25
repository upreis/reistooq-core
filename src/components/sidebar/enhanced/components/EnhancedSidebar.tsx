import React, { memo, useState, useCallback, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveRoute } from '../hooks/useActiveRoute';
import { SidebarItemWithChildren } from './SidebarItemWithChildren';
import { SimpleSidebarItems } from './SimpleSidebarItems';
import { useLocation } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { NavSection, NavItem } from '../types/sidebar.types';
import { Logo } from '@/components/ui/Logo';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { motion, AnimatePresence } from 'framer-motion';
import { isRouteActive } from '../utils/sidebar-utils';

interface EnhancedSidebarProps {
  navItems: NavSection[];
  isMobile?: boolean;
  onMobileClose?: () => void;
  isCollapsed?: boolean; // Allow external control from SidebarUIProvider
}

// Memoized section component (extracted to separate file for better organization)
const SidebarSection = memo(({ 
  section, 
  isCollapsed, 
  isMobile, 
  isActive
}: {
  section: NavSection;
  isCollapsed: boolean;
  isMobile: boolean;
  isActive: (path: string) => boolean;
}) => {
  return (
    <div key={section.id}>
      {/* Section Label */}
      <AnimatePresence>
        {(!isMobile && !isCollapsed) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-3"
          >
            <h2 className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              {section.group}
            </h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section Items */}
      <div className="space-y-1">
        {/* Items with children (groups) */}
        {section.items.filter(item => item.children && item.children.length > 0).map((item) => (
          <SidebarItemWithChildren
            key={item.id || item.label}
            item={item}
            isCollapsed={isCollapsed}
            isMobile={isMobile}
          />
        ))}
        
        {/* Single items (no children) */}
        <SimpleSidebarItems
          items={section.items}
          isCollapsed={isCollapsed}
          isMobile={isMobile}
          isActive={isActive}
        />
      </div>
    </div>
  );
});

SidebarSection.displayName = 'SidebarSection';

// Main sidebar content component
const SidebarContent = memo(({ 
  navItems, 
  isMobile = false, 
  onMobileClose,
  externalIsCollapsed 
}: { 
  navItems: NavSection[]; 
  isMobile?: boolean; 
  onMobileClose?: () => void;
  externalIsCollapsed?: boolean;
}) => {
  const { hasPermission } = useUserPermissions();
  const location = useLocation();
  
  // Use external collapsed state if provided (from SidebarUIProvider)
  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : false;
  
  // Memoized isActive function
  const isActive = useCallback((path: string) => {
    return isRouteActive(location.pathname, path);
  }, [location.pathname]);

  // Filter navigation by permissions
  const filteredNav = useMemo(() => {
    const filterItems = (items: NavItem[]): NavItem[] => {
      const result: NavItem[] = [];
      
      for (const item of items) {
        const children = item.children ? filterItems(item.children) : undefined;
        const visible = item.permission ? hasPermission(item.permission) : true;
        
        if (children && children.length > 0) {
          result.push({ ...item, children });
        } else if (visible) {
          result.push({ ...item, children: undefined });
        }
      }
      
      return result;
    };

    return navItems
      .map(section => ({
        ...section,
        items: filterItems(section.items)
      }))
      .filter(section => section.items.length > 0);
  }, [navItems, hasPermission]);

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-3">
            {/* Logo sempre do mesmo tamanho, independente do estado collapsed */}
            <div className="flex-shrink-0">
              <Logo size="md" />
            </div>
            <AnimatePresence>
              {(!isMobile && !isCollapsed) && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="text-lg font-bold text-[hsl(var(--foreground))] truncate">REISTOQ</h1>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] truncate whitespace-nowrap">Admin Dashboard</p>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Mobile close button */}
            {isMobile && onMobileClose && (
              <button
                onClick={onMobileClose}
                className="ml-auto p-1.5 rounded-md hover:bg-[hsl(var(--accent))] transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                aria-label="Fechar menu"
              >
                <LucideIcons.X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav 
          className="p-4 space-y-6 flex-1 overflow-y-auto"
          role="navigation"
          aria-label="Navegação principal"
        >
          {filteredNav.map((section) => (
            <SidebarSection
              key={section.id}
              section={section}
              isCollapsed={isCollapsed}
              isMobile={isMobile}
              isActive={isActive}
            />
          ))}
        </nav>
      </div>
    </TooltipProvider>
  );
});

SidebarContent.displayName = 'SidebarContent';

export const EnhancedSidebar = memo(({ navItems, isMobile, onMobileClose, isCollapsed: externalIsCollapsed }: EnhancedSidebarProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-[hsl(var(--background))] overflow-y-auto">
        <SidebarContent 
          navItems={navItems} 
          isMobile={true} 
          onMobileClose={onMobileClose} 
        />
      </div>
    );
  }

  // Use external collapsed state (always controlled by SidebarUIProvider now)
  const collapsed = externalIsCollapsed ?? false;
  const effectiveWidth = (collapsed && !isHovered) ? 72 : 288;

  return (
    <motion.aside
      className={cn(
        "fixed top-0 left-0 h-screen bg-[hsl(var(--background))] border-r border-[hsl(var(--border))] z-40 overflow-y-auto"
      )}
      initial={{ width: effectiveWidth }}
      animate={{ width: effectiveWidth }}
      transition={{ 
        duration: 0.3, 
        ease: [0.4, 0, 0.2, 1]
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <SidebarContent 
        navItems={navItems} 
        isMobile={false} 
        externalIsCollapsed={collapsed && !isHovered} 
      />
    </motion.aside>
  );
});

EnhancedSidebar.displayName = 'EnhancedSidebar';